import { createStylizedHeading } from '../mds-blocks.js';
const createMetadataBlock = ( main, document ) => {
	const meta = {
        Description : 'Nebraska Real Property Appraiser Board '
    };

    const title = ( document.querySelector('title').textContent.split( ':' )[1] ) || document.querySelector( '.page_title_large' )?.textContent;  
    if (title) {
        meta.Title = title;
        meta.Description += ` - ${title} page`;
    }
    const h1 = document.createElement('h1');
    h1.textContent = meta.Title;
    main.prepend(h1);
	// helper to create the metadata block
	const block = WebImporter.Blocks.getMetadataBlock( document, meta );

	// append the block to the main element
	main.append( block );

	// returning the meta object might be usefull to other rules
	return meta;
};

const normalizeURLs = ( main, pageUrl ) => {
    pageUrl = pageUrl.replace( 'localhost:3001', 'main--nrpab--ociostateofnebraska.aem.page').toLowerCase();
    const URLs = Array.from(main.querySelectorAll('a')).map(a => {
        a.href = a.href.replace( 'localhost:3001', 'main--nrpab--ociostateofnebraska.aem.page').replace( '.html', '' );
        return a;
    });
    URLs.forEach(url => {
        if(url.href.includes('main--nrpab--ociostateofnebraska.aem.page')) {
            url.href = url.href.toLowerCase().replaceAll('_', '-');
        }
        if (url.href.endsWith('.pdf')) {
            url.href = `${pageUrl.split( '?' )[0].split('/').slice(0, -1).join('/')}/docs/${url.href.split('/').pop()}`;
        }
    });
};

const createHeading = ( main ) => {
    main.querySelectorAll('.page_title_large').forEach( heading => {
        const stylizedHeading = createStylizedHeading( heading.textContent );
        heading.replaceWith(stylizedHeading);
    });
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
		createMetadataBlock( main, document );
        normalizeURLs( main, url );
        createHeading( main );
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