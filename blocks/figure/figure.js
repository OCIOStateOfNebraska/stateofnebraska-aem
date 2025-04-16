import { domEl } from '../../scripts/dom-helpers.js';
/**
 * loads and decorates the figures. 
 * @param {Element} block The figure block element
 */
export default function decorate( block ) {
	const picture = block.querySelector( 'picture' );
	const pictureWrap = picture.closest( 'p' ) ? picture.closest( 'p' ) : null;
	let caption = pictureWrap ? pictureWrap.nextElementSibling: null;

	if ( caption && caption.tagName !== 'P' ) {
		caption = null;
	}

	// Create new structure with domEl
	const figcaption = caption ? domEl( 'figcaption', {}, caption.textContent ) : '';
	const figure = domEl( 'figure', {}, picture, figcaption );

	// Remove everything inside the block and append the new <figure>
	block.innerHTML = '';
	block.appendChild( figure );
}
