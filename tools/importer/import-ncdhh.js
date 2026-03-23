/* eslint-disable no-cond-assign */
/* global WebImporter */
/* eslint-disable no-console */
import { createLogger, removeEmptyTable, wrapText, handleIFrames, processResources } from '../importer/importer-utils.js';
import { transformAccordion, transformLinkParagraphsToList, transformTable } from './mds-transformer.js';
import * as mdsBlocks from './mds-blocks.js';

export default {
	onLoad: ( { document } ) => {
		// Set font-size on strong elements for transformation to headings in transform()
		document.querySelectorAll( 'strong' ).forEach( ( /** @type {HTMLElement} */ strong ) => {
			strong.style.fontSize = window.getComputedStyle( strong ).fontSize;
		} );
	},
	transform: ( {
		document, url, params,
	} ) => {
		const main = document.body;
		const results = [];
		const meta = WebImporter.Blocks.getMetadata( document );
		const logger = createLogger( params.originalURL );

		const pageType = ( () => {
			const urlObj = new URL( url );
			if ( urlObj.pathname === '/' ) { return 'home'; }
			if ( main.querySelector( '.field--name-field-event-date' ) ) { return 'event'; }
			return 'default';
		} )();

		// Remove unneeded elements
		WebImporter.DOMUtils.remove( main, [
			'.skip-link',
			'.top-gray-bar',
			'.navbar',
			'.title-bkg',
			'.page-header',
			'.file-icon',
			'.footer',
			'.footer-bottom',
			'.footer-bottom-mobile',
		] );

		WebImporter.rules.transformBackgroundImages( main, document );
		WebImporter.rules.convertIcons( main, document );

		// Transformations
		createHero();
		transformTable( main, '.rwd-table', { variant: 'scrollable' } );
		transformForms();
		transformAccordion( main, '.faq-item', 'summary', '.faq-answer' );
		transformAccordion( main, '.panel.panel-default', '.panel-title', '.panel-body' );
		handleIFrames( main );

		restyleDefaultContent();
		
		// Metadata
		createMetadataBlock();

		// Cleanup
		removeEmptyTable( main );
		const resourceResults = processResources( main, url, params.originalURL, 'ncdhh' ); // Removes 'title' attribute from pdf anchor links to work with da-upload
		
		// Generate new page path
		const path = ( () => {
			let p = new URL( url ).pathname;
			if ( p.endsWith( '/' ) ) {
				p = `${p}index`;
			}
			
			return decodeURIComponent( p )
				.toLowerCase()
				.replace( /\.html$/, '' )
				.replace( /[^a-z0-9/]/gm, '-' );
		} )( url );
		
		// main page import - "element" is provided, i.e. content page will be created
		results.push( {
			element: main,
			path: path
		} );
		results.push( ...resourceResults );

		return results;

		// =======================================================================
		//                          Functions
		// =======================================================================
		function createHero() {
			/** @type {HTMLElement | null} */
			const navLogo = main.querySelector( '.nav-logo' );
			const heroImage = navLogo?.querySelector( 'img' );
			/** @type {string | null} */
			const pageTitle = meta?.Title?.replace( /\|.*$/gm, '' ).trim();

			if ( pageTitle ) {
				mdsBlocks.createHero( main, {
					heading: pageTitle,
					image: heroImage ?? undefined,
				} );
				navLogo?.remove();
			} else {
				logger.error( params.originalURL, 'Page title not found' );
			}
		}
		
		function transformForms() {
			main.querySelectorAll( 'form' ).forEach( ( form ) => {
				const disclaimer = Array.from( form.querySelectorAll( 'strong' ) )
					?.find( el => el.innerText.trim() === ( 'Disclaimer:' ) )
					?.parentElement;

				// Replace form
				const formBlock = mdsBlocks.createForm( `Insert form url here: origin -> ${params.originalURL}` );
				form.replaceWith( formBlock );

				if( disclaimer ) {
					/** @type {Array<Node>} */
					const disclaimerHeading =  Array.from( disclaimer.childNodes ).filter( node => {
						return ['STRONG'].includes( node.nodeName );
					} );
					/** @type {Array<Node>} */
					const disclaimerContent =  Array.from( disclaimer.childNodes ).filter( node => {
						return !['STRONG', 'BR'].includes( node.nodeName );
					} );
					const disclaimerSpan = document.createElement( 'span' ); // Spans get unwrapped in final output
					const disclaimerHeadingP = document.createElement( 'p' );
					const disclaimerContentP = document.createElement( 'p' );
					disclaimerHeadingP.append( ...disclaimerHeading );
					disclaimerContentP.append( ...disclaimerContent );
					disclaimerSpan.append( disclaimerHeadingP, disclaimerContentP );
					
					formBlock.after( disclaimerSpan );
				}
			} );
		}

		function restyleDefaultContent() {

			transformLinkParagraphsToList( main );
			document.querySelectorAll( '.content :is(h1,h3,h4,h5,h6)' ).forEach( ( heading, index ) => {
				// Transform first content heading to h2, and any other headings that are h1 to h2 (since h1 should be reserved for title in hero)
				if ( index === 0 ) {
					heading.replaceWith( wrapText( heading.innerText, 'h2' ) );
				} else if ( heading.tagName === 'H1' ) {
					heading.replaceWith( wrapText( heading.innerText, 'h2' ) );
				} 
			} );

			document.querySelectorAll( '.field--label' ).forEach( ( fieldLabel ) => {
				fieldLabel.replaceWith( wrapText( fieldLabel.innerText, 'strong' ) );
			} );

			// Strong > 22px --> Headings
			document.querySelectorAll( 'strong' ).forEach( ( strong ) => {
				const fontSize = parseFloat( strong.style.fontSize );
				const headingWrapper = strong.closest( 'h1, h2, h3, h4, h5, h6' );

				if ( fontSize ) {
					if ( fontSize >= 22 && fontSize <= 24 ) {
						const headerLevel = 'h2';
						( headingWrapper ?? strong ).replaceWith( wrapText( strong.innerText, headerLevel ) );
					}
				}
			} );

			// Remove strong elements nested in Headings
			document.querySelectorAll( 'h1 strong, h2 strong, h3 strong, h4 strong, h5 strong, h6 strong' ).forEach( ( strong ) => {
				strong.replaceWith( document.createTextNode( strong.innerText ) );
			} );

			// Link list turns into buttons -> link list
			const walker = document.createTreeWalker(
				document.body,
				NodeFilter.SHOW_TEXT
			);

			let node;
			while ( node = walker.nextNode() ) {
				if ( node.nodeValue.includes( '•' ) ) {
					node.nodeValue = node.nodeValue.replaceAll( '•', '' );
				}
			}
		}

		function createMetadataBlock() {
			const meta = {};
			// find the <title> element
			const title = document.querySelector( 'title' );
			if ( title ) {
				meta.Title = title.innerText.replace( /[\n\t]/gm, '' ).replace( '| Deaf and Hard of Hearing', '' );
			}
		
			// find the <meta property="og:image"> element
			const img = document.querySelector( 'meta[property="og:image"]' );
			if ( img ) {
				// create an <img> element
				const el = document.createElement( 'img' );
				el.src = img.content;
				meta.Image = el;
			}
		
			if ( pageType === 'event' ) {
				meta.tags = ['event'];
				const eventTitleEl = Array.from( document.querySelectorAll( 'strong' ) )
					?.find( el => el.innerText.toLowerCase().trim().includes( 'event title' ) );
				const title = eventTitleEl?.parentElement?.innerText.replace( eventTitleEl.innerText, '' ).trim();
				if ( title ) {
					meta['event:title'] = title;
				} else {
					meta['event:title'] = meta.Title;
					logger.warn( 'Event title not found, using page title as fallback', meta.Title );
				}

				const dateText = main.querySelector( '.field--name-field-event-date .field--item' )?.innerText;
				if ( dateText ) {
					const startDate = dateText.split( '-' )[0];
					const endDate = dateText.split( '-' )[1];

					if ( startDate && endDate ) {
						const startDateTime = new Date( startDate );
						const endDateTime = new Date( endDate );
						meta['event:start-date'] = `${startDateTime.toDateString()}, ${startDateTime.toLocaleTimeString()}`;
						meta['event:end-date'] = `${endDateTime.toDateString()}, ${endDateTime.toLocaleTimeString()}`;
					}
				}
			}
		
			const block = WebImporter.Blocks.getMetadataBlock( document, meta );
		
			main.append( block );
			return meta;
		}
	}
};