import { getMetadata } from '../../scripts/aem.js';
import { parseCombinedDateTime, convertTo24Hour } from '../../scripts/event-utils.js';
import { domEl } from '../../scripts/dom-helpers.js';

/**
 * Formats a date string to a readable format with semantic HTML
 * @param {string} dateString The date string to format (ISO format: YYYY-MM-DD)
 * @param {string} timeString Optional time string to include
 * @returns {HTMLElement|string} Formatted date as DOM element or string if error
 */
function formatDate( dateString, timeString = null ) {
	if ( !dateString ) return '';

	try {
		const date = new Date( dateString );
		const formattedDate = date.toLocaleDateString( 'en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		} );

		const container = document.createElement( 'div' );

		const timeEl = document.createElement( 'time' );
		timeEl.setAttribute( 'datetime', dateString );
		timeEl.textContent = formattedDate;
		container.appendChild( timeEl );

		if ( timeString ) {
			container.appendChild( document.createElement( 'br' ) );
			const timeText = document.createTextNode( timeString );
			container.appendChild( timeText );
		}

		return container;
	} catch ( error ) {
		console.warn( `Error formatting date: ${dateString}`, error ); // eslint-disable-line no-console
		return dateString;
	}
}

/**
 * Creates a metadata card (white card with shadow)
 * @param {string} label The field label
 * @param {string|HTMLElement} content The field content (string or DOM element)
 * @param {HTMLElement} actionElement Optional action element (button or link)
 * @returns {HTMLElement} The metadata card element
 */
function createMetadataCard( label, content, actionElement = null ) {
	const card = document.createElement( 'div' );
	card.className = 'event__card';

	const header = document.createElement( 'div' );
	header.className = 'event__card-header';

	const labelId = `event-${label.toLowerCase().replace( /[^a-z0-9-]/g, '-' )}`;
	const contentId = `event-content-${label.toLowerCase().replace( /[^a-z0-9-]/g, '-' )}`;

	const labelEl = document.createElement( 'h2' );
	labelEl.className = 'event__card-label';
	labelEl.id = labelId;
	labelEl.textContent = label;
	header.appendChild( labelEl );

	if ( actionElement ) {
		actionElement.setAttribute( 'aria-describedby', contentId );
		header.appendChild( actionElement );
	}

	const contentEl = document.createElement( 'div' );
	contentEl.className = 'event__card-content';
	contentEl.id = contentId;
	contentEl.setAttribute( 'aria-labelledby', labelId );

	if ( typeof content === 'string' ) {
		contentEl.textContent = content;
	} else if ( content instanceof HTMLElement ) {
		contentEl.appendChild( content );
	}

	card.appendChild( header );
	card.appendChild( contentEl );

	return card;
}

/**
 * Converts date and time to iCal format (YYYYMMDDTHHMMSS)
 * @param {string} dateString Date in ISO format (YYYY-MM-DD)
 * @param {string} timeString Time string (e.g., "9:00 am" or "14:00")
 * @returns {string} iCal formatted datetime
 */
function toICalDateTime( dateString, timeString = null ) {
	if ( !dateString ) return '';

	const match = dateString.match( /^(\d{4})-(\d{2})-(\d{2})$/ );
	if ( !match ) {
		console.warn( `Invalid date format for iCal: ${dateString}. Expected YYYY-MM-DD` ); // eslint-disable-line no-console
		return '';
	}

	const [, year, month, day] = match;

	if ( !timeString ) {
		return `${year}${month}${day}`;
	}

	const time24 = convertTo24Hour( timeString );
	if ( !time24 ) {
		console.warn( `Invalid time format for iCal: ${timeString}` ); // eslint-disable-line no-console
		return `${year}${month}${day}`;
	}

	const [hours, minutes] = time24.split( ':' );
	return `${year}${month}${day}T${hours}${minutes}00`;
}

/**
 * Generates an iCal (.ics) file content
 * @param {object} eventData Event metadata
 * @returns {string} iCal file content
 */
function generateICalFile( eventData ) {
	const {
		name,
		startDateTime,
		endDateTime,
		location,
		address,
		description,
		url,
	} = eventData;

	const start = parseCombinedDateTime( startDateTime );
	const end = parseCombinedDateTime( endDateTime );

	const dtStart = toICalDateTime( start.date, start.time );
	const dtEnd = end.date ? toICalDateTime( end.date, end.time ) : null;

	const locationString = [location, address].filter( Boolean ).join( ', ' );
	const uid = `event-${start.date || 'unknown'}-${Date.now()}@nebraska.gov`;

	const cleanDescription = description
		? description.replace( /\n/g, '\\n' ).replace( /,/g, '\\,' ).substring( 0, 500 )
		: null;

	const icsLines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//State of Nebraska//Events//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		`UID:${uid}`,
		`DTSTAMP:${toICalDateTime( new Date().toISOString().split( 'T' )[0] )}`,
		`DTSTART:${dtStart}`,
	];

	const optionalLines = [
		dtEnd && dtEnd !== dtStart && `DTEND:${dtEnd}`,
		name && `SUMMARY:${name.replace( /\n/g, '\\n' )}`,
		locationString && `LOCATION:${locationString.replace( /\n/g, '\\n' )}`,
		cleanDescription && `DESCRIPTION:${cleanDescription}`,
		url && `URL:${url}`,
	].filter( Boolean );

	icsLines.push( ...optionalLines, 'END:VEVENT', 'END:VCALENDAR' );

	return icsLines.join( '\r\n' );
}

/**
 * Downloads an iCal file
 * @param {string} icsContent The iCal file content
 * @param {string} filename The filename (without extension)
 */
function downloadICalFile( icsContent, filename = 'event' ) {
	const blob = new Blob( [icsContent], { type: 'text/calendar;charset=utf-8' } );
	const link = document.createElement( 'a' );
	link.href = URL.createObjectURL( blob );
	link.download = `${filename}.ics`;
	document.body.appendChild( link );
	link.click();
	document.body.removeChild( link );
	URL.revokeObjectURL( link.href );
}

/**
 * Creates "Add to Calendar" button
 * @param {object} eventData Event metadata for calendar generation
 * @returns {HTMLElement} Button element
 */
function createCalendarButton( eventData ) {
	const button = document.createElement( 'button' );
	button.className = 'event__action-button usa-button usa-button--outline';
	button.textContent = '+ Add to Calendar';
	button.type = 'button';
	button.setAttribute( 'aria-label', 'Add to calendar (downloads .ics file)' );

	button.addEventListener( 'click', () => {
		try {
			const icsContent = generateICalFile( eventData );
			const filename = eventData.name
				? eventData.name.toLowerCase().replace( /[^a-z0-9]+/g, '-' )
				: 'event';
			downloadICalFile( icsContent, filename );
		} catch ( error ) {
			console.error( 'Error generating calendar file:', error ); // eslint-disable-line no-console
			alert( 'Unable to create calendar file. Please try again.' ); // eslint-disable-line no-alert
		}
	} );

	return button;
}

/**
 * Creates "Get directions" link
 * @param {string} address The address to link to
 * @returns {HTMLElement} Link element
 */
function createMapLink( address ) {
	const link = document.createElement( 'a' );
	link.className = 'event__action-link usa-link usa-link--external';
	link.textContent = 'View map';
	link.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent( address )}`;
	link.target = '_blank';
	link.rel = 'noopener noreferrer';
	link.setAttribute( 'aria-label', 'Get directions (opens in new tab)' );
	return link;
}

/**
 * Event Block
 * Displays structured event metadata in separate white cards
 * @param {Element} block The event block element
 */
export default function decorate( block ) {
	const eventStartDate = getMetadata( 'event-start-date' )?.trim();
	const eventEndDate = getMetadata( 'event-end-date' )?.trim();
	const eventLocation = getMetadata( 'event-location' )?.trim();
	const eventAddress = getMetadata( 'event-address' )?.trim();
	const eventHostOrganization = getMetadata( 'event-host-organization' )?.trim();

	const container = document.createElement( 'div' );
	container.className = 'event__container';

	if ( eventStartDate ) {
		const start = parseCombinedDateTime( eventStartDate, { includeDateObject: true } );
		const end = parseCombinedDateTime( eventEndDate, { includeDateObject: true } );

		if ( start.dateObject && end.dateObject && end.dateObject < start.dateObject ) {
			console.warn( 'Event end date is before start date' ); // eslint-disable-line no-console
		}

		if ( start.dateObject && start.dateObject < new Date() ) {
			console.debug( 'Event is in the past' ); // eslint-disable-line no-console
		}

		let displayTime = start.time || '';
		if ( end.time && end.time !== start.time ) {
			displayTime += ` - ${end.time}`;
		}

		const dateTimeContent = formatDate( start.date, displayTime );

		const eventData = {
			name: getMetadata( 'og:title' ) || document.title,
			startDateTime: eventStartDate,
			endDateTime: eventEndDate,
			location: eventLocation,
			address: eventAddress,
			description: getMetadata( 'event-description' ) || getMetadata( 'description' ),
			url: window.location.href,
		};

		const calendarButton = createCalendarButton( eventData );
		const dateCard = createMetadataCard( 'Date & Time', dateTimeContent, calendarButton );
		container.appendChild( dateCard );
	}

	if ( eventLocation || eventAddress ) {
		const locationContentEl = domEl( 'div' );

		if ( eventLocation ) {
			const locationName = document.createElement( 'div' );
			locationName.className = 'event__location-name';
			locationName.textContent = eventLocation;
			locationContentEl.appendChild( locationName );
		}

		if ( eventAddress ) {
			const addressEl = document.createElement( 'address' );
			addressEl.className = 'event__address';
			addressEl.textContent = eventAddress;
			locationContentEl.appendChild( addressEl );
		}

		const mapLink = eventAddress ? createMapLink( eventAddress ) : null;
		const locationCard = createMetadataCard( 'Event Location', locationContentEl, mapLink );
		container.appendChild( locationCard );
	}

	if ( eventHostOrganization ) {
		const hostCard = createMetadataCard( 'Host Organization', eventHostOrganization );
		container.appendChild( hostCard );
	}

	if ( container.children.length > 0 ) {
		block.innerHTML = '';
		block.appendChild( container );
	} else {
		console.warn( 'Missing required event metadata. Add event-start-date to page metadata.' ); // eslint-disable-line no-console
		block.remove();
	}
}
