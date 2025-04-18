import { domEl } from '../../scripts/dom-helpers.js';

/**
* Add creates and adds scope to the table headers
* @param {HTMLElement} row - The row that will contain the header (tr)
* @param {HTMLElement} cell - The cell that is the header (td --> gets transformed to th)
* @param {string} scope - The scope that the table cell should have once it is a th
*/
function createTableHeaders( row, cell, scope ) {
	const th = domEl( 'th', { 'scope': scope }, cell.innerText );

	if ( scope === 'row' ) {
		row.prepend( th );
	} else {
		row.append( th );
	}

	cell.remove();
}

/**
* Check the table type to see if its scrollable or not 
* @param {HTMLElement} block - The table generated by EDS
*/
function checkType( block ) {
	const c = block.classList;
	let type;
	
	if ( c.contains( 'col-1-header' ) ) {
		type = 'col-heading';
	} else if ( c.contains( 'scrollable' ) ){
		type = 'scrollable';
	} else {
		type = 'default';
	}
	
	return type;
}

/**
* Generates the table
* @param {HTMLElement} block - The table generated by EDS
*/
export default function decorate( block ) {
	const type = checkType( block );
	const table = block.querySelector( 'table' );
	const p = block.querySelector( 'p' );
	const caption = domEl( 'caption', {}, p );
	const tbody = table.querySelector( 'tbody' );
	const rows = tbody.querySelectorAll( 'tr' );
	let thead = null;
	let container = null;
	let newRows;
	
	table.classList.add( 'usa-table' );

	// create the header 
	thead = domEl( 'thead', {}, rows[0] );
	rows[0].querySelectorAll( 'td' ).forEach( ( cell ) => {
		createTableHeaders( rows[0], cell, 'col' );
	} );

	table.prepend( thead );
	if ( caption ) {
		table.append( caption );
	}
	// grab the new Rows in the body after we generate the thead 
	newRows = tbody.querySelectorAll( 'tr' ); 
	
	// handle scrollable table 
	if ( type === 'scrollable' || type === 'col-heading' ) {
		container = domEl( 'div', {class: 'usa-table-container--scrollable' }, table );
		if ( type === 'col-heading' ) {
			newRows.forEach( ( row ) => {
				row.querySelectorAll( 'td' ).forEach( ( cell, index ) => {
					while ( index === 0 ) {
						createTableHeaders( row, cell, 'row' );
						break;
					}
				} );
			} );
		}
	} else { // handle stacked table 
		table.classList.add( 'usa-table--stacked' );
		const newHeaderRow = table.querySelectorAll( 'thead th' );
		newRows.forEach( ( row ) => {
			const tds = [...row.querySelectorAll( 'td' ) ]; // Get all td elements in this row
			[...newHeaderRow].map( ( th, index ) => {
				const dataLabel = th.textContent.trim();
				tds[index].dataset.label = dataLabel;
			} );
		} );
	}

	block.textContent = '';
	if ( container ) {
		block.append( container );
	} else {
		block.append( table );
	}
}