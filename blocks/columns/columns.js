import { domEl } from '../../scripts/dom-helpers.js';


export default function decorate( block ) {
	const mainRow = domEl( 'div', {class: 'grid-row grid-gap'} );

	// // setup image columns
	[...block.children].forEach( ( row ) => {
		[...row.children].forEach( ( col ) => {
			col.classList.add( 'grid-col-12', 'desktop:grid-col-6' );
			mainRow.append( col );
		} );
	} );
	
	block.innerText = '';
	block.append( mainRow );
}
