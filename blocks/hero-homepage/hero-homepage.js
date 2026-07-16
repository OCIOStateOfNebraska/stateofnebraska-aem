import { div, button } from '../../scripts/dom-helpers.js';
import { removeEmptyChildren, getIndividualIcon } from '../../scripts/utils.js';

export default function decorate( block ) {
	block.classList.add( 'usa-hero' );
	const content = div( { class: 'usa-hero__callout' } );
	const container = div( { class: 'grid-container' }, content );
	
	const backgroundImg = block.querySelector( 'picture' );
	const video = block.querySelector( 'video' );
	let videoBlock = null;
	
	if( !backgroundImg && video ) {
		const reducedMotionMq = window.matchMedia( '(prefers-reduced-motion: reduce)' );
		if( reducedMotionMq.matches ){
			video.pause();
		}
		const playButton = button( { class: 'usa-hero__control usa-button usa-button--secondary usa-link', 
			title: 'Pause',  
			'aria-label': 'Pause video',  
			'aria-pressed': false }, 
			'' );
		getIndividualIcon( playButton, 'pause' );
		videoBlock = div( { class: 'usa-hero__video' }, video, playButton );
		
			let userPaused = false;
		let pausedByInteraction = false;

		function updateButtonState( isPaused ) {
			playButton.innerHTML = '';

			if ( isPaused ) {
				playButton.setAttribute( 'title', 'Play' );
				playButton.setAttribute( 'aria-label', 'Play video' );
				playButton.setAttribute( 'aria-pressed', 'true' );
				getIndividualIcon( playButton, 'play' );
			} else {
				playButton.setAttribute( 'title', 'Pause' );
				playButton.setAttribute( 'aria-label', 'Pause video' );
				playButton.setAttribute( 'aria-pressed', 'false' );
				getIndividualIcon( playButton, 'pause' );
			}
		}

		function pauseForInteraction() {
			if ( reducedMotionMq.matches || video.paused ) {
				return;
			}

			pausedByInteraction = true;
			video.pause();
			updateButtonState( true );
		}

		function resumeAfterInteraction() {
			if (
				reducedMotionMq.matches
				|| userPaused
				|| !pausedByInteraction
			) {
				return;
			}

			pausedByInteraction = false;

			video.play().catch( () => {
				updateButtonState( true );
			} );

			updateButtonState( false );
		}

		playButton.addEventListener( 'click', () => {
			if ( video.paused ) {
				userPaused = false;
				pausedByInteraction = false;

				video.play().catch( () => {
					updateButtonState( true );
				} );

				updateButtonState( false );
			} else {
				userPaused = true;
				pausedByInteraction = false;
				video.pause();
				updateButtonState( true );
			}
		} );

		block.addEventListener( 'focusin', pauseForInteraction );

		block.addEventListener( 'focusout', ( event ) => {
			if ( block.contains( event.relatedTarget ) ) {
				return;
			}

			resumeAfterInteraction();
		} );

		block.addEventListener( 'mouseenter', pauseForInteraction );
		block.addEventListener( 'mouseleave', resumeAfterInteraction );

		if ( reducedMotionMq.matches ) {
			userPaused = true;
			video.pause();
			updateButtonState( true );
		} else {
			video.play()
			.then( () => {
				updateButtonState( false );
			} )
			.catch( () => {
				updateButtonState( true );
			} );
		}
	}	

	const h1 = block.querySelector( 'h1' );
	h1.classList.add( 'usa-hero__heading' );
	content.appendChild( h1 );


	// extract buttons first because they are themselves / contained in p tags
	const buttons = block.querySelectorAll( '.usa-button__wrap' );
	if( buttons.length ) {

		buttons.forEach( ( btn ) => { 
			btn.querySelector( 'a' ).classList.add( 'usa-button--big', 'usa-button--inverse' );
		} );

		const btnContainer = div( { class: 'usa-hero__btns' }, ...buttons );
		content.appendChild( btnContainer );
	}

	const desc = block.querySelectorAll( 'p, ul, ol' );
	if( desc.length ) {
		const descContainer = div( { class: 'usa-hero__desc' }, ...desc );
		h1.after( descContainer );
	}

	const svg = `
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1728 103" preserveAspectRatio="none">
			<path class="usa-hero__svg-back" d="M1728,103.5H0v-16c214.8-7.6,389.7-21.8,511.9-33.7,203.4-19.7,272.2-34.2,428.8-35,122.8-.6,172.5,7.8,379.1,19.9,176.1,10.3,318.3,14.6,408,16.7v48h.2Z"/>
			<path class="usa-hero__svg-mid" d="M1728,103.5v-8.5c-127.2-15.2-316.6-32.5-552-34.1-99.6-.7-106.1,2.1-184,0C707.5,53,605.9,10.3,408.1,1.1,312.2-3.3,172.5-.8,0,35.3v68.2h1728Z"/>
		</svg>
	`;
	const svgDiv = div( { class: 'usa-hero__svg', 'aria-hidden': true } );
	svgDiv.innerHTML = svg;
	
	block.innerText = '';
	block.appendChild( container );
	if( backgroundImg ) { container.before( backgroundImg ); }
	if ( videoBlock ) { container.before( videoBlock ); }
	block.appendChild( svgDiv );

	block.querySelectorAll( 'p' ).forEach( el => {
		removeEmptyChildren( el ); // remove any empty p tags that are left over 
	} );
}
