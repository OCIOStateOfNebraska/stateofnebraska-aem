/* global WebImporter */
/* eslint-disable no-console */

const createMetadataBlock = ( main, document ) => {
	const meta = {};

	// find the <title> element
	const title = document.querySelector( 'title' );
	if ( title ) {
		meta.Title = title.innerHTML.replace( /[\n\t]/gm, '' ).replace( 'OCIO - Innovation in Technology: ', '' );
	}

	// find the <meta property="og:description"> element
	const desc = document.querySelector( '[property="og:description"]' );
	if ( desc ) {
		meta.Description = desc.content.replace( 'OCIO - Innovation in Technology: ', '' );
	}

	// find the <meta property="og:image"> element
	const img = document.querySelector( '[property="og:image"]' );
	if ( img ) {
		// create an <img> element
		const el = document.createElement( 'img' );
		el.src = img.content;
		meta.Image = el;
	}

	// helper to create the metadata block
	const block = WebImporter.Blocks.getMetadataBlock( document, meta );

	// append the block to the main element
	main.append( block );

	// returning the meta object might be usefull to other rules
	return meta;
};

export default {
	transform: ( {
		document, url, params,
	} ) => {
		const main = document.body;
		WebImporter.DOMUtils.remove( main, [
			'header',
			'.navbar',
			'.footer'
		] );
		createMetadataBlock( main, document );
		WebImporter.rules.transformBackgroundImages( main, document );
		WebImporter.rules.adjustImageUrls( main, url, params.originalURL );
		WebImporter.rules.convertIcons( main, document );

		const results = [];
		const path = ( ( u ) => {
			let p = new URL( url ).pathname;
			if ( p.endsWith( '/' ) ) {
				p = `${p}index`;
			}

			return decodeURIComponent( p )
				.toLowerCase(  )
				.replace( /\.html$/, '' )
				.replace( /[^a-z0-9/]/gm, '-' );
		} )( url );

		// main page import - "element" is provided, i.e. a docx will be created
		results.push({
		  element: main,
		  path: path
		});

		// find pdf links
		main.querySelectorAll('a').forEach((a) => {
			const href = a.getAttribute('href');
			if (href && href.endsWith('.pdf')) {
				const u = new URL(href, url);
				const newPath = WebImporter.FileUtils.sanitizePath(u.pathname);
				// no "element", the "from" property is provided instead - importer will download the "from" resource as "path"
				results.push({
					path: newPath,
					from: u.toString(),
				});

				// update the link to new path on the target host
				// this is required to be able to follow the links in Word
				// you will need to replace "main--repo--owner" by your project setup
				const newHref = new URL(newPath, 'https://main--cio--ociostateofnebraska.aem.page').toString();
				a.setAttribute('href', newPath);
			}
		});

		return results;
	},
};