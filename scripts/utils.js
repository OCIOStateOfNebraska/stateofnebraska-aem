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

export { debounce, normalizeId, createId };
