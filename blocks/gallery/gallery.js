import { domEl } from '../../scripts/dom-helpers.js';
import {  getIndividualIcon } from '../../scripts/utils.js';

function showcasePicture( e, modal, thumbnailContainer){
	modal.classList.remove('hidden');
	const figure =  modal.querySelector( 'figure' );
	if(	figure ){
		thumbnailContainer.append( figure );
	}
	modal.prepend( e.currentTarget );
	e.currentTarget.focus();
	// rows.forEach( row => row.classList.remove( 'showcased' ) );
	// item.classList.add( 'showcased' );
	
	// const img = item.querySelector( 'img' );
	// console.log(img.getAttribute('width'))	
}


export default function decorate( block ) {
	const rows = Array.from( block.children );
	const thumbnailContainer = domEl( 'div', { class: 'thumbnail__container' }); 

	const modal = domEl( 'div', { class: 'gallery__modal hidden', role: 'dialog', ['aria-modal']: true, ['aria-labelledby']: 'gallery-caption' } ); 
	const modalButton  = domEl( 'button', { class: 'usa-button usa-button--outline', ['aria-label']:'Close image'} );
	// getIndividualIcon( modalButton, 'expand_more' );
	modalButton.addEventListener( 'click', () => modal.classList.add( 'hidden' ) )
	modalButton.textContent = 'Hide Image';

	rows.forEach( row => {
		let count = 1; 
		// row.classList.add( 'gallery__item' );
		const figure = domEl( 'figure', { class: 'gallery__media' } );    
		const button  = domEl( 'button', { class: 'gallery__thumbnail' } );    
		figure.addEventListener( 'click', (e) => showcasePicture(e, modal, thumbnailContainer) );

		const img = row.querySelector( 'picture' );
		const caption = row.querySelector( 'p' );
		const link = row.querySelector( 'a' );

		button.append( img );
		figure.append( button );

		const width = Number( figure.querySelector( 'img' )?.getAttribute( 'width' ) );
		const height = Number( figure.querySelector( 'img' )?.getAttribute( 'height' ) );

		// console.log(width)
		// console.log(height)	

		// if( width > height ){
		// 	row.classList.add( 'horizontal' );

		// }
		// if( width == height ){
		// 	row.classList.add( 'square' );

		// }
		// else {
		// 	row.classList.add( 'portrait' );
		// }
		
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

		thumbnailContainer.append( figure );
		
		if( link ){
			link.classList.add( 'gallery__link' );
			thumbnailContainer.append( link );
		}
		
		const divs = Array.from( row.querySelectorAll( 'div' ) );
		divs.forEach( div => div.remove() );	

		row.remove()
		
	} );
	
	


	modal.append( modalButton );
	block.append( modal );
	block.append( thumbnailContainer );
}