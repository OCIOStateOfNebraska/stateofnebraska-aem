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
	const usaSectionDiv = div( { class: 'usa-section main-content' } );
	const usaGridDiv = div( { class: 'grid-container' } );
	const usaGridRowDiv = div( { class: 'grid-row grid-gap' } );
	const usaContentDiv = div( { class: 'desktop:grid-col-12 usa-prose' } );
	main.parentNode.append( usaSectionDiv );
	usaSectionDiv.append( usaGridDiv );
	usaGridDiv.append( usaGridRowDiv );
	usaGridRowDiv.append( usaContentDiv );
	main.append( usaSectionDiv );
	[...main.children].forEach( ( child ) => {
		if ( !child.classList.contains( 'main-content' ) ) {
			usaContentDiv.appendChild( child );
		}
	} );
	// TODO: create / decorate sidenav
	// const siteNav = buildBlock('sidnav', '');
	// usaGridRowDiv.append(siteNav);
	// decorateBlock(siteNav);
}