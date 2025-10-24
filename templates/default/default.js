import {
	div,
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
	const showSideBar = layout === 'side-bar' || layout === 'side bar';
	const showInPageNav = !showSideBar && !showSideNav && ( layout === 'in-page-nav' || layout === 'in page nav' );

	const main = doc.querySelector( 'main' );
	const usaSectionDiv = div( { class: 'usa-section' } );
	const usaContainerDiv = div( { class: 'grid-container' } );
	main.parentNode.append( usaSectionDiv );
	usaSectionDiv.append( usaContainerDiv );

	const usaContentDiv = div( { class: ( showSideNav || showSideBar ? 'grid-col-12 tablet:grid-col-9 usa-prose main-content' :  'usa-prose main-content' ) } );

	// Only add grid if sidenav is present
	let usaGridRowDiv;
	if( showSideNav || showSideBar ) {
		usaGridRowDiv = div( { class: 'grid-row grid-gap' } );
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
		const usaGridSideNavDiv = div( { class: 'side-navigation-container side-navigation-container--tablet grid-col-12 tablet:grid-col-3' } );
		const usaGridSideNavDivMobile = div( { class: 'side-navigation-container side-navigation-container--mobile' } );


		const sideNav = buildBlock( 'side-navigation', '' );
		
		usaGridSideNavDiv.append( sideNav );
		decorateBlock( sideNav );
	
		// await this so we can clone it for mobile
		await loadBlock( sideNav );
		
		const mobileSideNav = sideNav.cloneNode( true );
		usaGridSideNavDivMobile.append( mobileSideNav );
		
		usaGridRowDiv.prepend( usaGridSideNavDiv );
		usaGridRowDiv.after( usaGridSideNavDivMobile );

	} else if( showSideBar ){
		const usaGridSideNavDiv = div( { class: 'side-navigation-container side-navigation-container--tablet grid-col-12 tablet:grid-col-3' } );
		const usaGridSideNavDivMobile = div( { class: 'side-navigation-container side-navigation-container--mobile' } );

		const sideBar = buildBlock( 'side-bar', '' );

		usaGridSideNavDiv.append( sideBar );
		decorateBlock( sideBar );

		await loadBlock( sideBar );

		usaGridRowDiv.firstChild.className = 'grid-col-12 tablet:grid-col-12 desktop:grid-col-9 usa-prose main-content';

		const mobileSideNav = sideBar.cloneNode( true );
		usaGridSideNavDivMobile.append( mobileSideNav );
		usaGridRowDiv.prepend( usaGridSideNavDiv );
		usaGridRowDiv.after( usaGridSideNavDivMobile );

	} else if( showInPageNav ) {
		const inPageNav = buildBlock( 'in-page-navigation', '' );
		usaContainerDiv.prepend( inPageNav );
		decorateBlock( inPageNav );
		await loadBlock( inPageNav );
	}
}
