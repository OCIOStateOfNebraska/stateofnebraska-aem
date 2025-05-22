/* global WebImporter */
/* eslint-disable no-console */

function createSummaryBoxBlock( main, document ) {
	main.querySelectorAll( '.paragraphs-item-featured-well' ).forEach( ( each ) => {
		const summaryContent = each.innerHTML;
		const data = [
			['summary-box'],
			[summaryContent]
		];
		each.replaceWith( WebImporter.DOMUtils.createTable( data, document ) );
	} );
	const columnInSummary = main.querySelectorAll( '.field .field--item .row .text-center' );
	let colData = [];
	if ( columnInSummary.length > 0 ) {
		columnInSummary.forEach( ( item ) => {
			if ( item.innerHTML !== '' ) colData.push( item.innerHTML );
		} );
		if ( colData.length > 0 ) {
			const data = [
				['columns'],
				colData
			];
			columnInSummary[0].parentNode.replaceWith( WebImporter.DOMUtils.createTable( data, document ) );
		}
	}
}

function createColumns( main, document ) {
	main.querySelectorAll( '.field .field--item .row' ).forEach( ( row ) => {
		process6Columns( row, document );
		process4Columns( row, document );
	} );
}

function process6Columns( row, document ) {
	const columns6 = row.querySelectorAll( '.col-sm-6' );
	let colData6 = [];
	if ( columns6.length > 0 ) {
		columns6.forEach( ( item ) => {
			if ( item.innerHTML !== '' ) colData6.push( item.innerHTML );
		} );
		if ( colData6.length > 0 ) {
			const data = [
				['columns'],
				colData6
			];
			columns6[0].parentNode.replaceWith( WebImporter.DOMUtils.createTable( data, document ) );
		}
	}
}

function process4Columns( row, document ) {
	const columns4 = row.querySelectorAll( '.col-sm-4' );
	let colData4 = [];
	if ( columns4.length > 0 ) {
		columns4.forEach( ( item ) => {
			if ( item.innerHTML !== '' ) colData4.push( item.innerHTML );
		} );
		if ( colData4.length > 0 ) {
			const data = [
				['columns'],
				colData4
			];
			columns4[0].parentNode.replaceWith( WebImporter.DOMUtils.createTable( data, document ) );
		}
	}
}

function createHomeHeroHeader( main, document ) {
	const homeHeroHeader = main.querySelectorAll( '.header-container .row .col-sm-12' );
	let colData = [];
	if ( homeHeroHeader.length > 0 ) {
		homeHeroHeader.forEach( ( row ) => {
			if ( row.classList.contains( 'main-news-column' ) ) {
				const mainNews = row.querySelector( '.main-news' );
				colData.push( createCards( mainNews, document ) );
			} else if ( row.classList.contains( 'second-news-main-column' ) ) {
				const div = document.createElement( 'div' );
				const secondNews = row.querySelector( '.second-news' );
				div.append( createCards( secondNews, document ) );
				const bottomNews = row.querySelectorAll( '.bottom-news-column .col-xs-6' );
				const btmNewsData = [];
				if ( bottomNews.length > 0 ) {
					bottomNews.forEach( ( item ) => {
						btmNewsData.push( item );
					} );
					const data = [
						['columns'],
						btmNewsData
					];
					div.append( WebImporter.DOMUtils.createTable( data, document ) );
				}
				colData.push( div );
			}
		} );
		const data = [
			['columns'],
			colData
		];
		homeHeroHeader[0].parentNode.replaceWith( WebImporter.DOMUtils.createTable( data, document ) );
	}
}

function createAccordion( main, document ) {
	const accordionItems = main.querySelectorAll( '.field .field--item .row .accordion' );
	if ( accordionItems.length > 0 ) {
		let data = [
			['accordion']
		];
		accordionItems.forEach( ( accordion ) => {
			let row = [];
			row.push( accordion.firstElementChild );
			row.push( accordion.nextElementSibling.firstElementChild );
			data.push( row );
		} );
		accordionItems.forEach( ( item, index ) => {
			if ( index === 0 ) {
				item.closest( '.field--item' ).replaceWith( WebImporter.DOMUtils.createTable( data, document ) );
			} else {
				item.closest( '.field--item' ).remove(  );
			}
		} );
	}
}

function createCards( ele, document ) {
	const fieldContent = ele.querySelectorAll( '.field-content' );
	const colData = [];
	let card = '';
	if ( fieldContent.length > 0 ) {
		const div = document.createElement( 'div' );
		fieldContent.forEach( ( item ) => {
			if ( item.querySelector( 'img' ) ) {
				colData.push( item );
			} else {
				div.append( item );
			}
		} );
		colData.push( div );
		const data = [
			['cards'],
			colData
		];
		card = WebImporter.DOMUtils.createTable( data, document );
	}
	return card;
}

function handleIFrame( main ) {
	main.querySelectorAll( 'iframe' ).forEach( ( iframe ) => {
		const iframeSrc = iframe.getAttribute( 'src' );
		iframe.parentNode.append( iframeSrc );
		iframe.remove();
	} );
}

function removeFileIcon( main ) {
	const icons = main.querySelectorAll( '.file-icon' );
	if ( icons.length > 0 ) {
		icons.forEach( ( icon ) => {
			icon.remove();
		} );
	}
}

function removeFileSize( main ) {
	const fileSize = main.querySelectorAll( '.file-size' );
	if ( fileSize.length > 0 ) {
		fileSize.forEach( ( each ) => {
			each.remove();
		} );
	}
}

function updateLinks( main, url ) {
	main.querySelectorAll( 'a' ).forEach( ( a ) => {
		const href = a.getAttribute( 'href' );
		if ( href && !href.endsWith( '.pdf' ) ) {
			const u = new URL( href, url );
			const newPath = WebImporter.FileUtils.sanitizePath( u.pathname );
			const newHref = new URL( newPath, 'https://main--stateofnebraska-aem--ociostateofnebraska.aem.page' ).toString();
			a.setAttribute( 'href', newHref );
		}
	} );
}

function updateImageLinks( main, url ) {
	main.querySelectorAll( 'img' ).forEach( ( img ) => {
		const src = img.getAttribute( 'src' );
		if ( src ) {
			const u = new URL( src, url );
			const newPath = WebImporter.FileUtils.sanitizePath( u.pathname );
			const newSrc = new URL( newPath, 'https://ndbf.nebraska.gov/' ).toString();
			img.setAttribute( 'src', newSrc );
		}
	} );
}

const createMetadataBlock = ( main, document, url ) => {
	const meta = {};
	console.log("URL - {}", url);
	// find the <title> element
	const title = document.querySelector( 'title' );
	if ( title ) {
		meta.Title = title.innerText.replace( /[\n\t]/gm, '' ).replace( '| Nebraska Banking and Finance', '' );
	}

	// find the <meta property="og:title"> element
	const ogTitle = document.querySelector( '[property="og:title"]' );
	if ( ogTitle ) {
		meta['og:title'] = ogTitle.content.replace( /[\n\t]/gm, '' ).replace( '| Nebraska Banking and Finance', '' );
	}

	// find the <meta property="og:description"> element
	const desc = document.querySelector( '[property="og:description"]' );
	if ( desc ) {
		meta.Description = desc.content;
	}

	// find the <meta property="og:image"> element
	const img = document.querySelector( '[property="og:image"]' );
	if ( img ) {
		// create an <img> element
		const el = document.createElement( 'img' );
		el.src = img.content;
		meta.Image = el;
	}

	const pageUrl = new URL( url );
	const path = pageUrl.pathname;
	if ( path.startsWith( '/notices' ) || path.startsWith( '/notice-' ) ) {
		meta.tags = [ 'notice' ];
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

		const parentH1 = document.querySelector( '.inside-container .container .inside-title h1' );
		const heading = document.querySelector( '.region.region-title h1' );
		if ( parentH1 && heading ) {
			parentH1.replaceWith( heading );
		}

		const hero = document.querySelector( '.inside-hero' );
		if ( hero && heading ) {
			const hr = document.createElement( 'hr' );
			heading.after( hero );
			hero.after( hr );
		}

		createHomeHeroHeader( main, document );
		createSummaryBoxBlock( main, document );
		createColumns( main, document );
		createAccordion( main, document );
		removeFileIcon( main, document );
		removeFileSize( main, document );
		handleIFrame( main );

		WebImporter.DOMUtils.remove( main, [
			'.skip-link',
			'.navbar',
			'.tablet-search-container',
			'.mobile-search',
			'.breadcrumb-row',
			'a#main-content',
			'.footer'
		] );

		createMetadataBlock( main, document, url );
		WebImporter.rules.transformBackgroundImages( main, document );
		WebImporter.rules.adjustImageUrls( main, url, params.originalURL );
		WebImporter.rules.convertIcons( main, document );

		updateLinks( main, url );
		updateImageLinks( main, url );

		const results = [];
		const path = ( ( u ) => {
			let p = new URL( url ).pathname;
			if ( p.endsWith( '/' ) ) {
				p = `${p}index`;
			}

			if ( p.startsWith( '/notice-' ) ) {
				p = '/notices'.concat( p );
			} else if ( main.innerHTML.includes( 'Publication Date' ) ) {
				const pArr = p.split( '/' );
				p = '/notices/'.concat( pArr[pArr.length - 1] );
			}

			return decodeURIComponent( p )
				.toLowerCase(  )
				.replace( /\.html$/, '' )
				.replace( /[^a-z0-9/]/gm, '-' );
		} )( url );

		// main page import - "element" is provided, i.e. a docx will be created
		results.push( {
		  element: main,
		  path: path
		} );

		// find pdf links
		main.querySelectorAll( 'a' ).forEach( ( a ) => {
			const href = a.getAttribute( 'href' );
			if ( href && href.endsWith( '.pdf' ) ) {
				const u = new URL( href, url );
				const newPath = WebImporter.FileUtils.sanitizePath( u.pathname ).replace( '/sites/default/', '/' );
				// no "element", the "from" property is provided instead - importer will download the "from" resource as "path"
				results.push( {
					path: newPath,
					from: u.toString(),
				} );

				// update the link to new path on the target host
				// this is required to be able to follow the links in Word
				// you will need to replace "main--repo--owner" by your project setup
				const newHref = new URL( newPath, 'https://main--ndbf-eds--ociostateofnebraska.aem.page' ).toString();
				a.setAttribute( 'href', newPath );
			}
		} );

		return results;
	},
};