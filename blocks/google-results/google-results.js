import { loadScript, readBlockConfig, fetchPlaceholders } from '../../scripts/aem.js';
import { domEl, input, span } from '../../scripts/dom-helpers.js';

/**
 * Creates the search submit button with text and icon.
 * @param {object} placeholders - Fetched placeholder strings.
 * @returns {HTMLElement}
 */
function createSearchIcon( placeholders ) {
	const searchTxt = placeholders.searchPlaceholder || 'Search';
	return domEl( 'button', {
		class: 'usa-button',
		type: 'submit',
	},
	span( {
		class: 'usa-search__submit-text',
	}, searchTxt ),
	domEl( 'img', {
		class: 'usa-search__submit-icon',
		alt: searchTxt,
		src: '../../icons/usa-icons-bg/search--white.svg',
	} ),
	);
}

/**
 * Creates the search input field with label, text input, and submit button.
 * @param {object} placeholders - Fetched placeholder strings.
 * @returns {HTMLElement}
 */
function createSearchInput( placeholders ) {
	const searchPlaceholder = ( placeholders.searchPlaceholder || 'Search' ) + '\u2026';
	const searchLabelEl = domEl( 'label', { class: 'usa-sr-only', for: 'google-search-field' } );
	const searchInputEl = input( {
		type: 'search',
		class: 'usa-input usa-text-input',
		id: 'google-search-field',
		name: 'q',
		placeholder: searchPlaceholder,
		'aria-label': searchPlaceholder,
		onkeyup: ( e ) => {
			if ( e.code === 'Escape' ) {
				e.target.value = '';
			}
		},
	} );
	return domEl( 'div', { class: 'usa-input__wrapper' }, searchLabelEl, searchInputEl, createSearchIcon( placeholders ) );
}

/**
 * Creates the USWDS search form.
 * @param {object} placeholders - Fetched placeholder strings.
 * @returns {HTMLFormElement}
 */
function createSearchForm( placeholders ) {
	return domEl( 'form', { class: 'usa-search usa-search--big', role: 'search' }, createSearchInput( placeholders ) );
}

/**
 * Loads and renders Google Programmable Search Engine results
 * with a USWDS search bar for on-page re-searching.
 * Reads `?q=` from the URL automatically.
 *
 * Block options (authored as rows):
 *   search-engine-id  — Google PSE ID value
 *
 * @param {HTMLElement} block
 */
export default async function decorate( block ) {
	const config = readBlockConfig( block );
	const searchEngineId = config['search-engine-id'];
	const showSearchBox = !['false', 'no'].includes( config['show-search-box']?.toLowerCase().trim() );

	block.innerHTML = '';

	const wrapper = domEl( 'div', { class: 'google-results-wrapper' } );
	const searchResults = domEl( 'div', {
		class: 'gcse-searchresults-only',
		'data-queryParameterName': 'q',
	} );
	const loader = domEl( 'div', { class: 'google-results-loading', role: 'status' },
		domEl( 'div', { class: 'google-results-spinner' } )
	);
	const initialQuery = new URLSearchParams( window.location.search ).get( 'q' );
	loader.hidden = !initialQuery;
	wrapper.append( loader, searchResults );

	if ( showSearchBox ) {
		const placeholders = await fetchPlaceholders();
		const searchForm = createSearchForm( placeholders );
		block.append( searchForm, wrapper );

		// Pre-fill input from URL parameter
		const queryInput = searchForm.querySelector( 'input[name="q"]' );
		if ( initialQuery ) {
			queryInput.value = initialQuery;
		}

		// Handle form submission — re-search via Google PSE API
		searchForm.addEventListener( 'submit', ( e ) => {
			e.preventDefault();
			const query = queryInput.value.trim();
			if ( !query ) return;

			loader.hidden = false;
			const element = window.google?.search?.cse?.element?.getElement( 'searchresults-only0' );
			if ( element ) {
				element.execute( query );
			}
		} );
	} else {
		block.append( wrapper );
	}

	window.__gcse = {
		searchCallbacks: {
			web: {
				starting: () => { loader.hidden = false; },
				ready: ( gname, query ) => {
					loader.hidden = true;
					const url = new URL( window.location.href );
					url.searchParams.set( 'q', query );
					window.history.replaceState( {}, '', url.toString() );
					const searchInput = block.querySelector( 'input[name="q"]' );
					if ( searchInput ) searchInput.value = query;
				},
			},
		},
	};

	loadScript(
		`https://cse.google.com/cse.js?cx=${encodeURIComponent( searchEngineId )}`,
		{ async: 'true' },
	).catch( () => {
		loader.hidden = true;
		wrapper.append(
			domEl( 'p', { class: 'google-search-error' }, 'Search is temporarily unavailable.' ),
		);
	} );
}
