import { domEl } from '../../scripts/dom-helpers.js';
import { parseCombinedDateTime } from '../../scripts/event-utils.js';

/**
 * Month names array used across calendar functions
 */
const MONTH_NAMES = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Weekday labels for calendar headers and date formatting
 */
const WEEKDAY_LABELS = [
	{ short: 'Sun', full: 'Sunday' },
	{ short: 'Mon', full: 'Monday' },
	{ short: 'Tue', full: 'Tuesday' },
	{ short: 'Wed', full: 'Wednesday' },
	{ short: 'Thu', full: 'Thursday' },
	{ short: 'Fri', full: 'Friday' },
	{ short: 'Sat', full: 'Saturday' }
];

/**
 * Strip time component from Date object
 * @param {Date|null} date - Date object
 * @returns {Date|null} - Date with time set to midnight (local timezone)
 */
function stripTime( date ) {
	if ( !date ) return null;
	return new Date( date.getFullYear(), date.getMonth(), date.getDate() );
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
 * Fetches the events index JSON file
 * @param {string} indexPath Path to the events index JSON file
 * @returns {Promise<Object>} The events index data
 */
async function fetchEventsIndex( indexPath ) {
	const response = await fetch( indexPath );
	if ( !response.ok ) {
		throw new Error( `Failed to fetch events index: ${response.status}` );
	}
	return response.json();
}

/**
 * Determines if an entry is an event page
 * @param {Object} event Search index event entry
 * @returns {boolean} True if entry is an event page
 */
function isEventPage( event ) {
	return event.template === 'events';
}

/**
 * Checks if a URL is external (different domain than current site)
 * @param {string} url - URL to check
 * @returns {boolean} - True if URL is external
 */
function isExternalUrl( url ) {
	if ( !url ) return false;

	try {
		// Relative URLs are internal
		if ( !url.startsWith( 'http://' ) && !url.startsWith( 'https://' ) ) {
			return false;
		}

		const urlObj = new URL( url );
		return urlObj.hostname !== window.location.hostname;
	} catch ( error ) {
		// Invalid URL, treat as internal
		return false;
	}
}

/**
 * Fetch and parse events from one or more events-index.json files
 * @param {string} indexPaths Comma-separated paths to events index JSON files
 * @returns {Promise<Array>} Array of event objects with date and description
 */
async function parseEvents( indexPaths ) {
	const events = [];

	try {
		const paths = indexPaths.split( ',' )
			.map( ( path ) => path.trim() )
			.filter( ( path ) => path.length > 0 );

		if ( paths.length === 0 ) {
			return events;
		}

		const fetchPromises = paths.map( ( path ) => fetchEventsIndex( path ) );
		const results = await Promise.allSettled( fetchPromises );


		const searchIndices = results
			.filter( ( result ) => {
				if ( result.status === 'rejected' ) {
					console.error( 'Failed to fetch events index:', result.reason );
					return false;
				}
				return true;
			} )
			.map( ( result ) => result.value );

		searchIndices.forEach( ( searchIndex ) => {
			if ( !searchIndex.data || !Array.isArray( searchIndex.data ) ) {
				console.warn( 'Invalid events index format:', searchIndex );
				return;
			}

			searchIndex.data
				.filter( isEventPage )
				.forEach( ( event ) => {
					const startParsed = parseCombinedDateTime( event.eventStartDate, { includeDateObject: true } );

					if ( !startParsed.dateObject ) {
						return; // Skip events with invalid dates
					}

					const endParsed = parseCombinedDateTime( event.eventEndDate, { includeDateObject: true } );

					const startDateOnly = stripTime( startParsed.dateObject );
					const endDateOnly = stripTime( endParsed.dateObject );

					const isSameDay = !endDateOnly || startDateOnly.getTime() === endDateOnly.getTime();

					if ( isSameDay ) {
						events.push( {
							date: startParsed.dateObject,
							time: startParsed.time || '',
							description: event.title || event.description || 'Untitled Event',
							path: event.path
						} );
						return;
					}

					const currentDate = new Date( startDateOnly );
					const endDate = new Date( endDateOnly );

					// Safeguard: limit multi-day events to prevent runaway loops from typos
					const MAX_EVENT_DAYS = 90;
					let dayCount = 0;

					while ( currentDate <= endDate && dayCount < MAX_EVENT_DAYS ) {
						events.push( {
							date: new Date( currentDate ),
							time: startParsed.time || '',
							description: event.title || event.description || 'Untitled Event',
							path: event.path
						} );

						currentDate.setDate( currentDate.getDate() + 1 );
						dayCount++;
					}

					if ( dayCount >= MAX_EVENT_DAYS ) {
						console.warn( `Event truncated: "${event.title || event.description}" spans more than ${MAX_EVENT_DAYS} days. Check start/end dates for errors.` );
					}
				} );
		} );

		return events;
	} catch ( error ) {
		console.error( 'Error loading events for calendar:', error );
		return events; // Return empty array on error
	}
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

	return grouped;
}

/**
 * Get month name from month number
 * @param {number} month - Month number (0-11)
 * @returns {string} - Month name
 */
function getMonthName( month ) {
	return MONTH_NAMES[month];
}

/**
 * Generate calendar grid data for a given month/year
 * @param {number} year - Year (e.g., 2026)
 * @param {number} month - Month (0-11, where 0 = January)
 * @returns {Array} - Array of 42 day objects for the calendar grid
 */
function generateCalendarGrid( year, month ) {
	const grid = [];

	const firstDay = new Date( year, month, 1 );
	const startDayOfWeek = firstDay.getDay();

	const lastDay = new Date( year, month + 1, 0 );
	const daysInMonth = lastDay.getDate();

	const prevMonthLastDay = new Date( year, month, 0 );
	const prevMonthDays = prevMonthLastDay.getDate();

	const prevMonthStartDay = prevMonthDays - startDayOfWeek + 1;

	let currentDate = 1;
	let nextMonthDate = 1;

	for ( let i = 0; i < 42; i++ ) {
		let dayNum;
		let dayMonth;
		let dayYear;
		let isCurrentMonth = false;
		let isAdjacentMonth = false;

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
		} else if ( currentDate <= daysInMonth ) {
			dayNum = currentDate;
			dayMonth = month;
			dayYear = year;
			isCurrentMonth = true;
			currentDate++;
		} else {
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
 * @param {string} monthName - Current month name
 * @param {number} year - Current year
 * @returns {HTMLElement} - Navigation buttons container
 */
function renderNavigationButtons( monthName, year ) {
	const navContainer = domEl( 'nav', {
		class: 'calendar__nav',
		'aria-label': `Calendar navigation. Current month: ${monthName} ${year}`
	} );

	const prevButton = domEl( 'button', {
		type: 'button',
		class: 'usa-button usa-button--outline calendar__nav-btn calendar__nav-btn--prev',
		'aria-label': 'Previous month'
	}, 'Previous' );

	const todayButton = domEl( 'button', {
		type: 'button',
		class: 'usa-button usa-button--outline calendar__nav-btn calendar__nav-btn--today',
		'aria-label': 'Go to today'
	}, 'Today' );

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
		class: 'calendar__header'
	} );

	const navButtons = renderNavigationButtons( monthName, year );
	header.appendChild( navButtons );

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
	const weekdayRow = domEl( 'div', {
		class: 'calendar__weekdays',
		role: 'row',
		'aria-label': 'Days of the week'
	} );

	WEEKDAY_LABELS.forEach( ( day ) => {
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
 * @param {Date} today - Today's date
 * @param {number} year - Calendar year
 * @param {number} month - Calendar month (0-11)
 * @returns {HTMLElement} - Calendar grid element
 */
function renderCalendarGrid( grid, eventsByDate, today, year, month ) {
	const monthName = getMonthName( month );
	const gridElement = domEl( 'div', {
		class: 'calendar__grid',
		role: 'grid',
		'aria-label': `${monthName} ${year}, use arrow keys to navigate dates`
	} );

	// Find the initial focus day
	// If viewing current month, prefer today's date
	// Otherwise, use first day of displayed month
	let initialFocusIndex = 0;
	const isViewingCurrentMonth = year === today.getFullYear() && month === today.getMonth();

	for ( let i = 0; i < grid.length; i++ ) {
		if ( grid[i].isCurrentMonth ) {
			initialFocusIndex = i;
			if ( isViewingCurrentMonth && isToday( grid[i].date, today ) ) {
				break;
			}
		}
	}

	grid.forEach( ( cell, index ) => {
		/**
		 * Roving tabindex pattern: Only one day cell is tabbable at a time.
		 * Without this, users would need to Tab through all 42 day cells (6 rows × 7 days)
		 * to exit the calendar grid. With roving tabindex:
		 * - Tab once to enter the grid (focus lands on initial day)
		 * - Arrow keys navigate between days (focus moves, tabindex updates)
		 * - Tab again to exit the grid to next control
		 * This dramatically improves keyboard navigation efficiency.
		 */
		const isInitialFocus = index === initialFocusIndex;

		const ariaLabel = buildDayAriaLabel( cell, eventsByDate, today );

		const dayCell = domEl( 'div', {
			class: 'calendar__day',
			role: 'gridcell',
			tabindex: isInitialFocus ? '0' : '-1',
			'data-date': cell.dateKey,
			'aria-label': ariaLabel
		} );

		if ( cell.isAdjacentMonth ) {
			dayCell.classList.add( 'calendar__day--adjacent' );
		}

		if ( isToday( cell.date, today ) ) {
			dayCell.classList.add( 'calendar__day--today' );
			dayCell.setAttribute( 'aria-current', 'date' );
		}

		const hasEvents = eventsByDate[cell.dateKey] && eventsByDate[cell.dateKey].length > 0;
		if ( hasEvents ) {
			const eventCount = eventsByDate[cell.dateKey].length;
			dayCell.setAttribute( 'data-event-count', eventCount );
		}

		// Hidden from screen readers since date is already in cell's aria-label
		const dayNumber = domEl( 'span', {
			class: 'calendar__day-number',
			'aria-hidden': 'true'
		}, String( cell.dayNum ) );

		dayCell.appendChild( dayNumber );

		if ( hasEvents ) {
			const dayEvents = eventsByDate[cell.dateKey];

			// NOT hidden - screen reader will announce these after the date/count
			const eventsContainer = domEl( 'div', {
				class: 'calendar__day-events'
			} );

			dayEvents.forEach( ( event ) => {
				const displayText = event.time ? `${event.description} ${event.time}` : event.description;
				const eventText = domEl( 'span', {
					class: 'calendar__day-event-text',
					title: displayText // Full text on hover
				}, displayText );

				eventsContainer.appendChild( eventText );
			} );

			dayCell.appendChild( eventsContainer );
		}

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
	const dayName = WEEKDAY_LABELS[date.getDay()].full;
	const monthName = MONTH_NAMES[date.getMonth()];
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

	if ( isToday( cell.date, today ) ) {
		parts.push( 'today' );
	}

	const events = eventsByDate[cell.dateKey];
	if ( events && events.length > 0 ) {
		const eventText = events.length === 1 ? '1 event' : `${events.length} events`;
		parts.push( eventText );

		// List event names (limit to first 3 to avoid overly long labels)
		const maxEventsToAnnounce = 3;
		const eventsToList = events.slice( 0, maxEventsToAnnounce );
		const eventNames = eventsToList.map( ( event ) => {
			const name = event.description;
			const time = event.time ? ` at ${event.time}` : '';
			return `${name}${time}`;
		} ).join( ', ' );
		parts.push( eventNames );

		if ( events.length > maxEventsToAnnounce ) {
			parts.push( `and ${events.length - maxEventsToAnnounce} more` );
		}
	}

	if ( cell.isAdjacentMonth ) {
		parts.push( 'not in current month' );
	}

	return parts.join( ', ' );
}

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

/**
 * Render event display area
 * @param {Object} cell - Selected day cell object
 * @param {Object} eventsByDate - Events grouped by date key
 * @returns {HTMLElement} - Event display element
 */
function renderEventDisplay( cell, eventsByDate ) {
	const eventDisplay = domEl( 'div', {
		class: 'calendar__events',
		'aria-live': 'polite',
		'aria-atomic': 'true'
	} );

	const dateHeader = domEl( 'h3', {
		class: 'calendar__events-header',
		tabindex: '-1'
	}, formatDateDisplay( cell.date ) );

	eventDisplay.appendChild( dateHeader );

	const events = eventsByDate[cell.dateKey];

	if ( events && events.length > 0 ) {
		const eventList = domEl( 'ul', {
			class: 'calendar__events-list'
		} );

		// Limit displayed events to prevent excessive DOM
		const MAX_DISPLAYED_EVENTS = 20;
		const displayedEvents = events.slice( 0, MAX_DISPLAYED_EVENTS );
		const hasMoreEvents = events.length > MAX_DISPLAYED_EVENTS;

		displayedEvents.forEach( ( event ) => {
			const fullText = event.time ? `${event.description} ${event.time}` : event.description;
			const truncatedText = truncateText( fullText, 150 );

			const eventItem = domEl( 'li', {
				class: 'calendar__events-item'
			} );

			if ( event.path ) {
				const isExternal = isExternalUrl( event.path );

				// Add date parameter to internal event links
				let eventUrl = event.path;
				if ( !isExternal ) {
					const dateParam = cell.dateKey; // YYYY-MM-DD format
					const separator = event.path.includes( '?' ) ? '&' : '?';
					eventUrl = `${event.path}${separator}date=${dateParam}`;
				}

				const linkAttrs = {
					href: eventUrl,
					class: isExternal ? 'usa-link usa-link--external' : 'usa-link',
					title: fullText !== truncatedText ? fullText : undefined // Full text on hover
				};

				// Add external link attributes
				if ( isExternal ) {
					linkAttrs.target = '_blank';
					linkAttrs.rel = 'noopener noreferrer';
				}

				const eventLink = domEl( 'a', linkAttrs, truncatedText );
				eventItem.appendChild( eventLink );
			} else {
				eventItem.textContent = truncatedText;
				if ( fullText !== truncatedText ) {
					eventItem.title = fullText;
				}
			}

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

export default async function decorate( block ) {

	// Read configuration from first cell (optional path to events index)
	const firstRow = block.querySelector( ':scope > div' );
	const firstCell = firstRow?.querySelector( ':scope > div' );
	const indexPath = firstCell?.textContent?.trim() || '/events-index.json';

	// Fetch events from events-index.json
	const events = await parseEvents( indexPath );

	// Group events by date
	const eventsByDate = groupEventsByDate( events );

	// Get current date for initial display
	const today = new Date();

	// Calendar state - tracks currently displayed month and selected day
	const state = {
		year: today.getFullYear(),
		month: today.getMonth(),
		todayYear: today.getFullYear(),
		todayMonth: today.getMonth(),
		selectedDate: null,
		grid: null
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
		}, 100 );
	}

	/**
	 * Handle day cell click
	 * @param {Object} cell - Clicked day cell object
	 */
	function handleDayClick( cell ) {
		// Toggle behavior: if clicking same date, deselect it
		if ( state.selectedDate && state.selectedDate.dateKey === cell.dateKey ) {
			// Remove selection highlight
			const previousSelected = calendarContainer.querySelector( '.calendar__day--selected' );
			if ( previousSelected ) {
				previousSelected.classList.remove( 'calendar__day--selected' );
				previousSelected.removeAttribute( 'aria-selected' );
			}

			// Clear selected date
			state.selectedDate = null;

			// Update event display (will hide panel)
			updateEventDisplay();
			return;
		}

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

		setTimeout( () => {
			const eventsPanel = calendarContainer.querySelector( '.calendar__events' );
			if ( eventsPanel ) {
				const heading = eventsPanel.querySelector( '.calendar__events-header' );
				if ( heading ) {
					heading.focus();
				}
			}
		}, 50 );

		// Announce selection to screen readers
		const dateLabel = formatDateDisplay( cell.date );
		const events = eventsByDate[cell.dateKey];
		if ( events && events.length > 0 ) {
			const eventText = events.length === 1 ? '1 event' : `${events.length} events`;
			announce( `Selected ${dateLabel}, showing ${eventText}` );
		} else {
			announce( `Selected ${dateLabel}, no events scheduled` );
		}

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
				targetIndex = currentIndex - 1;
				break;
			case 'ArrowRight':
				targetIndex = currentIndex + 1;
				break;
			case 'ArrowUp':
				targetIndex = currentIndex - 7;
				break;
			case 'ArrowDown':
				targetIndex = currentIndex + 7;
				break;
			case 'Home':
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
				e.preventDefault();
				handlePageNavigation( 'prev', grid[currentIndex] );
				return;
			case 'PageDown':
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

		state.month = newMonth;
		state.year = newYear;
		updateCalendar();

		announce( `Navigated to ${getMonthName( newMonth )} ${newYear}` );

		// Focus on target day after re-render (using shared focusDay function)
		focusDay( targetDay );

	}

	/**
	 * Update calendar display for current state
	 */
	function updateCalendar() {
		calendarContainer.textContent = '';

		// Re-add live region (it was cleared with textContent)
		calendarContainer.appendChild( liveRegion );

		const header = renderCalendarHeader( state.year, state.month );
		calendarContainer.appendChild( header );

		attachNavigationHandlers( header );

		const weekdayHeaders = renderWeekdayHeaders();
		calendarContainer.appendChild( weekdayHeaders );

		state.grid = generateCalendarGrid( state.year, state.month );
		const gridElement = renderCalendarGrid( state.grid, eventsByDate, today, state.year, state.month );
		calendarContainer.appendChild( gridElement );

		// Re-render event display if a date is selected
		if ( state.selectedDate ) {
			updateEventDisplay();

			const selectedDay = calendarContainer.querySelector( `[data-date="${state.selectedDate.dateKey}"]` );
			if ( selectedDay ) {
				selectedDay.classList.add( 'calendar__day--selected' );
				selectedDay.setAttribute( 'aria-selected', 'true' );
			}
		}

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
	 * Handle month navigation (previous/next)
	 * @param {string} direction - 'prev' or 'next'
	 */
	function handleMonthNavigation( direction ) {
		// Remember which day to focus
		const focusedDay = calendarContainer.querySelector( '.calendar__day:focus' );
		const dayToFocus = focusedDay ?
			parseInt( focusedDay.querySelector( '.calendar__day-number' ).textContent, 10 ) : 1;

		if ( direction === 'prev' ) {
			state.month--;
			if ( state.month < 0 ) {
				state.month = 11;
				state.year--;
			}
		} else {
			state.month++;
			if ( state.month > 11 ) {
				state.month = 0;
				state.year++;
			}
		}

		state.selectedDate = null; // Clear selected date when navigating
		updateCalendar();
		announce( `Navigated to ${getMonthName( state.month )} ${state.year}` );

		// Restore focus to same day number
		focusDay( dayToFocus );
	}

	/**
	 * Attach click handlers to navigation buttons
	 * @param {HTMLElement} header - Calendar header element
	 */
	function attachNavigationHandlers( header ) {
		const prevButton = header.querySelector( '.calendar__nav-btn--prev' );
		if ( prevButton ) {
			prevButton.addEventListener( 'click', () => handleMonthNavigation( 'prev' ) );
		}

		const todayButton = header.querySelector( '.calendar__nav-btn--today' );
		if ( todayButton ) {
			todayButton.addEventListener( 'click', () => {
				state.year = state.todayYear;
				state.month = state.todayMonth;
				state.selectedDate = null;
				updateCalendar();
				announce( `Navigated to current month, ${getMonthName( state.month )} ${state.year}` );

				// Focus today's date
				const todayDay = today.getDate();
				focusDay( todayDay );
			} );
		}

		const nextButton = header.querySelector( '.calendar__nav-btn--next' );
		if ( nextButton ) {
			nextButton.addEventListener( 'click', () => handleMonthNavigation( 'next' ) );
		}
	}

	calendarContainer.addEventListener( 'click', ( e ) => {
		const dayCell = e.target.closest( '.calendar__day' );
		if ( !dayCell ) return;

		const dateKey = dayCell.getAttribute( 'data-date' );
		const cell = state.grid.find( ( c ) => c.dateKey === dateKey );
		if ( cell ) {
			handleDayClick( cell );
		}
	} );

	calendarContainer.addEventListener( 'keydown', ( e ) => {
		const focusedDay = e.target.closest( '.calendar__day' );
		if ( !focusedDay ) return;

		if ( e.key === 'Enter' || e.key === ' ' ) {
			e.preventDefault();
			const dateKey = focusedDay.getAttribute( 'data-date' );
			const cell = state.grid.find( ( c ) => c.dateKey === dateKey );
			if ( cell ) {
				handleDayClick( cell );
			}
			return;
		}

		const navKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];
		if ( navKeys.includes( e.key ) ) {
			handleKeyboardNavigation( e, state.grid );
		}
	} );

	calendarContainer.addEventListener( 'focusin', ( e ) => {
		const dayCell = e.target.closest( '.calendar__day' );
		if ( !dayCell ) return;

		const allDays = calendarContainer.querySelectorAll( '.calendar__day' );
		allDays.forEach( ( day ) => {
			day.setAttribute( 'tabindex', '-1' );
		} );
		dayCell.setAttribute( 'tabindex', '0' );
	} );

	updateCalendar();

	block.textContent = '';
	block.appendChild( calendarContainer );
}
