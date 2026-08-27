import { div, ul, li } from '../../scripts/dom-helpers.js';
import { isFullWidthTemplate } from '../../scripts/utils.js';
import { getMetadata } from '../../scripts/aem.js';


export default function decorate( block ) {
	
	const fullWidth = isFullWidthTemplate( getMetadata );

	let grid = 12;

	const divArray = [...block.children];

	if ( fullWidth ) {
		[...block.children].forEach( ( row ) => {
			const cols = [...row.children];

			if ( cols.length >= 2 ) {
				grid = 6;
			}
		} );
	}


	const containerArray = divArray.map( ( row ) => { 
		return [...row.children].map( ( item ) => {
			const heading = item.querySelector( 'h2, h3, h4, h5, h6' ).textContent;
			const bodyText = item.querySelector( 'p' ).textContent;
			return li( { class: `usa-card grid-col-12 tablet:grid-col-12 desktop:grid-col-${grid}` }, 
				div( { class: 'usa-card__container' }, 
					div( { class: 'usa-card__header' }, heading ), 
					div( { class: 'usa-card__body' }, bodyText ) ) );
		} ); } );
	console.log( containerArray );
	const ulElement = ul( { class: 'usa-card-group grid-row' }, ...containerArray.flat() );
	block.innerHTML = '';
	block.append( ulElement );

}

