import {
	loadBlock as loadPageBlock,
	loadSection as loadPageSection,
	loadSections as loadPageSections,
	loadCSS as loadPageCSS,
} from './aem.js';
import { getEmbedContext, setEmbedContext, resolveContentUrls } from './embed-context.js';

export async function loadBlock( block, context = getEmbedContext( block ) ) {
	if ( !context ) return loadPageBlock( block );
	if ( context.blockLoads.has( block ) ) return context.blockLoads.get( block );
	if ( block.dataset.blockStatus === 'loaded' ) return block;
	setEmbedContext( block, context );
	const promise = ( async () => {
		const { blockName } = block.dataset;
		const base = new URL( `blocks/${blockName}/${blockName}`, context.sourceBase ).href;
		block.dataset.blockStatus = 'loading';
		try {
			context.signal.throwIfAborted();
			await context.loadStyle( `${base}.css` );
			const mod = await import( `${base}.js` );
			context.signal.throwIfAborted();
			if ( mod.default ) await mod.default( block, context.pageUrl.origin, context );
			resolveContentUrls( block, context.pageUrl );
			block.dataset.blockStatus = 'loaded';
			return block;
		} catch ( error ) {
			block.dataset.blockStatus = 'error';
			context.blockLoads.delete( block );
			throw error;
		}
	} )();
	context.blockLoads.set( block, promise );
	return promise;
}

export async function loadSection( section, callback, context = getEmbedContext( section ) ) {
	if ( !context ) return loadPageSection( section, callback );
	if ( section.dataset.sectionStatus === 'loaded' ) return;
	section.dataset.sectionStatus = 'loading';
	for ( const block of section.querySelectorAll( 'div.block' ) ) {
		await loadBlock( block, context );
	}
	if ( callback ) await callback( section );
	section.dataset.sectionStatus = 'loaded';
	section.style.removeProperty( 'display' );
}

export async function loadSections( element, context = getEmbedContext( element ) ) {
	if ( !context ) return loadPageSections( element );
	for ( const section of element.querySelectorAll( 'div.section' ) ) {
		await loadSection( section, null, context );
	}
}

export function loadCSS( href, element ) {
	const context = getEmbedContext( element );
	return context ? context.loadStyle( href ) : loadPageCSS( href );
}
