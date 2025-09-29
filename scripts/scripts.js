import {
	buildBlock,
	loadHeader,
	loadFooter,
	readBlockConfig,
	toCamelCase,
	decorateBlocks,
	decorateBlock,
	decorateTemplateAndTheme,
	getMetadata,
	waitForFirstImage,
	loadSection,
	loadSections,
	loadCSS,
	loadBlock,
} from './aem.js';
import { getIndividualIcon, isSameDomainOrSubdomain } from './utils.js';
import { div, domEl } from './dom-helpers.js';

// variable for caching site index
window.siteIndexCache = window.siteIndexCache || {};

/**
 * Builds hero block and prepends to main.
 * @param {Element} main The container element
 * @param {String} templateName The name of the template
 */
function buildHeroBlock( main, templateName ) {
	const h1 = main.querySelector( 'h1' );
	let heroSection;
	if ( h1 ) {
		heroSection = h1.closest( '.section' );
	}
	const multipleSections = main.querySelectorAll( '.section' ).length > 1;

	let picture = null;
	// If there are no sections delineated, everything is in the hero section
	// homepage always grabs the first image (it's required)
	if ( heroSection && ( multipleSections || templateName === 'homepage' ) ) {
		picture = heroSection.querySelector( 'picture' );
	}

	const container = document.createElement( 'div' );
	let heroBlock;
	if ( templateName === 'homepage' ) {
		let desc;
		if ( heroSection && multipleSections ) {
			desc = heroSection.querySelectorAll( 'p, ul, ol' );
		}
		heroBlock = buildBlock( 'hero-homepage', { elems: [picture, h1, ...desc] } );
	} else {
		heroBlock = buildBlock( 'hero', { elems: [picture, h1] } );
	}
	container.appendChild( heroBlock );
	main.prepend( container );
	decorateBlock( heroBlock );
	loadBlock( heroBlock );
}

/**
 * Add <svg> for icon, prefixed with codeBasePath and optional prefix.
 * @param {Element} [span] span element with icon classes
 */
function decorateIcon( span ) {
	let iconName = Array.from( span.classList )
		.find( ( c ) => c.startsWith( 'icon-' ) )
		.substring( 5 );
	let google = false;
	if ( iconName.startsWith( 'g-' ) ) {
		iconName = iconName.substring( 2 );
		google = true;
	}

	getIndividualIcon( span, iconName, google );
}

/**
 * Add <img> for icons, prefixed with codeBasePath and optional prefix. -- taken from aem.js and modified
 * @param {Element} [element] Element containing icons
 * @param {string} [prefix] prefix to be added to icon the src
 */
function decorateIcons( element, prefix = '' ) {
	const icons = [...element.querySelectorAll( 'span.icon' )];
	icons.forEach( ( span ) => {
		decorateIcon( span, prefix );
	} );
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 * @param {String} templateName The name of the template
 */
function buildAutoBlocks( main, templateName ) {
	try {
		buildHeroBlock( main, templateName );
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error( 'Auto Blocking failed', error );
	}
}

/**
 * Check to see if a ul element contains only links
 * @param {Element} ulElement element we are checking
 */
function containsOnlyLinks( ulElement ) {
	const lis = ulElement.querySelectorAll( 'li' );
	for ( const li of lis ) {
		if ( li.children.length !== 1 || li.firstElementChild.tagName.toLowerCase() !== 'a' ) {
			return false;
		}
	}
	return true;
}

/**
 * Decorates content containing a list of links as an unstyled link list.
 * @param {Element} element container element
 */
function decorateUnstyledLinks( element ) {
	element.querySelectorAll( 'ul' ).forEach( ( ul ) => {
		// only add the class if this is directly in the default content wrapper and NOT a block
		if ( ul.parentNode.classList.contains( 'default-content-wrapper' ) && containsOnlyLinks( ul ) ) {
			ul.classList.add( 'usa-list', 'usa-list--unstyled', 'usa-list__unstyled-link-list' );
		}
	} );
}

/**
 * Decorates paragraphs containing a single link as buttons.
 * @param {Element} element container element
 */
function decorateButtons( element ) {
	element.querySelectorAll( 'a' ).forEach( ( a ) => {
		a.title = a.title || a.textContent;
		if ( a.href !== a.textContent ) {
			const up = a.parentElement;
			const twoup = a.parentElement.parentElement;
			if ( !a.querySelector( 'img' ) ) {
				if ( up.childNodes.length === 1 && ( up.tagName === 'P' || up.tagName === 'DIV' ) ) {
					a.className = 'usa-button'; // default
					up.classList.add( 'usa-button__wrap' );
				}
				if (
					up.childNodes.length === 1
					&& up.tagName === 'STRONG'
					&& twoup.childNodes.length === 1
					&& twoup.tagName === 'P'
				) {
					a.className = 'usa-button usa-button--secondary';
					twoup.classList.add( 'usa-button__wrap' );
				}
				if (
					up.childNodes.length === 1
					&& up.tagName === 'EM'
					&& twoup.childNodes.length === 1
					&& twoup.tagName === 'P'
				) {
					a.className = 'usa-button usa-button--outline';
					twoup.classList.add( 'usa-button__wrap' );
				}
			}
		}
	} );
}

/**
 * Checks if a URL is a pdf.
 * @param {string} url The URL to check
 * @returns {boolean} True if the URL ends with .pdf
 */
function isPDFUrl( url ) {
	return url.toLowerCase().endsWith( '.pdf' );
}

/**
 * Decorates paragraphs containing an external link. Separating out for managing.
 * @param {Element} element container element
 */
function decorateExternalLinks( element ) {
	element.querySelectorAll( 'a' ).forEach( ( a ) => {
		a.title = a.title || a.textContent;
		if ( a.textContent && a.href !== a.textContent ) { // only decorate if the link is wrapping text content
			if ( !a.querySelector( 'img' ) ) {
				if( isPDFUrl( a.href ) ) {
					a.classList.add( 'usa-link--pdf' );
					a.setAttribute( 'target', '_blank' );
					getIndividualIcon( a, 'file-pdf' );
				} else if ( !isSameDomainOrSubdomain( a.href ) ) {
					a.classList.add( 'usa-link--external' );
					a.setAttribute( 'target', '_blank' );
				}
			}
		} else if ( a.href !== a.textContent ) {
			if ( !isSameDomainOrSubdomain( a.href ) ) {
				a.setAttribute( 'target', '_blank' );
			}
		}
	} );
}

/**
 * Decorates h2 elements with a class
 * @param {Element} element container element
 */
function decorateH2s( element ) {
	element.querySelectorAll( 'h2' ).forEach( ( h2 ) => {
		const childEleTag = h2.childNodes.length === 1 && h2.firstElementChild?.tagName.toLowerCase();
		// contains only emphasized text
		if ( childEleTag && ( childEleTag === 'em' || childEleTag === 'i' ) ) {
			h2.classList.add( 'h2--underline' );
		}
	} );
}

/**
 * Converts links to YouTube to embedded videos
 * Leverages text within the same paragraph as the title for accessibility
 * @param {Element} element container element
 */
function decorateYouTube( element ) {
	element.querySelectorAll( 'a[href*="youtube.com"], a[href*="youtu.be"], a[href*="youtube-nocookie.com"]' ).forEach( ( link ) => {

		// extract the video ID from the link
		const youtubeRegex = /(?:https?:\/\/(?:m\.)?(?:www\.)?youtu(?:\.be\/|(?:be-nocookie|be)\.com\/)(?:watch|\w+\?(?:feature=\w+\.\w+&)?v=|v\/|e\/|embed\/|live\/|shorts\/|user\/(?:[\w#]+\/)+))([^&#?\n]+)/i;
		const id = youtubeRegex.exec( link.href )?.[1];
		if( !id ) return;

		let parent = link.closest( 'p' );

		// stop if it's a button
		if( parent?.classList.contains( 'usa-button__wrap' ) ) return;

		// stop if there's text ahead of the link
		if( link.previousSibling?.textContent.trim().length ) return;

		// text after the link is used as alt text if wrapped in parentheses
		const textAfter = link.nextSibling?.textContent.trim();
		let titleText = '';
		if( textAfter && textAfter[0] === '(' && textAfter[textAfter.length - 1] === ')' ) {
			titleText = textAfter.substring( 1, textAfter.length - 1 );
		}

		// stop if there's text after which is not wrapped in parenthesis (assuming a paragraph)
		if( textAfter && !titleText ) return;

		const wrapper = domEl( 'figure', { class: 'video-embed' } );
		const iframe = domEl( 'iframe', {
			src: `https://www.youtube.com/embed/${id}?rel=0&color=white`,
			allowfullscreen: true,
			loading: 'lazy',
			frameborder: 0,
			allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
			title: titleText || 'YouTube video player',
		} );

		wrapper.appendChild( div( iframe ) );

		if ( !parent ) {
			// likely inside a column, create a wrapper so that column classes aren't added directly to the iframe
			parent = div();

			let origParent = link.parentElement;
			origParent.childNodes.forEach( ( child ) => {
				parent.append( child );
			} );

			origParent.textContent = '';
			origParent.append( parent );
		}

		parent.replaceWith( wrapper );
	} );
}

/**
 * Converts links to YouTube to embedded videos
 * Leverages text within the same paragraph as the title for accessibility
 * @param {Element} element container element
 */
function decorateGoogleMaps( element ) {
	element.querySelectorAll( 'a[href*="google.com/maps"]' ).forEach( ( link ) => {
		let parent = link.closest( 'p' );

		// stop if it's a button
		if ( parent?.classList.contains( 'usa-button__wrap' ) ) return;

		// stop if there's text ahead of the link
		if ( link.previousSibling?.textContent.trim().length ) return;

		// text after the link is used as alt text if wrapped in parentheses
		const textAfter = link.nextSibling?.textContent.trim();
		let titleText = '';
		if ( textAfter && textAfter[0] === '(' && textAfter[textAfter.length - 1] === ')' ) {
			titleText = textAfter.substring( 1, textAfter.length - 1 );
		}

		// stop if there's text after which is not wrapped in parenthesis (assuming a paragraph)
		if ( textAfter && !titleText ) return;


		// Helper function to create the iframe
		const createIframe = ( embedURL, parent, titleText, link ) => {
			const wrapper = domEl( 'figure', { class: 'map-embed' } );
			const iframe = domEl( 'iframe', {
				src: embedURL,
				style: 'border:0',
				allowfullscreen: '',
				loading: 'lazy',
				referrerpolicy: 'no-referrer-when-downgrade',
				title: titleText || 'Google Map',
			} );

			wrapper.appendChild( iframe );

			if ( !parent ) {
				// likely inside a column, create a wrapper so that column classes aren't added directly to the iframe
				parent = domEl( 'div' );
				let origParent = link.parentElement;
				origParent.childNodes.forEach( ( child ) => {
					parent.append( child );
				} );
				origParent.textContent = '';
				origParent.append( parent );
			}
			parent.replaceWith( wrapper );
		};

		const url = new URL( link.href );

		// Check if the link is an embed URL
		if ( url.href.startsWith( 'https://www.google.com/maps/embed' ) || url.href.startsWith( 'https://www.google.com/maps/d/embed' ) ) {
			createIframe( url.href, parent, titleText, link );
		}
		//If it isn't an embed URL, then it must be a google maps URL
		else if ( url.href.startsWith( 'https://www.google.com/maps/' ) ) {
			let embedURL = null;
			const match = url.searchParams.get( 'q' ) || url.searchParams.get( 'api=1&query' ) || url.searchParams.get( 'cid' );

			if ( match ) {
				embedURL = `https://maps.google.com/maps?q=${match}&output=embed`;
			} else {
				const pathParts = url.pathname.split( '@' )[1]?.split( ',' );
				if ( pathParts?.length >= 2 ) {
					const latitude = parseFloat( pathParts[0] );
					const longitude = parseFloat( pathParts[1] );
					embedURL = `https://maps.google.com/maps?q=${latitude},${longitude}&output=embed`;
				}
			}
			if ( embedURL ) {
				createIframe( embedURL, parent, titleText, link );
			}
		}
	} );
}

/** Converts list with icons into an icon list component
 * Has "Big" variant
 * @param {Element} element The container element
 */
function decorateIconList( element ) {
	element.querySelectorAll( 'ul' ).forEach( ( ul ) => {
		if( !ul.closest( 'body' ) ) { return; } // skip if ul is not in the DOM (i.e. a fragment)

		// already decorated
		if ( ul.classList.contains( 'usa-icon-list' ) ) return; 
		
		// only decorate if all li elements have an icon
		const lis = ul.querySelectorAll( ':scope > li' );
		if( ul.querySelectorAll( ':scope > li .icon:first-child' ).length !== lis.length ) return;

		ul.classList.add( 'usa-icon-list' );
		if( ul.querySelector( 'h2, h3, h4' ) ) {
			ul.classList.add( 'usa-icon-list--size-lg' );
		}

		lis.forEach( ( li ) => {
			li.classList.add( 'usa-icon-list__item' );
			
			// leaving as a span because decorateIcon is still potentially working with it asynchronously
			const iconEle = li.querySelector( '.icon' );
			iconEle.classList.add( 'usa-icon-list__icon' );

			const contentWrapper = div( { class: 'usa-icon-list__content' } );
			while( li.firstChild ) {
				const child = li.firstChild;
				
				// move everything after the br to a new paragraph
				if( child.tagName && ['H2', 'H3', 'H4'].includes( child.tagName.toUpperCase() ) ) {
					const after = document.createElement( 'p' );
					let found = false;
					child.childNodes.forEach( c => {
						if( found ) {
							after.appendChild( c );
						} else if ( c.tagName == 'BR' ) {
							found = true;
						}
					} );
					
					contentWrapper.appendChild( child ); // the title
					contentWrapper.appendChild( after );
				} else {
					contentWrapper.appendChild( child );
				}
			}
			li.appendChild( contentWrapper );
			
			li.prepend( iconEle ); // pull the icon back out to the front
		} );
	} );
}

function decorateImgs( element ) {
	element.querySelectorAll( 'p img:only-child, p picture:only-child, p figure:only-child' ).forEach( ( img ) => {
		// if there is nothing else in the paragraph, unwrap the image
		if( !img.closest( 'body' ) ) { return; } // skip if ul is not in the DOM (i.e. a fragment)

		const pEle = img.closest( 'p' );
		let isOnlyNode = true;
		pEle.childNodes.forEach( ( childNode ) => {
			if( childNode !== img && childNode.textContent.trim().length > 0 ) {
				isOnlyNode = false;
			}
		} );

		if( isOnlyNode ) {
			pEle.replaceWith( img );
		}
	} );
}
		


/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
export function decorateMain( main ) {
	main.id = 'main-content';
	decorateInner( main );

}

function decorateSections( main ) {
	main.querySelectorAll( ':scope > div' ).forEach( ( section ) => {
		const wrappers = [];
		let defaultContent = false;
		[...section.children].forEach( ( e ) => {
			if ( e.tagName === 'DIV' || !defaultContent ) {
				const wrapper = document.createElement( 'div' );
				wrappers.push( wrapper );
				defaultContent = e.tagName !== 'DIV';
				if ( defaultContent ) wrapper.classList.add( 'default-content-wrapper' );
			}
			wrappers[wrappers.length - 1].append( e );
		} );
		wrappers.forEach( ( wrapper ) => section.append( wrapper ) );
		section.classList.add( 'section' );
		section.dataset.sectionStatus = 'initialized';
		section.style.display = 'none';

		// Process section metadata
		const sectionMeta = section.querySelector( 'div.section-metadata' );
		if ( sectionMeta ) {
			const meta = readBlockConfig( sectionMeta );
			Object.keys( meta ).forEach( ( key ) => {
				if( key == 'layout' ){
					const layout = meta[key].split( '/' );
					const sum = parseInt( layout[0] ) + parseInt( layout[1] );

					if( sum == 100 && parseInt( layout[0] ) >= 10 && parseInt( layout[1] ) >= 10 ){
						section.classList.add('section-grid')
						section.style.setProperty( '--grid-columns', `${layout[0]-1}% ${layout[1]-1}%` )
					}
				}
				if ( key === 'style' ) {
					const styles = meta.style
						.split( ',' )
						.filter( ( style ) => style )
						.map( ( style ) => toClassName( style.trim() ) );
					styles.forEach( ( style ) => section.classList.add( style ) );
				} else {
					section.dataset[toCamelCase( key )] = meta[key];
				}
			} );
			sectionMeta.parentNode.remove();
		}
	} );
}

export function decorateInner( container ) {
	decorateH2s( container );
	decorateImgs( container );
	decorateButtons( container );
	decorateYouTube( container );
	decorateGoogleMaps( container );
	decorateIcons( container );
	decorateIconList( container );
	decorateSections( container );
	decorateBlocks( container );
	decorateUnstyledLinks( container );
	decorateExternalLinks( container );
}

/**
 *
 * @param {Element} doc The container element
 * @param {string} templateName The template name from document metadata
 */
async function loadTemplate( doc, templateName ) {
	try {
		const cssLoaded = new Promise( ( resolve ) => {
			loadCSS( `${window.hlx.codeBasePath}/templates/${templateName}/${templateName}.css`, resolve() );
		} );
		const decorationComplete = new Promise( ( resolve ) => {
			( async () => {
				try {
					const mod = await import( `../templates/${templateName}/${templateName}.js` );
					if ( mod.default ) {
						await mod.default( doc );
					}
				} catch ( error ) {
					// eslint-disable-next-line no-console
					console.log( `failed to load module for ${templateName}`, error );
				}
				resolve();
			} )();
		} );
		await Promise.all( [cssLoaded, decorationComplete] );
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.log( `failed to load template ${templateName}`, error );
	}
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager( doc ) {
	// Brand slug application
	const brandSlug = getMetadata( 'brandslug' );
	if ( brandSlug ) {
		document.title = document.title + ' | ' + brandSlug;
	}
	document.documentElement.lang = 'en';
	decorateTemplateAndTheme();
	loadHeader( doc.querySelector( 'header' ) );
	// load the blocks BEFORE decorating the template
	const main = doc.querySelector( 'main' );
	if ( main ) {
		decorateMain( main );
		await loadSection( main.querySelector( '.section' ), waitForFirstImage );
	}

	// pull in template name from document metadata
	// fallback to USWDS "documentation" template if none is specified
	const templateName = getMetadata( 'template' );
	if ( templateName ) {
		await loadTemplate( doc, templateName );
	} else {
		await loadTemplate( doc, 'default' );
	}

	// // build components that should be in main but be outside of the main template area
	buildAutoBlocks( main, templateName );
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy( doc ) {
	const main = doc.querySelector( 'main' );
	await loadSections( main );

	const { hash } = window.location;
	const element = hash ? doc.getElementById( hash.substring( 1 ) ) : false;
	if ( hash && element ) element.scrollIntoView();

	loadFooter( doc.querySelector( 'footer' ) );
	loadCSS( `${window.hlx.codeBasePath}/styles/lazy-styles.css` );
	loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
	window.setTimeout( () => import( './delayed.js' ), 3000 );
	// load anything that can be postponed to the latest here
}

async function loadFonts() {
	await loadCSS( 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap' );
	try {
		if ( !window.location.hostname.includes( 'localhost' ) ) sessionStorage.setItem( 'fonts-loaded', 'true' );
	} catch ( e ) {
		// do nothing
	}
}

async function loadPage() {
	await loadEager( document );
	await loadLazy( document );
	loadDelayed();
}

await loadPage();

// add class to to make the content appear in case header gets stuck
( function bodyAppear() {

	function addClass() {
		document.body.classList.add( 'appear' );
	}
	setTimeout( addClass, 2000 );
} )();

// enable document authoring snippet
( async function loadDa() {
	if ( !new URL( window.location.href ).searchParams.get( 'dapreview' ) ) return;
	import( 'https://da.live/scripts/dapreview.js' ).then( ( { default: daPreview } ) => daPreview( loadPage ) );
}() );
