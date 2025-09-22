import { domEl } from '../../scripts/dom-helpers.js';


export default function decorate( block ) {
	// append to one main Row just in case they author the wrong number of columns. This way we don't have any gaps 

	let colSize = [];
	[...block.classList].forEach( item => {
		if( item.includes( 'layout' ) ){
			colSize = item.replace( 'layout-', '' ).split( '-' );
		}
	} );
	const mainRow = domEl( 'div', {class: 'columns__grid-row grid-row grid-gap'} );

	[...block.children].forEach( ( row ) => {
		const rowLength = row.children.length;
		[...row.children].forEach( ( col ) => {
			if( parseInt( colSize[0] ) + parseInt( colSize[1] ) == 100 && rowLength  == 2 ){
				if( row.children.length == 2 ){
					col.style.setProperty( '--flex-basis-odd', colSize[0] + '%' );
				}
				if( row.children.length == 1 ){
					col.style.setProperty( '--flex-basis-even', colSize[1] + '%' );
				}

			}
			col.classList.add( 'columns__grid-col', 'grid-col-12', 'desktop:grid-col-6' );
			mainRow.append( col );
		} );
	} );
	
	block.innerText = '';
	block.append( mainRow );
}
