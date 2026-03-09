import { createOptimizedPicture } from '../../scripts/aem.js';
import { domEl } from '../../scripts/dom-helpers.js';

/**
 * Validates an email address using a basic regex pattern.
 * @param {string} email - The email address to validate.
 * @returns {boolean} True if the email is valid, false otherwise.
 */
function isValidEmail( email ) {
	// Basic email validation: requires @ symbol, domain, and TLD
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test( email );
}

/**
 * Creates a placeholder SVG when no image is provided.
 * @returns {SVGElement} A placeholder user icon SVG.
 */
function createPlaceholderImage() {
	const svg = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );
	svg.setAttribute( 'class', 'contact-card__placeholder' );
	svg.setAttribute( 'viewBox', '0 0 24 24' );
	svg.setAttribute( 'fill', 'currentColor' );
	svg.setAttribute( 'role', 'img' );
	svg.setAttribute( 'aria-label', 'Image not provided' );

	const path = document.createElementNS( 'http://www.w3.org/2000/svg', 'path' );
	path.setAttribute( 'd', 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' );

	svg.appendChild( path );
	return svg;
}

/**
 * Generates the media content in the contact card.
 * @param {HTMLElement} imageCell - The cell element containing the image.
 * @param {HTMLElement} container - The card wrapper the content should be in.
 */
function generateMedia( imageCell, container ) {
	const mediaWrapper = domEl( 'div', { class: 'usa-card__media' } );
	const imgWrapper = domEl( 'div', { class: 'usa-card__img' } );
	const img = imageCell?.querySelector( 'img' );

	if ( img ) {
		imgWrapper.append( img );
	} else {
		// Create placeholder if no image provided
		const placeholder = createPlaceholderImage();
		imgWrapper.append( placeholder );
		imgWrapper.classList.add( 'contact-card__placeholder-wrapper' );
	}

	mediaWrapper.append( imgWrapper );
	container.append( mediaWrapper );
}

/**
 * Generates the non-media content in the contact card (name, title, email).
 * @param {HTMLElement} nameDiv - The div element containing the name.
 * @param {HTMLElement} titleDiv - The div element containing the title.
 * @param {HTMLElement} emailDiv - The div element containing the email.
 * @param {HTMLElement} container - The card wrapper the content should be in.
 */
function generateContent( nameDiv, titleDiv, emailDiv, container ) {
	const bodyWrapper = domEl( 'div', { class: 'usa-card__body' } );

	// Name (optional field)
	const nameText = nameDiv?.textContent?.trim();
	if ( nameText ) {
		const heading = domEl( 'p', {
			class: 'usa-card__heading',
			tabindex: '0'
		} );

		// Check if name contains a link
		const nameLink = nameDiv?.querySelector( 'a' );
		if ( nameLink && nameLink.href ) {
			// Create link that opens in new tab
			const link = domEl( 'a', {
				href: nameLink.href,
				target: '_blank',
				rel: 'noopener noreferrer'
			} );
			link.textContent = nameText;
			heading.append( link );
		} else {
			// No link, just add text
			heading.textContent = nameText;
		}

		bodyWrapper.append( heading );
	}

	// Title (optional field)
	const titleText = titleDiv?.textContent?.trim();
	if ( titleText ) {
		const title = domEl( 'p', {
			class: 'contact-card-title',
			tabindex: '0'
		} );
		title.textContent = titleText;

		bodyWrapper.append( title );
	}

	// Email (optional field)
	let emailAddress = null;

	// First check if there's an existing anchor tag with mailto href
	const existingEmailLink = emailDiv?.querySelector( 'a[href^="mailto:"]' );
	if ( existingEmailLink ) {
		// Extract email from href attribute
		emailAddress = existingEmailLink.href.replace( /^mailto:/i, '' );
	} else {
		// Fall back to using text content
		const emailText = emailDiv?.textContent?.trim();
		if ( emailText ) {
			emailAddress = emailText;
		}
	}

	if ( emailAddress ) {
		// Validate email address
		if ( isValidEmail( emailAddress ) ) {
			// Valid email: create mailto link
			const emailLink = domEl( 'a', {
				class: 'contact-card-email',
				href: `mailto:${emailAddress}`
			} );
			emailLink.textContent = emailAddress;
			bodyWrapper.append( emailLink );
		} else {
			// Invalid email: display as plain text
			const emailText = domEl( 'p', {
				class: 'contact-card-email contact-card-email--invalid'
			} );
			emailText.textContent = emailAddress;
			bodyWrapper.append( emailText );
		}
	}

	container.append( bodyWrapper );
}

/**
 * Generates the complete contact card.
 * @param {HTMLElement} container - The card wrapper (child of the li).
 * @param {Array} cells - Array of cell elements from the table row.
 */
function generateWholeCard( container, cells ) {
	// Expected structure: [Image, Name, Title, Email]
	const imageDiv = cells[0];
	const nameDiv = cells[1];
	const titleDiv = cells[2];
	const emailDiv = cells[3];

	// Generate media section
	if ( imageDiv ) {
		generateMedia( imageDiv, container );
	}

	// Generate content section
	generateContent( nameDiv, titleDiv, emailDiv, container );
}

/**
 * Decorates the contact card grid block.
 * @param {HTMLElement} block - The card grid generated by AEM.
 */
export default function decorate( block ) {
	// All cards use the same responsive grid pattern
	// Mobile: 12 cols (1 card per row), Tablet: 6 cols (2 per row), Desktop: 4 cols (3 per row)
	const grid = 'grid-col-12 tablet:grid-col-6 desktop:grid-col-4';

	const ul = domEl( 'ul', { class: 'usa-card-group grid-row' } );

	// Build cards in a DocumentFragment to minimize reflows
	const tempList = document.createDocumentFragment();

	// Process each table row as a contact card
	[...block.children].forEach( ( row, index ) => {
		// First card gets special class for centering on its own row
		const managerClass = index === 0 ? ' contact-card--manager' : '';
		const li = domEl( 'li', { class: `usa-card contact-card ${grid}${managerClass}` } );
		const cardContainer = domEl( 'div', { class: 'usa-card__container' } );

		// Get all cells from the row
		const cells = [...row.children];

		// Generate the card structure
		generateWholeCard( cardContainer, cells );

		li.append( cardContainer );
		tempList.append( li );
	} );

	// Append all cards at once (single reflow)
	ul.append( tempList );

	// Optimize all images in the grid (lazy loading is set automatically)
	ul.querySelectorAll( 'img' ).forEach( ( img ) => {
		// Use existing alt text or fallback to 'Contact photo'
		const alt = img.alt || 'Contact photo';
		img.replaceWith(
			createOptimizedPicture( img.src, alt, false, [{ width: '605' }] )
		);
	} );

	// Replace block content with the generated grid
	block.textContent = '';
	block.append( ul );
}
