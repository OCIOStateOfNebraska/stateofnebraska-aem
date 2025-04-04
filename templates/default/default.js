import {
	buildBlock,
	decorateBlock,
	loadBlock,
	getMetadata
} from '../../scripts/aem.js';
import {
	div
} from '../../scripts/dom-helpers.js';

/**
 * Decorates the document to align with USWDS Documentation Page Template
 * @param {Element} doc current document
 */
export default async function decorate( doc ) {
	// TODO: see if any of this is common between USWDS templates and should be consolidated
	const layout = getMetadata( 'layout' ) || 'default';
	const showSideNav = layout.toLowerCase() === 'side-nav' || layout.toLowerCase() === 'side nav';

	const main = doc.querySelector( 'main' );
	const usaSectionDiv = div( { class: 'usa-section main-content' } );
	const usaGridDiv = div( { class: 'grid-container' } );
	const usaGridRowDiv = div( { class: 'grid-row grid-gap' } );
	main.parentNode.append( usaSectionDiv );
	usaSectionDiv.append( usaGridDiv );
	usaGridDiv.append( usaGridRowDiv );

	let usaGridSideNavDiv = null;
	let usaGridSideNavDivMobile = null;
	if ( showSideNav ) {
		usaGridSideNavDiv = div( { class: 'usa-layout-docs__sidenav display-none desktop:display-block desktop:grid-col-3' } );
		usaGridSideNavDivMobile = div( { class: 'usa-layout-docs__sidenav desktop:display-none' } );

		const sideNav = buildBlock( 'side-navigation', '' );
		usaGridSideNavDiv.append( sideNav );
		decorateBlock( sideNav );

		// await this so we can clone it for mobile
		await loadBlock( sideNav );

		const mobileSideNav = sideNav.cloneNode( true );
		usaGridSideNavDivMobile.append( mobileSideNav );
	}

	const usaContentDiv = div( { class: showSideNav ? 'desktop:grid-col-9 usa-prose' : 'desktop:grid-col-12 usa-prose' } );
	showSideNav && usaGridRowDiv.append( usaGridSideNavDiv );
	usaGridRowDiv.append( usaContentDiv );
	showSideNav && usaGridRowDiv.append( usaGridSideNavDivMobile );

	main.append( usaSectionDiv );
	[...main.children].forEach( ( child ) => {
		if ( !child.classList.contains( 'main-content' ) ) {
			usaContentDiv.appendChild( child );
		}
	} );
}