import { getMetadata } from '../../scripts/aem.js';
import { parseCombinedDateTime, convertTo24Hour } from '../../scripts/event-utils.js';
import { domEl } from '../../scripts/dom-helpers.js';

/**
 * Formats time string for better screen reader pronunciation
 * Converts "9:00 am" to "9:00 a.m." and "7:00 pm" to "7:00 p.m."
 * Also converts " - " to " to " for more natural reading
 * @param {string} timeString Time string to format
 * @returns {string} Formatted time string with periods and "to"
 */
function formatTimeForAccessibility( timeString ) {
	if ( !timeString ) return '';
	return timeString
		.replace( /\s*am\b/gi, ' a.m.' )
		.replace( /\s*pm\b/gi, ' p.m.' )
		.replace( /\s*-\s*/g, ' to ' );
}

/**
 * Formats a date to a readable format with semantic HTML
 * @param {Date} dateObject The Date object to format
 * @param {string} dateString ISO date string for datetime attribute (YYYY-MM-DD)
 * @param {string} timeString Optional time string to include
 * @returns {HTMLElement|string} Formatted date as DOM element or string if error
 */
function formatDate( dateObject, dateString, timeString = null ) {
	if ( !dateObject ) return '';

	try {
		const formattedDate = dateObject.toLocaleDateString( 'en-US', {
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
			const comma = document.createTextNode( ', ' );
			container.appendChild( comma );
			container.appendChild( document.createElement( 'br' ) );
			const timeSpan = document.createElement( 'span' );
			timeSpan.textContent = timeString;
			timeSpan.setAttribute( 'aria-label', formatTimeForAccessibility( timeString ) );
			container.appendChild( timeSpan );
		}

		return container;
	} catch ( error ) {
		console.warn( `Error formatting date: ${dateString}`, error ); // eslint-disable-line no-console
		return dateString;
	}
}

/**
 * Formats a date range to a readable format with semantic HTML
 * @param {Date} startDate The start Date object
 * @param {string} startDateString ISO date string for start (YYYY-MM-DD)
 * @param {Date} endDate The end Date object
 * @param {string} endDateString ISO date string for end (YYYY-MM-DD)
 * @param {string} timeString Optional time string to include
 * @returns {HTMLElement|string} Formatted date range as DOM element
 */
function formatDateRange( startDate, startDateString, endDate, endDateString, timeString = null ) {
	if ( !startDate || !endDate ) return '';

	try {
		const container = document.createElement( 'div' );
		const sameYear = startDate.getFullYear() === endDate.getFullYear();
		const sameMonth = sameYear && startDate.getMonth() === endDate.getMonth();

		// Format: "August 28-29, 2026" (same month)
		// or "August 28 - September 7, 2026" (same year)
		// or "December 28, 2026 - January 5, 2027" (different years)
		const startMonth = startDate.toLocaleDateString( 'en-US', { month: 'long' } );
		const startDay = startDate.getDate();
		const endMonth = endDate.toLocaleDateString( 'en-US', { month: 'long' } );
		const endDay = endDate.getDate();
		const endYear = endDate.getFullYear();

		let formattedRange;
		let ariaLabel;

		if ( sameMonth ) {
			// Same month and year: "August 28-29, 2026"
			formattedRange = `${startMonth} ${startDay}-${endDay}, ${endYear}`;
			ariaLabel = `From ${startMonth} ${startDay} to ${endDay}, ${endYear}`;
		} else if ( sameYear ) {
			// Different months, same year: "August 28 - September 7, 2026"
			formattedRange = `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endYear}`;
			ariaLabel = `From ${startMonth} ${startDay} to ${endMonth} ${endDay}, ${endYear}`;
		} else {
			// Different years: "December 28, 2026 - January 5, 2027"
			const startYear = startDate.getFullYear();
			formattedRange = `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
			ariaLabel = `From ${startMonth} ${startDay}, ${startYear} to ${endMonth} ${endDay}, ${endYear}`;
		}

		const timeEl = document.createElement( 'time' );
		timeEl.setAttribute( 'datetime', startDateString );
		timeEl.setAttribute( 'aria-label', ariaLabel );
		timeEl.textContent = formattedRange;
		container.appendChild( timeEl );

		if ( timeString ) {
			const comma = document.createTextNode( ', ' );
			container.appendChild( comma );
			container.appendChild( document.createElement( 'br' ) );
			const timeSpan = document.createElement( 'span' );
			timeSpan.textContent = timeString;
			timeSpan.setAttribute( 'aria-label', formatTimeForAccessibility( timeString ) );
			container.appendChild( timeSpan );
		}

		return container;
	} catch ( error ) {
		console.warn( 'Error formatting date range', error ); // eslint-disable-line no-console
		return `${startDateString} - ${endDateString}`;
	}
}

/**
 * Creates an event metadata card
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

	const match = dateString.match( /^(\d{4})-(\d{1,2})-(\d{1,2})$/ );
	if ( !match ) {
		console.warn( `Invalid date format for iCal: ${dateString}. Expected YYYY-MM-DD or YYYY-M-D` ); // eslint-disable-line no-console
		return '';
	}

	let [, year, month, day] = match;
	// Zero-pad month and day to 2 digits
	month = month.padStart( 2, '0' );
	day = day.padStart( 2, '0' );

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

	// Generate DTSTAMP (current timestamp in UTC format: YYYYMMDDTHHMMSSz)
	const now = new Date();
	const dtStamp = `${now.getUTCFullYear()}${String( now.getUTCMonth() + 1 ).padStart( 2, '0' )}${String( now.getUTCDate() ).padStart( 2, '0' )}T${String( now.getUTCHours() ).padStart( 2, '0' )}${String( now.getUTCMinutes() ).padStart( 2, '0' )}${String( now.getUTCSeconds() ).padStart( 2, '0' )}Z`;

	// Determine if this is an all-day event (no time component)
	const isAllDay = !start.time;

	const icsLines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//State of Nebraska//Events//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		`UID:${uid}`,
		`DTSTAMP:${dtStamp}`,
		isAllDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`,
	];

	const optionalLines = [
		dtEnd && dtEnd !== dtStart && ( isAllDay ? `DTEND;VALUE=DATE:${dtEnd}` : `DTEND:${dtEnd}` ),
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

	// Show warning if required start date is missing
	if ( !eventStartDate ) {
		const warningCard = document.createElement( 'div' );
		warningCard.style.cssText = 'background: #fff3cd; border: 2px solid #ffc107; padding: 1rem; color: #856404; border-radius: 4px; margin-bottom: 1rem;';
		warningCard.innerHTML = '<strong>⚠️ Event Block:</strong> Missing required metadata. Add <code style="background: #fff; padding: 0.2rem 0.4rem; border-radius: 2px;">event-start-date</code> to page metadata.';
		container.appendChild( warningCard );
		console.warn( 'Missing required event metadata. Add event-start-date to page metadata.' ); // eslint-disable-line no-console
	}

	if ( eventStartDate ) {
		const start = parseCombinedDateTime( eventStartDate, { includeDateObject: true } );
		const end = parseCombinedDateTime( eventEndDate, { includeDateObject: true } );
		const eventTitle = getMetadata( 'og:title' ) || document.title;

		if ( start.dateObject && end.dateObject && end.dateObject < start.dateObject ) {
			console.warn( `Event end date is before start date: "${eventTitle}". Date card will not be displayed.` ); // eslint-disable-line no-console

			// Show visible warning for authors
			const dateWarningCard = document.createElement( 'div' );
			dateWarningCard.style.cssText = 'background: #fff3cd; border: 2px solid #ffc107; padding: 1rem; color: #856404; border-radius: 4px; margin-bottom: 1rem;';
			dateWarningCard.innerHTML = '<strong>⚠️ Event Block:</strong> Event end date is before start date. Please correct the dates in page metadata.';
			container.appendChild( dateWarningCard );
		} else {
			// Valid dates - create and display date card

			// Check for date parameter in URL (from calendar clicks)
			const urlParams = new URLSearchParams( window.location.search );
			const dateParam = urlParams.get( 'date' );

			let displayTime = start.time || '';
			if ( end.time && end.time !== start.time ) {
				displayTime += ` - ${end.time}`;
			}

			let dateTimeContent;

			if ( dateParam ) {
				// Show specific date from calendar click
				const match = dateParam.match( /^(\d{4})-(\d{2})-(\d{2})$/ );
				if ( match ) {
					const [, year, month, day] = match;
					const displayDate = new Date( parseInt( year, 10 ), parseInt( month, 10 ) - 1, parseInt( day, 10 ) );
					dateTimeContent = formatDate( displayDate, dateParam, displayTime );
				} else {
					// Invalid date parameter, fall back to start date
					dateTimeContent = formatDate( start.dateObject, start.date, displayTime );
				}
			} else if ( end.dateObject && end.dateObject.getTime() !== start.dateObject.getTime() ) {
				// Show date range for multi-day events when no date parameter
				dateTimeContent = formatDateRange( start.dateObject, start.date, end.dateObject, end.date, displayTime );
			} else {
				// Show single date
				dateTimeContent = formatDate( start.dateObject, start.date, displayTime );
			}

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
		// Shouldn't reach here since warning is now added as first card
		block.remove();
	}
}
