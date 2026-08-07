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
	const link = block.querySelector( 'a' );
	const indexPath = link?.href?.trim();
	
	const searchIndex = await fetchSearchIndex( indexPath );

	if ( !searchIndex.data || !Array.isArray( searchIndex.data ) ) {
		throw new Error( 'Invalid search index format' );
	}

	link.remove();
	return searchIndex;
}

function checkDate( cell, dateColumns, dateTimeColumns ) {
	if( cell.textContent.toLowerCase().includes( '(date)' ) && new Date( cell.textContent ) !=='Invalid Date' ){		
		dateColumns.push( cell.cellIndex );
		cell.textContent = cell.textContent.replace( '(date)', '' ).trim();
	}
	if( cell.textContent.toLowerCase().includes( '(date-time)' ) && new Date( cell.textContent ) !=='Invalid Date' ){		
		dateTimeColumns.push( cell.cellIndex );
		cell.textContent = cell.textContent.replace( '(date-time)', '' ).trim();
	} 
}

function handleFilter( block, dataSet ) {
	const filterRows = Array.from( block.querySelectorAll( '.block > div' ) );
	if( filterRows.length === 1 ) return dataSet;
	filterRows.shift(); // Remove the table row
	const operators = {
		'=': ( a, b ) => a == b,
		'>': ( a, b ) => a > b,
		'<': ( a, b ) => a < b,
		'!=': ( a, b ) => a != b,
		'>=': ( a, b ) => a >= b,
		'<=': ( a, b ) => a <= b,
		'contains': ( a, b ) => a.toLowerCase().includes( b ),
		'before': ( a, b ) => new Date( a ) < new Date( b ),
		'after': ( a, b ) => new Date( a ) > new Date( b ),
		'current': ( a  ) => new Date( a ) >=  Date.now(),
		'past': ( a ) => new Date( a ) <=  Date.now()
	};


	let filteredData = [];

	filterRows.forEach( ( row ) => {
		const filterBy = row.querySelector( 'div' ).textContent;
		const condition = row.querySelector( 'div:nth-child(2)' ).textContent;
		const value = row.querySelector( 'div:nth-child(3)' ).textContent;
		const dataToFilter = filteredData.length? filteredData: dataSet;
		
		filteredData = dataToFilter.filter( ( data ) => operators[condition]( data[filterBy], value ) );
	} );

	return filteredData;
}

export async function createBasicTable( block ) {
	let dataSet = await fetchData( block );
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
	
	const dateColumns = [];
	const dateTimeColumns = [];

	firstRowCells.forEach( ( cell ) => {
		const isLink = cell.querySelector( 'a' );
		const url = isLink?.href?.trim().split( '/' ).pop();

		checkDate( cell, dateColumns, dateTimeColumns );

		const corrCol = cell.textContent;
		const results = handleFilter( block, dataSet.data );
		// console.log( 'result', results );
		let dataArray = results.map( ( row ) => 
			td( {'data-label' : headings[cell.cellIndex].textContent }, url && row[url] ? 
				a( { href: row[url]  }, dateColumns.includes( cell.cellIndex ) ?
					new Date( row[ corrCol ] ).toLocaleDateString( 'en-US' ) : dateTimeColumns.includes( cell.cellIndex ) ?
						new Date( row[ corrCol ] ).toLocaleString( 'en-US' ) : row[ corrCol ] ) : dateColumns.includes( cell.cellIndex ) ?
					new Date( row[ corrCol ] ).toLocaleDateString( 'en-US' ) : dateTimeColumns.includes( cell.cellIndex ) ?
						new Date( row[ corrCol ] ).toLocaleString( 'en-US' ) : row[ corrCol ]  ) );
		
		for ( let index = 0; index < results.length; index++ ) {
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

