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
	const usaContainerDiv = div( { class: 'grid-container' } );
	main.parentNode.append( usaSectionDiv );
	usaSectionDiv.append( usaContainerDiv );

	const usaContentDiv = div( { class: ( showSideNav ? 'desktop:grid-col-9 usa-prose main-content' :  'usa-prose main-content' ) } );

	if( showSideNav ) {
		const usaGridRowDiv = div( { class: 'grid-row grid-gap' } );
		usaContainerDiv.append( usaGridRowDiv );
		usaGridRowDiv.append( usaContentDiv );
	} else {
		usaContainerDiv.append( usaContentDiv );
	}

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
		const inPageNav = buildBlock( 'in-page-navigation', '' );
		usaContainerDiv.appendChild( inPageNav );
		decorateBlock( inPageNav );
		await loadBlock( inPageNav );
	}
}
