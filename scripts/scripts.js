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
 * Decorates h2 elements with a class
 * @param {Element} element container element
 */
function decorateH2s( element ) {
	element.querySelectorAll( 'h2' ).forEach( ( h2 ) => {
		const childEleTag = h2.children.length === 1 && h2.firstElementChild.tagName.toLowerCase();
		// contains only emphasized text
		if ( childEleTag && ( childEleTag === 'em' || childEleTag === 'i' ) ) {
			h2.classList.add( 'h2--underline' );
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
	decorateSections( container );
	decorateBlocks( container );
	decorateUnstyledLinks( container );
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
