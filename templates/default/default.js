import {
	div
} from '../../scripts/dom-helpers.js';

import { getMetadata, buildBlock, decorateBlock, loadBlock } from '../../scripts/aem.js';

/**
 * Decorates the document to align with USWDS Documentation Page Template
 * @param {Element} doc current document
 */
export default async function decorate( doc ) {
	// TODO: see if any of this is common between USWDS templates and should be consolidated
	const layout = getMetadata( 'layout' )?.toLowerCase().trim() || 'default' ;
	const showSideNav = layout === 'side-nav' || layout === 'side nav';
	const showInPageNav = !showSideNav && ( layout === 'in-page-nav' || layout === 'in page nav' );

	const main = doc.querySelector( 'main' );
	const usaSectionDiv = div( { class: 'usa-section' } );
	const usaGridDiv = div( { class: 'grid-container' } );
	const usaGridRowDiv = div( { class: 'grid-row grid-gap' } );
	main.parentNode.append( usaSectionDiv );
	usaSectionDiv.append( usaGridDiv );
	usaGridDiv.append( usaGridRowDiv );

	const usaContentDiv = div( { class: ( showSideNav || showInPageNav ? 'desktop:grid-col-9 usa-prose main-content' : 'desktop:grid-col-12 usa-prose main-content' ) } );
	usaGridRowDiv.append( usaContentDiv );
	main.append( usaSectionDiv );
	[...main.children].forEach( ( child ) => {
		if ( child !== usaSectionDiv ) {
			usaContentDiv.appendChild( child );
		}
	} );

	// Inject sidenav if that layout option is chosen
	// delay to help avoid layout shift while it loads
	if ( showSideNav ) {
		// Resolve conflicts :) 
	} else if( showInPageNav ) {
		const usaGridSideNavDiv = div( { class: 'desktop:grid-col-3' } );
		const inPageNav = buildBlock( 'in-page-navigation', '' );
		usaGridSideNavDiv.append( inPageNav );
		usaGridRowDiv.appendChild( usaGridSideNavDiv );
		decorateBlock( inPageNav );
		await loadBlock( inPageNav );
	}
}
