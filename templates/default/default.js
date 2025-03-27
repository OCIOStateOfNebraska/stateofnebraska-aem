import {
	div
} from '../../scripts/dom-helpers.js';

/**
 * Decorates the document to align with USWDS Documentation Page Template
 * @param {Element} doc current document
 */
export default async function decorate( doc ) {
	// TODO: see if any of this is common between USWDS templates and should be consolidated
	const main = doc.querySelector( 'main' );
	main.classList.add( 'desktop:grid-col-9', 'usa-prose' );
	const usaSectionDiv = div( { class: 'usa-section' } );
	const usaGridDiv = div( { class: 'grid-container' } );
	const usaGridRowDiv = div( { class: 'grid-row grid-gap' } );
	usaGridRowDiv.append( main );
	usaGridDiv.append( usaGridRowDiv );
	usaSectionDiv.append( usaGridDiv );
	document.querySelector( 'header' ).after( usaSectionDiv );
	// TODO: create / decorate sidenav
	// const siteNav = buildBlock('sidnav', '');
	// usaGridRowDiv.append(siteNav);
	// decorateBlock(siteNav);
}