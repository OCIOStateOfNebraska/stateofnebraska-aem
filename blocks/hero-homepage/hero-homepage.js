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
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1728 103" preserveAspectRatio="none">
			<path class="usa-hero__svg-back" d="M1728,103.5H0v-16c214.8-7.6,389.7-21.8,511.9-33.7,203.4-19.7,272.2-34.2,428.8-35,122.8-.6,172.5,7.8,379.1,19.9,176.1,10.3,318.3,14.6,408,16.7v48h.2Z"/>
			<path class="usa-hero__svg-mid" d="M1728,103.5v-8.5c-127.2-15.2-316.6-32.5-552-34.1-99.6-.7-106.1,2.1-184,0C707.5,53,605.9,10.3,408.1,1.1,312.2-3.3,172.5-.8,0,35.3v68.2h1728Z"/>
			<path class="usa-hero__svg-fore" d="M1728,79.5v24H0v-32c142-17,257.6-18,336-16,201.7,5.2,280.5,34,480,32,123.8-1.3,162.3-13.4,288-24,144.9-12.2,356.2-18.3,624,16Z"/>
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
