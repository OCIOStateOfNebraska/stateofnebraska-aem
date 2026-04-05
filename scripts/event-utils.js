/**
 * Shared utility functions for event handling across templates and blocks
 */

/**
 * Converts 12-hour time to 24-hour format (HH:MM)
 * @param {string} time12h Time in 12-hour format (e.g., "9:00 am", "2:30 pm")
 * @returns {string|null} Time in 24-hour format (e.g., "09:00", "14:30")
 */
export function convertTo24Hour( time12h ) {
	if ( !time12h ) return null;

	const timeString = time12h.trim().toLowerCase();
	const match = timeString.match( /(\d{1,2}):(\d{2})\s*(am|pm)/ );

	if ( !match ) {
		// eslint-disable-next-line no-console
		console.warn( `Invalid time format: ${time12h}` );
		return null;
	}

	let hours = parseInt( match[1], 10 );
	const minutes = match[2];
	const period = match[3];

	// Convert to 24-hour format
	if ( period === 'pm' && hours !== 12 ) {
		hours += 12;
	} else if ( period === 'am' && hours === 12 ) {
		hours = 0;
	}

	// Pad hours with leading zero
	const hours24 = hours.toString().padStart( 2, '0' );

	return `${hours24}:${minutes}`;
}

/**
 * Parses combined date-time string into separate components
 * @param {string} combinedDateTime Combined format: "YYYY-MM-DD, HH:MM am/pm"
 * @param {object} options Configuration options
 * @param {boolean} options.includeTime24 Include 24-hour time format
 * @param {boolean} options.includeDateObject Include JavaScript Date object
 * @returns {object} Parsed date/time components
 * @returns {string|null} returns.date - Date in ISO format (YYYY-MM-DD)
 * @returns {string|null} returns.time - Time in 12-hour format (e.g., "9:00 am")
 * @returns {string|null} [returns.time24] - Time in 24-hour format (e.g., "09:00") if includeTime24=true
 * @returns {Date|null} [returns.dateObject] - JavaScript Date object if includeDateObject=true
 * @returns {string|null} [returns.dateISO] - ISO date string if includeDateObject=true
 */
export function parseCombinedDateTime( combinedDateTime, options = {} ) {
	const {
		includeTime24 = false,
		includeDateObject = false,
	} = options;

	// Base result structure
	const result = {
		date: null,
		time: null,
	};

	if ( !combinedDateTime ) {
		if ( includeTime24 ) result.time24 = null;
		if ( includeDateObject ) {
			result.dateObject = null;
			result.dateISO = null;
		}
		return result;
	}

	try {
		// Split on comma: "2024-12-05, 9:00 am" -> ["2024-12-05", " 9:00 am"]
		const parts = combinedDateTime.split( ',' );

		if ( parts.length !== 2 ) {
			// Just a date without time
			result.date = parts[0].trim();
		} else {
			// Date and time
			result.date = parts[0].trim();
			result.time = parts[1].trim();

			// Add 24-hour time if requested
			if ( includeTime24 ) {
				result.time24 = convertTo24Hour( result.time );
			}
		}

		// Add Date object if requested
		if ( includeDateObject && result.date ) {
			// Parse as local time, not UTC (prevents timezone offset issues)
			const [year, month, day] = result.date.split( '-' ).map( Number );
			result.dateObject = new Date( year, month - 1, day ); // month is 0-indexed
			result.dateISO = result.date;
		}

		return result;
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.warn( `Error parsing combined date-time: ${combinedDateTime}`, error );

		if ( includeTime24 ) result.time24 = null;
		if ( includeDateObject ) {
			result.dateObject = null;
			result.dateISO = null;
		}
		return result;
	}
}

/**
 * Formats a date for display
 * @param {Date} date Date object
 * @returns {string} Formatted date string
 */
export function formatEventDate( date ) {
	if ( !date ) return '';

	return date.toLocaleDateString( 'en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	} );
}
