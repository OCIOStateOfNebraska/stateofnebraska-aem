import {domEl} from '../../scripts/dom-helpers.js';
import {removeEmptyChildren, checkIfRowExists } from '../../scripts/utils.js';
import { getMetadata } from '../../scripts/aem.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate( block ) {
	block.classList.add( 'usa-footer', 'usa-footer--big' );
	// generate wrapper domEls
	const primarySection = domEl( 'div', { class: 'usa-footer__primary-section' } );
	const primaryGridContainer = domEl( 'div', { class: 'grid-container' } );
	const secondarySection = domEl( 'div', { class: 'usa-footer__secondary-section' } );
	const secondaryGridContainer = domEl( 'div', { class: 'grid-container secondary' } );
	// Get each of our rows for each section. They are all different and need to be grabbed one by one
	
	const children = [...block.children];
	
	if ( children.length !== 4 ) { // if they didn't author right, bail, don't render anything 
		block.innerHTML = '';
		return; 
	}
	
	const [siteMap, infoAndSocial, accreditation, footerLinks] = children.map( ( child, index ) => { return checkIfRowExists( children, index ); } );

	// Section renderers
	/**
	 * Styles the sitemap section of the footer.
	 *
	 * @param {HTMLCollection} row - The sitemap section of the footer.
	 */
	function styleSitemap( row ) {
		const container = domEl( 'nav', { class: 'usa-footer__nav', 'aria-label': 'Footer navigation'} );
		const sectionClass = 'usa-footer__primary-content usa-footer__primary-content--collapsible ';
		const grid = domEl( 'div', { class: 'grid-row grid-gap' } );
		Array.from( row ).forEach( child => {
			const section = domEl( 'section', { class: sectionClass } );
			const rows = domEl( 'div', { class: 'mobile-lg:grid-col-6 desktop:grid-col-3' } );
			while ( child.firstElementChild ) {
				child.querySelectorAll( 'ul' ).forEach( el => {
					el.classList.add( 'usa-list--unstyled', 'usa-list' );
					if ( el.previousElementSibling ) {
						el.previousElementSibling.classList.add( 'usa-footer__primary-link' );
					}
				} );
				
				child.querySelectorAll( 'li' ).forEach( el => {
					el.classList.add( 'usa-footer__secondary-link' );
				} );
				
				section.append( child.firstElementChild );
			} 
			rows.append( section );
			grid.append( rows );
		} );
		container.append( grid );
		primaryGridContainer.append( container );
		primarySection.append( primaryGridContainer );
		block.append( primarySection );
		block.removeChild( block.firstElementChild );
	}
	
	/**
	 * Styles the logo and social media section of the footer.
	 *
	 * @param {HTMLCollection} row - the logo and social media section.
	 */
	function styleLogoAndSocial( row ) {
		const grid = domEl( 'div', { class: 'grid-row grid-gap usa-footer__logo-social-row' } );
		Array.from( row ).forEach( child => {
			if ( child.querySelector( 'picture' ) ) {
				styleLogo( child );
			} else {
				styleSocial( child );
			}
			grid.append( child );
		} );
		secondaryGridContainer.append( grid );
		secondarySection.append( secondaryGridContainer );
		block.append( secondarySection );
		block.removeChild( block.firstElementChild ); // remove the empty div the children used to be in
	}
	
	// todo: add alt text
	/**
	* Styles the logo section of the footer.
	*
	* @param {Element} logoColumn - The element containing the logo.
	*/
	function styleLogo( logoColumn ) {
		const logo = logoColumn.querySelector( 'picture' );
		logoColumn.classList.add( 'usa-footer__logo', 'grid-row', 'mobile-lg:grid-col-6', 'mobile-lg:grid-gap-2' );
		logo.classList.add( 'usa-footer__logo-img' );
		logoColumn.prepend( logo );
		removeEmptyChildren( logoColumn );
		Array.from( logoColumn.children ).forEach( el => {
			const col = domEl( 'div', { class: 'grid-col-auto' } );
			col.append( el );
			logoColumn.append( col );
		} );
	}

	/**
	* Styles the social media section of the footer.
	*
	* @param {Element} socialColumn - The element containing the social media links.
	*/
	function styleSocial( socialColumn ) {
		const socialLinks = socialColumn.querySelector( 'ul' );
		const optionalButton = socialColumn.querySelector( '.usa-button' );
		if ( optionalButton ){
			optionalButton.classList.remove( 'usa-button' );
		}
			
		if ( socialLinks ) {
			socialColumn.classList.add( 'usa-footer__contact-links', 'mobile-lg:grid-col-6' );
			socialLinks.classList.add( 'usa-footer__social-links', 'grid-row', 'grid-gap-1', 'usa-list', 'usa-list--unstyled' );
				
			Array.from( socialLinks.children ).forEach( li => {
				const link = li.querySelector( 'a' );
				const icon = li.querySelector( 'svg' );
				li.classList.add( 'grid-col-auto' );
				link.classList.add( 'usa-social-link' );
				icon.parentNode.classList.add( 'usa-social-link__icon' );
			} );
		}
	}

	/**
	 * Styles the accreditation section of the footer.
	 *
	 * @param {HTMLCollection} row - The accreditation section of the footer.
	 */
	function styleAccreditation( row ) {
		const pictureWrapper = domEl( 'div', { class: 'grid-row grid-gap usa-footer__accreditations grid-col-12' } );
		Array.from( row ).forEach( child => {
			const pictures = child.querySelectorAll( 'picture' );
			child.classList.add( 'grid-row', 'grid-gap', 'usa-footer__accreditations-row' );

			[...pictures].forEach( ( picture ) => {
				picture.classList.add( 'grid-col-auto', 'usa-footer__accreditation' );
				pictureWrapper.append( picture );
			} );
			
			child.prepend( pictureWrapper );
			
			removeEmptyChildren( child );
			secondaryGridContainer.append( child );
		} );
		block.removeChild( block.firstElementChild ); // remove the empty div the children used to be in
	}
	
	/**
	 * Styles the footer links section of the footer.
	 *
	 * @param {HTMLCollection} row - The footer links section of the footer.
	 */
	function styleIdentifierLinks( row ) {
		const container = secondaryGridContainer;
		const nav = domEl( 'nav', { class: 'usa-identifier', 'aria-label': 'Footer navigation'} );
		const grid = domEl( 'section', { class: 'grid-row grid-gap usa-identifier__section usa-identifier__section--required-links' } );
		Array.from( row ).forEach( child => {
			while ( child.firstElementChild ) {
				child.querySelectorAll( 'ul' ).forEach( el => {
					el.classList.add( 'usa-list--unstyled', 'usa-list', 'usa-identifier__required-links-list' );
				} );
				
				child.querySelectorAll( 'li' ).forEach( el => {
					el.classList.add( 'usa-identifier__required-links-item' );
				} );
				
				grid.append( child.firstElementChild );
			} 
		} );
		nav.append( grid );
		container.append( nav );
		block.removeChild( block.firstElementChild ); // remove the empty div the children used to be in
	}
	
	/**
	 * Styles the copyright section of the footer.
	 */
	function styleCopyright() {
		const copyrightWrapper = domEl( 'div', { class: 'grid-row grid-gap usa-footer__copyright' } );
		const copyrightMeta = getMetadata( 'copyrightslug' );
		const col = domEl( 'div', { class: 'grid-col-12' } );
		const text = domEl( 'p' );
		const year = new Date().getFullYear();
		const child = `© ${year} ${copyrightMeta}`;
		text.append( child );
		col.append( text );
		copyrightWrapper.append( col );
		secondaryGridContainer.append( copyrightWrapper );
	}

	//decorate footer DOM
	if ( siteMap ) { styleSitemap( siteMap ); }
	styleLogoAndSocial( infoAndSocial );
	if ( accreditation ) { styleAccreditation( accreditation ); }
	styleIdentifierLinks( footerLinks );
	styleCopyright();
}
