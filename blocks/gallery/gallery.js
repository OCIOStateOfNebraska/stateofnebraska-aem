import { domEl } from '../../scripts/dom-helpers.js';

export default function decorate( block ) {
	const rows = Array.from( block.children );
	rows.forEach( row => {
		let count = 1; 
		row.classList.add( 'gallery__item' );
		const figure = domEl( 'figure', { class: 'gallery__media' } );    
		const img = row.querySelector( 'picture' );
		const caption = row.querySelector( 'p' );
		const link = row.querySelector( 'a' );

		figure.append( img );
		
		if( caption ){
			const figcaption = document.createElement( 'figcaption' );        
			figcaption.textContent = caption.textContent;
			figure.append( figcaption );

			const label = 'fig' + count;
			figure.role = 'group';
			figure.setAttribute( 'aria-labelledby', label );
			figcaption.id = label;
			
			count ++;
		}

		row.append( figure );
		
		if( link ){
			link.classList.add( 'gallery__link' );
			row.append( link );
		}
		
		const divs = Array.from( row.querySelectorAll( 'div' ) );
		divs.forEach( div => div.remove() );			
	} );
}