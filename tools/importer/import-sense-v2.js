/* global WebImporter */
/* eslint-disable no-console */

/**
 * Gets the first sentence from a string of text.
 * A sentence is defined as a string of characters ending with a period (.),
 * question mark (?), or exclamation mark (!).
 * If no sentence-ending punctuation is found, the entire string is returned.
 *
 * @param {string} text The input text.
 * @returns {string} The first sentence of the text.
 */
function getFirstSentence( text ) {
	if ( typeof text !== 'string' || text.length === 0 ) {
		return '';
	}

	// Regular expression to find the first sentence.
	// It looks for any characters (non-greedy) until it hits a ., ?, or !
	// followed by a space or the end of the string.
	const sentenceRegex = /.+?[.?!](\s|$)/;
	const match = text.match( sentenceRegex );

	if ( match ) {
		return match[0].trim();
	}

	// If no sentence-ending punctuation is found, return the whole string.
	return text;
}

function createAccordion( main, document ) {
	const accordionItems = main.querySelectorAll( '.field-content .row .accordion' );
	if (accordionItems.length == 0) {
		return;
	}

	const accordionContainer = accordionItems[0].closest( '.field-content' );

	if ( accordionItems.length > 0 ) {
		let data = [
			['accordion']
		];
		accordionItems.forEach( ( accordion ) => {
			let row = [];
			const h2 = document.createElement( 'h2' );
			h2.innerText = accordion.firstElementChild.innerText
			row.push( h2 );

			//process drawer contents into lists
			const listItems = accordion.nextElementSibling.firstElementChild.querySelectorAll('p');
			if (listItems && listItems.length > 0) {

				const contents = document.createElement('div');

				let ul = null;
				listItems.forEach((pItem) => {
					//check for headings (which would mean multiple lists needed)
					if (pItem.firstElementChild.tagName === 'STRONG') {
						ul = document.createElement('ul');
						const h3 = document.createElement('h3');
						h3.innerText = pItem.firstElementChild.innerText;
						contents.append(h3);
						contents.append(ul);
					} else if (pItem.firstElementChild.tagName === 'A') {
						const li = document.createElement('li');
						li.append(pItem.firstElementChild);
						if (ul == null) {
							ul = document.createElement('ul');
							contents.append(ul);
						}
						ul.append(li);
					}
				});

				row.push( contents );
			}

			data.push( row );
		} );
		accordionContainer.replaceWith( WebImporter.DOMUtils.createTable( data, document ) );
	}
}

function convertCarouselToInfoCards( main, document ) {
	const carouselContainers = main.querySelectorAll( '.carousel.slide' );
	carouselContainers.forEach( ( carouselContainer ) => {
		const carouselItems = carouselContainer.querySelectorAll( '.carousel-inner .row' );
		if ( carouselItems.length > 0 ) {
			let data = [
				['info-card-grid']
			];
			carouselItems.forEach( ( slide ) => {
				let row = [];
				const slideImg = slide.querySelector( 'img' );
				row.push( slideImg );
				const h2 = document.createElement( 'h2' );
				h2.innerText = slide.querySelector( '.carousel-caption h3' ).innerText;
				const contentDiv = document.createElement( 'div' );
				contentDiv.append( h2 );
				const cardContent = slide.querySelector( '.card-body-content' );
				if (cardContent) {
					const cta = cardContent.querySelector( 'a' );
					cta.innerText = 'Read More';
					cardContent.remove( cta );
					cardContent.innerText = getFirstSentence( cardContent.innerText );
					contentDiv.append( cardContent );
					contentDiv.append( cta );
				}
				row.push( contentDiv );
				data.push( row );
			} );
			carouselContainer.replaceWith( WebImporter.DOMUtils.createTable( data, document ) );
		}
	} );
}


function updateLinks( main, url ) {
	main.querySelectorAll( 'a' ).forEach( ( a ) => {
		const href = a.getAttribute( 'href' );
		if ( href && !href.endsWith( '.pdf' ) && !href.startsWith( 'http://' ) && !href.startsWith( 'https://' ) ) {
			const u = new URL( href, url );
			const newPath = WebImporter.FileUtils.sanitizePath( u.pathname );
			const newHref = new URL( newPath, 'https://main--makecentsmakesense--ociostateofnebraska.aem.page' ).toString();
			a.setAttribute( 'href', newHref );
		}
	} );
}

function updatePdfLinks( main, url ) {
	main.querySelectorAll( 'a' ).forEach( ( a ) => {
		const href = a.getAttribute( 'href' );
		if ( href && href.endsWith( '.pdf' ) && !href.startsWith( 'http://' ) && !href.startsWith( 'https://' ) ) {
			const u = new URL( href, url );
			const newPath = WebImporter.FileUtils.sanitizePath( u.pathname );
			const newHref = new URL( newPath, 'https://main--makecentsmakesense--ociostateofnebraska.aem.page' ).toString();
			a.setAttribute( 'href', newHref );
		}
	} );
}

function updateImageSrcs( main, url ) {
	main.querySelectorAll( 'img' ).forEach( ( img ) => {
		const src = img.getAttribute( 'src' );
		if ( src ) {
			const u = new URL( src, url );
			// const newPath = WebImporter.FileUtils.sanitizePath(  );
			const newSrc = new URL( u.pathname, 'https://makecentsmakesense.nebraska.gov/' ).toString();
			img.setAttribute( 'src', newSrc );
		}
	} );
}

function removeEmptyTable( main ) {
	main.querySelectorAll( 'table' ).forEach( ( each ) => {
		if ( !each.querySelector( 'th' ) ) {
			each.remove();
		}
	} );
}

const createMetadataBlock = ( main, document, url ) => {
	const meta = {};
	// find the <title> element
	const title = document.querySelector( 'title' );
	if ( title ) {
		meta.Title = title.innerText.replace( /[\n\t]/gm, '' ).replace( '| Nebraska Banking and Finance', '' );
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
			'#navbar',
			'.visually-hidden',
			'.tablet-search-container',
			'.link-to-ndbf-home',
			'.footer'
		] );

		const h1 = document.createElement( 'h1' );
		let h2;
		const hr = document.createElement( 'hr' );
		h1.after( hr );
		let currentHeading = document.querySelector( 'h2.block-title' );
		if (!currentHeading) {
			const headerSection = document.querySelector( '.view-header .file_header_text' );
			if (headerSection) {
				currentHeading = headerSection.firstElementChild;
				h2 = document.createElement('h2');
				const em = document.createElement('em');
				const secondHeading = headerSection.children[1];
				em.innerText = secondHeading.innerText;
				h2.appendChild(em);
				headerSection.removeChild(secondHeading);
			}
		}
		h1.innerText = currentHeading.innerText;
		if (h2) {
			currentHeading.after(h2);
		}
		currentHeading.after( hr );
		currentHeading.replaceWith( h1 );


		createAccordion( main, document );
		convertCarouselToInfoCards( main, document );


		createMetadataBlock( main, document, url );
		WebImporter.rules.transformBackgroundImages( main, document );
		WebImporter.rules.adjustImageUrls( main, url, params.originalURL );
		WebImporter.rules.convertIcons( main, document );

		updateLinks( main, url );
		updateImageSrcs( main, url );
		removeEmptyTable( main );

		const results = [];
		const path = ( () => {
			let p = new URL( url ).pathname;
			if ( p.endsWith( '/' ) ) {
				p = `${p}index`;
			}

			return decodeURIComponent( p )
				.toLowerCase()
				.replace( /\.html$/, '' )
				.replace( /[^a-z0-9/]/gm, '-' );
		} )( url );



		// find pdf links
		// main.querySelectorAll( 'a' ).forEach( ( a ) => {
		// 	const href = a.getAttribute( 'href' );
		// 	if ( href && href.endsWith( '.pdf' ) && !href.startsWith( 'http://' ) && !href.startsWith( 'https://' ) ) {
		// 		const u = new URL( href, url );
		// 		const newPath = WebImporter.FileUtils.sanitizePath( u.pathname ).replace( '/sites/default/', '/' );
		// 		// no "element", the "from" property is provided instead - importer will download the "from" resource as "path"
		// 		results.push( {
		// 			path: newPath,
		// 			from: u.toString(),
		// 		} );

		// 		// update the link to new path on the target host
		// 		// this is required to be able to follow the links in Word
		// 		// you will need to replace "main--repo--owner" by your project setup
		// 		const newHref = new URL( newPath, 'https://main--ndbf-eds--ociostateofnebraska.aem.page' ).toString();
		// 		a.setAttribute( 'href', newHref );
		// 	}
		// } );

		// updatePdfLinks( main, url );
		// main page import - "element" is provided, i.e. a docx will be created
		results.push( {
			element: main,
			path: path
		} );

		return results;
	},
};