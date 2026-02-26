import { domEl } from '../../scripts/dom-helpers.js';
import { normalizeId, getIndividualIcon } from '../../scripts/utils.js';

let resizeTimer;

/**
 * loads and decorates the figures. 
 * @param {Element} block The figure block element
 */
export default function decorate( block ) {
	// Associate it with the previous media
	const captionWrapper = block.parentElement;
	const previousBlock = captionWrapper.previousElementSibling;

	if( !previousBlock.classList.contains( 'default-content-wrapper' ) && !previousBlock.classList.contains( 'figure-wrapper' ) ) {
		invalidCaption( block, 'This caption is not preceded by intended content.' );
		return;
	}

	let figure = previousBlock.querySelector( ':scope > figure:last-child, :scope .figure figure' );
	if( !figure ) {
		const picture = previousBlock.querySelector( ':scope > picture:last-child' );

		if( !picture ) {
			invalidCaption( block, 'This caption is not preceded by valid media.' );
			return;
		}

		figure = domEl( 'figure', {}, picture ); // wrap the picture in a figure element
		previousBlock.appendChild( figure );
	}

	if( figure.querySelector( 'figcaption' ) ) {
		invalidCaption( block, 'Preceding media already has a related caption.' );
		return;
	}

	const innerWrapper = block.querySelector( 'div' );
	const uniqueId = createUniqueId( innerWrapper );
	
	innerWrapper.id = uniqueId;
	innerWrapper.setAttribute( 'hidden', '' );
	innerWrapper.classList.add( 'caption__content' );
	innerWrapper.setAttribute( 'tabindex', -1 ); // allow JS to focus on it when opened

	block.prepend( createButton( uniqueId, figure.querySelector( 'picture' ) ? 'View description' : 'View the video description' ) );

	// wrap it in a figcaption and shift it into the figure
	const figcaption = domEl( 'figcaption', {}, block );
	figure.appendChild( figcaption );

	window.addEventListener( 'resize', () => {
		if( resizeTimer ) { clearTimeout( resizeTimer ); }
		resizeTimer = setTimeout( resizeContentHeight, 100 );
	}, { passive: true} );
}

function invalidCaption( block, error ) {
	console.warn( 'Caption Block will not render:', error, '\n' + block.textContent.trim().substring( 0, 255 ) + '...' );
	block.innerHTML = '';
}

function createUniqueId( ele ) {
	const rootId = normalizeId( ele.textContent.trim().split( ' ' ).splice( 0, 4 ).join( ' ' ) ); // use the first four words as the id
	let uniqueCount = 1;
	let uniqueId = rootId;
	while( document.getElementById( uniqueId ) ) {
		uniqueId = rootId + '_' + uniqueCount;
		uniqueCount++;
	}

	return uniqueId;
}

function createButton( id, btnText ) {
	const expandIcon = domEl( 'span', { class: 'usa-icon caption__icon--expand' } );
	getIndividualIcon( expandIcon, 'add_circle_outline' );
	const collapseIcon = domEl( 'span', { class: 'usa-icon caption__icon--collapse' } );
	getIndividualIcon( collapseIcon, 'remove_circle' );
	const icons = domEl( 'span', { class: 'caption__icon' }, expandIcon );
	icons.append( collapseIcon );

	const btn = domEl( 'button', {
		type: 'button',
		'aria-controls': id,
		'aria-expanded': 'false',
		class: 'caption__btn usa-button usa-button--outline usa-button--big'
	}, icons );
	btn.append( btnText );
	btn.addEventListener( 'click', btnClick );

	return domEl( 'div', { class: 'caption__btn-wrap' }, btn );
}

function btnClick( e ) {
	const btn = e.currentTarget;
	const content = document.getElementById( e.currentTarget.getAttribute( 'aria-controls' ) );

	if( btn.getAttribute( 'aria-expanded' ) == 'true' ) {
		btn.setAttribute( 'aria-expanded', false );
		content.classList.add( 'caption__content--closing' );
		content.addEventListener( 'transitionend', () => {
			content.setAttribute( 'hidden', '' );
		}, { once: true } );
	} else {
		btn.setAttribute( 'aria-expanded', true );
		
		// reset for transition
		content.style.maxHeight = '';
		content.classList.remove( 'caption__content--closing' );
		content.removeAttribute( 'hidden' );
		
		const newHeight = getContentHeight( content ) + 'px';

		// Force the browser to commit max-height: 0 as the transition start
		content.getBoundingClientRect();

		content.style.maxHeight = newHeight;
		content.focus();
	}
}

function getContentHeight( contentWrap ) {
	contentWrap.style.display = 'block';
	contentWrap.style.transition = 'none';
	const prevHeight = contentWrap.style.maxHeight;
	contentWrap.style.setProperty( 'max-height', 'none', 'important' );

	const height = contentWrap.getBoundingClientRect().height;

	// reset back to what it was previously
	contentWrap.style.display = '';
	contentWrap.style.maxHeight = prevHeight;
	contentWrap.style.transition = '';
	return height;
}

function resizeContentHeight() {
	Array.from( document.querySelectorAll( '.caption__content:not([hidden]):not(.caption__content--closing)' ) ).forEach( ( content ) => {
		const newHeight = getContentHeight( content ) + 'px';

		// Force the browser to commit max-height: 0 as the transition start
		content.getBoundingClientRect();

		content.style.maxHeight = newHeight;
	} );
}
