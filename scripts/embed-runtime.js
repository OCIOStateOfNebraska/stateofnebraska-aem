import { buildBlock, decorateBlock, getMetadata, toClassName } from './aem.js';
import { loadBlock, loadSections } from './block-loader.js';
import { decorateMain } from './page.js';
import { setEmbedContext, resolveContentUrls, plainUrl, loadStylesheet } from './embed-context.js';

const fontUrl = 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap';

async function fetchText( url, signal ) {
	const response = await fetch( url, { signal } );
	if ( !response.ok ) throw new Error( `Unable to fetch ${url}: ${response.status}` );
	return response.text();
}

export async function renderEmbed( { pageUrl, sourceBase, type, root, container, signal } ) {
	const context = {
		pageUrl,
		sourceBase,
		root,
		signal,
		blockLoads: new WeakMap(),
		loadStyle: ( href ) => loadStylesheet( new URL( href, sourceBase ).href, root ),
	};
	setEmbedContext( container, context );
	container.addEventListener( 'click', ( event ) => {
		const link = event.target.closest( 'a[href^="#"]' );
		if ( !link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey ) return;
		const id = decodeURIComponent( link.getAttribute( 'href' ).slice( 1 ) );
		const target = root.getElementById( id ) || document.getElementById( id );
		if ( !target ) return;
		event.preventDefault();
		target.scrollIntoView();
		const tabindex = target.getAttribute( 'tabindex' );
		if ( tabindex === null ) target.tabIndex = -1;
		target.focus( { preventScroll: true } );
		if ( tabindex === null ) target.addEventListener( 'blur', () => target.removeAttribute( 'tabindex' ), { once: true } );
	}, { signal } );
	const [html, metadataHtml] = await Promise.all( [
		fetchText( plainUrl( pageUrl ), signal ),
		fetchText( pageUrl, signal ),
		context.loadStyle( 'styles/embed.css' ),
		context.loadStyle( 'styles/lazy-styles.css' ),
		loadStylesheet( fontUrl ),
	] );
	signal.throwIfAborted();
	context.metadata = new DOMParser().parseFromString( metadataHtml, 'text/html' );
	container.classList.add( 'appear' );
	getMetadata( 'theme', context.metadata ).split( ',' ).map( toClassName ).filter( Boolean )
		.forEach( ( theme ) => container.classList.add( `theme--${theme}` ) );
	const main = document.createElement( 'main' );
	main.innerHTML = html;
	container.append( main );
	resolveContentUrls( main, pageUrl );

	if ( type === 'hero' ) {
		const heading = main.querySelector( 'h1' );
		if ( !heading ) throw new Error( 'The fetched fragment contains no h1' );
		const section = heading.closest( 'main > div' ) || main;
		const picture = section.querySelector( 'picture' );
		const hero = buildBlock( 'hero', { elems: [picture, heading].filter( Boolean ) } );
		const wrapper = document.createElement( 'div' );
		wrapper.append( hero );
		main.replaceChildren( wrapper );
		decorateBlock( hero );
		await loadBlock( hero, context );
	} else {
		decorateMain( main );
		await loadSections( main, context );
		if ( type !== 'main' ) {
			context.fragment = main;
			const landmark = document.createElement( type );
			const block = buildBlock( type, '' );
			landmark.append( block );
			container.append( landmark );
			decorateBlock( block );
			await loadBlock( block, context );
			main.remove();
		}
	}
	signal.throwIfAborted();
}
