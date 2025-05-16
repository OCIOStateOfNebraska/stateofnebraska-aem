/**
 * output the dates that require specific formats.
 */
export default class Events {
	/**
	 * @param {object} date - Date passed through in yyyy-MM-ddTHH:mm:zzz-00:00 format
	 */
	constructor( date ) {
		this.date = date;
		this.event =  new Date( this.convertTimestampToISO( this.date ) );
		this.lang = navigator.language;
		this.TIMEZONE = 'America/Chicago'; // Lincoln, Nebraska is in Central Time

		this.longDateOptions = {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			timeZone: this.TIMEZONE
		};
		
		this.shortMonth = {
			month: 'short',
			timeZone: this.TIMEZONE
		};
		
		this.dayNum = {
			day: 'numeric',
			timeZone: this.TIMEZONE
		};
		
		this.timeOptions = {
			hour: 'numeric',
			minute: 'numeric',
			timeZone: this.TIMEZONE
		};
	}
	
	convertTimestampToISO( timestamp ) {
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

		// Assuming -07:00 is the desired timezone offset
		const timezoneOffset = '-06:00';

		const isoDateString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${timezoneOffset}`;

		return isoDateString;
	}

	getDate() {
		let event = this.event.toLocaleDateString( this.lang, {timeZone: this.TIMEZONE} );
		return event;
	}
	
	day() {
		let event = this.event.toLocaleDateString( this.lang, this.dayNum );
		return event;
	}
	
	monthAbbr() {
		let event = this.event.toLocaleDateString( this.lang, this.shortMonth );
		return event;
	}
	
	longDate() {
		let event = this.event.toLocaleDateString( this.lang, this.longDateOptions );
		return event;
	}
    
	time() {
		let event = this.event.toLocaleString( this.lang, this.timeOptions );
		return event;
	}
}