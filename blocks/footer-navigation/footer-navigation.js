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
	// TODO: once Allison gets theming set up, trade out themes 
	const svgTheme = '#ffc44d';
	const svg = `
	<?xml version="1.0" encoding="UTF-8"?>
	<svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 1728 113" preserveAspectRatio="none">
		<defs>
            <clipPath id="clippath">
                <rect class="st0" y=".9" width="1728" height="112"/>
            </clipPath>
            <style>
                .st0, .st1, .st2 {
                    fill: none;
                }

                .st1 {
                    stroke: #bbd4dd;
                }

                .st1, .st2 {
                    stroke-width: 2px;
                }

                .st1, .st2 {
                    stroke-miterlimit: 10;
                }

                .st4 {
                    fill: #f3f7fc;
                }

                .st2 {
                    isolation: isolate;
                    opacity: .5;
                    stroke: ${svgTheme}; 
                }

                .st5 {
                    clip-path: url(#clippath);
                }
            </style>
		</defs>
        <g class="st5">
            <g>
                <path class="st4" d="M1125.5,34.4c-176-23.8-305.7-24.8-501.8-26.2C456.8,6.9,244.9,13.2-1,40V.9h1730v47c-166.2-12.2-287.5-18.3-304.4-18.6-22.2-.4-45.1-.6-45.1-.6h-1.6c-52.2-.4-138.8,0-248.8,5.5-1.2,0-2.5.1-3.7.2Z"/>
                <path class="st1" d="M-1,40C244.9,13.2,456.8,6.9,623.7,8.1c196,1.4,325.8,2.4,501.8,26.2,1.3.2,2.7.4,4,.5,100.2,13.7,205.9,33.5,374.4,44.7l3.2.2c93.5,6.1,170.7,7.3,221.9,7.2"/>
                <path class="st1" d="M789.9,58.6c111.4-8.7,220.4-18.2,335.6-24.2,1.2,0,2.5-.1,3.7-.2,109.9-5.6,196.6-6,248.8-5.5h1.6s22.9.2,45.1.6c16.9.3,138.2,6.4,304.4,18.6"/>
                <path class="st1" d="M-1,59.1c21.3,2.9,52.5,6.9,90.3,10.4,3.2.3,6.5.6,9.7.9,88.8,7.7,158.1,7,200.7,7.6,182.6,2.6,338.7-7.6,490.3-19.4"/>
                <path class="st2" d="M-1,80.9c34-3.9,67.4-7.4,100-10.5,290.7-27.6,523.8-22.8,690.9-11.8h0c145.2,9.6,306.9,28.5,556.7,25.6,56.1-.7,108.8-2.3,157.3-4.6,91-4.2,167.4-10.5,225.1-16"/>
                </g>
            </g>
		</svg>
	`;
	const primarySection = domEl( 'div', { class: 'usa-footer__primary-section' } );
	const primaryGridContainer = domEl( 'div', { class: 'grid-container' } );
	const secondarySection = domEl( 'div', { class: 'usa-footer__secondary-section' } );
	const secondaryGridContainer = domEl( 'div', { class: 'secondary' } );
	// Get each of our rows for each section. They are all different and need to be grabbed one by one
	
	primarySection.innerHTML = svg;
	
	const children = [...block.children];
	
	// Authored table MUST have four columns 
	if ( children && children.length !== 4 ) { // if they didn't author right, bail, don't render anything 
		block.innerHTML = '';
		console.error('Footer has wrong number of rows. Please reauthor');
		return; 
	}
	
	const [siteMap, infoAndSocial, accreditation, footerLinks] = children.map( ( child, index ) => { return checkIfRowExists( children, index ); } );
	
	

	// Section renderers
	// TODO: Back to Top
	// function styleBackToTop() {
	// 	const container = domEl( 'div', { class: 'grid-container usa-footer__return-to-top'} );
	// 	const a = domEl( 'a', { 'href': '#'}, 'Return to top' );
	// 	container.append( a );
	// 	block.prepend( container );
	// }
	
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
			const rows = domEl( 'div', { class: 'mobile-lg:grid-col-6 desktop:grid-col-3 usa-footer__primary-rows' } );
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
		const wrapper = domEl( 'div', { class: 'usa-footer__logo-social-row' } );
		const container = domEl( 'div', { class: 'grid-container' } );
		const grid = domEl( 'div', { class: 'grid-row grid-gap' } );
		Array.from( row ).forEach( child => {
			if ( child.querySelector( 'picture' ) ) {
				styleLogo( child );
			} else {
				styleSocial( child );
			}
			grid.append( child );
		} );
		container.append( grid );
		wrapper.append( container );
		secondaryGridContainer.append( wrapper );
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
		const pictureWrapper = domEl( 'div', { class: 'usa-footer__accreditations' } );
		Array.from( row ).forEach( child => {
			const pictures = child.querySelectorAll( 'picture' );
			child.classList.add( 'grid-container', 'usa-footer__accreditations-row' );

			[...pictures].forEach( ( picture ) => {
				const next = picture.parentNode.nextElementSibling;
				if ( next && next.querySelector( 'a' ) ) { // wrap picture in a link if link is authored 
					const a = next.querySelector( 'a' );
					if ( a && a.textContent.startsWith( 'https://' ) ) {
						a.innerHTML = '';
						a.className = '';
						a.appendChild( picture );
						a.classList.add( 'usa-footer__accreditation' );
						pictureWrapper.append( a );
					}
				} else {
					picture.classList.add( 'usa-footer__accreditation' );
					pictureWrapper.append( picture );
				}
			} );
			
			child.prepend( pictureWrapper );
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
		const nav = domEl( 'nav', { class: 'usa-identifier grid-container', 'aria-label': 'Footer navigation'} );
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
		const copyrightWrapper = domEl( 'div', { class: 'grid-container usa-footer__copyright' } );
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
	//styleBackToTop(); // TODO: back to top
	
	block.querySelectorAll( 'p' ).forEach( el => {
		removeEmptyChildren( el ); // remove any empty p tags that are left over 
	} );
}
