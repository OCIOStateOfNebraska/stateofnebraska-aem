import { loadScript, readBlockConfig, fetchPlaceholders } from '../../scripts/aem.js';
import { domEl, div, input, span } from '../../scripts/dom-helpers.js';

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
	const searchPlaceholder = ( placeholders.searchPlaceholder || 'Search' ) + '...';
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
 * Injects "< Previous" / "Next >" links into the Google CSE pagination.
 * Uses a MutationObserver so links are (re-)added whenever Google re-renders
 * the `.gsc-cursor` element (e.g. after a page change).
 * @param {HTMLElement} wrapper - The container to observe.
 */
function addPaginationNav( wrapper ) {
	const observer = new MutationObserver( () => {
		wrapper.querySelectorAll( '.gsc-cursor' ).forEach( ( cursor ) => {
			if ( cursor.querySelector( '.gsc-cursor-nav' ) ) return;

			const pages = [ ...cursor.querySelectorAll( '.gsc-cursor-page' ) ];
			const currentIndex = pages.findIndex( ( p ) => p.classList.contains( 'gsc-cursor-current-page' ) );

			const handleNav = ( targetPage ) => ( e ) => {
				if ( e.type === 'click' || e.key === 'Enter' || e.key === ' ' ) {
					e.preventDefault();
					targetPage.click();
				}
			};

			const prevLink = div(
				{ class: 'gsc-cursor-nav gsc-cursor-prev', role: 'link', tabindex: '0' },
				'\u2039 Previous',
			);
			const nextLink = div(
				{ class: 'gsc-cursor-nav gsc-cursor-next', role: 'link', tabindex: '0' },
				'Next \u203A',
			);

			if ( currentIndex > 0 ) {
				const nav = handleNav( pages[currentIndex - 1] );
				prevLink.addEventListener( 'click', nav );
				prevLink.addEventListener( 'keydown', nav );
			} else {
				prevLink.setAttribute( 'aria-disabled', 'true' );
			}

			if ( currentIndex < pages.length - 1 ) {
				const nav = handleNav( pages[currentIndex + 1] );
				nextLink.addEventListener( 'click', nav );
				nextLink.addEventListener( 'keydown', nav );
			} else {
				nextLink.setAttribute( 'aria-disabled', 'true' );
			}

			cursor.prepend( prevLink );
			cursor.append( nextLink );
		} );
	} );

	observer.observe( wrapper, { childList: true, subtree: true } );
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
	wrapper.append( searchResults );

	if ( showSearchBox ) {
		const placeholders = await fetchPlaceholders();
		const searchForm = createSearchForm( placeholders );
		block.append( searchForm, wrapper );

		// Pre-fill input from URL parameter
		const queryInput = searchForm.querySelector( 'input[name="q"]' );
		const initialQuery = new URLSearchParams( window.location.search ).get( 'q' );
		if ( initialQuery ) {
			queryInput.value = initialQuery;
		}

		// Handle form submission — re-search via Google PSE API
		searchForm.addEventListener( 'submit', ( e ) => {
			e.preventDefault();
			const query = queryInput.value.trim();
			if ( !query ) return;

			const url = new URL( window.location.href );
			url.searchParams.set( 'q', query );
			window.history.replaceState( {}, '', url.toString() );

			const element = google.search.cse.element.getElement( 'searchresults-only0' );
			if ( element ) {
				element.execute( query );
			}
		} );
	} else {
		block.append( wrapper );
	}

	loadScript(
		`https://cse.google.com/cse.js?cx=${encodeURIComponent( searchEngineId )}`,
		{ async: 'true' },
	).catch( () => {
		wrapper.append(
			domEl( 'p', { class: 'google-search-error' }, 'Search is temporarily unavailable.' ),
		);
	} );
}
