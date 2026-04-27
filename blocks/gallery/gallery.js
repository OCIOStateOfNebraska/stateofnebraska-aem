import {
	button, div, img, figcaption, figure, p
} from '../../scripts/dom-helpers.js';
import { getIndividualIcon } from '../../scripts/utils.js';

function createModal( images, index ) {
	const modal = div(
		{ class: 'gallery__modal-overlay' },
		div(
			{ 
				class: 'gallery__modal-content',
				role: 'dialog',
				['aria-modal']: true,
				['aria-label']: 'Image viewer',
				['aria-describedby']: 'fig' + index
			},
			div(
				{ class: 'modal-controls' },
				button( { class: 'usa-button usa-button--outline', id: 'close-button', ['aria-label']:'Close image' } ),
			),
			figure(
				{ class: 'image-container', 'aria-describedby': 'fig' + index},
				img( { src: images[index]['image'].src, alt: images[index]['image'].alt } ),
				images[index].caption? figcaption(
					{ class: 'modal-caption', id: 'fig' + index },
					images[index].caption + ' ',
				): '',
				images[index].link ? images[index].link: ''
			),
		),
	);

	const closeButton = modal.querySelector( '#close-button' );
	getIndividualIcon( closeButton, 'close' );
	
	closeButton.addEventListener( 'click', () => {
		modal.remove();
		images[index].button.focus();
	} );

	modal.addEventListener( 'keydown', ( e ) => {
		if( e.key === 'Escape' ){
			modal.remove();
			images[index].button.focus();
		}
	} );
	
	document.body.appendChild( modal );
	closeButton.focus();
}

export default function decorate( block ) {
	const images = [];
	[...block.children].forEach( ( row ) => {
		const image = row.querySelector( 'img' );
		const caption = row.querySelector( 'p:not(:has(.usa-button))' );
		const link = row.querySelector( 'a' );
		link?.classList.add( 'usa-button--secondary' );

		const imageObj ={
			'image': image,
			'caption': caption?.textContent,
			'link': link,
		};
		images.push( imageObj );
	} );
	
	const galleryGrid = div( { class: 'gallery__grid' } );

	const missingAlts = [];
	
	images.forEach( ( imgEl, index ) => {

		if( imgEl.image.alt == '' ){
			missingAlts.push( index+1 );
		}
		else{
			const galleryItem = button( { 
				class: 'gallery__item',
				['aria-label']: `Open image ${index + 1} of ${images.length}`
			}, 
			imgEl['image'].cloneNode( true ),
			div( { class: 'hover-circle' , ['aria-hidden']: true } ),	
			);

			galleryItem.querySelector( 'a' )?.classList.add( 'hidden' );
			galleryGrid.appendChild( galleryItem );
			imgEl['button'] = galleryItem;

			galleryItem.addEventListener( 'click', () => {
				createModal( images, index );
			} );
		}
	} );

	block.textContent = '';
	
	if( missingAlts.length > 0 ){
		const alert = div( 
			{ class: 'usa-alert usa-alert--error usa-alert--no-heading' },
			div( { class: 'usa-alert__body' },
				p( { class: 'usa-alert__text' },
					missingAlts.length == 1?
						`Image number ${missingAlts.toString()} doesn't have an alt text`:
						'Following images don\'t have an alt text: ' + missingAlts.toString()
				)
			)
		);
		block.prepend( alert );
	}

	block.appendChild( galleryGrid );
}