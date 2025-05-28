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
			// Multiply by 1000 to convert seconds to milliseconds
			const date = new Date( timestamp * 1000 );
			if ( isNaN( date.getTime() ) ) {
				return null; // Or throw an error, indicating invalid timestamp
			}
			const year = date.getFullYear();
			const month = String( date.getMonth() + 1 ).padStart( 2, '0' ); // Months are 0-indexed
			const day = String( date.getDate() ).padStart( 2, '0' );
			const hours = String( date.getHours() ).padStart( 2, '0' );
			const minutes = String( date.getMinutes() ).padStart( 2, '0' );
			const seconds = String( date.getSeconds() ).padStart( 2, '0' );
			const milliseconds = String( date.getMilliseconds() ).padStart( 3, '0' );

			const isoDateString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
			return isoDateString;
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