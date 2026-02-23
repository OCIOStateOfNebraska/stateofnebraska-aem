/* global WebImporter */
import { replaceButtons, wrapElement, wrapText } from './importer-utils.js';

/**
 * MDS Components - Reusable block transformation utilities for Master Design System components
 *
 * This module provides functions to create Master Design System blocks from DOM Elements/content.
 * Each function focuses on the block structure and variants, while the caller is expected to
 * handle finding and extracting the content.
 *
 * Usage:
 *   import { createAccordion, createColumns } from './mds-components.js';
 *   const table = createAccordion( items );
 */

/**
 * Logs a warning for transformation issues
 * @param {string} blockName - The block being transformed
 * @param {string} message - Warning message
 */
function logWarning( blockName, message ) {
	// eslint-disable-next-line no-console
	console.warn( `[MDS:${blockName}] ${message}` );
}

/**
 * Builds a variant string from options
 * @param {string} baseName - The base block name
 * @param {Array<string>} variants - Array of variant names
 * @returns {string} Block name with variants in parentheses
 */
function buildBlockName( baseName, variants = [] ) {
	if ( variants.length === 0 ) {
		return baseName;
	}
	return `${baseName} (${variants.join( ', ' )})`;
}

// ============================================================================
// BLOCK CREATION FUNCTIONS
// ============================================================================

/**
 * Creates an accordion block table
 * @param {Array<{heading: Element|string, content: Element|string}>} items - Accordion items
 * @param {Object} [options={}] - Optional settings
 * @param {boolean} [options.tabs=false] - Use tabs variant (max 5 items)
 * @returns {HTMLElement|null} The accordion block table or null if invalid
 */
export function createAccordion( items, options = {} ) {
	if ( !items || items.length === 0 ) {
		logWarning( 'accordion', 'No items provided' );
		return null;
	}

	const variants = [];
	if ( options.tabs ) {
		if ( items.length > 5 ) {
			logWarning( 'accordion', 'Tabs variant limited to 5 items, using standard accordion' );
		} else {
			variants.push( 'tabs' );
		}
	}

	const blockName = buildBlockName( 'accordion', variants );
	const rows = items.map( item => [item.heading, item.content] );
	return WebImporter.DOMUtils.createTable( [[blockName], ...rows], document );
}

/**
 * Creates an alert block table
 * @param {Object} config - Alert configuration
 * @param {Element|string} [config.heading] - Alert heading
 * @param {Element|string} config.body - Alert body content
 * @param {string} [config.type='info'] - Alert type: info, warning, error, success, emergency
 * @param {Object} [config.options={}] - Additional options
 * @param {boolean} [config.options.noIcon=false] - Hide the icon
 * @param {boolean} [config.options.slim=false] - Use slim variant
 * @returns {HTMLElement|null} The alert block table or null if invalid
 */
export function createAlert( config ) {
	if ( !config || !config.body ) {
		logWarning( 'alert', 'No body content provided' );
		return null;
	}

	const variants = [];
	const type = config.type || 'info';
	const validTypes = ['info', 'warning', 'error', 'success', 'emergency'];

	if ( validTypes.includes( type ) && type !== 'info' ) {
		variants.push( type );
	}

	if ( config.options?.noIcon ) {
		variants.push( 'no-icon' );
	}

	if ( config.options?.slim ) {
		variants.push( 'slim' );
	}

	const blockName = buildBlockName( 'alert', variants );

	// If no heading, just body in a single cell
	const headingDiv = document.createElement( 'div' );
	const bodyDiv = document.createElement( 'div' );

	if ( config.heading ) {
		if ( typeof config.heading === 'string' ) {
			const p = document.createElement( 'p' );
			p.textContent = config.heading;
			headingDiv.append( p );
		} else {
			headingDiv.append( config.heading );
		}
	}

	if ( typeof config.body === 'string' ) {
		const p = document.createElement( 'p' );
		p.textContent = config.body;
		bodyDiv.append( p );
	} else {
		bodyDiv.append( config.body );
	}

	// Always provide both divs - alert.js expects two sibling divs
	const rows = [[headingDiv, bodyDiv]];

	return WebImporter.DOMUtils.createTable( [[blockName], ...rows], document );
}

/**
 * Creates a backdrop-grid block table
 * @param {Array<{image?: Element, heading?: Element|string, metadata?: Element|string, description?: Element|string, button?: Element}>} cards - Card items
 * @returns {HTMLElement|null} The backdrop-grid block table or null if invalid
 */
export function createBackdropGrid( cards ) {
	if ( !cards || cards.length === 0 ) {
		logWarning( 'backdrop-grid', 'No cards provided' );
		return null;
	}

	const rows = cards.map( card => {
		// Create content container for non-image content
		const contentDiv = document.createElement( 'div' );
		if ( card.heading ) {
			const headingP = wrapElement( card.heading, 'p' );
			contentDiv.append( headingP );
		}
		if ( card.metadata ) {
			const metaP = wrapText( card.metadata, 'p' );
			contentDiv.append( metaP );
		}
		if ( card.description ) {
			const descriptionP = wrapText( card.description, 'p' );
			contentDiv.append( descriptionP );
		}
		if ( card.button ) {
			const buttonP = wrapElement( card.button, 'p' );
			contentDiv.append( buttonP );
		}
		return [card.image, contentDiv];
	} );

	return WebImporter.DOMUtils.createTable( [['backdrop-grid'], ...rows], document );
}

/**
 * Creates a carousel block table
 * @param {Array<{image: Element, heading?: Element}>} slides - Carousel slides (heading optional for image-only)
 * @returns {HTMLElement|null} The carousel block table or null if invalid
 */
export function createCarousel( slides ) {
	if ( !slides || slides.length === 0 ) {
		logWarning( 'carousel', 'No slides provided' );
		return null;
	}

	const rows = slides.map( slide => {
		if ( slide.heading ) {
			return [slide.image, slide.heading];
		}
		return [slide.image];
	} );

	return WebImporter.DOMUtils.createTable( [['carousel'], ...rows], document );
}

/**
 * Creates a columns block table
 * @param {Array<Element|string>} columns - Array of column contents
 * @param {string} [layout] - Optional layout (e.g., 'layout-9-3', 'layout-6-6') - values must sum to 12. If layout is not provided default equal widths are used.
 * @returns {HTMLElement|null} The columns block table or null if invalid
 */
export function createColumns( columns, layout ) {
	if ( !columns || columns.length === 0 ) {
		logWarning( 'columns', 'No columns provided' );
		return null;
	}

	const variants = [];
	if ( layout ) {
		// Validate layout format (should be layout-X-Y where X+Y=12, using dashes)
		// Columns block splits by '-' after removing 'layout-' prefix
		const match = layout.match( /^layout-(\d+(?:-\d+)+)$/ );
		if ( match ) {
			const values = match[1].split( '-' ).map( v => parseInt( v, 10 ) );
			const sum = values.reduce( ( a, b ) => a + b, 0 );
			if ( sum === 12 ) {
				variants.push( layout );
			} else {
				logWarning( 'columns', `Invalid layout "${layout}" - values must sum to 12 (got ${sum})` );
			}
		}
	}

	const blockName = buildBlockName( 'columns', variants );
	return WebImporter.DOMUtils.createTable( [[blockName], columns], document );
}

/**
 * Creates an embed block table
 * @param {string|Element} url - The URL to embed (string or anchor element)
 * @param {Object} [options={}] - Optional settings
 * @param {Element|string} [options.caption] - Optional caption
 * @param {number} [options.width] - Desktop width in pixels
 * @param {number} [options.height] - Desktop height in pixels
 * @param {number} [options.mobileWidth] - Mobile width in pixels
 * @param {number} [options.mobileHeight] - Mobile height in pixels
 * @param {number} [options.tabletWidth] - Tablet width in pixels
 * @param {number} [options.tabletHeight] - Tablet height in pixels
 * @returns {HTMLElement|null} The embed block table or null if invalid
 */
export function createEmbed( url, options = {} ) {
	if ( !url ) {
		logWarning( 'embed', 'No URL provided' );
		return null;
	}

	const variants = [];

	// Add size variants
	if ( options.width ) variants.push( `width-${options.width}` );
	if ( options.height ) variants.push( `height-${options.height}` );
	if ( options.mobileWidth ) variants.push( `mobilewidth-${options.mobileWidth}` );
	if ( options.mobileHeight ) variants.push( `mobileheight-${options.mobileHeight}` );
	if ( options.tabletWidth ) variants.push( `tabletwidth-${options.tabletWidth}` );
	if ( options.tabletHeight ) variants.push( `tabletheight-${options.tabletHeight}` );

	const blockName = buildBlockName( 'embed', variants );

	// Convert string URL to anchor element if needed
	let urlElement = url;
	if ( typeof url === 'string' ) {
		urlElement = document.createElement( 'a' );
		urlElement.href = url;
		urlElement.textContent = url;
	}

	const rows = options.caption
		? [[urlElement, options.caption]]
		: [[urlElement]];

	return WebImporter.DOMUtils.createTable( [[blockName], ...rows], document );
}

/**
 * Creates a figure block table
 * @param {Element} image - The image/picture element
 * @param {Element|string} [caption] - Optional caption
 * @param {string} [alignment] - Optional alignment: 'left' or 'right'
 * @returns {HTMLElement|null} The figure block table or null if invalid
 */
export function createFigure( image, caption, alignment ) {
	if ( !image ) {
		logWarning( 'figure', 'No image provided' );
		return null;
	}

	const variants = [];
	if ( alignment === 'left' || alignment === 'right' ) {
		variants.push( alignment );
	}

	const blockName = buildBlockName( 'figure', variants );

	// The block looks for caption as nextElementSibling of the picture wrapper
	const cellContent = document.createElement( 'div' );
	cellContent.append( image );

	if ( caption ) {
		const captionEl = typeof caption === 'string'
			? ( () => { const p = document.createElement( 'p' ); p.textContent = caption; return p; } )()
			: caption;
		cellContent.append( document.createElement( 'br' ), captionEl );
	}

	return WebImporter.DOMUtils.createTable( [[blockName], [cellContent]], document );
}

/**
 * Creates a form block
 * @param {string} formUrl - The form definition URL
 * @returns {HTMLElement|null} The form block or null if invalid
 */
export function createForm( formUrl ) {
	if ( !formUrl ) {
		logWarning( 'form', 'No form URL provided' );
		return null;
	}

	const link = document.createElement( 'a' );
	link.href = formUrl;
	link.textContent = formUrl;

	return WebImporter.DOMUtils.createTable( [['form'], [link]], document );
}

/**
 * Creates a hero block table (interior page hero)
 * @param {Object} config - Hero configuration
 * @param {Element|string} config.heading - The element or string for the h1 heading
 * @param {Element|ImageConfig} [config.image] - Optional background image/picture element or object with {src: string, alt: string}
 */
export function createHero( main, config ) {
	const heroConfig = {
		heading: config.heading,
		image: config.image || undefined
	};

	createHeroHomepage( main, heroConfig );
}

/**
 * Creates a hero-homepage block (homepage hero variant)
 * @param {Object} config - Hero configuration
 * @param {Element|string} config.heading - The element or string for the h1 heading
 * @param {Element|ImageConfig} [config.image] - Optional background image/picture element or object with {src: string, alt: string}
 * @param {string} [config.description] - Optional description
 * @param {Element} [config.button] - Optional button element (link wrapped for button styling)
 */
export function createHeroHomepage( main, config ) {
	if ( !config || !config.heading ) {
		logWarning( 'hero-homepage', 'No heading provided' );
		return null;
	}

	// Add heading (must be h1)
	let headingElement;
	if ( typeof config.heading === 'string' ) {
		headingElement = document.createElement( 'h1' );
		headingElement.textContent = config.heading;
	} else {
		// Extract text content and create new h1
		headingElement = document.createElement( 'h1' );
		headingElement.textContent = config.heading.innerText || config.heading.textContent;
	}
	main.prepend( headingElement );

	// Add image if provided (becomes background)
	let imageElement;
	if ( config.image ) {
		
		if ( config.image instanceof Element && config.image.tagName === 'IMG' ) {
			imageElement = config.image;
		} else if ( typeof config.image === 'object' && config.image.src ) {
			// Create img element from src/alt object
			imageElement = document.createElement( 'img' );
			imageElement.src = config.image.src;
			imageElement.alt = config.image.alt || '';
		} else {
			logWarning( 'hero-homepage', 'Invalid image format - must be Element or {src, alt} object' );
			return null;
		}
		
		headingElement.after( imageElement );
	}

	// Add description
	let descElement;
	if ( config.description && config.description.length > 0 ) {
		descElement = document.createElement( 'p' );
		descElement.textContent = config.description;
		( imageElement || headingElement ).after( descElement );
	}

	// Add button
	if ( config.button ) {
		config.button.innerText += ' :arrow_forward:'; // Append arrow icon to button text
		( descElement || imageElement || headingElement ).after( config.button );
	}

	( config.button || descElement || imageElement || headingElement ).after( document.createElement( 'hr' ) );
}

/**
 * Creates an icon-button-grid block table
 * @param {Array<{icon: Element, link: Element}>} buttons - Button items
 * @returns {HTMLElement|null} The icon-button-grid block table or null if invalid
 */
export function createIconButtonGrid( buttons ) {
	if ( !buttons || buttons.length === 0 ) {
		logWarning( 'icon-button-grid', 'No buttons provided' );
		return null;
	}

	const rows = buttons.map( button => {
		const cell = document.createElement( 'div' );
		if ( button.icon ) {
			const icon = document.createElement( 'p' );
			icon.append( button.icon );
			cell.append( icon );
		}
		if ( button.link ) {
			const link = document.createElement( 'p' );
			link.append( button.link );
			cell.append( link );
		}
		return [cell];
	} );

	return WebImporter.DOMUtils.createTable( [['icon-button-grid'], ...rows], document );
}

/**
 * Creates an info-card-grid block table
 * @param {Array<{image?: Element, icon?: Element, heading: Element|string, description?: Element|string, button?: Element}>} cards - Card items
 * @param {Object} [options={}] - Optional settings
 * @param {boolean} [options.blue=false] - Use blue variant (icons instead of images)
 * @returns {HTMLElement|null} The info-card-grid block table or null if invalid
 */
export function createInfoCardGrid( cards, options = {} ) {
	if ( !cards || cards.length === 0 ) {
		logWarning( 'info-card-grid', 'No cards provided' );
		return null;
	}

	const variants = options.blue ? ['blue'] : [];
	const blockName = buildBlockName( 'info-card-grid', variants );

	const rows = cards.map( card => {
		const mediaCell = card.image || card.icon || '';
		const contentDiv = document.createElement( 'div' );

		if ( card.heading ) {
			const headingEl = typeof card.heading === 'string'
				? document.createTextNode( card.heading )
				: card.heading;
			contentDiv.append( headingEl );
		}
		if ( card.description ) {
			const descEl = typeof card.description === 'string'
				? document.createTextNode( card.description )
				: card.description;
			contentDiv.append( descEl );
		}
		if ( card.button ) {
			contentDiv.append( card.button );
		}

		return [mediaCell, contentDiv];
	} );

	return WebImporter.DOMUtils.createTable( [[blockName], ...rows], document );
}

/**
 * Creates an intro block table
 * @param {Element|string} content - The intro/lead paragraph content
 * @returns {HTMLElement|null} The intro block table or null if invalid
 */
export function createIntro( content ) {
	if ( !content ) {
		logWarning( 'intro', 'No content provided' );
		return null;
	}

	return WebImporter.DOMUtils.createTable( [['intro'], [content]], document );
}

/**
 * Creates a linked-card-grid block table
 * @param {Array<{heading: Element, image?: Element, description?: Element|string, link: Element}>} cards - Card items
 * @param {Object} [options={}] - Optional settings
 * @param {string} [options.color] - Color variant: 'blue-filled', 'red', 'red-filled', 'green', 'green-filled', 'yellow', 'yellow-filled'
 * @returns {HTMLElement|null} The linked-card-grid block table or null if invalid
 */
export function createLinkedCardGrid( cards, options = {} ) {
	if ( !cards || cards.length === 0 ) {
		logWarning( 'linked-card-grid', 'No cards provided' );
		return null;
	}

	const variants = [];
	if ( options.color ) {
		variants.push( options.color );
	}

	const blockName = buildBlockName( 'linked-card-grid', variants );

	const rows = cards.map( card => {
		const contentDiv = document.createElement( 'div' );

		if ( card.heading ) {
			contentDiv.append( card.heading );
		}

		if ( card.image ) {
			contentDiv.append( card.image );
		}

		if ( card.description ) {
			const descEl = typeof card.description === 'string'
				? document.createTextNode( card.description )
				: card.description;
			contentDiv.append( descEl );
		}

		if ( card.link ) {
			let linkElement = card.link;
			
			// If it's not an anchor tag, try to find one inside
			if ( linkElement.tagName !== 'A' ) {
				linkElement = linkElement.querySelector( 'a' );
			}
			
			// Wrap the anchor tag in a paragraph if found
			if ( linkElement ) {
				const linkP = document.createElement( 'p' );
				linkP.append( linkElement );
				contentDiv.append( linkP );
			}
		}

		return [contentDiv];
	} );

	return WebImporter.DOMUtils.createTable( [[blockName], ...rows], document );
}

/**
 * Creates a manual-collection block table
 * @param {Array<{image?: Element, anchorHeading: Element, description?: Element|string, date?: string}>} items - Collection items
 * @param {Object} [options={}] - Optional settings
 * @param {boolean} [options.bigImages=false] - Use bigger images variant
 * @returns {HTMLElement|null} The manual-collection block table or null if invalid
 */
export function createManualCollection( items, options = {} ) {
	if ( !items || items.length === 0 ) {
		logWarning( 'manual-collection', 'No items provided' );
		return null;
	}

	const variants = options.bigImages ? ['bigger'] : [];
	const blockName = buildBlockName( 'manual-collection', variants );

	const rows = items.map( item => {
		const contentDiv = document.createElement( 'div' );

		if ( item.anchorHeading ) {
			contentDiv.append( item.anchorHeading );
		}
		if ( item.description ) {
			const descEl = typeof item.description === 'string'
				? ( () => { const p = document.createElement( 'p' ); p.textContent = item.description; return p; } )()
				: item.description;
			contentDiv.append( descEl );
		}
		if ( item.date ) {
			const dateP = document.createElement( 'p' );
			dateP.textContent = item.date;
			contentDiv.append( dateP );
		}

		return item.image ? [item.image, contentDiv] : [contentDiv];
	} );

	return WebImporter.DOMUtils.createTable( [[blockName], ...rows], document );
}

/**
 * Creates a summary-box block. 
 * @param {Element|string} content - The summary content or element containing the content
 * @returns {HTMLElement|null} The summary-box block or null if invalid.
 */
export function createSummaryBox( content ) {
	if ( !content ) {
		logWarning( 'summary-box', 'No heading or content provided' );
		return null;
	}

	const contentDiv = document.createElement( 'div' );

	if ( content ) {
		const contentEl = typeof content === 'string'
			? document.createTextNode( content )
			: content;
		replaceButtons( contentEl, 'outline' );
		contentDiv.append( contentEl );
	}
	return WebImporter.DOMUtils.createTable( [['summary-box'], [contentDiv]], document );
}

/**
 * Creates a table block table from row data
 * @param {Array<Array<string|Element>>} rows - Array of rows, where each row is an array of cell contents. First row is the header.
 * @param {Object} [options={}] - Optional settings
 * @param {string} [options.variant] - Variant: 'scrollable' or 'col-header'
 * @param {string} [options.caption] - Optional table caption
 * @returns {HTMLElement|null} The table block table or null if invalid
 */
export function createTable( rows, options = {} ) {
	if ( !rows || rows.length === 0 || rows[0].length === 0 ) {
		logWarning( 'table', 'No table rows provided' );
		return null;
	}

	// Validate all rows have the same number of columns
	const numCols = rows[0].length;
	const unequalRow = rows.findIndex( row => row.length !== numCols );
	if ( unequalRow !== -1 ) {
		logWarning( 'table', `Row ${unequalRow} has ${rows[unequalRow].length} columns, expected ${numCols}` );
		return null;
	}

	const variants = [];
	if ( options.variant === 'scrollable' || options.variant === 'col-header' ) {
		variants.push( options.variant );
	}

	const blockName = buildBlockName( 'table', variants );

	// Build the table element in the required format
	const table = document.createElement( 'table' );

	// Create colgroup
	const colgroup = document.createElement( 'colgroup' );
	for ( let i = 0; i < numCols; i++ ) {
		colgroup.append( document.createElement( 'col' ) );
	}
	table.append( colgroup );

	// Create tbody with all rows (including header row)
	const tbody = document.createElement( 'tbody' );

	rows.forEach( row => {
		const tr = document.createElement( 'tr' );
		row.forEach( cellContent => {
			const td = document.createElement( 'td' );
			const p = document.createElement( 'p' );

			if ( typeof cellContent === 'string' ) {
				p.textContent = cellContent;
			} else if ( cellContent ) {
				p.append( cellContent );
			}

			td.append( p );
			tr.append( td );
		} );
		tbody.append( tr );
	} );

	table.append( tbody );

	const cell = document.createElement( 'div' );
	cell.append( table );

	// Add caption if provided
	if ( options.caption ) {
		const captionP = document.createElement( 'p' );
		captionP.textContent = options.caption;
		cell.append( captionP );
	}

	return WebImporter.DOMUtils.createTable( [[blockName], [cell]], document );
}

/**
 * Creates a section-metadata block table
 * @param {Object} metadata - Metadata key-value pairs
 * @param {string} [metadata.style] - Section style classes
 * @param {string} [metadata.layout] - Section layout (e.g., '8/4', '6/6')
 * @returns {HTMLElement} The section-metadata block table
 */
export function createSectionMetadata( metadata = {} ) {
	const rows = [];

	Object.entries( metadata ).forEach( ( [key, value] ) => {
		if ( value !== undefined && value !== null ) {
			rows.push( [key, value] );
		}
	} );

	return WebImporter.DOMUtils.createTable( [['section metadata'], ...rows], document );
}

/**
 * Creates a stylized-heading element
 * @param {string|Element} text - The heading text or element containing heading text
 * @returns {HTMLElement} The stylized-heading element
 */
export function createStylizedHeading( text ) {
	const heading = document.createElement( 'h2' );
	const em = document.createElement( 'em' );

	let content = text;
	if ( typeof content !== 'string' && content instanceof Element ) {
		content = content.innerText || content.textContent;
	}
	else {
		logWarning( 'stylized-heading', 'Text must be a string or Element' );
	}

	em.textContent = content;
	heading.append( em );
	return heading;
}

/**
 * Creates a metadata block using metadata key-value pairs
 * @param {Object} meta - Metadata key-value pairs
 * @returns {HTMLElement} The metadata block table
 */
export function createMetadata( meta ) {
	return WebImporter.Blocks.getMetadataBlock( document, meta );
}

export default {
	createAccordion,
	createAlert,
	createBackdropGrid,
	createCarousel,
	createColumns,
	createEmbed,
	createFigure,
	createForm,
	createHero,
	createHeroHomepage,
	createIconButtonGrid,
	createInfoCardGrid,
	createIntro,
	createLinkedCardGrid,
	createManualCollection,
	createSummaryBox,
	createTable,
	createSectionMetadata,
	createStylizedHeading,
	createMetadata
};

/**
 * @typedef {Object} ImageConfig
 * @property {string} src - Image source URL
 * @property {string} alt - Image alt text
 */