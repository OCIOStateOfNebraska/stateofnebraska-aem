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
	const button = div?.querySelector( '.usa-button__wrap' );
	const buttonLink = button?.querySelector( 'a' );
	const buttonText = buttonLink?.title;
	const heading = div.querySelector( 'h2, h3, h4, h5, h6' );
	div.className = 'carousel-card__body';
	let meta = '';
	const pTags = div.querySelectorAll( 'p:not(.usa-button__wrap' );
	
	if ( pTags.length > 1 ) {
		meta = domEl( 'span', { class: 'usa-tag' }, div.querySelector( 'p' ).textContent );
		div.querySelector( 'p' ).remove(); // remove meta p tag after we grab it
	}
	
	// take out the fake button and put into its own container
	if ( button ) {
		const fakeButton = domEl( 'p', { class: 'usa-button usa-button--secondary', title: buttonText }, buttonText );
		const buttonWrap = domEl( 'div', { class: 'carousel-card__footer' } );
		buttonWrap.append( fakeButton );
		button.remove();
		container.append( buttonWrap );
		getIndividualIcon( fakeButton, 'arrow_forward' );
	}

	// take out the heading and put into its own container
	if ( heading ) {
		const link = buttonLink?.getAttribute( 'href' );
		heading.classList.add( 'carousel-card__heading' );
		if( link ){
			const cardLink = domEl( 'a', { class: 'carousel-card__link', href: link, 'aria-labelledby': heading.id} );
			heading.append( cardLink );
		}
		const headerWrap = domEl( 'div', { class: 'carousel-card__header',}, meta, heading );
		container.prepend( headerWrap );
	}
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
	const desc = container.querySelector( '.carousel-card__body' );
	const content = domEl( 'div', { class: 'carousel-card__content' }, heading, desc );
	container.append( picture );
	container.append( content );
}

function showSlide( indicator, slider, block ){   
	const arrowLeft = block.querySelector( '[title="arrow back"' );
	const arrowRight = block.querySelector( '[title="arrow right"' );
	const indicators = Array.from( indicator ).reverse();
	const slides = Array.from( slider.children );
	let currentIndex = 0;

	function changeSlide( index ){
		if ( index < 0 ) index = slides.length-1;
		if ( index >= slides.length ) index = 0;
		currentIndex = index;

		indicators.forEach( dot => dot.classList.remove( 'usa-current' ) );
		slides.forEach( dot => dot.classList.remove( 'usa-current' ) );
		indicators[index].classList.add( 'usa-current' );
		slides[index].classList.add( 'usa-current' );
		

		slider.scrollTo( {
			left: slides[index].offsetLeft
		} );        
	}

	arrowLeft.addEventListener( 'click', () => changeSlide( currentIndex-1 ) );
	arrowRight.addEventListener( 'click', () => changeSlide( currentIndex+1 ) );

	indicators.forEach( ( dot, i ) => {
		dot.addEventListener( 'click', () => changeSlide( i ) );
	} );

	changeSlide( 0 );

	// Carousel Swipe logic
	let startX = 0;
	let endX = 0;

	slider.addEventListener( 'touchstart', ( e ) =>{
		startX = e.touches[0].clientX;
	} );
	slider.addEventListener( 'touchmove', ( e ) =>{
		endX = e.touches[0].clientX;
	} );

	slider.addEventListener( 'touchend', () =>{
		const diff = startX - endX;
		const threshold = 50;

		if( Math.abs( diff ) > threshold ) {
			if( diff > 0 ) {
				changeSlide( currentIndex + 1 );
			}
			else{
				changeSlide( currentIndex - 1 );
			}
		}

		startX = 0;
		endX = 0;
	} );
}


export default function decorate( block ) {
	const ul = domEl( 'ul', { class: 'carousel-group usa-list--unstyled' } );
	const indicators = domEl( 'ul', { class: 'carousel-group__indicator usa-list--unstyled' } );
	const arrowContainer = domEl( 'p', { class: 'carousel-arrow__container'} );
	const arrowLeft = domEl( 'p', { class: 'usa-button usa-button--outline carousel-arrow__item', title: 'arrow back' } );
	const arrowRight = domEl( 'p', { class: 'usa-button usa-button--outline carousel-arrow__item', title: 'arrow right' } );



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

	ul.querySelectorAll( 'picture > img' ).forEach( ( img ) => img.closest( 'picture' ).replaceWith( createOptimizedPicture( img.src, img.alt, false, [{ width: '800' }] ) ) );

	block.textContent = '';
	block.append( indicators );
	block.append( ul );
	block.append( arrowContainer );
	showSlide( indicators.children, ul, block ); 

}
