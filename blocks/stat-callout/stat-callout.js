import { div, ul, li } from '../../scripts/dom-helpers.js';



export default function decorate( block ) {
	
	let grid = 'grid-col-12 tablet:grid-col-12 desktop:grid-col-12';

	const divArray = [...block.children];

	const containerArray = divArray.map( ( item ) => {
		const heading = item.querySelector( 'h2, h3, h4, h5, h6' ).textContent;
		const bodyText = item.querySelector( 'p' ).textContent;
		return li( { class: `usa-card ${grid}` }, 
			div( { class: 'usa-card__container' }, 
				div( { class: 'usa-card__header' }, heading ), 
				div( { class: 'usa-card__body' }, bodyText ) ) );
	} );

	const ulElement = ul( { class: 'usa-card-group grid-row' }, ...containerArray );
	block.innerHTML = '';
	block.append( ulElement );

}

