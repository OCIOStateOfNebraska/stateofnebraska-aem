/* global WebImporter */
/* eslint-disable no-console */

const createMetadataBlock = ( main, document ) => {
	const meta = {
		// Title : 'Meetings Minutes',
		// Description : 'Nebraska Real Property Appraiser Board Meetings Minutes page',
		// Title : 'Meeting Agendas',
		// Description : 'Nebraska Real Property Appraiser Board Meeting Agendas page',
		// Title : 'Public Meeting Materials',
		// Description : 'Nebraska Real Property Appraiser Board Public Meeting Materials page',
		// Title : 'Memos from the Board',
		// Description : 'Nebraska Real Property Appraiser Board - Memos from the Board page',
		Title : 'Appraiser Board Newsletters',
		Description : 'Nebraska Real Property Appraiser Board - Appraiser Board Newsletters page',
	};
	const h1 = document.createElement( 'h1' );
	h1.textContent = meta.Title;
	main.prepend( h1 );
	// helper to create the metadata block
	const block = WebImporter.Blocks.getMetadataBlock( document, meta );

	// append the block to the main element
	main.append( block );

	// returning the meta object might be usefull to other rules
	return meta;
};

const createList = ( links, year ) => {
	const filteredLinks = links.filter( link => link.href.includes( year.toLowerCase() ) );
	const ul = document.createElement( 'ul' );
	filteredLinks.forEach( link => {
		const li = document.createElement( 'li' );
		li.appendChild( link );
		ul.appendChild( li );
	} );
	return ul;
};
const createHeadings = ( headings, year ) => {
	const heading = document.createElement( 'h2' );
	heading.textContent = headings.length > 0 ? 
		headings.filter( headingEl => headingEl.textContent.includes( year ) ).map( el => el.textContent ).join( ' ' ) : year;
	return heading;
};


const createAccordion = ( main, document ) => {
	const table = document.querySelectorAll( 'table' )[1]; // minutes and Memos from the Board table
	// const table = document.querySelector( 'table' ); // minutes and Memos from the Board table
	// const table = document.querySelector( 'tr.alignCenter' ); // agendas and public materials table
	if ( !table ) {
		return;
	}
	// const headings = Array.from( table.querySelectorAll( 'span.page_title' ) ).filter( th => th.textContent.trim() !== '' ); // minutes headings
	// const headings = Array.from( table.querySelectorAll( '.page_title > span > span' ) ).filter( th => th.textContent.trim() !== '' ); // agendas and public materials headings
	const headings = Array.from( table.querySelectorAll( 'h3' ) ).filter( th => th.textContent.trim() !== '' ); // agendas and public materials headings
	const links = Array.from( table.querySelectorAll( 'a' ) ).map( a => {
		// a.href = `/meetings/docs/minutes/${a.href.split( '/' ).slice(5).join( '/' ).replaceAll( '_', '-' ).toLowerCase()}`; // minutes links
		// a.href = `/meetings/docs/agenda/${a.href.split( '/' ).slice(5).join( '/' ).replaceAll( '_', '-' ).toLowerCase()}`; // agendas links
		// a.href = `/meetings/docs/public-material/${a.href.split( '/' ).slice(5).join( '/' ).replaceAll( '_', '-' ).toLowerCase()}`; // public materials links
		a.href = `/public-info/newsletters-and-memos/docs/${a.href.replaceAll( '_', '-' ).toLowerCase().replace( 'http://localhost:3001/newsletters-and-memos/', '' )}`; // Memos from the Board links
		return a;
	} );


	// before use it modify the statement above to preserve the original URL
	// downloadPDFs( links.filter( link => link.href.includes( '2026' ) ).map( link => link.href ) );
	
	const cells = [
		['Accordion'],
		// [ createHeadings( headings, '2026' ) , createList( links, '2026' )],
		[ createHeadings( headings, '2025' ) , createList( links, '2025' )],
		[ createHeadings( headings, '2024' ) , createList( links, '2024' )],
		[ createHeadings( headings, '2023' ) , createList( links, '2023' )],
		[ createHeadings( headings, '2022' ) , createList( links, '2022' )],
		[ createHeadings( headings, '2021' ) , createList( links, '2021' )],
		[ createHeadings( headings, '2020' ) , createList( links, '2020' )],
		[ createHeadings( headings, '2019' ) , createList( links, '2019' )],
		[ createHeadings( headings, '2018' ) , createList( links, '2018' )],
		[ createHeadings( headings, '2017' ) , createList( links, '2017' )],
		[ createHeadings( headings, '2016' ) , createList( links, '2016' )],
		// [ createHeadings( headings, '2015' ) , createList( links, '2015' )],
		// [ createHeadings( headings, '2014' ) , createList( links, '2014' )],
		// [ createHeadings( headings, '2013' ) , createList( links, '2013' )],
		// [ createHeadings( headings, '2012' ) , createList( links, '2012' )],
		// [ createHeadings( headings, '2011' ) , createList( links, '2011' )],
		// [ createHeadings( headings, '2010' ) , createList( links, '2010' )],
		// [ createHeadings( headings, '2009' ) , createList( links, '2009' )],
		// [ createHeadings( headings, '2008' ) , createList( links, '2008' )],
		[ createHeadings( headings, '2007' ) , createList( links, '2007' )],
		[ createHeadings( headings, '2006' ) , createList( links, '2006' )],
	];
 
	const accordion = WebImporter.DOMUtils.createTable( cells, document );   
	main.append( accordion );
	table.remove();
};
export default {
	transformDOM: ( {
		document, url, params,
	} ) => {
		const main = document.body;
		WebImporter.DOMUtils.remove( main, [
			'header',
			'.headerText',
			'.positionRelative',
			'.logo',
			'.topnav',
			'.footer',
			'.news_right',
			'#branding',
		] );
		createAccordion( main, document );
		createMetadataBlock( main, document );
		WebImporter.rules.transformBackgroundImages( main, document );
		WebImporter.rules.adjustImageUrls( main, url, params.originalURL );
		WebImporter.rules.convertIcons( main, document );

		return main;
	},

	generateDocumentPath: ( {
		url
	} ) => {
		let p = new URL( url ).pathname;
		if ( p.endsWith( '/' ) ) {
			p = `${p}index`;
		}

		return decodeURIComponent( p )
			.toLowerCase(  )
			.replace( /\.html$/, '' )
			.replace( /[^a-z0-9/]/gm, '-' );
	},
};