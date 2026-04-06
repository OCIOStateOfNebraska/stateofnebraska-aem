import { domEl } from '../../scripts/dom-helpers.js';
import { removeEmptyChildren, checkIfRowExists, getIndividualIcon } from '../../scripts/utils.js';
import { getMetadata, createOptimizedPicture } from '../../scripts/aem.js';

/**
 * loads and decorates the footer-navigation
 * @param {Element} block The footer-navigation block element
 */
export default async function decorate( block ) {
	block.classList.add( 'usa-footer', 'usa-footer--big' );
	// generate wrapper domEls

	const svg = `
		<svg class="usa-footer__svg-graphic" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1730.1 86.006" preserveAspectRatio="none">
			<path class="usa-footer__svg-background" d="M1126.5 33.5C950.5 9.7 820.8 8.7 624.7 7.3 457.8 6 245.9 12.3 0 39.1V0h1730v47c-166.2-12.2-287.5-18.3-304.4-18.6-22.2-.4-45.1-.6-45.1-.6h-1.6c-52.2-.4-138.8 0-248.8 5.5-1.2 0-2.5.1-3.7.2h.1Z" />
			<path class="usa-footer__svg-stroke" d="M0 39.1C245.9 12.3 457.8 6 624.7 7.2c196 1.4 325.8 2.4 501.8 26.2 1.3.2 2.7.4 4 .5 100.2 13.7 205.9 33.5 374.4 44.7l3.2.2c93.5 6.1 170.7 7.3 221.9 7.2M790.9 57.7c111.4-8.7 220.4-18.2 335.6-24.2 1.2 0 2.5-.1 3.7-.2 109.9-5.6 196.6-6 248.8-5.5h1.6s22.9.2 45.1.6c16.9.3 138.2 6.4 304.4 18.6M0 58.2c21.3 2.9 52.5 6.9 90.3 10.4 3.2.3 6.5.6 9.7.9 88.8 7.7 158.1 7 200.7 7.6 182.6 2.6 338.7-7.6 490.3-19.4" />
			<path class="usa-footer__svg-stroke usa-footer__svg-stroke--alt" d="M0 80c34-3.9 67.4-7.4 100-10.5 290.7-27.6 523.8-22.8 690.9-11.8 145.2 9.6 306.9 28.5 556.7 25.6 56.1-.7 108.8-2.3 157.3-4.6 91-4.2 167.4-10.5 225.1-16" />
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
		// eslint-disable-next-line no-console
		console.error( 'Footer has wrong number of rows. Please reauthor' );
		return;
	}

	const [siteMap, infoAndSocial, accreditation, footerLinks] = children.map( ( child, index ) => { return checkIfRowExists( children, index ); } );

	/**
	 * Styles the back to top button
	 */
	function styleBackToTop() {
		const container = domEl( 'div', { class: 'grid-container usa-footer__return-to-top' } );
		const a = domEl( 'a', { class: 'usa-button usa-button--outline', 'href': '#' }, 'Return to top' );
		container.append( a );
		getIndividualIcon( a, 'arrow_upward' );
		block.prepend( container );
	}

	/**
	 * Styles the sitemap section of the footer.
	 *
	 * @param {HTMLCollection} row - The sitemap section of the footer.
	 */
	function styleSitemap( row ) {
		const container = domEl( 'nav', { class: 'usa-footer__nav', 'aria-label': 'Footer navigation' } );
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

		logoColumn.classList.add( 'usa-footer__logo', 'grid-row', 'mobile-lg:grid-col-6', 'mobile-lg:grid-gap-2' );
		Array.from( logoColumn.children ).forEach( el => {
			const col = domEl( 'div', { class: 'grid-col-auto' } );
			col.append( el );
			logoColumn.append( col );
		} );

		if ( logoColumn.querySelector( 'picture' ) ) {
			logoColumn.querySelector( 'picture' ).querySelectorAll( 'img' ).forEach( ( img ) => {
				const optimizedPicture = createOptimizedPicture( img.src, img.alt, false, [{ width: '250' }] );
				img.closest( 'picture' ).replaceWith( optimizedPicture );
			} );
			// after we replace the picture tag, add the class to the new tag
			logoColumn.querySelector( 'picture' ).classList.add( 'usa-footer__logo-img' );
		}
	}

	/**
	* Styles the social media section of the footer.
	*
	* @param {Element} socialColumn - The element containing the social media links.
	*/
	function styleSocial( socialColumn ) {
		const socialLinks = socialColumn.querySelector( 'ul' );
		const optionalButton = socialColumn.querySelector( '.usa-button' );
		if ( optionalButton ) {
			optionalButton.classList.remove( 'usa-button' );
		}

		if ( socialLinks ) {
			socialColumn.classList.add( 'usa-footer__contact-links', 'mobile-lg:grid-col-6' );
			socialLinks.classList.add( 'usa-footer__social-links', 'grid-row', 'grid-gap-1', 'usa-list', 'usa-list--unstyled' );

			Array.from( socialLinks.children ).forEach( li => {
				const link = li.querySelector( 'a' );
				const icon = li.querySelector( 'span' );
				li.classList.add( 'grid-col-auto' );
				link.classList.add( 'usa-social-link' );
				icon.classList.add( 'usa-social-link__icon' );
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
			child.classList.add( 'grid-container', 'usa-footer__accreditations-row' );

			child.querySelectorAll( 'img' ).forEach( ( img ) => {
				const optimizedPicture = createOptimizedPicture( img.src, img.alt, false, [{ width: '100' }] );
				img.closest( 'picture' ).replaceWith( optimizedPicture );
			} );

			// select pictures only after the element has been replaced
			const pictures = child.querySelectorAll( 'picture' );

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
		if ( row ) {
			const container = secondaryGridContainer;
			const nav = domEl( 'nav', { class: 'usa-identifier grid-container', 'aria-label': 'Footer state sites navigation' } );
			const grid = domEl( 'section', { class: 'usa-identifier__section usa-identifier__section--required-links' } );
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
		}
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
	styleBackToTop();

	block.querySelectorAll( 'p' ).forEach( el => {
		removeEmptyChildren( el ); // remove any empty p tags that are left over
	} );
}
