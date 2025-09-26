import { domEl } from '../../scripts/dom-helpers.js';

export default function decorate( block ) {
	// One main row to avoid gaps if authors add uneven rows
	
	const mainRow = domEl( 'div', {
		class: 'columns__grid-row grid-row grid-gap',
	} );

	let colSize = [];
	if( block.className.includes( 'layout' ) ) {
		block.classList.forEach( item => {
			if( item.includes( 'layout-' ) ){
				colSize = item.replace( 'layout-', '' ).split( '-' );
			}
		} );
	}

	// Collect and flatten all authored columns
	const cols = [];
	[...block.children].forEach( ( row ) => {
		const rowLength = row.children.length;
		[...row.children].forEach( ( col ) => {
			cols.push( col );
		} );
		
		const count = cols.length;
		
		// Map count -> desktop width class (USWDS 12-col grid)
		// Use 'auto' when 12 % count !== 0 (e.g., 5 columns)
		const desktopWidthClass = ( () => {
			if ( count <= 0 ) return 'desktop:grid-col-12';
			const size = 12 / count;
			const valid = Number.isInteger( size ) && size >= 1 && size <= 12;
			return valid ? `desktop:grid-col-${size}` : 'desktop:grid-col-auto';
		} )();
		
		// Optional: add a modifier to the block for styling hooks like .columns--3
		block.classList.add( `columns--${count}` );
		
		cols.forEach( ( col ) => {
			col.classList.add(
				'columns__grid-col',
				'grid-col-12',
				desktopWidthClass
			);
			mainRow.append( col );
		} );
		calculateColSize( colSize, cols );
	} );
	
	block.innerText = '';
	block.append( mainRow );
}


function calculateColSize ( colSize, cols ){
	let sum = 0;
	colSize.forEach( value =>{
		sum += parseInt( value );
	} );
	if ( sum == 100 && colSize.length == cols.length ){
		for( let i = 0; i < colSize.length; i++ ){
			cols[i].style.setProperty( '--flex-basis', colSize[i] + '%' );
		}
	}
}