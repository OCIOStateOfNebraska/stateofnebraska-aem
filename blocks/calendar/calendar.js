import { domEl } from '../../scripts/dom-helpers.js';

/**
 * Parse date string from multiple formats to Date object
 * Supported formats:
 * - M-DD-YYYY or M/DD/YYYY (e.g., "2-24-2026" or "2/24/2026")
 * - MM-DD-YYYY or MM/DD/YYYY (e.g., "02-24-2026" or "02/24/2026")
 * - YYYY-MM-DD or YYYY/MM/DD (ISO format, e.g., "2026-02-24" or "2026/02/24")
 * - M-D-YYYY or M/D/YYYY (e.g., "2-4-2026" or "2/4/2026")
 * - Optional time after date (e.g., "2-24-2026 2:45 PM")
 *
 * @param {string} dateStr - Date string in various formats, optionally with time
 * @returns {Object|null} - Object with date and time, or null if invalid
 */
function parseDate( dateStr ) {
	if ( !dateStr || typeof dateStr !== 'string' ) {
		return null;
	}

	const trimmed = dateStr.trim();

	// Check if there's a time component (space followed by time)
	// Time can be: "2:45 PM", "14:45", "2:45pm", etc.
	let datePart = trimmed;
	let timePart = null;

	// Split on first space to separate date from time
	const spaceIndex = trimmed.indexOf( ' ' );
	if ( spaceIndex !== -1 ) {
		datePart = trimmed.substring( 0, spaceIndex ).trim();
		timePart = trimmed.substring( spaceIndex + 1 ).trim();
	}

	// Detect separator (- or /)
	let separator = '-';
	if ( datePart.includes( '/' ) ) {
		separator = '/';
	}

	const parts = datePart.split( separator );
	if ( parts.length !== 3 ) {
		return null;
	}

	let month, day, year;

	// Detect format: if first part is 4 digits, it's YYYY-MM-DD, otherwise M-DD-YYYY
	const firstPart = parseInt( parts[0], 10 );
	if ( parts[0].length === 4 && firstPart > 1000 ) {
		// YYYY-MM-DD or YYYY/MM/DD format
		year = firstPart;
		month = parseInt( parts[1], 10 );
		day = parseInt( parts[2], 10 );
	} else {
		// M-DD-YYYY or M/DD/YYYY format
		month = firstPart;
		day = parseInt( parts[1], 10 );
		year = parseInt( parts[2], 10 );
	}

	// Validate ranges
	if ( isNaN( month ) || isNaN( day ) || isNaN( year ) ) {
		return null;
	}

	// Reasonable date range: 1900-2100 (supports historical and future events)
	if ( month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100 ) {
		return null;
	}

	// Create date (month is 0-indexed in JavaScript)
	const date = new Date( year, month - 1, day );

	// Verify the date is valid (handles Feb 30, etc.)
	if ( date.getMonth() !== month - 1 || date.getDate() !== day || date.getFullYear() !== year ) {
		return null;
	}

	return {
		date,
		time: timePart
	};
}

/**
 * Format Date object as YYYY-MM-DD string
 * @param {Date} date - Date object
 * @returns {string} - Date string in format "2026-02-24"
 */
function formatDateKey( date ) {
	const year = date.getFullYear();
	const month = String( date.getMonth() + 1 ).padStart( 2, '0' );
	const day = String( date.getDate() ).padStart( 2, '0' );
	return `${year}-${month}-${day}`;
}

/**
 * Parse events from DA table structure
 * @param {HTMLElement} block - The calendar block element
 * @returns {Array} - Array of event objects with date and description
 */
function parseEvents( block ) {
	const events = [];

	// AEM/Franklin Edge Delivery converts tables to divs
	// Try div structure first (most common), then fallback to table
	const divRows = block.querySelectorAll( ':scope > div' );

	if ( divRows.length > 0 ) {
		console.log( `Calendar: Found ${divRows.length} div rows (AEM/Franklin structure)` );

		divRows.forEach( ( row, index ) => {
			// Each row is a div containing divs for cells
			const cells = row.querySelectorAll( ':scope > div' );

			if ( cells.length < 2 ) {
				console.warn( `Calendar: Row ${index} has fewer than 2 cells (${cells.length}), skipping` );
				return;
			}

			const dateStr = cells[0].textContent.trim();
			const description = cells[1].textContent.trim();

			console.log( `Calendar: Row ${index} - Date: "${dateStr}", Description: "${description}"` );

			// Skip header row (if first row contains "calendar")
			if ( index === 0 && dateStr.toLowerCase() === 'calendar' ) {
				console.log( 'Calendar: Skipping header row' );
				return;
			}

			// Require date, but allow empty descriptions
			if ( !dateStr ) {
				console.warn( `Calendar: Row ${index} has empty date, skipping` );
				return;
			}

			const parsedDate = parseDate( dateStr );

			if ( !parsedDate ) {
				console.warn( `Calendar: Row ${index} has invalid date "${dateStr}", skipping` );
				return;
			}

			// Warn about far future dates (>10 years from now)
			const currentYear = new Date().getFullYear();
			const yearDiff = parsedDate.date.getFullYear() - currentYear;
			if ( yearDiff > 10 ) {
				console.warn( `Calendar: Row ${index} has date ${yearDiff} years in the future (${dateStr})` );
			} else if ( yearDiff < -5 ) {
				console.warn( `Calendar: Row ${index} has date ${Math.abs( yearDiff )} years in the past (${dateStr})` );
			}

			events.push( {
				date: parsedDate.date,
				time: parsedDate.time,
				dateStr,
				description: description || 'No description provided' // Fallback for empty descriptions
			} );
		} );

		return events;
	}

	// Fallback: Try HTML table structure
	console.log( 'Calendar: No div rows found, trying table structure' );
	const table = block.querySelector( 'table' );

	if ( !table ) {
		console.warn( 'Calendar: No table or div rows found in block' );
		return events;
	}

	// Try tbody first, then fallback to table itself
	let tbody = table.querySelector( 'tbody' );
	if ( !tbody ) {
		console.log( 'Calendar: No tbody found, using table directly' );
		tbody = table;
	}

	const rows = tbody.querySelectorAll( 'tr' );
	console.log( `Calendar: Found ${rows.length} table rows` );

	rows.forEach( ( row, index ) => {
		// Look for td cells (data rows), skip th cells (header rows)
		const cells = row.querySelectorAll( 'td' );

		// Skip rows with th (header rows)
		if ( cells.length === 0 && row.querySelectorAll( 'th' ).length > 0 ) {
			console.log( `Calendar: Row ${index} is a header row, skipping` );
			return;
		}

		if ( cells.length < 2 ) {
			console.warn( `Calendar: Row ${index} has fewer than 2 cells (${cells.length}), skipping` );
			return;
		}

		const dateStr = cells[0].textContent.trim();
		const description = cells[1].textContent.trim();

		console.log( `Calendar: Row ${index} - Date: "${dateStr}", Description: "${description}"` );

		// Require date, but allow empty descriptions
		if ( !dateStr ) {
			console.warn( `Calendar: Row ${index} has empty date, skipping` );
			return;
		}

		const parsedDate = parseDate( dateStr );

		if ( !parsedDate ) {
			console.warn( `Calendar: Row ${index} has invalid date "${dateStr}", skipping` );
			return;
		}

		// Warn about far future dates (>10 years from now)
		const currentYear = new Date().getFullYear();
		const yearDiff = parsedDate.date.getFullYear() - currentYear;
		if ( yearDiff > 10 ) {
			console.warn( `Calendar: Row ${index} has date ${yearDiff} years in the future (${dateStr})` );
		} else if ( yearDiff < -5 ) {
			console.warn( `Calendar: Row ${index} has date ${Math.abs( yearDiff )} years in the past (${dateStr})` );
		}

		events.push( {
			date: parsedDate.date,
			time: parsedDate.time,
			dateStr,
			description: description || 'No description provided' // Fallback for empty descriptions
		} );
	} );

	return events;
}

/**
 * Group events by date for efficient lookup
 * @param {Array} events - Array of event objects
 * @returns {Object} - Object with date keys (YYYY-MM-DD) and arrays of events
 */
function groupEventsByDate( events ) {
	const grouped = {};

	events.forEach( ( event ) => {
		const dateKey = formatDateKey( event.date );

		if ( !grouped[dateKey] ) {
			grouped[dateKey] = [];
		}

		grouped[dateKey].push( event );
	} );

	// Sort events within each date by original order (they're already in DA order)
	Object.keys( grouped ).forEach( ( dateKey ) => {
		grouped[dateKey].sort( ( a, b ) => a.date - b.date );
	} );

	return grouped;
}

/**
 * Get month name from month number
 * @param {number} month - Month number (0-11)
 * @returns {string} - Month name
 */
function getMonthName( month ) {
	const monthNames = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];
	return monthNames[month];
}

/**
 * Generate calendar grid data for a given month/year
 * @param {number} year - Year (e.g., 2026)
 * @param {number} month - Month (0-11, where 0 = January)
 * @returns {Array} - Array of 42 day objects for the calendar grid
 */
function generateCalendarGrid( year, month ) {
	const grid = [];

	// Get first day of the month
	const firstDay = new Date( year, month, 1 );
	const startDayOfWeek = firstDay.getDay(); // 0 = Sunday, 6 = Saturday

	// Get number of days in current month
	const lastDay = new Date( year, month + 1, 0 );
	const daysInMonth = lastDay.getDate();

	// Get last day of previous month
	const prevMonthLastDay = new Date( year, month, 0 );
	const prevMonthDays = prevMonthLastDay.getDate();

	// Calculate how many days from previous month to show
	const prevMonthStartDay = prevMonthDays - startDayOfWeek + 1;

	// Fill grid with 42 cells (6 rows × 7 days)
	let currentDate = 1;
	let nextMonthDate = 1;

	for ( let i = 0; i < 42; i++ ) {
		let dayNum;
		let dayMonth;
		let dayYear;
		let isCurrentMonth = false;
		let isAdjacentMonth = false;

		// Previous month days
		if ( i < startDayOfWeek ) {
			dayNum = prevMonthStartDay + i;
			dayMonth = month - 1;
			dayYear = year;
			isAdjacentMonth = true;

			// Handle year boundary
			if ( dayMonth < 0 ) {
				dayMonth = 11;
				dayYear = year - 1;
			}
		}
		// Current month days
		else if ( currentDate <= daysInMonth ) {
			dayNum = currentDate;
			dayMonth = month;
			dayYear = year;
			isCurrentMonth = true;
			currentDate++;
		}
		// Next month days
		else {
			dayNum = nextMonthDate;
			dayMonth = month + 1;
			dayYear = year;
			isAdjacentMonth = true;
			nextMonthDate++;

			// Handle year boundary
			if ( dayMonth > 11 ) {
				dayMonth = 0;
				dayYear = year + 1;
			}
		}

		// Create date object for this cell
		const cellDate = new Date( dayYear, dayMonth, dayNum );

		grid.push( {
			date: cellDate,
			dateKey: formatDateKey( cellDate ),
			dayNum,
			isCurrentMonth,
			isAdjacentMonth
		} );
	}

	return grid;
}

/**
 * Render navigation buttons
 * @returns {HTMLElement} - Navigation buttons container
 */
function renderNavigationButtons() {
	const navContainer = domEl( 'div', {
		class: 'calendar__nav',
		role: 'navigation',
		'aria-label': 'Calendar navigation'
	} );

	// Previous month button
	const prevButton = domEl( 'button', {
		type: 'button',
		class: 'usa-button usa-button--outline calendar__nav-btn calendar__nav-btn--prev',
		'aria-label': 'Previous month'
	}, 'Previous' );

	// Today button
	const todayButton = domEl( 'button', {
		type: 'button',
		class: 'usa-button usa-button--outline calendar__nav-btn calendar__nav-btn--today',
		'aria-label': 'Go to today'
	}, 'Today' );

	// Next month button
	const nextButton = domEl( 'button', {
		type: 'button',
		class: 'usa-button usa-button--outline calendar__nav-btn calendar__nav-btn--next',
		'aria-label': 'Next month'
	}, 'Next' );

	navContainer.appendChild( prevButton );
	navContainer.appendChild( todayButton );
	navContainer.appendChild( nextButton );

	return navContainer;
}

/**
 * Render calendar header with month and year
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {HTMLElement} - Calendar header element
 */
function renderCalendarHeader( year, month ) {
	const monthName = getMonthName( month );
	const header = domEl( 'div', {
		class: 'calendar__header',
		'aria-label': `Calendar header for ${monthName} ${year}`
	} );

	// Add navigation buttons
	const navButtons = renderNavigationButtons();
	header.appendChild( navButtons );

	// Add month/year title
	const title = domEl( 'h2', {
		class: 'calendar__title',
		'aria-live': 'polite',
		'aria-atomic': 'true'
	}, `${monthName} ${year}` );

	header.appendChild( title );

	return header;
}

/**
 * Render weekday headers
 * @returns {HTMLElement} - Weekday row element
 */
function renderWeekdayHeaders() {
	const weekdays = [
		{ short: 'Sun', full: 'Sunday' },
		{ short: 'Mon', full: 'Monday' },
		{ short: 'Tue', full: 'Tuesday' },
		{ short: 'Wed', full: 'Wednesday' },
		{ short: 'Thu', full: 'Thursday' },
		{ short: 'Fri', full: 'Friday' },
		{ short: 'Sat', full: 'Saturday' }
	];
	const weekdayRow = domEl( 'div', {
		class: 'calendar__weekdays',
		role: 'row',
		'aria-label': 'Days of the week'
	} );

	weekdays.forEach( ( day ) => {
		const dayCell = domEl( 'div', {
			class: 'calendar__weekday',
			role: 'columnheader',
			'aria-label': day.full
		}, day.short );

		weekdayRow.appendChild( dayCell );
	} );

	return weekdayRow;
}

/**
 * Check if a date is today
 * @param {Date} date - Date to check
 * @param {Date} today - Today's date
 * @returns {boolean} - True if date is today
 */
function isToday( date, today ) {
	return date.getFullYear() === today.getFullYear() &&
		date.getMonth() === today.getMonth() &&
		date.getDate() === today.getDate();
}

/**
 * Render calendar grid
 * @param {Array} grid - Array of day objects
 * @param {Object} eventsByDate - Events grouped by date key
 * @param {Function} onDayClick - Click handler for day cells
 * @param {Date} today - Today's date
 * @param {number} year - Calendar year
 * @param {number} month - Calendar month (0-11)
 * @returns {HTMLElement} - Calendar grid element
 */
function renderCalendarGrid( grid, eventsByDate, onDayClick, today, year, month ) {
	const monthName = getMonthName( month );
	const gridElement = domEl( 'div', {
		class: 'calendar__grid',
		role: 'grid',
		'aria-label': `${monthName} ${year}, use arrow keys to navigate dates`
	} );

	// Find the first day of current month or today (for initial focus)
	let initialFocusIndex = 0;
	for ( let i = 0; i < grid.length; i++ ) {
		if ( grid[i].isCurrentMonth ) {
			initialFocusIndex = i;
			if ( isToday( grid[i].date, today ) ) {
				break; // Prefer today if it's visible
			}
		}
	}

	grid.forEach( ( cell, index ) => {
		// Only the initial focus day is tabbable (roving tabindex pattern)
		const isInitialFocus = index === initialFocusIndex;

		// Build comprehensive ARIA label
		const ariaLabel = buildDayAriaLabel( cell, eventsByDate, today );

		const dayCell = domEl( 'div', {
			class: 'calendar__day',
			role: 'gridcell',
			tabindex: isInitialFocus ? '0' : '-1',
			'data-date': cell.dateKey,
			'aria-label': ariaLabel
		} );

		// Add class for adjacent month days
		if ( cell.isAdjacentMonth ) {
			dayCell.classList.add( 'calendar__day--adjacent' );
		}

		// Check if this is today's date
		if ( isToday( cell.date, today ) ) {
			dayCell.classList.add( 'calendar__day--today' );
			dayCell.setAttribute( 'aria-current', 'date' );
		}

		// Check if this day has events
		const hasEvents = eventsByDate[cell.dateKey] && eventsByDate[cell.dateKey].length > 0;
		if ( hasEvents ) {
			const eventCount = eventsByDate[cell.dateKey].length;
			dayCell.setAttribute( 'data-event-count', eventCount );
		}

		// Create day number element
		// Hidden from screen readers since date is already in cell's aria-label
		const dayNumber = domEl( 'span', {
			class: 'calendar__day-number',
			'aria-hidden': 'true'
		}, String( cell.dayNum ) );

		dayCell.appendChild( dayNumber );

		// Add event text preview if day has events
		if ( hasEvents ) {
			const dayEvents = eventsByDate[cell.dateKey];

			// Create container for event texts
			// NOT hidden - screen reader will announce these after the date/count
			const eventsContainer = domEl( 'div', {
				class: 'calendar__day-events'
			} );

			// Show all events (each on its own line with ellipsis)
			dayEvents.forEach( ( event ) => {
				// Format: "Description. Time" or just "Description" if no time
				const displayText = event.time ? `${event.description} ${event.time}` : event.description;
				const eventText = domEl( 'span', {
					class: 'calendar__day-event-text',
					title: displayText // Full text on hover
				}, displayText );

				eventsContainer.appendChild( eventText );
			} );

			dayCell.appendChild( eventsContainer );
		}

		// Add click handler
		dayCell.addEventListener( 'click', () => {
			onDayClick( cell );
		} );

		// Add keyboard handler (Enter/Space)
		dayCell.addEventListener( 'keydown', ( e ) => {
			if ( e.key === 'Enter' || e.key === ' ' ) {
				e.preventDefault();
				onDayClick( cell );
			}
		} );

		// Add focus handler for roving tabindex
		dayCell.addEventListener( 'focus', () => {
			// When a day gets focus, make it the only tabbable day
			const allDays = gridElement.querySelectorAll( '.calendar__day' );
			allDays.forEach( ( day ) => {
				day.setAttribute( 'tabindex', '-1' );
			} );
			dayCell.setAttribute( 'tabindex', '0' );
		} );

		gridElement.appendChild( dayCell );
	} );

	return gridElement;
}

/**
 * Format date for display
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string (e.g., "Monday, March 24, 2026")
 */
function formatDateDisplay( date ) {
	const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const months = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];

	const dayName = days[date.getDay()];
	const monthName = months[date.getMonth()];
	const dayNum = date.getDate();
	const year = date.getFullYear();

	return `${dayName}, ${monthName} ${dayNum}, ${year}`;
}

/**
 * Build ARIA label for day cell
 * @param {Object} cell - Day cell data
 * @param {Object} eventsByDate - Events grouped by date
 * @param {Date} today - Today's date
 * @returns {string} - ARIA label for the day cell
 */
function buildDayAriaLabel( cell, eventsByDate, today ) {
	const dateLabel = formatDateDisplay( cell.date );
	const parts = [dateLabel];

	// Add "today" indicator
	if ( isToday( cell.date, today ) ) {
		parts.push( 'today' );
	}

	// Add event count
	const events = eventsByDate[cell.dateKey];
	if ( events && events.length > 0 ) {
		const eventText = events.length === 1 ? '1 event' : `${events.length} events`;
		parts.push( eventText );
	}

	// Add context for adjacent month days
	if ( cell.isAdjacentMonth ) {
		parts.push( 'not in current month' );
	}

	return parts.join( ', ' );
}

/**
 * Render event display area
 * @param {Object} cell - Selected day cell object
 * @param {Object} eventsByDate - Events grouped by date key
 * @returns {HTMLElement} - Event display element
 */
/**
 * Truncate text if it exceeds maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text with ellipsis if needed
 */
function truncateText( text, maxLength = 150 ) {
	if ( !text || text.length <= maxLength ) {
		return text;
	}
	return text.substring( 0, maxLength ).trim() + '…';
}

function renderEventDisplay( cell, eventsByDate ) {
	const eventDisplay = domEl( 'div', {
		class: 'calendar__events',
		'aria-live': 'polite',
		'aria-atomic': 'true'
	} );

	// Display selected date
	const dateHeader = domEl( 'h3', {
		class: 'calendar__events-header'
	}, formatDateDisplay( cell.date ) );

	eventDisplay.appendChild( dateHeader );

	// Get events for this date
	const events = eventsByDate[cell.dateKey];

	if ( events && events.length > 0 ) {
		// Create event list
		const eventList = domEl( 'ul', {
			class: 'calendar__events-list'
		} );

		// Limit displayed events to prevent excessive DOM
		const MAX_DISPLAYED_EVENTS = 20;
		const displayedEvents = events.slice( 0, MAX_DISPLAYED_EVENTS );
		const hasMoreEvents = events.length > MAX_DISPLAYED_EVENTS;

		displayedEvents.forEach( ( event ) => {
			// Format: "Description. Time" or just "Description" if no time
			const fullText = event.time ? `${event.description} ${event.time}` : event.description;
			// Truncate long descriptions for readability
			const truncatedText = truncateText( fullText, 150 );

			const eventItem = domEl( 'li', {
				class: 'calendar__events-item',
				title: fullText !== truncatedText ? fullText : undefined // Full text on hover
			}, truncatedText );

			eventList.appendChild( eventItem );
		} );

		// Show message if events were truncated
		if ( hasMoreEvents ) {
			const moreEventsNote = domEl( 'li', {
				class: 'calendar__events-item calendar__events-item--note'
			}, `…and ${events.length - MAX_DISPLAYED_EVENTS} more event${events.length - MAX_DISPLAYED_EVENTS === 1 ? '' : 's'}` );

			eventList.appendChild( moreEventsNote );
		}

		eventDisplay.appendChild( eventList );
	} else {
		// No events message
		const noEvents = domEl( 'p', {
			class: 'calendar__events-empty'
		}, 'No events scheduled for this date.' );

		eventDisplay.appendChild( noEvents );
	}

	return eventDisplay;
}

export default function decorate( block ) {
	console.log( 'Calendar: Decorating block', block );
	console.log( 'Calendar: Block HTML:', block.innerHTML.substring( 0, 500 ) );

	// Parse events from DA table
	const events = parseEvents( block );

	// Group events by date
	const eventsByDate = groupEventsByDate( events );

	// Log parsed and grouped data for verification
	console.log( 'Calendar: Parsed events:', events );
	console.log( 'Calendar: Total events:', events.length );
	console.log( 'Calendar: Events grouped by date:', eventsByDate );
	console.log( 'Calendar: Dates with events:', Object.keys( eventsByDate ).length );

	// Handle empty calendar gracefully
	if ( events.length === 0 ) {
		console.warn( 'Calendar: No valid events found in table' );
		// Still render calendar, just without event indicators
	}

	// Get current date for initial display
	const today = new Date();

	// Calendar state - tracks currently displayed month and selected day
	const state = {
		year: today.getFullYear(),
		month: today.getMonth(),
		todayYear: today.getFullYear(),
		todayMonth: today.getMonth(),
		selectedDate: null // Selected day cell
	};

	// Create calendar container
	const calendarContainer = domEl( 'div', {
		class: 'usa-calendar',
		'aria-label': 'Event Calendar - Use Tab to navigate controls, arrow keys to navigate dates',
		role: 'application'
	} );

	// Create visually-hidden live region for announcements
	const liveRegion = domEl( 'div', {
		class: 'calendar__live-region',
		'aria-live': 'polite',
		'aria-atomic': 'true',
		role: 'status'
	} );
	calendarContainer.appendChild( liveRegion );

	/**
	 * Announce message to screen readers via live region
	 * @param {string} message - Message to announce
	 */
	function announce( message ) {
		// Clear and set message to ensure announcement
		liveRegion.textContent = '';
		setTimeout( () => {
			liveRegion.textContent = message;
			console.log( 'Calendar: Screen reader announcement -', message );
		}, 100 );
	}

	/**
	 * Handle day cell click
	 * @param {Object} cell - Clicked day cell object
	 */
	function handleDayClick( cell ) {
		// Update selected date
		state.selectedDate = cell;

		// Remove previous selection highlight
		const previousSelected = calendarContainer.querySelector( '.calendar__day--selected' );
		if ( previousSelected ) {
			previousSelected.classList.remove( 'calendar__day--selected' );
			previousSelected.removeAttribute( 'aria-selected' );
		}

		// Highlight selected day
		const selectedDay = calendarContainer.querySelector( `[data-date="${cell.dateKey}"]` );
		if ( selectedDay ) {
			selectedDay.classList.add( 'calendar__day--selected' );
			selectedDay.setAttribute( 'aria-selected', 'true' );
		}

		// Update event display
		updateEventDisplay();

		// Announce selection to screen readers
		const dateLabel = formatDateDisplay( cell.date );
		const events = eventsByDate[cell.dateKey];
		if ( events && events.length > 0 ) {
			const eventText = events.length === 1 ? '1 event' : `${events.length} events`;
			announce( `Selected ${dateLabel}, showing ${eventText}` );
		} else {
			announce( `Selected ${dateLabel}, no events scheduled` );
		}

		console.log( 'Calendar: Selected date', cell.dateKey );
	}

	/**
	 * Update event display area
	 */
	function updateEventDisplay() {
		// Remove existing event display
		const existingDisplay = calendarContainer.querySelector( '.calendar__events' );
		if ( existingDisplay ) {
			existingDisplay.remove();
		}

		// Render new event display if date is selected
		if ( state.selectedDate ) {
			const eventDisplay = renderEventDisplay( state.selectedDate, eventsByDate );
			calendarContainer.appendChild( eventDisplay );
		}
	}

	/**
	 * Handle keyboard navigation in calendar grid
	 * @param {KeyboardEvent} e - Keyboard event
	 * @param {Array} grid - Calendar grid data
	 */
	function handleKeyboardNavigation( e, grid ) {
		const focusedDay = calendarContainer.querySelector( '.calendar__day:focus' );
		if ( !focusedDay ) {
			return;
		}

		const currentDateKey = focusedDay.getAttribute( 'data-date' );
		const currentIndex = grid.findIndex( cell => cell.dateKey === currentDateKey );

		if ( currentIndex === -1 ) {
			return;
		}

		let targetIndex = -1;

		switch ( e.key ) {
			case 'ArrowLeft':
				// Previous day
				targetIndex = currentIndex - 1;
				break;
			case 'ArrowRight':
				// Next day
				targetIndex = currentIndex + 1;
				break;
			case 'ArrowUp':
				// Same day, previous week
				targetIndex = currentIndex - 7;
				break;
			case 'ArrowDown':
				// Same day, next week
				targetIndex = currentIndex + 7;
				break;
			case 'Home':
				// First day of current month
				e.preventDefault();
				targetIndex = grid.findIndex( cell => cell.isCurrentMonth );
				if ( targetIndex !== -1 ) {
					const targetDay = calendarContainer.querySelector( `[data-date="${grid[targetIndex].dateKey}"]` );
					if ( targetDay ) {
						targetDay.focus();
					}
				}
				return;
			case 'End': {
				// Last day of current month
				e.preventDefault();
				const currentMonthDays = grid.filter( cell => cell.isCurrentMonth );
				if ( currentMonthDays.length > 0 ) {
					const lastDay = currentMonthDays[currentMonthDays.length - 1];
					const targetDay = calendarContainer.querySelector( `[data-date="${lastDay.dateKey}"]` );
					if ( targetDay ) {
						targetDay.focus();
					}
				}
				return;
			}
			case 'PageUp':
				// Previous month, same date
				e.preventDefault();
				handlePageNavigation( 'prev', grid[currentIndex] );
				return;
			case 'PageDown':
				// Next month, same date
				e.preventDefault();
				handlePageNavigation( 'next', grid[currentIndex] );
				return;
			default:
				return;
		}

		// Check if target is within bounds (for arrow keys)
		if ( targetIndex >= 0 && targetIndex < grid.length ) {
			e.preventDefault();
			const targetCell = grid[targetIndex];
			const targetDay = calendarContainer.querySelector( `[data-date="${targetCell.dateKey}"]` );

			if ( targetDay ) {
				targetDay.focus();
			}
		} else {
			// Handle month boundary wrapping
			e.preventDefault();
			handleMonthBoundaryNavigation( e.key, grid[currentIndex] );
		}
	}

	/**
	 * Handle Page Up/Down navigation
	 * @param {string} direction - 'prev' or 'next'
	 * @param {Object} currentCell - Current cell data
	 */
	function handlePageNavigation( direction, currentCell ) {
		let newMonth = state.month;
		let newYear = state.year;
		let targetDay = currentCell.date.getDate();

		if ( direction === 'prev' ) {
			newMonth--;
			if ( newMonth < 0 ) {
				newMonth = 11;
				newYear--;
			}
		} else {
			newMonth++;
			if ( newMonth > 11 ) {
				newMonth = 0;
				newYear++;
			}
		}

		// Get number of days in target month
		const daysInTargetMonth = new Date( newYear, newMonth + 1, 0 ).getDate();
		targetDay = Math.min( targetDay, daysInTargetMonth );

		// Update state and re-render
		state.month = newMonth;
		state.year = newYear;
		updateCalendar();

		// Announce month change
		announce( `Navigated to ${getMonthName( newMonth )} ${newYear}` );

		// Focus on target day after re-render (using shared focusDay function)
		focusDay( targetDay );

		console.log( `Calendar: Page ${direction === 'prev' ? 'Up' : 'Down'} to ${getMonthName( newMonth )} ${newYear}, day ${targetDay}` );
	}

	/**
	 * Handle navigation across month boundaries
	 * @param {string} key - Arrow key pressed
	 * @param {Object} currentCell - Current cell data
	 */
	function handleMonthBoundaryNavigation( key, currentCell ) {
		let newMonth = state.month;
		let newYear = state.year;
		let targetDay = currentCell.dayNum;

		switch ( key ) {
			case 'ArrowLeft':
			case 'ArrowUp': {
				// Go to previous month
				newMonth--;
				if ( newMonth < 0 ) {
					newMonth = 11;
					newYear--;
				}
				// Try to maintain same day number
				const daysInPrevMonth = new Date( newYear, newMonth + 1, 0 ).getDate();
				targetDay = Math.min( currentCell.dayNum, daysInPrevMonth );
				break;
			}
			case 'ArrowRight':
			case 'ArrowDown': {
				// Go to next month
				newMonth++;
				if ( newMonth > 11 ) {
					newMonth = 0;
					newYear++;
				}
				// Try to maintain same day number
				const daysInNextMonth = new Date( newYear, newMonth + 1, 0 ).getDate();
				targetDay = Math.min( currentCell.dayNum, daysInNextMonth );
				break;
			}
		}

		// Update state and re-render
		state.month = newMonth;
		state.year = newYear;
		updateCalendar();

		// Announce month change
		announce( `Navigated to ${getMonthName( newMonth )} ${newYear}` );

		// Focus on target day after re-render (using shared focusDay function)
		focusDay( targetDay );

		console.log( `Calendar: Wrapped to ${getMonthName( newMonth )} ${newYear}, day ${targetDay}` );
	}

	/**
	 * Update calendar display for current state
	 */
	function updateCalendar() {
		// Clear container
		calendarContainer.textContent = '';

		// Render calendar header with navigation
		const header = renderCalendarHeader( state.year, state.month );
		calendarContainer.appendChild( header );

		// Attach navigation button handlers
		attachNavigationHandlers( header );

		// Render weekday headers
		const weekdayHeaders = renderWeekdayHeaders();
		calendarContainer.appendChild( weekdayHeaders );

		// Generate and render calendar grid with events
		const grid = generateCalendarGrid( state.year, state.month );
		const gridElement = renderCalendarGrid( grid, eventsByDate, handleDayClick, today, state.year, state.month );
		calendarContainer.appendChild( gridElement );

		// Add keyboard navigation to grid
		gridElement.addEventListener( 'keydown', ( e ) => {
			const navKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];
			if ( navKeys.includes( e.key ) ) {
				handleKeyboardNavigation( e, grid );
			}
		} );

		// Re-render event display if a date is selected
		if ( state.selectedDate ) {
			updateEventDisplay();

			// Re-highlight selected day
			const selectedDay = calendarContainer.querySelector( `[data-date="${state.selectedDate.dateKey}"]` );
			if ( selectedDay ) {
				selectedDay.classList.add( 'calendar__day--selected' );
				selectedDay.setAttribute( 'aria-selected', 'true' );
			}
		}

		console.log( 'Calendar: Rendered grid for', getMonthName( state.month ), state.year );
	}

	/**
	 * Focus on a specific day after calendar update
	 * @param {number} dayNumber - Day number to focus (1-31)
	 */
	function focusDay( dayNumber ) {
		setTimeout( () => {
			// Try to focus the specific day number in current month
			const targetDate = new Date( state.year, state.month, dayNumber );
			const targetDateKey = formatDateKey( targetDate );
			const targetDayElement = calendarContainer.querySelector( `[data-date="${targetDateKey}"]` );

			if ( targetDayElement && targetDayElement.classList.contains( 'calendar__day' ) ) {
				targetDayElement.focus();
			} else {
				// If day doesn't exist, focus first current-month day
				const firstCurrentDay = calendarContainer.querySelector( '.calendar__day:not(.calendar__day--adjacent)' );
				if ( firstCurrentDay ) {
					firstCurrentDay.focus();
				}
			}
		}, 50 );
	}

	/**
	 * Attach click handlers to navigation buttons
	 * @param {HTMLElement} header - Calendar header element
	 */
	function attachNavigationHandlers( header ) {
		// Previous month button
		const prevButton = header.querySelector( '.calendar__nav-btn--prev' );
		if ( prevButton ) {
			prevButton.addEventListener( 'click', () => {
				// Remember which day to focus
				const focusedDay = calendarContainer.querySelector( '.calendar__day:focus' );
				const dayToFocus = focusedDay ?
					parseInt( focusedDay.querySelector( '.calendar__day-number' ).textContent, 10 ) : 1;

				state.month--;
				if ( state.month < 0 ) {
					state.month = 11;
					state.year--;
				}
				updateCalendar();
				announce( `Navigated to ${getMonthName( state.month )} ${state.year}` );

				// Restore focus to same day number
				focusDay( dayToFocus );
			} );
		}

		// Today button
		const todayButton = header.querySelector( '.calendar__nav-btn--today' );
		if ( todayButton ) {
			todayButton.addEventListener( 'click', () => {
				state.year = state.todayYear;
				state.month = state.todayMonth;
				updateCalendar();
				announce( `Navigated to current month, ${getMonthName( state.month )} ${state.year}` );

				// Focus today's date
				const todayDay = today.getDate();
				focusDay( todayDay );
			} );
		}

		// Next month button
		const nextButton = header.querySelector( '.calendar__nav-btn--next' );
		if ( nextButton ) {
			nextButton.addEventListener( 'click', () => {
				// Remember which day to focus
				const focusedDay = calendarContainer.querySelector( '.calendar__day:focus' );
				const dayToFocus = focusedDay ?
					parseInt( focusedDay.querySelector( '.calendar__day-number' ).textContent, 10 ) : 1;

				state.month++;
				if ( state.month > 11 ) {
					state.month = 0;
					state.year++;
				}
				updateCalendar();
				announce( `Navigated to ${getMonthName( state.month )} ${state.year}` );

				// Restore focus to same day number
				focusDay( dayToFocus );
			} );
		}
	}

	// Initial render
	updateCalendar();

	// Replace block content with calendar
	block.textContent = '';
	block.appendChild( calendarContainer );

	// Log keyboard navigation info
	console.log( 'Calendar: Tab order - Previous button → Today button → Next button → Calendar grid (1 stop) → Events' );
	console.log( 'Calendar: Arrow keys - Left/Right: previous/next day, Up/Down: previous/next week' );
	console.log( 'Calendar: Home/End: first/last day of month, PageUp/PageDown: previous/next month' );
}
