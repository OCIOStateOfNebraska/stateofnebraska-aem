/*
 * Fragment Block
 * Include content on a page as a fragment.
 * https://www.aem.live/developer/block-collection/fragment
 */

import {
	decorateInner,
} from '../../scripts/page.js';

import {
	loadSections,
} from '../../scripts/block-loader.js';
import { getEmbedContext, setEmbedContext, plainUrl, resolveContentUrls } from '../../scripts/embed-context.js';

/**
 * Loads a fragment.
 * @param {string} path The path to the fragment
 * @returns {HTMLElement} The root element of the fragment
 */
export async function loadFragment( path, context = null ) {
	if ( path ) {
		const url = plainUrl( new URL( path, context?.pageUrl || window.location.href ).href );
		const resp = await fetch( url );
		if ( resp.ok ) {
			const container = document.createElement( 'div' );
			container.classList.add( 'fragment' );
			container.innerHTML = await resp.text();
			if ( context ) {
				setEmbedContext( container, context );
				resolveContentUrls( container, url );
			}

			// reset base path for media to fragment base
			const resetAttributeBase = ( tag, attr ) => {
				container.querySelectorAll( `${tag}[${attr}^="./media_"]` ).forEach( ( elem ) => {
					elem[attr] = new URL( elem.getAttribute( attr ), new URL( path, window.location ) ).href;
				} );
			};
			resetAttributeBase( 'img', 'src' );
			resetAttributeBase( 'source', 'srcset' );

			decorateInner( container );
			await loadSections( container, context );
			return container;
		}
		if ( context ) throw new Error( `Unable to fetch ${url}: ${resp.status}` );
	}
	return null;
}

export default async function decorate( block ) {
	const link = block.querySelector( 'a' );
	const path = link ? link.getAttribute( 'href' ) : block.textContent.trim();
	const fragment = await loadFragment( path, getEmbedContext( block ) );
	if ( fragment ) {
		const fragmentSection = fragment.querySelector( ':scope .section' );
		if ( fragmentSection ) {
			block.closest( '.section' ).classList.add( ...fragmentSection.classList );
			const target = block.closest( '.fragment' ) || block.closest( '.section' );
			target.replaceWith( ...fragment.childNodes );
		}
	}
}
