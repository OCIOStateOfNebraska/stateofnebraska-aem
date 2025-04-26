import { div } from '../../scripts/dom-helpers.js';
import { removeEmptyChildren } from '../../scripts/utils.js';

export default function decorate( block ) {
	block.classList.add( 'usa-hero' );
	const content = div( { class: 'usa-hero__callout' } );
	const container = div( { class: 'grid-container' }, content );
	
	const backgroundImg = block.querySelector( 'picture' );

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
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1727 86.298" preserveAspectRatio="none">
			<path class="usa-hero__svg-back" d="M1727 64.146c-295.4 32.475-530.69 19.402-695.6 0C807.283 37.782 675.19-4.221 479.723 25.283c-40.637 6.131-147.045 24.889-295.829 30.178-78.055 2.773-142.128.941-183.894-1.04V87.01l1727 .952V64.137v.01Z"/>
			<path class="usa-hero__svg-mid" d="M0 72.109c107.878 2.852 275.051 3.773 479.723-10.3C801.636 39.683 922.646.661 1159.33.008c133.62-.357 328.71 11.439 567.67 72.101v14.9H0v-14.9Z"/>
			<path class="usa-hero__svg-fore" d="M0 87.009h1727V51.508c-99-10.815-245.72-22.601-423.75-20.6-230.38 2.595-376.166 26.751-519.703 41.201C597.654 90.818 332.528 94.195 0 54.42v32.589Z"/>
		</svg>
	`;
	const svgDiv = div( { class: 'usa-hero__svg' } );
	svgDiv.innerHTML = svg;
	
	block.innerText = '';
	block.appendChild( container );
	if( backgroundImg ) { container.before( backgroundImg ); }
	block.appendChild( svgDiv );

	block.querySelectorAll( 'p' ).forEach( el => {
		removeEmptyChildren( el ); // remove any empty p tags that are left over 
	} );
}
