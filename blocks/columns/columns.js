import { domEl } from '../../scripts/dom-helpers.js';


export default function decorate( block ) {
	// append to one main Row just in case they author the wrong number of columns. This way we don't have any gaps 
	const mainRow = domEl( 'div', {class: 'grid-row grid-gap'} );

	[...block.children].forEach( ( row ) => {
		[...row.children].forEach( ( col ) => {
			col.classList.add( 'grid-col-12', 'desktop:grid-col-6' );
			mainRow.append( col );
		} );
	} );
	
	block.innerText = '';
	block.append( mainRow );
}
