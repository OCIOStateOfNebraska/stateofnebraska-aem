import { getMetadata, decorateBlock, loadBlock, buildBlock } from '../../scripts/aem.js';
import { div, button } from '../../scripts/dom-helpers.js';
import { getIndividualIcon } from '../../scripts/utils.js';

function buildBreadcrumbBlock( breadcrumbContainer ) {
	const hideBreadcrumbVal = getMetadata( 'hide-breadcrumb' ) || 'no';
	const hideBreadcrumb = hideBreadcrumbVal.toLowerCase() === 'yes' || hideBreadcrumbVal.toLowerCase() === 'true';
	if ( !hideBreadcrumb && window.location.pathname !== '/' && window.isErrorPage !== true ) {
		const section = document.createElement( 'div' );
		const breadcrumbs = buildBlock( 'breadcrumb', { elems: [] } );
		section.append( breadcrumbs );
		decorateBlock( breadcrumbs );
		loadBlock( breadcrumbs );
		breadcrumbContainer.prepend( breadcrumbs );
	}
}

let userPaused = false;
let pausedByInteraction = false;
const reducedMotionMq = window.matchMedia( '(prefers-reduced-motion: reduce)' );

/**
 * Update all attributes and icon on pause/play button 
 * @param {Boolean} isPaused if video was paused
 */
export function updateButtonState( isPaused, playButton ) {
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

export function pauseForInteraction( video, playButton ) {
	if ( reducedMotionMq.matches || video.paused ) {
		return;
	}
	
	pausedByInteraction = true;
	video.pause();
	updateButtonState( true, playButton );
}

export function resumeAfterInteraction( video, playButton ) {
	if (
		reducedMotionMq.matches
		|| userPaused
		|| !pausedByInteraction
	) {
		return;
	}
	
	pausedByInteraction = false;

	video.play().catch( () => {
		updateButtonState( true, playButton );
	} );

	updateButtonState( false, playButton );
}

export default function decorate( block ) {
	block.classList.add( 'usa-hero' );
	const container = div( { class: 'grid-container' } );
	const content = div( { class: 'usa-hero__callout' } );

	container.appendChild( content );
	buildBreadcrumbBlock( content );

	const backgroundImg = block.querySelector( 'picture' );
	const video = block.querySelector( 'video' );
	let videoBlock = null;
	
	if( !backgroundImg && video ) {

		video.muted = true;
		const playButton = button( { class: 'usa-hero__control usa-button usa-button--secondary usa-link', 
			title: 'Pause',  
			'aria-label': 'Pause video',  
			'aria-pressed': false }, 
		'' );
		getIndividualIcon( playButton, 'pause' );
		videoBlock = div( { class: 'usa-hero__video' }, video, playButton );

		playButton.addEventListener( 'click', () => {
			if ( video.paused ) {
				userPaused = false;
				pausedByInteraction = false;

				video.play().catch( () => {
					updateButtonState( true, playButton );
				} );

				updateButtonState( false, playButton );
			} else {
				userPaused = true;
				pausedByInteraction = false;
				video.pause();
				updateButtonState( true, playButton );
			}
		} );

		block.addEventListener( 'focusin', () => pauseForInteraction( video, playButton ) );

		block.addEventListener( 'focusout', ( event ) => {
			if ( block.contains( event.relatedTarget ) ) {
				return;
			}

			resumeAfterInteraction( video, playButton );
		} );

		block.addEventListener( 'mouseenter', () => pauseForInteraction( video, playButton ) );
		block.addEventListener( 'mouseleave', () => resumeAfterInteraction( video, playButton ) );
	}	

	const h1 = block.querySelector( 'h1' );
	if ( h1 ) {
		h1.classList.add( 'usa-hero__heading' );
		content.appendChild( h1 );
	}

	const svg = `
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1727 86" preserveAspectRatio="none">
			<path class="usa-hero__svg-back" d="M1727,64c-295.4,32.5-530.7,19.4-695.6,0C807.3,37.6,675.2-4.4,479.7,25.1c-40.6,6.1-147,24.9-295.8,30.2C105.8,58.1,41.8,56.3,0,54.3v32.6l1727,1v-23.8h0s0,0,0,0Z"/>
			<path class="usa-hero__svg-mid" d="M0,72c107.9,2.9,275.1,3.8,479.7-10.3C801.6,39.5,922.6.5,1159.3-.1c133.6-.4,328.7,11.4,567.7,72.1v14.9H0v-14.9Z"/>
		</svg>
	`;
	const svgDiv = div( { class: 'usa-hero__svg', 'aria-hidden': true } );
	svgDiv.innerHTML = svg;

	block.innerText = '';
	block.appendChild( container );
	if ( backgroundImg ) { container.before( backgroundImg ); }
	if ( videoBlock ) {
		container.before( videoBlock );
		if ( reducedMotionMq.matches ) {
			video.pause();
		} else {
			video.play();
		}
	}
	block.appendChild( svgDiv );
}
