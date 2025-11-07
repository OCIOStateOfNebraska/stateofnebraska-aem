import { domEl } from '../../scripts/dom-helpers.js';
import { createOptimizedPicture } from '../../scripts/aem.js';
import { getIndividualIcon } from '../../scripts/utils.js';

function generateMedia( div, container ) {
	div.className = 'carousel-card__media';
	const img = container.querySelector( 'picture' );
	const imgWrapper = domEl( 'div', { class: 'carousel-card__img' }, img );
	div.append( imgWrapper );
}

function generateContent( div, container ) {
	const heading = div.querySelector( 'h2, h3, h4, h5, h6' );
	if ( heading ) {
		const a = heading.querySelector( 'a' );
		if( a.textContent.length > 70 ){
			const text = a.textContent.substring( 0,a.textContent.indexOf( ' ', 65 )  ) + '...' ;
			a.textContent = text;
		}
		heading.classList.add( 'carousel-card__heading' );
		const headerWrap = domEl( 'div', { class: 'carousel-card__header' }, heading );
		container.prepend( headerWrap );
	}

	div.remove(  );
}

function generateWholeCard( container ) {
	[...container.children].forEach( ( div ) => {
		if ( div.querySelector( 'picture' ) ) {
			generateMedia( div, container );
		} else {
			generateContent( div, container );
		}
	} );

	const picture = container.querySelector( '.carousel-card__media' );
	const heading = container.querySelector( '.carousel-card__header' );
	container.append( picture );
	if( heading !== null ){
		const content = domEl( 'div', { class: 'carousel-card__content' }, heading );
		container.append( content );
	}	
}

function showSlide( indicator, slider, block ) {
	const arrowLeft = block.querySelector( '[title="arrow back"]' );
	const arrowRight = block.querySelector( '[title="arrow right"]' );
	const indicators = Array.from( indicator ).reverse(  );
	const slides = Array.from( slider.children );
	let currentIndex = 0;
	let slideShow = setInterval( slideShowFunc, 5000 );
	let isPaused = false;
	// -----------------------------
	// Main slide switch function
	// -----------------------------
	function changeSlide( index, key = null ) {
		clearInterval( slideShow );
		if ( index < 0 ) index = slides.length - 1;
		if ( index >= slides.length ) index = 0;
		currentIndex = index;

		indicators.forEach( ( dot ) => dot.classList.remove( 'usa-current' ) );
		slides.forEach( ( slide ) => slide.classList.remove( 'usa-current' ) );
		indicators[index].classList.add( 'usa-current' );
		slides[index].classList.add( 'usa-current' );

		slider.scrollTo( {
			left: slides[index].offsetLeft,
			behavior: 'smooth',
		} );

		if ( !isPaused ) {
			slideShow = setInterval( slideShowFunc, 5000 );
		}

		//if changed via keyboard, focus inside slide
		if ( key === 'key' ) {
			const focusable = slides[index].querySelector( 'a' );
			if ( focusable ) {
				setTimeout( (  ) => focusable.focus(  ), 0 );
			}
		}
	}
	// -----------------------------
	// Auto-advance logic
	// -----------------------------
	function slideShowFunc(  ) {
		changeSlide( currentIndex + 1 );
	}
	// -----------------------------
	// Focus handling (  pause/resume  )
	// -----------------------------
	block.addEventListener( 'focusin', ( e ) => {
		if ( slider.contains( e.target ) ) {
			clearInterval( slideShow );
			isPaused = true;
		}
	} );
	block.addEventListener( 'focusout', (  ) => {
		// use timeout to wait until new focus target is set
		setTimeout( (  ) => {
			if ( !slider.contains( document.activeElement ) ) {
				if ( !isPaused ) return; // already running
				slideShow = setInterval( slideShowFunc, 5000 );
				isPaused = false;
			}
		}, 50 );
	} );
	// -----------------------------
	// Mouse hover pause/resume
	// -----------------------------
	slider.addEventListener( 'mouseenter', (  ) => {
		clearInterval( slideShow );
		isPaused = true;
	} );
	slider.addEventListener( 'mouseleave', (  ) => {
		if ( !isPaused ) return;
		slideShow = setInterval( slideShowFunc, 5000 );
		isPaused = false;
	} );
	// -----------------------------
	// Clicks and key navigation
	// -----------------------------
	indicators.forEach( ( dot, i ) => {
		dot.addEventListener( 'click', (  ) => changeSlide( i, 'key' ) );
	} );
	arrowLeft.addEventListener( 'click', (  ) =>
		changeSlide( currentIndex - 1, 'key' ),
	);
	arrowRight.addEventListener( 'click', (  ) =>
		changeSlide( currentIndex + 1, 'key' ),
	);
	block.addEventListener( 'keydown', ( e ) => {
		if ( e.key === 'ArrowLeft' ) {
			e.preventDefault(  );
			changeSlide( currentIndex - 1, 'key' );
		}
		if ( e.key === 'ArrowRight' ) {
			e.preventDefault(  );
			changeSlide( currentIndex + 1, 'key' );
		}
	} );

	changeSlide( 0 );

	// Carousel Swipe logic
	let startX = 0;
	let endX = 0;

	slider.addEventListener( 'touchstart', ( e ) => {
		startX = e.touches[0].clientX;
	} );
	slider.addEventListener( 'touchmove', ( e ) => {
		endX = e.touches[0].clientX;
	} );

	slider.addEventListener( 'touchend', (  ) => {
		const diff = startX - endX;
		const threshold = 50;

		if ( Math.abs( diff ) > threshold ) {
			if ( diff > 0 ) {
				changeSlide( currentIndex + 1 );
			} else {
				changeSlide( currentIndex - 1 );
			}
		}

		startX = 0;
		endX = 0;
	} );
}

export default function decorate( block ) {
	const ul = domEl( 'ul', { class: 'carousel-group usa-list--unstyled' } );
	const indicators = domEl( 'ul', {
		class: 'carousel-group__indicator usa-list--unstyled',
	} );
	const arrowContainer = domEl( 'p', { class: 'carousel-arrow__container' } );
	const arrowLeft = domEl( 'p', {
		class: 'usa-button usa-button--outline carousel-arrow__item',
		title: 'arrow back',
	} );
	const arrowRight = domEl( 'p', {
		class: 'usa-button usa-button--outline carousel-arrow__item',
		title: 'arrow right',
	} );

	getIndividualIcon( arrowLeft, 'arrow_back' );
	getIndividualIcon( arrowRight, 'arrow_forward' );

	arrowContainer.append( arrowRight );
	arrowContainer.prepend( arrowLeft );

	[...block.children].forEach( ( row ) => {
		const indicator = domEl( 'li', { class: 'carousel-card__indicator' } );

		const li = domEl( 'li', { class: 'carousel-card' } );
		const cardContainer = domEl( 'div', { class: 'carousel-card__container' } );

		while ( row.firstElementChild ) {
			cardContainer.append( row.firstElementChild );
			li.append( cardContainer );
		}

		generateWholeCard( cardContainer );
		indicators.append( indicator );
		ul.append( li );
	} );

	ul
		.querySelectorAll( 'picture > img' )
		.forEach( ( img ) =>
			img
				.closest( 'picture' )
				.replaceWith( createOptimizedPicture( img.src, img.alt, false ) ),
		);

	block.textContent = '';
	block.append( indicators );
	block.append( ul );
	block.append( arrowContainer );
	showSlide( indicators.children, ul, block );
}
