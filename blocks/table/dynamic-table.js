import { tr, td, a } from '../../scripts/dom-helpers.js';

async function fetchSearchIndex( indexPath ) {
	const response = await fetch( indexPath );
	if ( !response.ok ) {
		throw new Error( `Failed to fetch search index: ${response.status}` );
	}
	return response.json();
}

/**
 * Fetch data from the JSON file to populate the dynamic table
 * @param { Element } block 
 */
async function fetchData( block ) {
	const indexPath = block.querySelector( 'a' )?.href?.trim();
	
	const searchIndex = await fetchSearchIndex( indexPath );

	if ( !searchIndex.data || !Array.isArray( searchIndex.data ) ) {
		throw new Error( 'Invalid search index format' );
	}

	return searchIndex;
}


export async function createBasicTable( block ) {
	const dataSet = await fetchData( block );
	if ( !dataSet ) return;

	const table = block.querySelector( 'table' );
	const tbody = table.querySelector( 'tbody' );
	const firstRow = tbody.querySelector( 'tr:nth-child(2)' );
	const headings = Array.from( tbody.querySelectorAll( 'tr:nth-child(1) > td' ) );
	const firstRowCells = firstRow?.querySelectorAll( 'td' );

	block.appendChild( table );
	let rows = [];
	
	for ( let index = 0; index < dataSet.data.length; index++ ) {
		rows.push( tr( {} ) );  
	}
	
	firstRowCells.forEach( ( cell ) => {
		const isLink = cell.querySelector( 'a' );
		const url = isLink?.href?.trim().split( '/' ).pop();
		
		const corrCol = cell.textContent;
		const dataArray = dataSet.data.map( ( row ) => td( {'data-label' : headings[cell.cellIndex].textContent }, url && row[url] ? a( { href: row[url]  }, row[ corrCol ] ) : row[ corrCol ] ) );
		
		for ( let index = 0; index < dataSet.data.length; index++ ) {
			rows[index].appendChild( dataArray[index] );
		}
		
	} );
	
	tbody.textContent = '';
	rows.forEach( ( row ) => {
		tbody.appendChild( row );
	} );    
	tbody.prepend( tr( {}, ...headings ) );
	
	return block;

}

