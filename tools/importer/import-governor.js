/* global WebImporter */
/* eslint-disable no-console */

const createMetadataBlock = ( main, document ) => {
	const meta = {};

	// find the <title> element
	const title = document.querySelector( 'title' );
	if ( title ) {
		meta.Title = title.innerHTML.replace( /[\n\t]/gm, '' ).replace( ' | Office of Governor Jim Pillen', '' );
	}

	// find the <meta property="og:description"> element
	const desc = document.querySelector( '[property="og:description"]' );
	if ( desc ) {
		meta.Description = desc.content;
	} else {
		// if no description is found, set it to an empty string
		meta.Description = '';
	}

	// find the <meta property="og:image"> element
	const img = document.querySelector( '[property="og:image"]' );
	if ( img ) {
		// create an <img> element
		const el = document.createElement( 'img' );
		el.src = img.content;
		meta.Image = el;
	}

	// looks for the existence of a dateline and converts it to metadata, and makes the page a news template
	const dateLineEl = document.querySelector( '.field--name-published-at' );
	if ( dateLineEl ) {
		const dateLine = dateLineEl.innerText.trim();
		if ( dateLine ) {
			meta.Date = dateLine;
			meta.Template = 'News';
		}
	}
	


	// helper to create the metadata block
	const block = WebImporter.Blocks.getMetadataBlock( document, meta );

	// append the block to the main element
	main.append( block );

	// returning the meta object might be usefull to other rules
	return meta;
};

export default {
	transformDOM: ( {
		document, url, params,
	} ) => {
		const main = document.body;
		WebImporter.DOMUtils.remove( main, [
			'header',
			'.navbar',
			'.footer',
			'aside',
			"nav",
			".header-bg",
			"ol.breadcrumb",
			"a.skip-link",
		] );
		createMetadataBlock( main, document );
	//	WebImporter.rules.transformBackgroundImages( main, document );
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