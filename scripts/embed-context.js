const contexts = new WeakMap();
const stylesheets = new WeakMap();

export function loadStylesheet( href, root = document.head ) {
	if ( !stylesheets.has( root ) ) stylesheets.set( root, new Map() );
	const cache = stylesheets.get( root );
	const url = new URL( href, document.baseURI ).href;
	const existing = [...root.querySelectorAll( 'link[rel="stylesheet"]' )].find( ( link ) => link.href === url );
	if ( existing && cache.has( url ) ) return cache.get( url );
	cache.delete( url );
	if ( existing?.sheet ) return Promise.resolve();
	const link = existing || document.createElement( 'link' );
	link.rel = 'stylesheet';
	link.href = url;
	const promise = new Promise( ( resolve, reject ) => {
		link.addEventListener( 'load', resolve, { once: true } );
		link.addEventListener( 'error', () => {
			cache.delete( url );
			link.remove();
			reject( new Error( `Unable to load stylesheet: ${url}` ) );
		}, { once: true } );
	} );
	cache.set( url, promise );
	if ( !existing ) root.append( link );
	return promise;
}

export function setEmbedContext( element, context ) {
	contexts.set( element, context );
}

export function getEmbedContext( element ) {
	for ( let node = element; node; node = node.parentNode || node.host ) {
		if ( contexts.has( node ) ) return contexts.get( node );
	}
	return null;
}

export function plainUrl( value ) {
	const url = new URL( value );
	url.hash = '';
	if ( !url.pathname.endsWith( '.plain.html' ) ) {
		url.pathname += url.pathname.endsWith( '/' ) ? 'index.plain.html' : '.plain.html';
	}
	return url;
}

export function resolveContentUrls( container, base ) {
	container.querySelectorAll( '[href], [src], [poster], [action], [srcset]' ).forEach( ( element ) => {
		['href', 'src', 'poster', 'action'].forEach( ( attribute ) => {
			const value = element.getAttribute( attribute );
			if ( value && !value.startsWith( '#' ) ) element.setAttribute( attribute, new URL( value, base ).href );
		} );
		const srcset = element.getAttribute( 'srcset' );
		if ( !srcset ) return;
		// URLs end at whitespace, not commas: data URLs can contain commas.
		let remaining = srcset;
		const candidates = [];
		while ( remaining.trim() ) {
			remaining = remaining.replace( /^[\s,]+/, '' );
			if ( !remaining ) break;
			const match = remaining.match( /^\S+/ )[0];
			const url = match.replace( /,+$/, '' );
			remaining = remaining.slice( match.length );
			let descriptor = '';
			if ( !match.endsWith( ',' ) ) {
				const end = remaining.indexOf( ',' );
				descriptor = end < 0 ? remaining : remaining.slice( 0, end );
				remaining = end < 0 ? '' : remaining.slice( end + 1 );
			}
			candidates.push( `${new URL( url, base ).href}${descriptor}` );
		}
		element.setAttribute( 'srcset', candidates.join( ', ' ) );
	} );
}
