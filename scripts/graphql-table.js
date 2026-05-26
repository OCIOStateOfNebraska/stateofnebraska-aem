import { buildBlock, decorateBlock, loadBlock } from './aem.js';
import createPagination from '../blocks/search/search-pagination.js';

/**
 * Persisted-query GET helper. Fetches the URL, validates the response,
 * and extracts the items array regardless of the top-level wrapper name
 * (e.g. `institutionList`, `securitiesRegistrationList`, etc.) — AEM
 * GraphQL returns `data.<wrapper>.items` and we grab whichever wrapper
 * is first.
 */
export async function getAllResults( queryUrl, pageSize, params ) {
	const query = buildUrl( queryUrl, pageSize, params );
	console.log( "#getAllResults - query: ", query );
	const response = await fetch( query );
	if ( !response.ok ) {
		throw new Error( `Response status: ${response.status}` );
	}

	const results = await response.json();
	const items = Object.values( results.data )[0]?.items ?? [];
	console.log( "getAllResults: ", items );
	return items;
}

/**
 * Build the persisted-query URL.
 *
 * @param {string} queryUrl - the authored anchor href pointing at the persisted query
 * @param {number} [pageSize] - optional `;limit=N;` parameter. Omit for "all results".
 * @param {{[k: string]: string}} [params] - additional `;key=value;` parameters
 */
export function buildUrl( queryUrl, pageSize, params = {} ) {
	const BASE_HOST = 'https://beta-ndbf.nebraska.gov';
	const queryPath = new URL( queryUrl, 'https://placeholder.com' ).pathname;
	const baseUrl = `${BASE_HOST}${queryPath}`;

	// Build raw `;key=value;…` segments with literal characters; we encode
	// the whole string in one pass at the end. This matches the official
	// adobe/aem-headless-client-js SDK — AEM URL-decodes the path once at
	// the HTTP layer, recovering literal `;`, `=`, spaces, etc., then runs
	// its matrix-param parser. Per-value encoding (encoding only the value
	// half) leaves the matrix parser seeing `State%20Bank` literally and
	// the filter never matches.
	const segments = [];
	if ( pageSize ) {
		segments.push( `;limit=${pageSize}` );
	}
	for ( const [key, value] of Object.entries( params ) ) {
		if ( value == null || value === '' ) continue;
		const v = typeof value === 'string' ? value : JSON.stringify( value );
		segments.push( `;${key}=${v}` );
	}

	if ( segments.length === 0 ) return baseUrl;
	return `${baseUrl}${encodeURIComponent( `${segments.join( '' )};` )}`;
}

/**
 * Walks a dot-separated path through `root`. Returns `{ exists, value }`:
 *   - `exists` is true iff every segment of the path resolved cleanly
 *     (each intermediate was an object with the named property, and the
 *     leaf property is an own property of its parent).
 *   - `value` is the leaf value (may be null/'' for falsy-known cases).
 * Broken paths (missing intermediate, null intermediate, undefined leaf)
 * yield `{ exists: false, value: undefined }`.
 */
function resolveDotPath( key, root ) {
	const parts = key.split( '.' );
	let current = root;
	for ( const part of parts ) {
		if ( current == null || typeof current !== 'object'
			|| !Object.prototype.hasOwnProperty.call( current, part ) ) {
			return { exists: false, value: undefined };
		}
		current = current[part];
	}
	return { exists: true, value: current };
}

/**
 * Named `Intl.DateTimeFormat` option presets for the `date:` directive.
 * Add new entries here to expose them in templates as `<date:field:NAME>`.
 */
const DATE_FORMATS = {
	short: { month: '2-digit', day: '2-digit', year: 'numeric' },   // 06/30/2025
	medium: { month: 'short', day: 'numeric', year: 'numeric' },    // Jun 30, 2025
	long: { month: 'long', day: 'numeric', year: 'numeric' },       // June 30, 2025
};

function formatDate( value, formatName ) {
	if ( value == null || value === '' ) return '';
	const str = String( value );
	// For ISO `YYYY-MM-DD` (with or without time), parse as local so we
	// don't shift a day due to UTC midnight in negative-offset timezones.
	const iso = str.match( /^(\d{4})-(\d{2})-(\d{2})/ );
	const d = iso
		? new Date( parseInt( iso[1], 10 ), parseInt( iso[2], 10 ) - 1, parseInt( iso[3], 10 ) )
		: new Date( str );
	if ( Number.isNaN( d.getTime() ) ) return value;
	const opts = DATE_FORMATS[formatName] || DATE_FORMATS.short;
	return new Intl.DateTimeFormat( 'en-US', opts ).format( d );
}

/**
 * Resolve a single key in a placeholder chain. Handles the `date:` directive
 * by formatting the resolved value, otherwise delegates to `resolveDotPath`.
 *
 *   resolveKey('date:filingDate',         values) → "06/30/2025"   (short format, the default)
 *   resolveKey('date-long:filingDate',    values) → "June 30, 2025"
 *   resolveKey('date-medium:filingDate',  values) → "Jun 30, 2025"
 *   resolveKey('date:address.lastUpdated', values) → "06/30/2025"  (dot-path inside directive)
 *
 * The format-name is baked into the directive (`date-FORMAT:`) instead of
 * appended as a second colon-segment, because the project's icon
 * autoblocker treats anything between two colons as an icon name and would
 * try to load `:filingDate:` as an icon image.
 */
function resolveKey( key, values ) {
	const match = key.match( /^date(?:-(\w+))?:/ );
	if ( !match ) return resolveDotPath( key, values );
	const formatName = match[1] || 'short';
	const path = key.slice( match[0].length );
	const { exists, value } = resolveDotPath( path, values );
	if ( !exists ) return { exists: false, value: undefined };
	return { exists: true, value: formatDate( value, formatName ) };
}

/**
 * Resolve a `<placeholder>` name to a string using JS short-circuit semantics.
 *
 *   resolvePlaceholder('a',                  values) → values.a            (or literal `<a>` if `a` is not a key)
 *   resolvePlaceholder('a.b',                values) → values.a.b          (dot walks nested objects)
 *   resolvePlaceholder('date:filingDate',    values) → "06/30/2025"        (date directive — short format, default)
 *   resolvePlaceholder('date-medium:filingDate', values) → "Jun 30, 2025"
 *   resolvePlaceholder('date-long:filingDate',   values) → "June 30, 2025"
 *   resolvePlaceholder('a|b|c',              values) → values.a || values.b || values.c   (first truthy wins)
 *   resolvePlaceholder('a&b&c',              values) → values.a && values.b && values.c   (all truthy → last; else '')
 *
 * Operators cannot be mixed in a single placeholder; `&` takes precedence
 * when both characters are present. Dot-notation and the `date[-FORMAT]:`
 * directive are independent of the operators — any chained key may itself
 * be a dot-path or directive (e.g. `<date:a.b|date:c.d>`).
 */
export function resolvePlaceholder( name, values ) {
	const isAnd = name.includes( '&' );
	const keys = name.split( isAnd ? '&' : '|' );

	if ( isAnd ) {
		let last;
		for ( const key of keys ) {
			last = resolveKey( key, values ).value;
			if ( !last ) return '';
		}
		return last;
	}

	for ( const key of keys ) {
		const { exists, value } = resolveKey( key, values );
		if ( exists && value ) return value;
	}
	return keys.some( ( k ) => resolveKey( k, values ).exists ) ? '' : `<${name}>`;
}

/**
 * Returns a clone of `template` with `<name>` placeholders replaced. See
 * `resolvePlaceholder` for the placeholder grammar. Substitution runs on:
 *
 *  - Text nodes (anywhere in the tree).
 *  - `href` attributes on `<a>` elements — so a template like
 *    `<a href="/detail?id=<institutionId>">View</a>` resolves the id at
 *    render time. Lets authors embed full URL templates with no separate
 *    detail-page configuration row.
 */
export function substitute( template, values ) {
	const result = template.cloneNode( true );
	const pattern = /<([^<>\s]+)>/g;
	const replace = ( str ) => str.replace( pattern, ( _match, name ) => (
		resolvePlaceholder( name, values )
	));

	const walker = document.createTreeWalker( result, NodeFilter.SHOW_TEXT );
	for ( let node = walker.nextNode(); node; node = walker.nextNode() ) {
		node.nodeValue = replace( node.nodeValue );
	}

	result.querySelectorAll( 'a[href]' ).forEach( ( a ) => {
		// The docx hyperlink editor percent-encodes angle brackets typed
		// into a URL, so `<institutionId>` arrives here as
		// `%3CinstitutionId%3E`. Normalize back to literal brackets so the
		// same placeholder regex catches both forms.
		const raw = a.getAttribute( 'href' )
			.replace( /%3C/gi, '<' )
			.replace( /%3E/gi, '>' );
		a.setAttribute( 'href', replace( raw ) );

		// scripts.js's `decorateButtons` runs over <main> before any block
		// decorator and converts any <a> that's the sole child of its
		// parent into a styled button (adds `usa-button*` to the link and
		// `usa-button__wrap` to the parent <p>/<div>). Undo that for cells
		// rendered through this helper — table links should be plain links
		// unless the author opts in to a button via separate styling.
		[...a.classList].forEach( ( c ) => {
			if ( c.startsWith( 'usa-button' ) ) a.classList.remove( c );
		});
		a.parentElement?.classList.remove( 'usa-button__wrap' );
	});

	return result;
}

/**
 * Merges top-level <p> children of `element` into a single <p> joined by
 * <br>s. Mutates `element` in place.
 *
 *  - Empty <p>s (no text and no element children) are dropped entirely.
 *  - A spacer <p> (text content exactly `<br/>`) contributes a <br> slot
 *    but no content, so the surrounding line-breaks render as a blank
 *    line inside the merged paragraph. The trailing `/` makes `br/`
 *    non-identifier-safe, so it can never collide with a real field name.
 *  - Other <p>s contribute their children, followed by a <br> separator
 *    (except for the last kept paragraph).
 */
export function mergeParagraphs( element ) {
	const paragraphs = [...element.querySelectorAll( ':scope > p' )];
	const kept = paragraphs.filter( ( p ) => p.textContent.trim() !== '' || p.children.length > 0 );

	if ( kept.length === 0 ) {
		paragraphs.forEach( ( p ) => p.remove() );
		return;
	}

	const merged = document.createElement( 'p' );
	kept.forEach( ( p, i ) => {
		if ( p.textContent.trim() !== '<br/>' ) {
			merged.append( ...p.childNodes );
		}
		if ( i < kept.length - 1 ) {
			merged.append( document.createElement( 'br' ) );
		}
	});
	paragraphs.forEach( ( p ) => p.remove() );
	element.append( merged );
}

/**
 * Looks for a `<each:NAME>` directive in `template`'s text content. Returns
 * `{ key, stripped }` where `stripped` is a clone of the template with the
 * marker removed, or `null` if no directive is present.
 *
 * The directive can sit anywhere in the cell (typically on its own line at
 * the top). Only the first occurrence is honored; one loop per cell.
 */
function findEachMarker( template ) {
	const match = template.textContent.match( /<each:([^<>\s]+)>/ );
	if ( !match ) return null;

	const stripped = template.cloneNode( true );
	const walker = document.createTreeWalker( stripped, NodeFilter.SHOW_TEXT );
	for ( let node = walker.nextNode(); node; node = walker.nextNode() ) {
		node.nodeValue = node.nodeValue.replace( /<each:[^<>\s]+>/g, '' );
	}
	return { key: match[1], stripped };
}

/**
 * Builds an array of <tr> data rows for `items` using `rowTemplate`. Pulled
 * out of `createTable` so pagination can rebuild rows without re-running
 * the whole table block lifecycle.
 *
 * `cellMarkers` is the result of mapping `findEachMarker` over `rowTemplate`
 * once at the call site (so we don't reparse loop markers per item).
 *
 * Loop cells: a cell template containing `<each:NAME>` causes that column to
 * be repeated once per element of `item[NAME]`, producing one extra <tr> per
 * iteration. Other columns in the same item are rowspan'd across the loop's
 * rows. Inside each iteration, placeholders resolve against
 * `{ ...item, ...subItem }` — the inner item's fields win on conflict.
 */
function buildDataRows( rowTemplate, items, cellMarkers ) {
	const rows = [];
	for ( const item of items ) {
		const cellPlans = cellMarkers.map( ( marker, idx ) => {
			if ( !marker ) return { kind: 'static', template: rowTemplate[idx] };
			const subItems = item[marker.key];
			return {
				kind: 'loop',
				template: marker.stripped,
				subItems: Array.isArray( subItems ) ? subItems : [],
			};
		});

		const loopCounts = cellPlans
			.filter( ( p ) => p.kind === 'loop' )
			.map( ( p ) => p.subItems.length );
		const rowCount = loopCounts.length > 0 ? Math.max( 1, ...loopCounts ) : 1;

		for ( let r = 0; r < rowCount; r += 1 ) {
			const tr = document.createElement( 'tr' );
			cellPlans.forEach( ( plan ) => {
				if ( plan.kind === 'static' ) {
					// Static cell appears in the first row only; rowspan covers the rest.
					if ( r > 0 ) return;
					const td = document.createElement( 'td' );
					if ( rowCount > 1 ) td.rowSpan = rowCount;
					const populated = substitute( plan.template, item );
					mergeParagraphs( populated );
					td.append( ...populated.childNodes );
					tr.append( td );
				} else {
					const td = document.createElement( 'td' );
					const subItem = plan.subItems[r];
					if ( subItem ) {
						const populated = substitute( plan.template, { ...item, ...subItem } );
						mergeParagraphs( populated );
						td.append( ...populated.childNodes );
					}
					tr.append( td );
				}
			});
			rows.push( tr );
		}
	}
	return rows;
}

/**
 * Builds an un-decorated `table` block element from `headers` (column titles)
 * and `rowTemplate` (one cell-template <div> per column), populated from
 * `items`. Caller is responsible for attaching the block to the DOM and
 * running decorateBlock/loadBlock — or use `renderTable` which does all of it.
 *
 * The first row of the produced <table> holds the headers as <td> cells —
 * the table block's decorator will convert them to <th scope="col">.
 *
 * When any cell has a `<each:NAME>` loop marker, the produced block is given
 * the `scrollable` class so the table block skips its stacked-mobile path
 * (which assumes one <td> per row and would break on rowspan'd cells).
 */
export function createTable( headers, rowTemplate, items ) {
	const table = document.createElement( 'table' );
	const tbody = document.createElement( 'tbody' );
	table.append( tbody );

	const headerRow = document.createElement( 'tr' );
	for ( const header of headers ) {
		const td = document.createElement( 'td' );
		td.textContent = header;
		headerRow.append( td );
	}
	tbody.append( headerRow );

	const cellMarkers = rowTemplate.map( ( tmpl ) => findEachMarker( tmpl ) );
	const hasLoop = cellMarkers.some( ( m ) => m !== null );

	buildDataRows( rowTemplate, items, cellMarkers ).forEach( ( tr ) => tbody.append( tr ) );

	const tableBlock = buildBlock( 'table', [[table]] );
	if ( hasLoop ) {
		tableBlock.classList.add( 'scrollable' );
	}
	// Sentinel <p>: the table block's decorator pulls the first <p> it finds
	// and turns it into a <caption>, which would steal the first cell's
	// content. The renderTable caller strips the resulting empty <caption>
	// after loadBlock resolves.
	tableBlock.prepend( document.createElement( 'p' ) );
	return tableBlock;
}

/**
 * Builds the spinner element shown while the persisted-query fetch is in
 * flight. Styled by `styles/_ne-spinner.scss`; positioning lives in each
 * consuming block's CSS.
 */
function buildSpinner() {
	const spinner = document.createElement( 'div' );
	spinner.className = 'ne-spinner';
	spinner.setAttribute( 'role', 'status' );
	spinner.setAttribute( 'aria-label', 'Loading results' );
	return spinner;
}

/**
 * Convert a M/D/YY (or M/D/YYYY) value to ISO `YYYY-MM-DD`. Falls back to
 * the original string if it doesn't parse as a date. Used by `normalizeParams`
 * to bridge between the form-builder's date output and AEM's `Calendar`
 * input format.
 */
function toIsoDate( value ) {
	if ( !value ) return value;
	const d = new Date( value );
	if ( Number.isNaN( d.getTime() ) ) return value;
	// Use local date components so MM/DD/YYYY doesn't shift a day via UTC.
	const y = d.getFullYear();
	const m = String( d.getMonth() + 1 ).padStart( 2, '0' );
	const day = String( d.getDate() ).padStart( 2, '0' );
	return `${y}-${m}-${day}`;
}

/**
 * Pattern-detects date-shaped string values (`N/N/NN` or `N/N/NNNN`) and
 * rewrites them to ISO so AEM's `Calendar` filters match. Everything else
 * passes through untouched.
 */
function normalizeParams( params ) {
	const isDateLike = ( v ) => typeof v === 'string' && /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test( v );
	const out = {};
	for ( const [k, v] of Object.entries( params ) ) {
		out[k] = isDateLike( v ) ? toIsoDate( v ) : v;
	}
	return out;
}

/**
 * Renders an `alert error` block into `block`, used when the fetch fails.
 */
async function renderErrorAlert( block ) {
	const alertBlock = buildBlock( 'alert', [['Unable to load results. Please try again.', '']] );
	alertBlock.classList.add( 'error' );
	block.replaceChildren( alertBlock );
	decorateBlock( alertBlock );
	await loadBlock( alertBlock );
}

/**
 * Does the actual work: fetch, choose between alert/heading/table, wire
 * pagination. Awaited internally by `renderTable`'s catch handler but not
 * by callers — `renderTable` returns immediately after showing the spinner.
 */
async function fetchAndRender( block, { queryUrl, pageSize, heading, headers, rowTemplate, params, emptyMessage } ) {
	const rawParams = params ?? Object.fromEntries( new URLSearchParams( window.location.search ) );
	const effectiveParams = normalizeParams( rawParams );
	// Always fetch the full result set — `pageSize` controls client-side
	// pagination, not the persisted-query limit. AEM's institutionList has
	// no totalCount field, so to enable jump-to-N we need everything.
	const allResults = await getAllResults( queryUrl, undefined, effectiveParams );

	if ( allResults.length === 0 && emptyMessage ) {
		const alertBlock = buildBlock( 'alert', [[emptyMessage, '']] );
		alertBlock.classList.add( 'warning' );
		block.replaceChildren( alertBlock );
		decorateBlock( alertBlock );
		await loadBlock( alertBlock );
		return;
	}

	const cellMarkers = rowTemplate.map( ( tmpl ) => findEachMarker( tmpl ) );
	const limit = Number.isFinite( pageSize ) && pageSize > 0 ? pageSize : null;
	const paginated = limit !== null && allResults.length > limit;

	const firstSlice = paginated ? allResults.slice( 0, limit ) : allResults;
	const tableBlock = createTable( headers, rowTemplate, firstSlice );

	let headingEl = null;
	if ( heading && allResults.length > 0 ) {
		const candidate = substitute( heading, allResults[0] );
		mergeParagraphs( candidate );
		// Skip rendering when the cell has no author content (or every
		// placeholder resolved to empty) — no callout for empty data.
		if ( candidate.textContent.trim() !== '' ) {
			candidate.classList.add( 'graphql-heading' );
			headingEl = candidate;
		}
	}

	block.replaceChildren( ...( headingEl ? [headingEl, tableBlock] : [tableBlock] ) );
	decorateBlock( tableBlock );
	await loadBlock( tableBlock );
	tableBlock.querySelector( 'caption' )?.remove();

	if ( !paginated ) return;

	const tbody = tableBlock.querySelector( 'tbody' );
	let currentOffset = 0;

	const renderPaginationNav = () => {
		block.querySelector( ':scope > .usa-pagination' )?.remove();
		createPagination( currentOffset, allResults, limit, block );
	};

	const renderPage = () => {
		const slice = allResults.slice( currentOffset, currentOffset + limit );
		tbody.replaceChildren( ...buildDataRows( rowTemplate, slice, cellMarkers ) );
		renderPaginationNav();
	};

	block.addEventListener( 'click', ( e ) => {
		const link = e.target.closest( '.usa-pagination a' );
		if ( !link ) return;
		e.preventDefault();
		if ( link.classList.contains( 'usa-pagination__link--disabled' ) ) return;
		const newOffset = parseInt( link.dataset.paginationButton, 10 );
		if ( !Number.isFinite( newOffset ) || newOffset < 0 || newOffset >= allResults.length ) return;
		currentOffset = newOffset;
		renderPage();
	});

	renderPaginationNav();
}

/**
 * One-stop entry point used by `graphql-results` and `graphql-detail` blocks.
 * Shows a spinner immediately and returns so the rest of the page can finish
 * loading. The persisted-query fetch runs in the background; when it lands,
 * the spinner is replaced with one of:
 *
 *  - `alert warning` block carrying `emptyMessage` (if results are empty
 *    and `emptyMessage` is set),
 *  - the heading template (if provided) + the data table (with pagination
 *    when `pageSize` is given and total > pageSize),
 *  - or, on fetch failure, an `alert error` block.
 *
 * When `heading` is provided (typically by `graphql-detail`), it is
 * substituted against the first result and rendered as a sibling above the
 * table inside `block`. Styled via `.graphql-heading`.
 *
 * @param {HTMLElement} block - the host block element to replace with the table
 * @param {Object} config
 * @param {string} config.queryUrl - persisted-query URL (authored anchor href)
 * @param {number} [config.pageSize] - client-side page size; omit to render all results
 * @param {HTMLElement} [config.heading] - optional template rendered above the table, substituted against the first result
 * @param {Array<string>} config.headers - column titles
 * @param {Array<HTMLElement>} config.rowTemplate - one cell-template element per column
 * @param {{[k: string]: string}} [config.params] - additional query params for the persisted query
 * @param {string} [config.emptyMessage] - when results come back empty, render an `alert warning` block with this message in place of the table
 */
export function renderTable( block, config ) {
	block.replaceChildren( buildSpinner() );
	// Fire-and-forget: don't await. Returns immediately so EDS section load
	// proceeds without blocking on the persisted-query fetch.
	fetchAndRender( block, config ).catch( ( err ) => {
		console.error( 'renderTable failed:', err );
		renderErrorAlert( block );
	});
}
