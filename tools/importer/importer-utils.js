/* global WebImporter */

/**
 * Processes PDF links in the main element, preparing them for download and updating their href attributes to point to the new base URL.
 * @param {Element} main 
 * @param {string} pageUrl The original page URL
 * @param {string} newHost "http[s]://main--repo--owner.aem.page" unique to your project setup
 * @returns {Array<{path: string, from: string, report: {'proxy-pdf-url': string}}>} Returns an array of file objects for PDF links found.
 */
export function processPdfLinks( main, pageUrl, host ) {
	const results = [];
	main.querySelectorAll( 'a' ).forEach( ( a ) => {
		const href = a.getAttribute( 'href' );
		if ( href && href.endsWith( '.pdf' ) && !href.startsWith( 'http://' ) && !href.startsWith( 'https://' ) ) {
			const u = new URL( href, pageUrl );
			const newPath = WebImporter.FileUtils.sanitizePath( u.pathname ).replace( '/sites/default/', '/' );
			// no "element", the "from" property is provided instead - importer will download the "from" resource as "path"
			results.push( {
				path: newPath,
				from: u.toString(),
				report: {
					'proxy-pdf-url': u.toString()
				}
			} );

			// update the link to new path on the target host
			// this is required to be able to follow the links in Word
			const newHref = new URL( newPath, host ).toString();
			a.setAttribute( 'href', newHref );
		}
	} );

	return results;
}

/**
 * Updates all anchor links in the main element to point to the new host, preserving their paths.
 * @param {Element} main 
 * @param {string} url 
 * @param {string} host 
 */
export function updateLinks( main, url, host ) {
	main.querySelectorAll( 'a' ).forEach( ( a ) => {
		const href = a.getAttribute( 'href' );
		if ( href && !href.endsWith( '.pdf' ) && !href.startsWith( 'http://' ) && !href.startsWith( 'https://' ) ) {
			const u = new URL( href, url );
			const newPath = WebImporter.FileUtils.sanitizePath( u.pathname );
			const newHref = new URL( newPath, host ).toString();
			a.setAttribute( 'href', newHref );
		}
	} );
}

/**
 * Updates all image links in the main element to point to the new host, preserving their paths.
 * @param {Element} main 
 * @param {string} url 
 * @param {string} host 
 */
export function updateImageLinks( main, url, host ) {
	main.querySelectorAll( 'img' ).forEach( ( img ) => {
		const src = img.getAttribute( 'src' );
		if ( src ) {
			const u = new URL( src, url );
			const newPath = WebImporter.FileUtils.sanitizePath( u.pathname );
			const newSrc = new URL( newPath, host ).toString();
			img.setAttribute( 'src', newSrc );
		}
	} );
}

/**
 * Removes tables without header cells from the container element.
 * @param {Element} container 
 */
export function removeEmptyTable( container ) {
	container.querySelectorAll( 'table' ).forEach( ( each ) => {
		if ( !each.querySelector( 'th' ) ) {
			each.remove();
		}
	} );
}

/**
 * Formats a Date object into a readable string.
 * @param {Date} date 
 * @param {string} [timezone] Optional timezone identifier (e.g., "America/Chicago")
 * @returns {string} Formatted date string like "January 1, 2020 - 3:00 pm"
 */
export function formatDate( date, timezone ) {
	const dateFormatted = new Intl.DateTimeFormat( 'en-US', { 
		month: 'long', 
		day: 'numeric', 
		year: 'numeric',
		...( timezone && { timeZone: timezone } )
	} ).format( date );

	const timeFormatted = new Intl.DateTimeFormat( 'en-US', { 
		hour: 'numeric', 
		minute: '2-digit', 
		hour12: true,
		...( timezone && { timeZone: timezone } )
	} ).format( date ).toLowerCase();

	return dateFormatted + ' - ' + timeFormatted;
}

/**
 * Groups adjacent elements into a 2D array.
 * @param {Iterable<Element>} elements 
 * @returns {Array<Array<Element>>} Returns a 2D array where each sub-array contains adjacent elements. All elements are in document order.
 */
export function getAdjacentElements( elements ) {
	const sortedElements = sortByDocumentOrder( elements );
	const adjacentElements = [];
	let group = -1;

	function addAdjacentElement( element ) {
		if ( !adjacentElements[group] ) { 
			adjacentElements.push( [] ); 
		}
		adjacentElements[group].push( element );
	}

	sortedElements.forEach( ( element, index, arr ) => {
		const previousSibling = element.previousElementSibling;
		const isAdjacentPrevious = previousSibling && arr.includes( previousSibling );

		if ( !isAdjacentPrevious ) {
			group++;
		}
		addAdjacentElement( arr[index] );
	} );
	return adjacentElements;
}

/**
 * Groups adjacent elements matching a selector within a container element into a 2D array.
 * @param {Element} container 
 * @param {string} selector 
 * @returns {Array<Array<Element>>} Returns a 2D array where each sub-array contains adjacent elements matching the selector. All elements are in document order.
 */
export function getAdjacentElementsBySelector( container, selector ) {
	const elements = container.querySelectorAll( selector );
	return getAdjacentElements( elements );
}

/**
 * Gets the heading level of a heading element.
 * @param {Element} heading 
 * @returns {Number|null} Returns the heading level (1-6) or null if not a heading.
 */
export function getHeadingLevel( heading ) {
	const tagName = heading.tagName;
	if ( tagName.startsWith( 'H' ) ) {
		const level = parseInt( tagName[1] );
		return level;
	}
	return null;
}

/**
 * Sorts a collection of elements in document order.
 * @param {Iterable<Element>} elements 
 * @returns {Array<Element>} Returns a new array of elements sorted in document order.
 */
export function sortByDocumentOrder( elements ) {
	return Array.from( elements ).sort( ( a, b ) => {
		const position = a.compareDocumentPosition( b );
		
		if ( position & Node.DOCUMENT_POSITION_FOLLOWING ) {
			return -1;
		} else if ( position & Node.DOCUMENT_POSITION_PRECEDING ) {
			return 1;
		}
		return 0;
	} );
}

/**
 * Replaces a button element that is on it's own line, with a new button of the specified variation.
 * @param {Element} oldButton
 * @param {'primary'|'secondary'|'outline'} variation 
 */
export function replaceButton( oldButton, variation ) {
	// Make sure oldButton is an anchor tag
	if ( oldButton.tagName !== 'A' ) {
		console.error( 'Old button must be an anchor tag' );
		return;
	}
	const pWrapper = oldButton.closest( 'p' );
	if( !pWrapper || pWrapper.childNodes.length !== 1 ) {
		console.info( oldButton, 'Button is not the only element inside a paragraph' );
		return;
	}

	let buttonWrapper;
	switch ( variation ) {
		case 'primary':
			pWrapper.firstChild.replaceWith( oldButton );
			break;
		case 'secondary':
			buttonWrapper = document.createElement( 'strong' );
			buttonWrapper.appendChild( oldButton );
			pWrapper.firstChild ? pWrapper.firstChild.replaceWith( buttonWrapper ) : pWrapper.appendChild( buttonWrapper );
			break;
		case 'outline':
			buttonWrapper = document.createElement( 'em' );
			buttonWrapper.appendChild( oldButton );
			pWrapper.firstChild ? pWrapper.firstChild.replaceWith( buttonWrapper ) : pWrapper.appendChild( buttonWrapper );
			break;
		default:
			console.error( 'Invalid button variation' );
			return;
	}
}

/**
 * Queries the container for all anchor tags that are on their own line and replaces them with the specified button variation.
 * @param {Element} container 
 * @param {'primary'|'secondary'|'outline'} variation 
 * @returns {Element} The container buttons replaced with the specified variation.
 */
export function replaceButtons( container, variation ) {
	const buttons = container.querySelectorAll( 'a' );
	buttons.forEach( button => {
		replaceButton( button, variation );
	} );
	return container;
}

/**
 * Replaces a heading element with a new heading of the specified level, preserving attributes and content.
 * @param {Element} oldHeading 
 * @param {Number} newLevel 
 * @returns {Element} The new heading element.
 */
export function replaceHeading( oldHeading, newLevel ) {
	const newHeading = document.createElement( `h${newLevel}` );
  
	// Copy all attributes
	Array.from( oldHeading.attributes ).forEach( attr => {
		newHeading.setAttribute( attr.name, attr.value );
	} );
  
	// Copy all child nodes (preserves text and nested elements)
	while ( oldHeading.firstChild ) {
		newHeading.appendChild( oldHeading.firstChild );
	}
  
	// Replace in DOM
	oldHeading.parentNode.replaceChild( newHeading, oldHeading );
  
	return newHeading;
}

/**
 * Transforms all headings in the container to the target level. This transformation preserves attributes and content.
 * @param {Element} container 
 * @param {Number} targetLevel 
 * @returns {Element} The container with transformed headings.
 */
export function replaceHeadings( container, targetLevel ) {
	if ( targetLevel < 1 || targetLevel > 6 ) {
		console.error( 'Target level must be between 1 and 6' );
		return;
	}
  
	// Get all heading elements
	const headings = container.querySelectorAll( 'h1, h2, h3, h4, h5, h6' );
  
	headings.forEach( heading => {
		const currentLevel = parseInt( heading.tagName.charAt( 1 ) );
    
		// Only transform if it's a different level
		if ( currentLevel !== targetLevel ) {
			replaceHeading( heading, targetLevel );
		}
	} );
	return container;
}

/**
 * Wraps an element with a specified wrapper element or tag name.
 * @param {Element} element 
 * @param {Element|string} wrapper - The wrapper element or tag name.
 * @returns {Element} The wrapper element containing the original element.
 */
export function wrapElement( element, wrapper ) {
	const wrapperEl = typeof wrapper === 'string' 
		? document.createElement( wrapper ) 
		: wrapper;
  
	element.parentNode.insertBefore( wrapperEl, element );
  
	wrapperEl.appendChild( element );
  
	return wrapperEl;
}

/**
 * Wraps text in a specified wrapper element or tag name.
 * @param {string} text Text to wrap
 * @param {Element|string} wrapper The wrapper element or tag name.
 * @returns {Element} The wrapper element containing the text.
 */
export function wrapText( text, wrapper ) {
	const wrapperEl = typeof wrapper === 'string' 
		? document.createElement( wrapper ) 
		: wrapper;

	wrapperEl.textContent = text;
	return wrapperEl;
}

export default {
	processPdfLinks,
	updateLinks,
	updateImageLinks,
	removeEmptyTable,
	formatDate,
	getAdjacentElements,
	getAdjacentElementsBySelector,
	getHeadingLevel,
	sortByDocumentOrder,
	replaceButton,
	replaceButtons,
	replaceHeading,
	replaceHeadings,
	wrapElement,
	wrapText,
};