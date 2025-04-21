/**
	* Delay the execution of a function until after a specified period of inactivity.
	* @param {any} func - the function to be delayed
	* @param {any} wait - how long to wait
	* @returns {any}
	*/
function debounce( func, wait ) {
	let timeout;
	return function () {
		const context = this;
		const args = arguments;
		clearTimeout( timeout );
		timeout = setTimeout( () => {
			func.apply( context, args );
		}, wait );
	};
}

/**
 * Removes problematic characters from a string so that it may be used as an HTML id
 * Note: Does not guarantee uniqueness
 * @param {String} str - the string to be processed
 * @returns {String} - the processed string
 */
function normalizeId( str ) {
	str = `${str}`; // just in case it wasn't a string already
	str = str.toLowerCase();
	str = str.replace( /-/g, ' ' );
	str = str.match( /[\w\s]/g ).join( '' );
	str = str.replace( /\s+/g, ' ' );
	str = str.replace( /\s/g, '_' );
	return str;
}

function createId( str ) {
	str = `${str}`; // just in case it wasn't a string already
	let uniqueId = normalizeId( str );
	let counter = 0;
	let tryId = uniqueId;
	while ( document.getElementById( tryId ) ) {
		counter++;
		tryId = `${uniqueId}-${counter}`;
	}
	return tryId;
}

/**
 * Adds the "usa-list" class to all lists within a parent element
 * @param {HTMLElement} parent
 */
function addClassToLists( parent ) {
	let lists = parent.querySelectorAll( 'ul, ol' );

	if ( !lists ) { return; }
	lists.forEach( ( list ) => {
		list.classList.add( 'usa-list' );
	} );
}

/**
 * Adds a class to all links within a parent element
 * @param {HTMLElement} parent
 * @param {String} cl - optional, defaults to 'usa-link'
 */
function addClassToLinks( parent, cl = 'usa-link' ) {
	let links = parent.querySelectorAll( 'a' );

	if ( !links ) { return; }
	links.forEach( ( link ) => {
		link.classList.add( cl );
	} );
}

/**
 * Fetches index data and caches it in the window object.
 * Returns from cache if available.
 * @param {string} The name of the index file (e.g., 'query-index', 'index').
 * @param {string} The name of the sheet inside the index file (optional).
 * @returns {Promise<object>} The index data.
 */
async function fetchIndex( indexFile = 'query-index', sheet = null ) {
	const cacheKey = sheet ? `${indexFile}-${sheet}` : indexFile;
	const cache = window.siteIndexCache[cacheKey];
	// Add TTL logic if needed (e.g., cache for 5 minutes)
	if ( cache ) return cache;

	const indexPath = `/${indexFile.endsWith( '.json' ) ? indexFile : `${indexFile}.json`}`;
	try {
		const resp = await fetch( indexPath );
		if ( !resp.ok ) throw new Error( `Fetch failed: ${resp.status}` );
		const json = await resp.json();
		// Basic structure { data: [...] } or { sheetName: { data: [...] } }
		const data = sheet ? json[sheet] : json;
		window.siteIndexCache[cacheKey] = data;
		return data;
	} catch ( e ) {
		// eslint-disable-next-line no-console
		console.error( `Failed to fetch index ${indexPath}`, e );
		window.siteIndexCache[cacheKey] = { data: [] }; // Cache failure state
		return window.siteIndexCache[cacheKey];
	}
}

// remove any empty children in a block 
function removeEmptyChildren( el ) {
	if ( el.innerText.trim().length === 0 ) {
		el.remove();
	}
}

// check if the row exists OR if a row contains a picture 
function checkIfRowExists( el, rowNum ) {
	if ( el[rowNum] && ( el[rowNum].innerText.trim().length > 0 || el[rowNum].querySelector( 'picture' ) ) ) {
		return el[rowNum].children;
	} else {
		return;
	}
}

/**
 * Asynchronously loads a USWDS SVG icon into a given element.
 * @async
 * @function getIndividualIcon
 * @param {HTMLElement} el     - The element to inject the SVG into.
 * @param {string} iconName    - The icon name (e.g., 'arrow_back').
 * @param {bool} google        - If the icon is a material icon. defaults to false 
 * @param {string} [prefix=''] - Optional prefix to prepend to the icon path.
 */
async function getIndividualIcon( el, iconName, google = false, prefix = '' ) {
	let link;
	if ( google ) {
		link = `${window.hlx.codeBasePath}${prefix}/icons/material-icons/${iconName}.svg`;
	} else { // add material icon
		link = `${window.hlx.codeBasePath}${prefix}/icons/usa-icons/${iconName}.svg`;
	}

	const resp = await fetch( link );
	if ( resp.ok ) {
		const svgContent = await resp.text();
		const originalText = el.innerHTML;
		el.innerHTML = originalText + svgContent; // if we are adding an icon, make sure not to remove the el's inner text
		const svg = el.querySelector( 'svg' );
		svg.classList.add( 'usa-icon' );
		svg.setAttribute( 'aria-hidden', 'true' );
		svg.setAttribute( 'focusable', false );
		svg.setAttribute( 'role', 'img' );
		svg.dataset.iconName = iconName;
	} else {
		// eslint-disable-next-line no-console
		console.error( 'Failed to fetch SVG' );
	}
}

export { debounce, normalizeId, createId, addClassToLists, addClassToLinks, fetchIndex, removeEmptyChildren, checkIfRowExists, getIndividualIcon  };
