/* global WebImporter */
/* eslint-disable no-console */
import { formatDate, getAdjacentElementsBySelector, processPdfLinks, removeEmptyTable, replaceHeadings, updateImageLinks, updateLinks } from '../importer/importer-utils.js';
import { createAccordion, createStylizedHeading, createSummaryBox } from './mds-blocks.js';

function createSummaryBoxBlock( main ) {
	const summaryBoxes = main.querySelectorAll( '.paragraphs-item-featured-well .field--item' );
	summaryBoxes.forEach( ( summaryBox ) => {
		
		const content = document.createElement( 'div' );
		Array.from( summaryBox.children ).forEach( ( child ) => {
			content.appendChild( child.cloneNode( true ) );
		} );
		replaceHeadings( content, 2 );
		const summaryBoxBlock = createSummaryBox( content );

		if ( isJustHeading( summaryBox ) ) {
			const stylizedHeading = createStylizedHeading( summaryBox.innerText );
			summaryBox.replaceWith( stylizedHeading );
		} else {
			summaryBox.replaceWith( summaryBoxBlock );
		}
	} );
	
	function isJustHeading( summaryBox ) {
		const children = Array.from( summaryBox.children );
		if ( children.length !== 1 ) return false;
		const firstChild = children[0];
		return firstChild.tagName.startsWith( 'H' );
	}
}

function createColumns( main ) {
	main.querySelectorAll( '.field .field--item .row' ).forEach( ( row ) => {
		process6Columns( row );
		process4Columns( row );
	} );
}

function process6Columns( row ) {
	const columns6 = row.querySelectorAll( '.col-sm-6' );
	let colData6 = [];
	if ( columns6.length > 0 ) {
		columns6.forEach( ( item ) => {
			if ( item.innerHTML !== '' ) colData6.push( item.innerHTML );
		} );
		if ( colData6.length > 0 ) {
			const data = [
				['columns'],
				colData6
			];
			columns6[0].parentNode.replaceWith( WebImporter.DOMUtils.createTable( data, document ) );
		}
	}
}

function process4Columns( row ) {
	const columns4 = row.querySelectorAll( '.col-sm-4' );
	let colData4 = [];
	if ( columns4.length > 0 ) {
		columns4.forEach( ( item ) => {
			if ( item.innerHTML !== '' ) colData4.push( item.innerHTML );
		} );
		if ( colData4.length > 0 ) {
			const data = [
				['columns'],
				colData4
			];
			columns4[0].parentNode.replaceWith( WebImporter.DOMUtils.createTable( data, document ) );
		}
	}
}

function createHomeHeroHeader( main, document ) {
	const homeHeroHeader = main.querySelectorAll( '.header-container .row .col-sm-12' );
	let colData = [];
	if ( homeHeroHeader.length > 0 ) {
		homeHeroHeader.forEach( ( row ) => {
			if ( row.classList.contains( 'main-news-column' ) ) {
				const mainNews = row.querySelector( '.main-news' );
				colData.push( createCards( mainNews ) );
			} else if ( row.classList.contains( 'second-news-main-column' ) ) {
				const div = document.createElement( 'div' );
				const secondNews = row.querySelector( '.second-news' );
				div.append( createCards( secondNews ) );
				const bottomNews = row.querySelectorAll( '.bottom-news-column .col-xs-6' );
				const btmNewsData = [];
				if ( bottomNews.length > 0 ) {
					bottomNews.forEach( ( item ) => {
						btmNewsData.push( item );
					} );
					const data = [
						['columns'],
						btmNewsData
					];
					div.append( WebImporter.DOMUtils.createTable( data, document ) );
				}
				colData.push( div );
			}
		} );
		const data = [
			['columns'],
			colData
		];
		homeHeroHeader[0].parentNode.replaceWith( WebImporter.DOMUtils.createTable( data, document ) );
	}
}

function transformAccordions( main ) {
	const headerLevel = 2;  
	const accordionItems = getAdjacentElementsBySelector( main, '.field .field--item:has( .row .accordion )' );

	accordionItems.forEach( ( group, groupIndex, groupArr ) => { 
		
		const items = [];
		group.forEach( ( fieldItem, itemIndex, itemArr ) => { // Accordions that are adjacent to each other
			const headingText = fieldItem.querySelector( 'button.accordion' ).innerText;
			const content = document.createElement( 'div' );

			const accordionPanel = fieldItem.querySelector( '.accordion-panel .field--name-field-accordion-body' );
			Array.from( accordionPanel.children ).forEach( ( child ) => {
				content.appendChild( child );
			} );

			const header = document.createElement( `h${headerLevel}` );
			header.innerText = headingText;
			items.push( {
				heading: header,
				content: replaceHeadings( content, headerLevel + 1 )
			} );

			if( itemIndex > 0 ) { // Keep first element to replace with accordion, remove others
				itemArr[itemIndex].remove(); 
			}
		} );
		const accordion = createAccordion( items );
		groupArr[groupIndex][0].replaceWith( accordion );
	} );
}

function createCards( ele ) {
	const fieldContent = ele.querySelectorAll( '.field-content' );
	const colData = [];
	let card = '';
	if ( fieldContent.length > 0 ) {
		const div = document.createElement( 'div' );
		fieldContent.forEach( ( item ) => {
			if ( item.querySelector( 'img' ) ) {
				colData.push( item );
			} else {
				div.append( item );
			}
		} );
		colData.push( div );
		const data = [
			['cards'],
			colData
		];
		card = WebImporter.DOMUtils.createTable( data, document );
	}
	return card;
}

function handleIFrame( main ) {
	main.querySelectorAll( 'iframe' ).forEach( ( iframe ) => {
		const iframeSrc = iframe.getAttribute( 'src' );
		
		const isYoutube = iframeSrc.includes( 'youtube.com' );
		const isGoogleMaps = iframeSrc.includes( 'google.com/maps' );
		// Keep YouTube & Google Maps, remove others
		if ( isYoutube || isGoogleMaps ) {
			const link = document.createElement( 'a' );
			link.setAttribute( 'href', iframeSrc );
			link.textContent = iframeSrc;
			iframe.replaceWith( link );
		}
		else {
			console.warn( `Removing unsupported iframe with src: ${iframeSrc}` );
			iframe.remove();
		}
	} );
}

function createMetadataBlock( main, url, document ) {
	const meta = {};
	// find the <title> element
	const title = document.querySelector( 'title' );
	if ( title ) {
		meta.Title = title.innerText.replace( /[\n\t]/gm, '' ).replace( '| Nebraska Banking and Finance', '' );
	}

	// find the <meta property="og:image"> element
	const img = document.querySelector( '[property="og:image"]' );
	if ( img ) {
		// create an <img> element
		const el = document.createElement( 'img' );
		el.src = img.content;
		meta.Image = el;
	}

	const pageUrl = new URL( url );
	const path = pageUrl.pathname;
	const pubDateEle = main.querySelector( '.field--name-field-publication-date' );
	if ( path.startsWith( '/notices' ) || path.startsWith( '/notice-' ) || pubDateEle ) {
		meta.tags = ['notice'];
		const time = pubDateEle.querySelector( 'time' ).getAttribute( 'datetime' );
		meta['publication-date'] = formatDate( new Date( time ) );
		handlePublicationDate( main );
	}

	// helper to create the metadata block
	const block = WebImporter.Blocks.getMetadataBlock( document, meta );

	// append the block to the main element
	main.append( block );

	// returning the meta object might be usefull to other rules
	return meta;
}

function handlePublicationDate( main ) {
	const pubDateEle = main.querySelector( '.field--name-field-publication-date' );

	if ( pubDateEle ) {
		const label = pubDateEle.querySelector( '.field--label' );
		const dateTime = pubDateEle.querySelector( 'time' );

		const pubDate = document.createElement( 'p' );
		const strongLabel = document.createElement( 'strong' );
		strongLabel.textContent = label.textContent + ': ';

		pubDate.appendChild( strongLabel );
		pubDate.appendChild( dateTime );

		pubDateEle.replaceWith( pubDate );
	}
}

export default {
	transform: ( {
		document, url, params,
	} ) => {
		const newHost = 'https://main--ndbf-eds--ociostateofnebraska.aem.page';
		const main = document.body;
		const results = [];
		const pageType = ( () => {
			if ( new URL( url ).pathname === '/' ) return 'home';
			if ( new URL( url ).pathname.endsWith( 'news-publications/archive' ) ) return 'news-publications';
			return 'default';
		} )();

		//remove unneeded elements
		WebImporter.DOMUtils.remove( main, [
			'.skip-link',
			'.navbar',
			'.tablet-search-container',
			'.mobile-search',
			'.breadcrumb-row',
			'a#main-content',
			'.footer'
		] );

		const parentH1 = document.querySelector( '.inside-container .container .inside-title h1' );
		const heading = document.querySelector( '.region.region-title h1' );
		if ( parentH1 && heading ) {
			parentH1.replaceWith( heading );
		}
 
		// check if this is the news-publications page, if so, need to break out and process each article individually
		if ( pageType === 'news-publications' ) {

			const newsArticles = main.querySelectorAll( '.view-id-news_releases_interior_page .ui-accordion-content .views-row' );
			// convert each article into its own page/result
			newsArticles.forEach( ( articleEle ) => {
				const h3 = articleEle.querySelector( 'h3' );
				if ( h3 ) {
					const title = h3.textContent;
					const h1 = document.createElement( 'h1' );
					h1.textContent = title;
					h3.replaceWith( h1 );

					// find pdf links
					const pdfResults = processPdfLinks( main, url, newHost );
					results.push( ...pdfResults );

					//cleanup
					WebImporter.DOMUtils.remove( articleEle, [
						'.file-icon',
					] );

					const meta = {};
					meta.Title = title;
					const pubDateEle = articleEle.querySelector( '.views-field-field-news-release-date' );
					const time = pubDateEle.querySelector( 'time' ).getAttribute( 'datetime' );
					const date = new Date( time );
					meta['publication-date'] = formatDate( date );
					meta.tags = ['news'];

					// helper to create the metadata block
					const block = WebImporter.Blocks.getMetadataBlock( document, meta );

					// append the block to the main element
					articleEle.append( block );

					// create a URL-friendly path from the H3 content
					const pageName = title.toLowerCase()
						.replace( /[^a-z0-9]+/g, '-' )
						.replace( /^-+|-+$/g, '' );

					const path = `/about/news-publications/${date.getFullYear()}/${pageName}`;

					results.push( {
						element: articleEle,
						path: WebImporter.FileUtils.sanitizePath( path ),
					} );
				}
			} );
		} else {

			const hero = document.querySelector( '.header-overlay' )?.parentElement;
			if ( hero && heading ) {
				const hr = document.createElement( 'hr' );
				heading.after( hero );
				hero.after( hr );
			}

			createHomeHeroHeader( main, document );
			createSummaryBoxBlock( main );
			createColumns( main );
			transformAccordions( main );

			WebImporter.DOMUtils.remove( main, [
				'.file-icon',
				'.file-size'
			] );
			handleIFrame( main );


			createMetadataBlock( main, url, document );
			WebImporter.rules.transformBackgroundImages( main, document );
			WebImporter.rules.adjustImageUrls( main, url, params.originalURL );
			WebImporter.rules.convertIcons( main, document );

			updateLinks( main, url, newHost );
			updateImageLinks( main, url, params.originalURL );
			removeEmptyTable( main );

			const path = ( () => {
				let p = new URL( url ).pathname;
				if ( p.endsWith( '/' ) ) {
					p = `${p}index`;
				}

				if ( p.startsWith( '/notice-' ) ) {
					p = '/notices'.concat( p );
				} else if ( main.querySelector( '.field--name-field-publication-date' ) ) {
					const pArr = p.split( '/' );
					p = '/notices/'.concat( pArr[pArr.length - 1] );
				}

				return decodeURIComponent( p )
					.toLowerCase()
					.replace( /\.html$/, '' )
					.replace( /[^a-z0-9/]/gm, '-' );
			} )( url );

			// main page import - "element" is provided, i.e. a docx will be created
			results.push( {
				element: main,
				path: path
			} );

			// find pdf links
			const pdfResults = processPdfLinks( main, url, newHost );
			results.push( ...pdfResults );
		}

		return results;
	},
};