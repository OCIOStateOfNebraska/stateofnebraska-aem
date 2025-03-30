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
	var id = normalizeId( str );
	var uniqueId = id + '-' + Date.now(); // add a unique identifier just in case somewhere has the same 2 ids
	return uniqueId;
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

export { debounce, normalizeId, createId, addClassToLists, addClassToLinks };
