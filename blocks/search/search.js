import {
	createOptimizedPicture,
	decorateIcons,
	fetchPlaceholders
} from '../../scripts/aem.js';

const searchParams = new URLSearchParams( window.location.search );

/**
 * Finds the appropriate heading level for search results based on preceding headings
 * @param {HTMLElement} el - The element to start searching from
 * @returns {string} - The appropriate heading tag (H2-H6)
 */
function findNextHeading( el ) {
	let preceedingEl = el.parentElement.previousElement || el.parentElement.parentElement;
	let h = 'H2';
	while ( preceedingEl ) {
		const lastHeading = [...preceedingEl.querySelectorAll( 'h1, h2, h3, h4, h5, h6' )].pop();
		if ( lastHeading ) {
			const level = parseInt( lastHeading.nodeName[1], 10 );
			h = level < 6 ? `H${level + 1}` : 'H6';
			preceedingEl = false;
		} else {
			preceedingEl = preceedingEl.previousElement || preceedingEl.parentElement;
		}
	}
	return h;
}

/**
 * Highlights search terms within text elements by wrapping them in <mark> tags
 * @param {string[]} terms - Array of search terms to highlight
 * @param {HTMLElement[]} elements - Array of elements to search within
 */
function highlightTextElements( terms, elements ) {
	elements.forEach( ( element ) => {
		if ( !element || !element.textContent ) return;

		const matches = [];
		const { textContent } = element;
		terms.forEach( ( term ) => {
			let start = 0;
			let offset = textContent.toLowerCase().indexOf( term.toLowerCase(), start );
			while ( offset >= 0 ) {
				matches.push( { offset, term: textContent.substring( offset, offset + term.length ) } );
				start = offset + term.length;
				offset = textContent.toLowerCase().indexOf( term.toLowerCase(), start );
			}
		} );

		if ( !matches.length ) {
			return;
		}

		matches.sort( ( a, b ) => a.offset - b.offset );
		let currentIndex = 0;
		const fragment = matches.reduce( ( acc, { offset, term } ) => {
			if ( offset < currentIndex ) return acc;
			const textBefore = textContent.substring( currentIndex, offset );
			if ( textBefore ) {
				acc.appendChild( document.createTextNode( textBefore ) );
			}
			const markedTerm = document.createElement( 'mark' );
			markedTerm.textContent = term;
			acc.appendChild( markedTerm );
			currentIndex = offset + term.length;
			return acc;
		}, document.createDocumentFragment() );
		const textAfter = textContent.substring( currentIndex );
		if ( textAfter ) {
			fragment.appendChild( document.createTextNode( textAfter ) );
		}
		element.innerHTML = '';
		element.appendChild( fragment );
	} );
}

/**
 * Fetches data from the specified source URL
 * @param {string} source - URL to fetch data from
 * @returns {Promise<Object|null>} - JSON data or null if fetch fails
 */
export async function fetchData( source ) {
	const response = await fetch( source );
	if ( !response.ok ) {
		// eslint-disable-next-line no-console
		console.error( 'error loading API response', response );
		return null;
	}

	const json = await response.json();
	if ( !json ) {
		// eslint-disable-next-line no-console
		console.error( 'empty API response', source );
		return null;
	}

	return json.data;
}

/**
 * Renders a single search result item
 * @param {Object} result - The search result data
 * @param {string[]} searchTerms - Terms to highlight in the result
 * @param {string} titleTag - HTML tag to use for the result title
 * @returns {HTMLElement} - The rendered search result list item
 */
function renderResult( result, searchTerms, titleTag ) {
	const li = document.createElement( 'li' );
	const a = document.createElement( 'a' );
	a.href = result.path;
	if ( result.image ) {
		const wrapper = document.createElement( 'div' );
		wrapper.className = 'search-result-image';
		const pic = createOptimizedPicture( result.image, '', false, [{ width: '375' }] );
		wrapper.append( pic );
		a.append( wrapper );
	}
	if ( result.title ) {
		const title = document.createElement( titleTag );
		title.className = 'search-result-title';
		const link = document.createElement( 'a' );
		link.href = result.path;
		link.textContent = result.title;
		highlightTextElements( searchTerms, [link] );
		title.append( link );
		a.append( title );
	}
	if ( result.description ) {
		const description = document.createElement( 'p' );
		description.textContent = result.description;
		highlightTextElements( searchTerms, [description] );
		a.append( description );
	}
	li.append( a );
	return li;
}

/**
 * Clears the search results container
 * @param {HTMLElement} block - The search block element
 */
function clearSearchResults( block ) {
	const searchResults = block.querySelector( '.search-results' );
	searchResults.innerHTML = '';
}

/**
 * Clears search results and resets URL parameters
 * @param {HTMLElement} block - The search block element
 */
function clearSearch( block ) {
	clearSearchResults( block );
	if ( window.history.replaceState ) {
		const url = new URL( window.location.href );
		url.search = '';
		searchParams.delete( 'q' );
		window.history.replaceState( {}, '', url.toString() );
	}
}

/**
 * Renders search results in the search block
 * @param {HTMLElement} block - The search block element
 * @param {Object} config - Configuration object with placeholders
 * @param {Array} filteredData - Filtered search results
 * @param {string[]} searchTerms - Search terms to highlight
 */
async function renderResults( block, config, filteredData, searchTerms ) {
	clearSearchResults( block );
	const searchResults = block.querySelector( '.search-results' );
	const headingTag = searchResults.dataset.h;

	if ( filteredData.length ) {
		searchResults.classList.remove( 'no-results' );
		filteredData.forEach( ( result ) => {
			const li = renderResult( result, searchTerms, headingTag );
			searchResults.append( li );
		} );
	} else {
		const noResultsMessage = document.createElement( 'li' );
		searchResults.classList.add( 'no-results' );
		noResultsMessage.textContent = config.placeholders.searchNoResults || 'No results found.';
		searchResults.append( noResultsMessage );
	}
}

/**
 * Comparison function for sorting search results by match position
 * @param {Object} hit1 - First search hit with minIdx property
 * @param {Object} hit2 - Second search hit with minIdx property
 * @returns {number} - Comparison result for sorting
 */
function compareFound( hit1, hit2 ) {
	return hit1.minIdx - hit2.minIdx;
}

/**
 * Filters data based on search terms
 * @param {string[]} searchTerms - Array of search terms
 * @param {Array} data - Data to filter
 * @returns {Array} - Filtered data sorted by relevance
 */
function filterData( searchTerms, data ) {
	const foundInHeader = [];
	const foundInMeta = [];

	data.forEach( ( result ) => {
		let minIdx = -1;

		searchTerms.forEach( ( term ) => {
			const idx = ( result.header || result.title ).toLowerCase().indexOf( term );
			if ( idx < 0 ) return;
			if ( minIdx < idx ) minIdx = idx;
		} );

		if ( minIdx >= 0 ) {
			foundInHeader.push( { minIdx, result } );
			return;
		}

		const metaContents = `${result.title} ${result.description} ${result.path.split( '/' ).pop()} ${result.tags?.join(' ')} ${result.keywords} ${result.h2s?.join(' ')} ${result.body}`.toLowerCase();
		searchTerms.forEach( ( term ) => {
			const idx = metaContents.indexOf( term );
			if ( idx < 0 ) return;
			if ( minIdx < idx ) minIdx = idx;
		} );

		if ( minIdx >= 0 ) {
			foundInMeta.push( { minIdx, result } );
		}
	} );

	return [
		...foundInHeader.sort( compareFound ),
		...foundInMeta.sort( compareFound ),
	].map( ( item ) => item.result );
}

/**
 * Handles search input events
 * @param {Event} e - Input event
 * @param {HTMLElement} block - The search block element
 * @param {Object} config - Configuration object
 */
async function handleSearch( e, block, config ) {
	const searchValue = e.target.value;
	searchParams.set( 'q', searchValue );
	if ( window.history.replaceState ) {
		const url = new URL( window.location.href );
		url.search = searchParams.toString();
		window.history.replaceState( {}, '', url.toString() );
	}

	if ( searchValue.length < 3 ) {
		clearSearch( block );
		return;
	}
	const searchTerms = searchValue.toLowerCase().split( /\s+/ ).filter( ( term ) => !!term );

	const data = await fetchData( config.source );
	const filteredData = filterData( searchTerms, data );
	await renderResults( block, config, filteredData, searchTerms );
}

/**
 * Creates a container for search results
 * @param {HTMLElement} block - The search block element
 * @returns {HTMLElement} - The search results container element
 */
function searchResultsContainer( block ) {
	const results = document.createElement( 'ul' );
	results.className = 'search-results';
	results.dataset.h = findNextHeading( block );
	return results;
}

/**
 * Creates the search input field
 * @param {HTMLElement} block - The search block element
 * @param {Object} config - Configuration object with placeholders
 * @returns {HTMLElement} - The search input element
 */
function searchInput( block, config ) {
	const input = document.createElement( 'input' );
	input.setAttribute( 'type', 'search' );
	input.className = 'search-input';

	const searchPlaceholder = config.placeholders.searchPlaceholder || 'Search...';
	input.placeholder = searchPlaceholder;
	input.setAttribute( 'aria-label', searchPlaceholder );

	input.addEventListener( 'input', ( e ) => {
		handleSearch( e, block, config );
	} );

	input.addEventListener( 'keyup', ( e ) => { if ( e.code === 'Escape' ) { clearSearch( block ); } } );

	return input;
}

/**
 * Creates the search icon element
 * @returns {HTMLElement} - The search icon element
 */
function searchIcon() {
	const icon = document.createElement( 'span' );
	icon.classList.add( 'icon', 'icon-search' );
	return icon;
}

/**
 * Creates the search box container with input and icon
 * @param {HTMLElement} block - The search block element
 * @param {Object} config - Configuration object
 * @returns {HTMLElement} - The search box container
 */
function searchBox( block, config ) {
	const box = document.createElement( 'div' );
	box.classList.add( 'search-box' );
	box.append(
		searchIcon(),
		searchInput( block, config ),
	);

	return box;
}

/**
 * Decorates the search block with search functionality
 * @param {HTMLElement} block - The block element to decorate
 */
export default async function decorate( block ) {
	const placeholders = await fetchPlaceholders();
	const source = block.querySelector( 'a[href]' ) ? block.querySelector( 'a[href]' ).href : '/query-index.json';
	block.innerHTML = '';
	block.append(
		searchBox( block, { source, placeholders } ),
		searchResultsContainer( block ),
	);

	if ( searchParams.get( 'q' ) ) {
		const input = block.querySelector( 'input' );
		input.value = searchParams.get( 'q' );
		input.dispatchEvent( new Event( 'input' ) );
	}

	decorateIcons( block );
}
