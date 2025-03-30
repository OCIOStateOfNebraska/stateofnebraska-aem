import {
	decorateBlock,
	buildBlock,
	loadBlock,
	loadHeader,
	loadFooter,
	decorateIcons,
	decorateSections,
	decorateBlocks,
	decorateTemplateAndTheme,
	fetchPlaceholders,
	getMetadata,
	waitForFirstImage,
	loadSection,
	loadSections,
	loadCSS,
} from './aem.js';
import {
	div,
	a
} from '../../scripts/dom-helpers.js';

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock( main ) {
	const h1 = main.querySelector( 'h1' );
	const picture = main.querySelector( 'picture' );
	// eslint-disable-next-line no-bitwise
	if ( h1 && picture && ( h1.compareDocumentPosition( picture ) & Node.DOCUMENT_POSITION_PRECEDING ) ) {
		// const section = document.createElement('div');
		// section.append(buildBlock('hero', { elems: [picture, h1] }));
		// main.prepend(section);
	}
}

/**
 * Builds breadcrumb block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildBreadcrumbBlock( main ) {
	const hideBreadcrumbVal = getMetadata( 'hide-breadcrumb' ) || 'no';
	const hideBreadcrumb = hideBreadcrumbVal.toLowerCase() === 'yes' || hideBreadcrumbVal.toLowerCase() === 'true';
	if ( window.location.pathname !== '/' && window.isErrorPage !== true && !hideBreadcrumb ) {
		const section = document.createElement( 'div' );
		section.append( buildBlock( 'breadcrumb', { elems: [] } ) );
		main.prepend( section );
	}
}

// Add USWDS Banner to page
function loadBanner( body ) {
	const bannerWrapper = document.createElement( 'div' );
	const bannerBlock = buildBlock( 'banner', '' );
	body.prepend( bannerWrapper );
	bannerWrapper.append( bannerBlock );
	decorateBlock( bannerBlock );
	return loadBlock( bannerBlock );
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks( main ) {
	try {
		buildHeroBlock( main );
		buildBreadcrumbBlock( main );
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error( 'Auto Blocking failed', error );
	}
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
 * Decorates the main element.
 * @param {Element} main The main element
 */
export function decorateMain( main ) {
	main.id = 'main-content';

	// hopefully forward compatible button decoration
	decorateButtons( main );
	decorateIcons( main );
	buildAutoBlocks( main );
	decorateSections( main );
	decorateBlocks( main );
}

export function decorateUswdsPage( doc, placeholders ) {
	const { skipnav } = placeholders;
	const overlayDiv = div( { class: 'usa-overlay' } );
	doc.querySelector( '.banner-wrapper' ).after( overlayDiv );
	const skipNav = a( { class: 'usa-skipnav', href: '#main-content' }, skipnav ? skipnav : 'Skip to main content' );
	body.prepend( skipNav );
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
	loadBanner( doc.querySelector( 'body' ) );

	const placeholders = await fetchPlaceholders();

	decorateUswdsPage( doc, placeholders );

	// pull in template name from document metadata
	// fallback to USWDS "documentation" template if none is specified
	const templateName = getMetadata( 'template' );
	if ( templateName ) {
		await loadTemplate( doc, templateName );
	} else {
		await loadTemplate( doc, 'default' );
	}

	const main = doc.querySelector( 'main' );
	if ( main ) {
		decorateMain( main );
		document.body.classList.add( 'appear' );
		await loadSection( main.querySelector( '.section' ), waitForFirstImage );
	}
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

	loadHeader( doc.querySelector( 'header' ) );
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

loadPage();

// add uswds js to page
( function uswdsInit() {
	const loadingClass = 'usa-js-loading';
	let fallback = '';

	document.documentElement.classList.add( loadingClass );
	function revertClass() {
		document.documentElement.classList.remove( loadingClass );
	}

	fallback = setTimeout( revertClass, 8000 );

	function verifyLoaded() {
		if ( window.uswdsPresent ) {
			clearTimeout( fallback );
			revertClass();
			window.removeEventListener( 'load', verifyLoaded, true );
		}
	}

	window.addEventListener( 'load', verifyLoaded, true );
}() );

const uswds = document.createElement( 'script' );
const body = document.querySelector( 'body' );
uswds.async = 'true';
uswds.src = '/scripts/uswds.min.js';
body.append( uswds );
