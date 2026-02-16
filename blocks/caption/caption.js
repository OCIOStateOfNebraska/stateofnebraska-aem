import { domEl } from '../../scripts/dom-helpers.js';
import { normalizeId, getIndividualIcon } from '../../scripts/utils.js';

/**
 * loads and decorates the figures. 
 * @param {Element} block The figure block element
 */
export default function decorate( block ) {

	// Associate it with the previous media
	const captionWrapper = block.parentElement;
	const previousBlock = captionWrapper.previousElementSibling;
	if( !previousBlock.classList.contains( 'default-content-wrapper' ) ) { return; } // not housing a decorated video

	const figure = previousBlock.querySelector( 'figure:last-child' );
	if( figure.querySelector( 'figcaption' ) ) { return; } // already has a caption

	// Create a unique ID
	const innerWrapper = block.querySelector( 'div' );
	const wrapperId = normalizeId( innerWrapper.textContent.trim().split( ' ' ).splice( 0, 4 ).join( ' ' ) ); // use the first four words as the id
	let uniqueCount = 1;
	let uniqueId = wrapperId;
	while( document.getElementById( uniqueId ) ) {
		uniqueId = wrapperId + '_' + uniqueCount;
		uniqueCount++;
	}

	innerWrapper.id = uniqueId;
	innerWrapper.setAttribute( 'hidden', '' );
	innerWrapper.classList.add( 'caption__content' );

	// Collapse it behind a button
	const btnText = 'View the video description';

	const expandIcon = domEl( 'span', { class: 'usa-icon caption__icon--expand' } );
	getIndividualIcon( expandIcon, 'add_circle_outline' );
	const collapseIcon = domEl( 'span', { class: 'usa-icon caption__icon--collapse' } );
	getIndividualIcon( collapseIcon, 'remove_circle' );
	const icons = domEl( 'span', { class: 'caption__icon' }, expandIcon );
	icons.append( collapseIcon );

	const btn = domEl( 'button', {
		type: 'button',
		'aria-controls': uniqueId,
		'aria-expanded': 'false',
		class: 'caption__btn usa-button usa-button--outline usa-button--big'
	}, icons );
	btn.append( btnText );
	btn.addEventListener( 'click', btnClick );

	const btnWrap = domEl( 'div', { class: 'caption__btn-wrap' }, btn );

	block.prepend( btnWrap );






	const figcaption = domEl( 'figcaption', {}, block );
	figure.appendChild( figcaption );
}

function btnClick( e ) {
	const btn = e.target;
	const content = document.getElementById( e.target.getAttribute( 'aria-controls' ) );

	console.log( typeof btn.getAttribute( 'aria-expanded' ) );
	if( btn.getAttribute( 'aria-expanded' ) == 'true' ) {
		btn.setAttribute( 'aria-expanded', false );
		content.setAttribute( 'hidden', '' );
	} else {
		btn.setAttribute( 'aria-expanded', true );
		content.removeAttribute( 'hidden' );
	}
}