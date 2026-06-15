import { domEl, div, a, h3 } from '../../scripts/dom-helpers.js';
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
	const preferesReducedMotion = window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
	const arrowLeft = block.querySelector( '[title="Previous slide"]' );
	const arrowRight = block.querySelector( '[title="Next slide"]' );
	const indicators = Array.from( indicator );
	const slides = Array.from( slider.children );
	let currentIndex = 0;
	let slideShow = null;
	let isPaused = preferesReducedMotion;

	function shouldResumeAutoPlay() {
		return !isPaused && !block.contains( document.activeElement );
	}

	function startAutoPlay(){
		if ( preferesReducedMotion ) return;
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
		const { focusInside = false,  announce = false } = options;		

		stopAutoPlay();
		
		if ( index < 0 ) index = slides.length - 1;
		if ( index >= slides.length ) index = 0;
		currentIndex = index;

		indicators.forEach( ( dot, i ) => {
			const isActive = i === index;
			dot.classList.toggle( 'usa-current', isActive ); 
			dot.setAttribute( 'tabindex', isActive ? '0' : '-1' );
			dot.setAttribute( 'aria-current', isActive ? 'true' : 'false' );
		} );
		slides.forEach( ( slide ,i ) =>{
			const isActive = i === index;
			slide.classList.toggle( 'usa-current', isActive );
			
			if( isActive ){
				slide.removeAttribute( 'aria-hidden' );
				slide.removeAttribute( 'inert' );				
			}
			else{
				slide.setAttribute( 'aria-hidden', 'true' );
				slide.setAttribute( 'inert', '' );	
			}
			
			const link = slide.querySelector( 'a' );
			if( !link ) return;

			if( i === index ){
				link.removeAttribute( 'tabindex' );
			}
			else{
				link.setAttribute( 'tabindex', '-1' );
			}
		} );
		
		slider.scrollTo( {
			left: slides[index].offsetLeft,
			behavior: 'smooth',
		} );

		if ( announce ) {			
			const liveRegion = block.querySelector( '.carousel-live-region' );
			
			if ( liveRegion ) {
				const heading = slides[index].querySelector( '.carousel-card__heading' );
				const title = heading?.textContent?.trim() || slides[index]?.querySelector( 'img' )?.alt || `Slide ${index + 1}`;
				liveRegion.textContent = `${title}, slide ${index + 1} of ${slides.length}`;
			}
		}

		if( shouldResumeAutoPlay() && !slideShow ) startAutoPlay();

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
		changeSlide( currentIndex + 1, { announce: false } );
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
	block.addEventListener( 'focusin', () => {
		stopAutoPlay();
	} );

	block.addEventListener( 'focusout', ( e ) => {
		if ( !block.contains( e.relatedTarget ) && !isPaused ) {
			startAutoPlay();
		}
	} );

	// -----------------------------
	// Mouse hover pause/resume
	// -----------------------------
	block.addEventListener( 'mouseenter', stopAutoPlay );

	block.addEventListener( 'mouseleave', () => {
		if ( !isPaused && !block.contains( document.activeElement ) ) {
			startAutoPlay();
		}
	} );

	// -----------------------------
	// Clicks and key navigation
	// -----------------------------
	function handleArrowKeysOnTabs( e ) {
		if( e.key === 'ArrowLeft' ){
			e.preventDefault();
			changeSlide( currentIndex - 1, { announce: true } );
			indicators[currentIndex].focus();
		}
		if( e.key === 'ArrowRight' ){
			e.preventDefault();
			changeSlide( currentIndex + 1,  { announce: true } );
			indicators[currentIndex].focus();
		}
	}

	indicators.forEach( ( dot, i ) => {
		dot.addEventListener( 'click', (  ) => changeSlide( i,  { announce: true } ) );
		dot.addEventListener( 'keydown', handleArrowKeysOnTabs );
	} );

	arrowLeft.addEventListener( 'keydown', ( e ) =>{
		if( e.key === 'Enter' || e.key === ' ' ){
			changeSlide( currentIndex - 1,  { announce: true } );
			indicators[currentIndex].focus();
		}
	} );
	arrowLeft.addEventListener( 'click', () => changeSlide( currentIndex - 1,  { announce: true } ) );

	arrowRight.addEventListener( 'click', () => changeSlide( currentIndex + 1,  { announce: true } ) );
	arrowRight.addEventListener( 'keydown',  ( e ) =>{
		if( e.key === 'Enter' || e.key === ' ' ){
			changeSlide( currentIndex + 1,  { announce: true } );
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

/**
* Takes override data and creates populated element that is the same as manual entries. This is critical for formatting.
* @param {object} overrideRow - The `overrideRow` is a filtered object returned from search-index.json.
*/
function buildWithOverrideData( overrideRow ) {
	const image = overrideRow.image;
	const alt = overrideRow.imageAlt;
	
	if( !image  || !alt ){
		return null;
	}
	
	const row = div( {},
		div( {}, createOptimizedPicture( image, alt || '', false ) ),
		div( {}, 
			h3( {},
				a( { href: overrideRow.path }, overrideRow.title )
			)
		)
	);
	return row;
}

export default function decorate( block, override=[] ) {
	let rows;
	
	if ( override.length ) {
		rows = override.map( buildWithOverrideData );
	} else {
		rows = [...block.children];
	}


	const carouselGroup = domEl( 'div', { class: 'carousel-group' } );
	const indicators = domEl( 'div', {
		class: 'carousel-group__indicator usa-list--unstyled',
		'aria-label': 'Slide navigation' 
	} );

	const arrowContainer = domEl( 'div', { class: 'carousel-controls__container' } );
	const arrowLeft = domEl( 'button', {
		class: 'usa-button usa-button--outline carousel-controls__item',
		title: 'Previous slide',
		'aria-label' : 'Previous slide'
	} );

	const pauseBtn = domEl( 'button', {
		class: 'usa-button usa-button--outline carousel-controls__item carousel-toggle',
		title: 'Pause',
		'aria-label': 'Pause carousel',
		'aria-pressed': 'false'
	} );

	const arrowRight = domEl( 'button', {
		class: 'usa-button usa-button--outline carousel-controls__item',
		title: 'Next slide',
		'aria-label': 'Next slide' 
	} );

	getIndividualIcon( arrowLeft, 'navigate_before' );
	getIndividualIcon( pauseBtn, 'pause' );
	getIndividualIcon( arrowRight, 'navigate_next' );

	arrowContainer.append( pauseBtn );
	arrowContainer.append( arrowRight );
	arrowContainer.prepend( arrowLeft );

	// checks if row contains image
	if( !rows ) {
		return;
	}
	
	const validRows = rows.filter( row =>row = row.querySelector( 'picture' ) );
	const carouselId = `carousel-${crypto.randomUUID()}`;
		
	validRows.forEach( ( row ) => {	
		const indicator = domEl( 'button', {
			class: 'carousel-card__indicator',
			tabindex: '0',			
			'aria-label': `Slide indicator ${indicators.children.length + 1} of ${validRows.length}`
		} );
		
		const carouselCard = domEl( 'div', { 
			class: 'carousel-card',
			role: 'group',
			id: `${carouselId}-slide-${indicators.children.length + 1}`,
			'aria-roledescription': 'slide',
			'aria-label': `Slide ${indicators.children.length + 1} of ${validRows.length}`
		} );
		
		const cardContainer = domEl( 'div', { class: 'carousel-card__container' } );
		
		while ( row.firstElementChild ) {
			cardContainer.append( row.firstElementChild );
			carouselCard.append( cardContainer );
		}
		
		generateWholeCard( cardContainer );
		indicators.append( indicator );
		carouselGroup.append( carouselCard );
	} );

	carouselGroup
		.querySelectorAll( 'picture > img' )
		.forEach( ( img ) =>
			img
				.closest( 'picture' )
				.replaceWith( createOptimizedPicture( img.src, img.alt, false ) ),
		);

	const liveRegion = domEl( 'div', {
		class: 'usa-sr-only carousel-live-region',
		'aria-live': 'polite',
		'aria-atomic': 'true',
	} );

	
	block.setAttribute( 'role', 'region' );
	block.setAttribute( 'aria-roledescription', 'carousel' );
	block.setAttribute( 'aria-label', 'Featured content' );
	
	block.textContent = '';
	block.append( liveRegion );
	block.append( indicators );
	block.append( arrowContainer );
	block.append( carouselGroup );
	showSlide( indicators.children, carouselGroup, block );
}
