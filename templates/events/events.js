import { div } from '../../scripts/dom-helpers.js';
import { buildBlock, decorateBlock, loadBlock, getMetadata } from '../../scripts/aem.js';
import { parseCombinedDateTime } from '../../scripts/event-utils.js';

/**
 * Creates JSON-LD structured data for Google Event rich results
 * @returns {object|null} The structured data object or null if required fields missing
 */
function createEventStructuredData() {
	const eventName = getMetadata( 'og:title' ) || document.title;
	const eventStartDate = getMetadata( 'event-start-date' );

	if ( !eventName || !eventStartDate ) {
		console.warn( 'Missing required fields for Event structured data (name or start date)' ); // eslint-disable-line no-console
		return null;
	}

	const eventEndDate = getMetadata( 'event-end-date' );
	const eventLocation = getMetadata( 'event-location' );
	const eventAddress = getMetadata( 'event-address' );
	const eventDescription = getMetadata( 'event-description' ) || getMetadata( 'description' );
	const eventHostOrganization = getMetadata( 'event-host-organization' );

	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'Event',
		name: eventName,
		eventStatus: 'https://schema.org/EventScheduled',
		eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
	};

	if ( eventDescription ) {
		structuredData.description = eventDescription;
	}

	const start = parseCombinedDateTime( eventStartDate, { includeTime24: true } );

	if ( start.time24 ) {
		// Combine date and time into ISO format: YYYY-MM-DDTHH:MM
		structuredData.startDate = `${start.date}T${start.time24}`;
	} else {
		structuredData.startDate = start.date;
	}

	if ( eventEndDate ) {
		const end = parseCombinedDateTime( eventEndDate, { includeTime24: true } );
		if ( end.time24 ) {
			structuredData.endDate = `${end.date}T${end.time24}`;
		} else {
			structuredData.endDate = end.date;
		}
	}

	if ( eventLocation || eventAddress ) {
		structuredData.location = {
			'@type': 'Place',
		};

		if ( eventLocation ) {
			structuredData.location.name = eventLocation;
		}

		if ( eventAddress ) {
			structuredData.location.address = {
				'@type': 'PostalAddress',
				streetAddress: eventAddress,
			};
		}
	}

	if ( eventHostOrganization ) {
		structuredData.organizer = {
			'@type': 'Organization',
			name: eventHostOrganization,
		};
	}

	return structuredData;
}

/**
 * Injects JSON-LD structured data into the document head
 * @param {object} structuredData The structured data object
 */
function injectStructuredData( structuredData ) {
	if ( !structuredData ) return;

	const script = document.createElement( 'script' );
	script.type = 'application/ld+json';
	script.textContent = JSON.stringify( structuredData );
	document.head.appendChild( script );
}

/**
 * Ensures the first heading in content is an H1 and positioned at the top
 * @param {Element} container The content container
 * @returns {Element|null} The H1 element, or null if none found
 */
function ensureH1Title( container ) {
	const firstHeading = container.querySelector( 'h1, h2, h3, h4, h5, h6' );

	if ( !firstHeading ) return null;

	if ( firstHeading.tagName !== 'H1' ) {
		const h1 = document.createElement( 'h1' );
		h1.textContent = firstHeading.textContent;
		h1.className = firstHeading.className;
		firstHeading.replaceWith( h1 );
		return h1;
	}

	return firstHeading;
}

/**
 * Decorates the document to align with USWDS Event Page Template
 * Creates a simple single-column layout for event detail pages
 * @param {Element} doc current document
 */
export default async function decorate( doc ) {
	const main = doc.querySelector( 'main' );
	const usaContentDiv = div( { class: 'usa-prose main-content event-template' } );
	const usaContainerDiv = div( { class: 'grid-container' }, usaContentDiv );
	const usaSectionDiv = div( { class: 'usa-section' }, usaContainerDiv );

	main.append( usaSectionDiv );
	[...main.children].forEach( ( child ) => {
		if ( child !== usaSectionDiv ) {
			usaContentDiv.appendChild( child );
		}
	} );

	const h1Title = ensureH1Title( usaContentDiv );

	const eventBlock = buildBlock( 'event', '' );

	if ( h1Title ) {
		h1Title.after( eventBlock );
	} else {
		usaContentDiv.prepend( eventBlock );
	}

	decorateBlock( eventBlock );
	await loadBlock( eventBlock );

	const structuredData = createEventStructuredData();
	injectStructuredData( structuredData );
}
