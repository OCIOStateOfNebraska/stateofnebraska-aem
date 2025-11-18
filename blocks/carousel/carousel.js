import { domEl } from '../../scripts/dom-helpers.js';
import { createOptimizedPicture } from '../../scripts/aem.js';
import { getIndividualIcon } from '../../scripts/utils.js';

function generateMedia( div, container ) {
	div.className = 'carousel-card__media';
	const img = container.querySelector( 'picture' );
	if( img !== null ){
		const imgWrapper = domEl( 'div', { class: 'carousel-card__img' }, img );
		div.append( imgWrapper );
	}
}

function generateContent( div, container ) {
	const heading = div.querySelector( 'h2, h3, h4, h5, h6' );
	if ( heading ) {
		const a = heading.querySelector( 'a' );
		if( a.textContent.length > 70 ){
			const text = a.textContent.substring( 0, a.textContent.indexOf( ' ', 60 )  ) + '...' ;
			a.textContent = text;
		}
		heading.classList.add( 'carousel-card__heading' );
		const headerWrap = domEl( 'div', { class: 'carousel-card__header' }, heading );
		container.prepend( headerWrap );
	}
	else{
		container.classList.add( 'images-only' );
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
	if( heading !== null && picture !== null ){		
		const content = domEl( 'div', { class: 'carousel-card__content' }, heading );
		container.append( content );
	}	
	if( picture !== null ){
		container.prepend( picture );
	}
}

function showSlide( indicator, slider, block ) {
	const arrowLeft = block.querySelector( '[title="Previous slide"]' );
	const arrowRight = block.querySelector( '[title="Next slide"]' );
	const indicators = Array.from( indicator );
	const slides = Array.from( slider.children );
	let currentIndex = 0;
	let slideShow = null;
	let isPaused = false;

	function startAutoPlay(){
		stopAutoPlay();
		slideShow = setInterval( slideShowFunc, 5000 );
	}

	function stopAutoPlay(){
		if( slideShow ){
			clearInterval( slideShow );
			slideShow = null;
		}
	}

	// -----------------------------
	// Main slide switch function
	// -----------------------------
	function changeSlide( index, options = {} ) {
		const { focusInside = false } = options;		

		stopAutoPlay();

		if ( index < 0 ) index = slides.length - 1;
		if ( index >= slides.length ) index = 0;
		currentIndex = index;

		indicators.forEach( ( dot, i ) => {
			dot.classList.remove( 'usa-current' ); 
			dot.setAttribute( 'tabindex', i == index ? '0' : '-1' );
			dot.setAttribute( 'aria-selected', i == index ? 'true' : 'false' );
		} );
		slides.forEach( ( slide ,i ) =>{
			slide.classList.remove( 'usa-current' );
			slide.setAttribute( 'aria-selected', 'false' );
			const link = slide.querySelector( 'a' );
			if( !link ) return;

			if( i === index ){
				link.removeAttribute( 'tabindex' );
			}
			else{
				link.setAttribute( 'tabindex', '-1' );
			}
		} );
		
		indicators[index].classList.add( 'usa-current' );
		slides[index].classList.add( 'usa-current' );
		slides[index].setAttribute( 'aria-selected', 'true' );


		slider.scrollTo( {
			left: slides[index].offsetLeft,
			behavior: 'smooth',
		} );

		if( !isPaused && !slideShow ) startAutoPlay();

		//if changed via keyboard, focus inside slide
		if ( focusInside ) {
			const focusable = slides[index].querySelector( 'a' );
			if ( focusable ) setTimeout( (  ) => focusable.focus(  ), 0 );
		}
	}

	// -----------------------------
	// Autoplay loop
	// -----------------------------
	function slideShowFunc(  ) {
		changeSlide( currentIndex + 1 );
	}

	// -----------------------------
	// pause/resume Button
	// -----------------------------
	const pauseButton = block.querySelector( '.carousel-toggle' );

	pauseButton.addEventListener( 'click', () => {
		pauseButton.innerHTML = '';
		if( isPaused ){
			isPaused = false;
			slideShow = setInterval( slideShowFunc, 5000 );
			pauseButton.setAttribute( 'aria-label', 'Pause carousel' );
			pauseButton.setAttribute( 'aria-pressed', 'false' );
			pauseButton.title = 'Pause';
			getIndividualIcon( pauseButton, 'pause' );
		}
		else{
			isPaused = true;
			clearInterval( slideShow );
			pauseButton.setAttribute( 'aria-label', 'Play carousel' );
			pauseButton.setAttribute( 'aria-pressed', 'true' );
			pauseButton.title = 'Play';
			getIndividualIcon( pauseButton, 'play' );
		}
	} );
	
	// -----------------------------
	// Focus handling pause/resume
	// -----------------------------
	block.addEventListener( 'focusin', ( e ) => {
		setTimeout( (  ) => {
			const target = e.target;

			if ( target.matches( '.carousel-toggle' ) ||
			target.matches( '.carousel-card__indicator' ) ||
			target.matches( '.carousel-controls__item' ) ||
			target.matches( '.carousel-card a' ) )
			{
				stopAutoPlay();
			}
		}, 50 );
	} );
	block.addEventListener( 'focusout', (  ) => {
		// use timeout to wait until new focus target is set
		setTimeout( (  ) => {
			const active = document.activeElement;
			if ( !block.contains( active )  && !isPaused ) startAutoPlay();
		}, 50 );
	} );

	// -----------------------------
	// Mouse hover pause/resume
	// -----------------------------
	slider.addEventListener( 'mouseenter', (  ) => stopAutoPlay() );
	slider.addEventListener( 'mouseleave', (  ) => {
		if ( !isPaused )  startAutoPlay();
	} );

	// -----------------------------
	// Clicks and key navigation
	// -----------------------------
	function handleArrowKeysOnTabs( e ) {
		if( e.key === 'ArrowLeft' ){
			e.preventDefault();
			changeSlide( currentIndex - 1 );
			indicators[currentIndex].focus();
		}
		if( e.key === 'ArrowRight' ){
			e.preventDefault();
			changeSlide( currentIndex + 1 );
			indicators[currentIndex].focus();
		}
	}

	indicators.forEach( ( dot, i ) => {
		dot.addEventListener( 'click', (  ) => changeSlide( i ) );
		dot.addEventListener( 'keydown', handleArrowKeysOnTabs );
	} );

	arrowLeft.addEventListener( 'keydown', ( e ) =>{
		if( e.key === 'Enter' || e.key === ' ' ){
			changeSlide( currentIndex - 1 );
			indicators[currentIndex].focus();
		}
	} );
	arrowLeft.addEventListener( 'click', () => changeSlide( currentIndex - 1 ) );

	arrowRight.addEventListener( 'click', () => changeSlide( currentIndex + 1 ) );
	arrowRight.addEventListener( 'keydown',  ( e ) =>{
		if( e.key === 'Enter' || e.key === ' ' ){
			changeSlide( currentIndex + 1 );
			indicators[currentIndex].focus();
		}
	} );

	changeSlide( 0 );
	startAutoPlay();

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
		role:'tablist'
	} );
	indicators.setAttribute( 'aria-label', 'Slide navigation' );

	const arrowContainer = domEl( 'p', { class: 'carousel-controls__container' } );
	const arrowLeft = domEl( 'button', {
		class: 'usa-button usa-button--outline carousel-controls__item',
		title: 'Previous slide'
	} );
	arrowLeft.setAttribute( 'aria-label', 'Previous slide' );

	const pauseBtn = domEl( 'button', {
		class: 'usa-button usa-button--outline carousel-controls__item carousel-toggle',
		title: 'Pause',
	} );

	pauseBtn.setAttribute( 'aria-label', 'Pause carousel' );
	pauseBtn.setAttribute( 'aria-pressed', 'false' );
	
	const arrowRight = domEl( 'button', {
		class: 'usa-button usa-button--outline carousel-controls__item',
		title: 'Next slide'
	} );
	arrowRight.setAttribute( 'aria-label', 'Next slide' );

	getIndividualIcon( arrowLeft, 'navigate_before' );
	getIndividualIcon( pauseBtn, 'pause' );
	getIndividualIcon( arrowRight, 'navigate_next' );

	arrowContainer.append( pauseBtn );
	arrowContainer.append( arrowRight );
	arrowContainer.prepend( arrowLeft );

	// checks if row contains image
	const validRows = [...block.children].filter( row =>row = row.querySelector( 'picture' ) );

	validRows.forEach( ( row ) => {	
		const indicator = domEl( 'li', {
			class: 'carousel-card__indicator',
			role: 'tab',
			tabindex: '0'
		} );
		indicator.setAttribute( 'aria-controls', `carousel-slide-${indicators.children.length + 1}` );
		indicator.setAttribute( 'aria-label', `Slide indicator ${indicators.children.length + 1} of ${validRows.length}` );
		
		
		const li = domEl( 'li', { 
			class: 'carousel-card',
			role: 'group',
			id: `carousel-slide-${indicators.children.length + 1}`
		} );
		li.setAttribute( 'aria-roledescription', 'slide' );
		li.setAttribute( 'aria-label', `Slide ${indicators.children.length + 1} of ${validRows.length}` );

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

	block.setAttribute( 'role', 'region' );
	block.setAttribute( 'aria-roledescription', 'carousel' );
	block.setAttribute( 'aria-label', 'Carousel' );

	block.textContent = '';
	block.append( indicators );
	block.append( arrowContainer );
	block.append( ul );
	showSlide( indicators.children, ul, block );
}
