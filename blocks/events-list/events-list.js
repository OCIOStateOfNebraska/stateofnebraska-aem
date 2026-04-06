import { domEl } from '../../scripts/dom-helpers.js';
import { parseCombinedDateTime } from '../../scripts/event-utils.js';

/**
 * Fetches the events index JSON file
 * @param {string} indexPath Path to the events index JSON file
 * @returns {Promise<Object>} The events index data
 */
async function fetchSearchIndex( indexPath ) {
	const response = await fetch( indexPath );
	if ( !response.ok ) {
		throw new Error( `Failed to fetch search index: ${response.status}` );
	}
	return response.json();
}

/**
 * Determines if an event is an event page
 * @param {Object} event Search index event entry
 * @returns {boolean} True if event is an event page
 */
function isEventPage( event ) {
	return event.template === 'events';
}

/**
 * Creates a calendar icon element
 * @param {Date} date Date object
 * @returns {HTMLElement|null} Calendar icon element or null if no date
 */
function createCalendarIcon( date ) {
	if ( !date ) return null;

	const dateLabel = date.toLocaleDateString( 'en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	} );

	const calendar = domEl( 'div', {
		class: 'events-list__calendar',
		'aria-label': dateLabel
	} );

	const month = domEl( 'div', { class: 'events-list__calendar-month' } );
	month.textContent = date.toLocaleDateString( 'en-US', { month: 'short' } ).toUpperCase();

	const day = domEl( 'div', { class: 'events-list__calendar-day' } );
	day.textContent = date.getDate();

	calendar.appendChild( month );
	calendar.appendChild( day );

	return calendar;
}

/**
 * Creates an event list item element
 * @param {Object} event Event data from search index
 * @returns {HTMLElement} Event list item element
 */
function createEventItem( event ) {
	const item = domEl( 'li', { class: 'events-list__item' } );

	const calendar = createCalendarIcon( event.startDate );
	if ( calendar ) {
		item.appendChild( calendar );
	}

	const content = domEl( 'div', { class: 'events-list__content' } );

	const heading = domEl( 'h2', { class: 'events-list__heading' } );
	const eventTitle = event.eventTitle || event.eventDescription || 'Untitled Event';
	const link = domEl( 'a', {
		href: event.path,
		class: 'events-list__link'
	} );
	link.textContent = eventTitle;
	heading.appendChild( link );
	content.appendChild( heading );

	if ( event.eventDescription && event.eventDescription !== event.eventTitle ) {
		const description = domEl( 'p', { class: 'events-list__description' } );
		const truncatedDesc = event.eventDescription.length > 300
			? event.eventDescription.substring( 0, 300 ) + '...'
			: event.eventDescription;
		description.textContent = truncatedDesc;
		content.appendChild( description );
	}

	item.appendChild( content );

	return item;
}

/**
 * Events List Block
 * Fetches and displays all events from events-index.json
 * @param {Element} block The events-list block element
 */
export default async function decorate( block ) {
	try {
		const firstRow = block.querySelector( ':scope > div' );
		const firstCell = firstRow?.querySelector( ':scope > div' );
		const indexPath = firstCell?.textContent?.trim() || '/events-index.json';

		const searchIndex = await fetchSearchIndex( indexPath );

		if ( !searchIndex.data || !Array.isArray( searchIndex.data ) ) {
			throw new Error( 'Invalid search index format' );
		}

		const eventPages = searchIndex.data
			.filter( isEventPage )
			.map( ( event ) => {
				const start = parseCombinedDateTime( event.eventStartDate, { includeDateObject: true } );

				return {
					path: event.path,
					eventTitle: event.title,
					eventDescription: event.description,
					startDate: start.dateObject,
				};
			} )
			.filter( ( event ) => {
				if ( !event.startDate ) return true;

				// Compare only dates, not times (show events for entire day)
				const today = new Date();
				const todayDateOnly = new Date( today.getFullYear(), today.getMonth(), today.getDate() );
				const eventDateOnly = new Date( event.startDate.getFullYear(), event.startDate.getMonth(), event.startDate.getDate() );

				return eventDateOnly >= todayDateOnly;
			} )
			.sort( ( a, b ) => ( a.startDate?.getTime() || 0 ) - ( b.startDate?.getTime() || 0 ) );

		if ( eventPages.length === 0 ) {
			block.innerHTML = '<p>No events found.</p>';
			return;
		}

		const container = domEl( 'div', { class: 'events-list__container' } );
		const collection = domEl( 'ul', { class: 'events-list__collection' } );

		eventPages.forEach( ( event ) => {
			const item = createEventItem( event );
			collection.appendChild( item );
		} );

		container.appendChild( collection );
		block.innerHTML = '';
		block.appendChild( container );
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error( 'Error loading events list:', error );
		block.innerHTML = '<p>Unable to load events. Please try again later.</p>';
	}
}
