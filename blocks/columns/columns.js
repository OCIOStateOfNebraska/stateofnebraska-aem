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
	let count= 0;
	[...block.children].forEach( ( row ) => {
		count = [...row.children].length;	
		const cols = [];
		[...row.children].forEach( ( col ) => {
			cols.push( col );
		} );
		
		
		// count= 4;
		
		// Map count -> desktop width class (USWDS 12-col grid)
		// Use 'auto' when 12 % count !== 0 (e.g., 5 columns)
		const desktopWidthClass = ( () => {
			if ( count <= 0 ) return 'desktop:grid-col-12';
			let size = 12 / count;
			const valid = (Number.isInteger( size ) || Number.isInteger( Math.floor(size) )) && size >= 1 && size <= 12;
			if(!Number.isInteger( size )) size = Math.floor(size);
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
			
		} );

		row.classList.add('columns__grid-row','grid-row', 'grid-gap');
		mainRow.append(row)

		calculateColSize( colSize, cols );
	}) ;
	
	block.innerText = '';
	block.append( mainRow );
}


function calculateColSize ( colSize, cols ){
	let sum = 0;
	colSize.forEach( value =>{
		sum += parseInt( value );
	} );
	console.log(sum)
	if ( sum == 100 && colSize.length == cols.length ){
		for( let i = 0; i < colSize.length; i++ ){
			cols[i].style.setProperty( '--flex-basis', colSize[i] + '%' );
			cols[i].style.width = colSize[i] + '%' ;
		}
	}
}