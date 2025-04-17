import { domEl } from '../../scripts/dom-helpers.js';
import { createOptimizedPicture } from '../../scripts/aem.js';
/**
 * loads and decorates the figures. 
 * @param {Element} block The figure block element
 */
export default function decorate( block ) {
	const picture = block.querySelector( 'picture' );
	const left = block.classList.contains( 'left' );
	const right =  block.classList.contains( 'right' );
	const imgWidth = picture.querySelector( 'img' ).width;
	const containerWidth = 1400; // max container width 
	const wrapperMaxWidth = ( left || right ) ? ( containerWidth / 2 ) : containerWidth;
	
	const pictureWrap = picture.closest( 'p' ) ? picture.closest( 'p' ) : null;
	let caption = pictureWrap ? pictureWrap.nextElementSibling: null;

	if ( caption && caption.tagName.toUpperCase() !== 'P' ) {
		caption = null;
	}

	// Create new structure with domEl
	const figcaption = caption ? domEl( 'figcaption', {}, caption.textContent ) : '';
	const figure = domEl( 'figure', {}, picture, figcaption );
	
	if ( imgWidth > wrapperMaxWidth ) {
		picture.querySelectorAll( 'img' ).forEach( ( img ) => img.closest( 'picture' ).replaceWith( createOptimizedPicture( img.src, img.alt, false, [{ width: `${wrapperMaxWidth}` }] ) ) );
	}

	// Remove everything inside the block and append the new <figure>
	block.innerHTML = '';
	block.appendChild( figure );
}
