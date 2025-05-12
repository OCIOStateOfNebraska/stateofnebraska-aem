import {
	buildBlock,
	loadHeader,
	loadFooter,
	decorateSections,
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
import { getIndividualIcon } from '../../scripts/utils.js';
import { div, domEl } from '../../scripts/dom-helpers.js';

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
 * Decorates paragraphs containing a list of links as an unstyled link list.
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
 * Checks if a URL is on the same domain or subdomain as the current page.
 * @param {string} url The URL to check
 * @returns {boolean} True if the URL is on the same domain or subdomain, false otherwise.
 */
function isSameDomainOrSubdomain( url ) {
	try {
	// Get the current page's hostname
		const currentHostname = window.location.hostname;

		// Construct a URL object for the link
		const linkURL = new URL( url, window.location.href ); // Base URL for relative URLs
		const linkHostname = linkURL.hostname;

		// If the link and the current page have the exact same hostname, it's the same domain
		if ( linkHostname === currentHostname ) {
			return true;
		}

		// Check if the link is a subdomain of the current domain
		if ( linkHostname.endsWith( '.' + currentHostname ) ) {
			return true;
		}

		// Check if the current domain is a subdomain of the link
		if ( currentHostname.endsWith( '.' + linkHostname ) ) {
			return true;
		}

		// If none of the above conditions are met, it's not the same domain or a subdomain
		return false;
	} catch ( error ) {
		// Handle invalid URLs and return false
		// eslint-disable-next-line no-console
		console.warn( `Invalid URL: ${url}`, error );
		return false;
	}
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
		if ( a.href !== a.textContent && a.textContent ) { // only decorate if the link is wrapping text content
			if ( !a.querySelector( 'img' ) ) {
				if( isPDFUrl( a.href ) ) {
					a.setAttribute( 'target', '_blank' );
					getIndividualIcon( a, 'description', true );
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

		const url = new URL( link.href );
		const id = url.searchParams.get( 'v' ) || url.pathname.split( '/embed/' )?.[1] || url.pathname.substring( 1 );
		if ( id ) {
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

export function decorateInner( container ) {
	decorateButtons( container );
	decorateIcons( container );
	decorateH2s( container );
	decorateYouTube( container );
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

// document authoring snippet
( async function loadDa() {
	if ( !new URL( window.location.href ).searchParams.get( 'dapreview' ) ) return;
	import( 'https://da.live/scripts/dapreview.js' ).then( ( { default: daPreview } ) => daPreview( loadPage ) );
}() );
