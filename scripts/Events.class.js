export default class Events {
	/**
     * @param {object} date - Date passed through in a timestamp format or "May 16, 2024 - 8:00 am" format
     */
	constructor( date ) {
		this.date = this.convertTimestampToISO( date );
	}

	/**
     * Converts a timestamp or a date string in "May 16, 2024 - 8:00 am" format to ISO format.
     * @param {string|number} timestamp - The timestamp (in seconds or milliseconds) or the date string to convert.
     * @returns {string} - The ISO formatted date string.
     */
	convertTimestampToISO( timestamp ) {
		if ( typeof timestamp === 'number' ) {
			// Check if the timestamp is likely in seconds (older timestamps are likely in seconds)

			// Get the approximate year 2000 in milliseconds and seconds
			const year2000Milliseconds = 946684800000;
			const year2000Seconds = year2000Milliseconds / 1000;

			// If timestamp is smaller than year2000 in seconds, assume it is in milliseconds else assume that the seconds are off
			if ( timestamp < year2000Seconds ) {
				timestamp = timestamp * 1000; // Convert seconds to milliseconds
			}
			return new Date( timestamp ).toISOString();
		}

		if ( typeof timestamp === 'string' ) {
			// Attempt to parse "May 16, 2024 - 8:00 am" format
			const parsedDate = this.parseCustomDate( timestamp );
			if ( parsedDate ) {
				return parsedDate.toISOString();
			}

			try {
				// Attempt to parse as standard date string (e.g., ISO format)
				return new Date( timestamp ).toISOString();
			} catch ( error ) {
				console.warn( `Could not parse date string: ${timestamp}`, error );
				return null;
			}
		}

		return null;
	}

	/**
     * Parses a date string in "May 16, 2024 - 8:00 am" format and returns a Date object.
     * @param {string} dateString - The date string to parse.
     * @returns {Date|null} - A Date object or null if parsing fails.
     */
	parseCustomDate( dateString ) {
		try {
			const parts = dateString.split( ' - ' );
			if ( parts.length !== 2 ) return null;

			const datePart = parts[0].trim(); // Trim whitespace
			const timePart = parts[1].trim(); // Trim whitespace

			const [month, day, year] = datePart.split( ' ' );
			const numericMonth = this.getMonthNumber( month );

			if ( !numericMonth ) return null; // Invalid month

			const date = new Date( `${year}-${numericMonth}-${day}` ); // yyyy-MM-dd
			if ( isNaN( date.getTime() ) ) return null; // Invalid Date

			const [time, ampm] = timePart.split( ' ' );
			const [hours, minutes] = time.split( ':' );
			let numericHours = parseInt( hours, 10 );

			if ( ampm.toLowerCase() === 'pm' && numericHours !== 12 ) {
				numericHours += 12;
			} else if ( ampm.toLowerCase() === 'am' && numericHours === 12 ) {
				numericHours = 0; // Midnight
			}

			date.setHours( numericHours );
			date.setMinutes( parseInt( minutes, 10 ) );
			date.setSeconds( 0 );
			date.setMilliseconds( 0 );

			return date;
		} catch ( error ) {
			console.warn( `Could not parse custom date string: ${dateString}`, error );
			return null;
		}
	}

	/**
     * Converts a month name (e.g., "May") to its numeric representation (e.g., "05").
     * @param {string} monthName - The month name to convert.
     * @returns {string} - The numeric representation of the month (1-12).
     */
	getMonthNumber( monthName ) {
		const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
			'july', 'august', 'september', 'october', 'november', 'december'];
		const monthIndex = monthNames.findIndex( month => month === monthName.toLowerCase() );
		if ( monthIndex === -1 ) return null;
		return ( monthIndex + 1 ).toString().padStart( 2, '0' );
	}

	getDate() {
		return new Date( this.date );
	}

	day() {
		return this.getDate().toLocaleDateString( 'en-US', { weekday: 'long' } );
	}

	monthAbbr() {
		return this.getDate().toLocaleDateString( 'en-US', { month: 'short' } );
	}

	longDate() {
		return this.getDate().toLocaleDateString( 'en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		} );
	}

	time() {
		return this.getDate().toLocaleTimeString( 'en-US', { hour: '2-digit', minute: '2-digit' } );
	}
}