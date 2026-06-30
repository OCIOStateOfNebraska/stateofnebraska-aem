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
	console.log( '#getAllResults - query: ', query );
	const response = await fetch( query );
	if ( !response.ok ) {
		throw new Error( `Response status: ${response.status}` );
	}

	const results = await response.json();
	const items = Object.values( results.data )[0]?.items ?? [];
	console.log( 'getAllResults: ', items );
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
	const baseUrl = new URL( queryUrl );

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
 * Derives a CSS class from a persisted-query URL identifying which search it
 * runs — the last two path segments joined with a hyphen. e.g.
 * `/graphql/execute.json/ndbf/search-securities` → `ndbf-search-securities`.
 * Returns `null` if the URL has fewer than two usable path segments.
 */
export function searchClassFromUrl( queryUrl ) {
	const { pathname } = new URL( queryUrl, 'https://placeholder.com' );
	const segments = pathname.split( '/' ).filter( Boolean );
	if ( segments.length < 2 ) return null;
	return segments.slice( -2 ).join( '-' ).toLowerCase();
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
	// Fallback for rows with no pdfAsset.
	const MISSING_PDF_MESSAGE_HTML = 'A copy of this order may be requested from the Department using the <a href="https://ndbf.nebraska.gov/about/contact-us">"Contact Us" form</a>.';

	const result = template.cloneNode( true );
	const pattern = /<([^<>\s]+)>/g;
	const replace = ( str ) => str.replace( pattern, ( _match, name ) => (
		resolvePlaceholder( name, values )
	) );

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
		const newHref = replace( raw );

		// Unresolved `<pdfAsset...>` → row has no PDF, swap in fallback.
		if ( newHref.includes( '<pdfAsset' ) ) {
			a.outerHTML = MISSING_PDF_MESSAGE_HTML;
			return;
		}

		a.setAttribute( 'href', newHref );

		// scripts.js's `decorateButtons` runs over <main> before any block
		// decorator and converts any <a> that's the sole child of its
		// parent into a styled button (adds `usa-button*` to the link and
		// `usa-button__wrap` to the parent <p>/<div>). Undo that for cells
		// rendered through this helper — table links should be plain links
		// unless the author opts in to a button via separate styling.
		[...a.classList].forEach( ( c ) => {
			if ( c.startsWith( 'usa-button' ) ) a.classList.remove( c );
		} );
		a.parentElement?.classList.remove( 'usa-button__wrap' );
	} );

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
	} );
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
		} );

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
			} );
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
 * Builds a loading overlay that covers its positioned parent, dims the
 * content underneath, and centers a spinner. Used on pagination page
 * fetches so the user sees feedback without the table contents being
 * blown away. Styled by `styles/_ne-spinner.scss` (`.ne-spinner__overlay`).
 */
function buildOverlay() {
	const overlay = document.createElement( 'div' );
	overlay.className = 'ne-spinner__overlay';
	overlay.append( buildSpinner() );
	return overlay;
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
 *
 * When `pageSize` is set, two fetches run in parallel:
 *   - a small `limit=pageSize` query — renders the first page as soon as
 *     it lands so the user gets to interactive results fast.
 *   - the unbounded query — its result feeds jump-to-N pagination, which
 *     is wired up once the full set is in memory.
 * The pagination nav is held back until that full set lands; in the gap
 * the user sees page 1 only. This trades one extra server-side filter
 * pass (the small + the big both hit AEM's filter) for fast time-to-first
 * render on large datasets.
 */
async function fetchAndRender( block, { queryUrl, pageSize, heading, headers, rowTemplate, params, emptyMessage } ) {
	const rawParams = params ?? Object.fromEntries( new URLSearchParams( window.location.search ) );
	// Convert M/D/YY date values to ISO so AEM's Calendar filters match.
	const effectiveParams = normalizeParams( rawParams );
	const cellMarkers = rowTemplate.map( ( tmpl ) => findEachMarker( tmpl ) );
	const limit = Number.isFinite( pageSize ) && pageSize > 0 ? pageSize : null;

	// Fire both fetches in parallel. When no limit is set, both refs point
	// at the same promise — `await firstPagePromise` gets the full set and
	// the `.then` on `fullPromise` short-circuits below.
	const fullPromise = getAllResults( queryUrl, undefined, effectiveParams );
	const firstPagePromise = limit ? getAllResults( queryUrl, limit, effectiveParams ) : fullPromise;
	// Suppress unhandled rejection — the outer await on the page query will
	// surface the same error if both fail; if only the full query fails we
	// log it below in the .then chain.
	fullPromise.catch( () => {} );

	const firstPage = await firstPagePromise;

	if ( firstPage.length === 0 && emptyMessage ) {
		const alertBlock = buildBlock( 'alert', [[emptyMessage, '']] );
		alertBlock.classList.add( 'warning' );
		block.replaceChildren( alertBlock );
		decorateBlock( alertBlock );
		await loadBlock( alertBlock );
		return;
	}

	const tableBlock = createTable( headers, rowTemplate, firstPage );

	let headingEl = null;
	if ( heading && firstPage.length > 0 ) {
		const candidate = substitute( heading, firstPage[0] );
		mergeParagraphs( candidate );
		// Skip rendering when the cell had no author content (or every
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

	if ( !limit ) return;

	const tbody = tableBlock.querySelector( 'tbody' );
	let currentOffset = 0;
	let allResults = null;             // populated when the full set lands
	let knownLastPage = firstPage.length < limit;
	let pageFetchInFlight = false;

	// Per-offset page cache so prev/next during the pre-full-set phase is
	// usually instant. Seed it with the first page we already have.
	const pageCache = new Map( [[0, firstPage]] );
	// De-dupe concurrent fetches for the same offset (a click and a
	// prefetch can race for the same page).
	const inFlight = new Map();

	const fetchPage = ( offset ) => {
		if ( pageCache.has( offset ) ) return Promise.resolve( pageCache.get( offset ) );
		if ( inFlight.has( offset ) ) return inFlight.get( offset );
		const p = getAllResults( queryUrl, limit, { ...effectiveParams, offset } )
			.then( ( slice ) => {
				pageCache.set( offset, slice );
				return slice;
			} )
			.finally( () => inFlight.delete( offset ) );
		inFlight.set( offset, p );
		return p;
	};

	// Warm the next two pages in the background so forward clicks hit the
	// cache. No-op once the full set has landed (client-side slicing is
	// already instant) or once we know we're on the last page. Stops
	// scheduling further pages as soon as one comes back short (last page).
	const PREFETCH_AHEAD = 2;
	const prefetchNext = () => {
		if ( allResults || knownLastPage ) return;
		for ( let i = 1; i <= PREFETCH_AHEAD; i += 1 ) {
			const offset = currentOffset + ( i * limit );
			if ( pageCache.has( offset ) || inFlight.has( offset ) ) continue;
			fetchPage( offset ).then( ( slice ) => {
				// A short page means we've prefetched past the end — don't
				// keep requesting offsets beyond it.
				if ( slice.length < limit ) knownLastPage = true;
			} ).catch( () => {} );
		}
	};

	const renderNav = () => {
		block.querySelector( ':scope > .usa-pagination' )?.remove();
		if ( allResults ) {
			// Full data: jump-to-N pagination.
			if ( allResults.length <= limit ) return;
			createPagination( currentOffset, allResults, limit, block );
			return;
		}
		// Pre-full-set: prev/next only. We fake `data.length` so
		// createPagination renders the prev/next arrows correctly; the
		// `.usa-pagination--minimal` class hides the numeric page links.
		if ( knownLastPage && currentOffset === 0 ) return; // single page, no nav
		const fakeLength = knownLastPage
			? currentOffset + limit
			: currentOffset + ( 2 * limit );
		createPagination( currentOffset, { length: fakeLength }, limit, block );
		block.querySelector( ':scope > .usa-pagination' )?.classList.add( 'usa-pagination--minimal' );
	};

	block.addEventListener( 'click', async ( e ) => {
		const link = e.target.closest( '.usa-pagination a' );
		if ( !link ) return;
		e.preventDefault();
		if ( link.classList.contains( 'usa-pagination__link--disabled' ) ) return;
		if ( pageFetchInFlight ) return;

		const newOffset = parseInt( link.dataset.paginationButton, 10 );
		if ( !Number.isFinite( newOffset ) || newOffset < 0 ) return;

		if ( allResults ) {
			// Full set cached — client-side slice.
			if ( newOffset >= allResults.length ) return;
			currentOffset = newOffset;
			const slice = allResults.slice( currentOffset, currentOffset + limit );
			tbody.replaceChildren( ...buildDataRows( rowTemplate, slice, cellMarkers ) );
			renderNav();
			return;
		}

		// Pre-full-set. If the page is already cached (prefetched or visited
		// before), render synchronously with no overlay. Otherwise show the
		// overlay spinner while we fetch it.
		if ( pageCache.has( newOffset ) ) {
			const slice = pageCache.get( newOffset );
			currentOffset = newOffset;
			tbody.replaceChildren( ...buildDataRows( rowTemplate, slice, cellMarkers ) );
			knownLastPage = slice.length < limit;
			renderNav();
			prefetchNext();
			return;
		}

		pageFetchInFlight = true;
		tableBlock.classList.add( 'ne-spinner__outer-wrap' );
		const overlay = buildOverlay();
		tableBlock.append( overlay );
		try {
			// Race the targeted page request against the full set. If the
			// full set lands first (or during the wait), slice the requested
			// page from it rather than blocking on the slower limited request.
			await Promise.race( [
				fetchPage( newOffset ).catch( () => {} ),
				fullPromise.catch( () => {} ),
			] );

			if ( allResults ) {
				// Full set is here — serve the requested page from it. The
				// fullPromise handler already upgraded the nav to jump-to-N.
				if ( newOffset < allResults.length ) {
					currentOffset = newOffset;
					const slice = allResults.slice( currentOffset, currentOffset + limit );
					tbody.replaceChildren( ...buildDataRows( rowTemplate, slice, cellMarkers ) );
				}
				renderNav();
				return;
			}

			// Page request won the race; it's cached now so this is instant.
			const slice = await fetchPage( newOffset );
			if ( slice.length === 0 && newOffset > currentOffset ) {
				// Walked past the end. Disable next and keep the user on the
				// last real page.
				knownLastPage = true;
				renderNav();
				return;
			}
			currentOffset = newOffset;
			tbody.replaceChildren( ...buildDataRows( rowTemplate, slice, cellMarkers ) );
			knownLastPage = slice.length < limit;
			renderNav();
			prefetchNext();
		} finally {
			overlay.remove();
			pageFetchInFlight = false;
		}
	} );

	renderNav();
	prefetchNext();

	// Upgrade to jump-to-N once the full set lands. tbody keeps showing
	// whichever page the user navigated to; only the nav re-renders. The
	// full set is now the single source of truth, so the per-page cache is
	// dropped — subsequent clicks slice from `allResults` and never read it.
	fullPromise.then( ( all ) => {
		allResults = all;
		pageCache.clear();
		inFlight.clear();
		renderNav();
	} ).catch( ( err ) => {
		console.error( 'Failed to fetch full result set for pagination:', err );
	} );
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
	} );
}
