import { decorateIcons, fetchPlaceholders } from '../../scripts/aem.js';
import { li, span, ul, input, domEl } from '../../scripts/dom-helpers.js';
import ffetch from '../../scripts/ffetch.js';
import Events from '../../scripts/Events.class.js';

import { Fuse } from '../../scripts/deps/bundle-uswds.js';
import renderResult from './search-result.js';
import createPagination from './search-pagination.js';

/**
 * @file search.js
 * @description This module implements a search block that allows users to search for content within the site.
 * It provides functionalities for creating a search UI, handling user input, filtering and sorting search results,
 * rendering those results, and providing pagination.  It uses Fuse.js for fuzzy matching.
 */

// Settings for search
const SEARCH_RESULTS_CONTAINER_CLASS = 'search-results usa-collection';
const NO_RESULTS_CLASS = 'no-results';
const OFFSET_PARAM = 'offset';
const QUERY_PARAM = 'q';
const SEARCH_SETTINGS_BOX = 'show-search-box';
const SEARCH_SETTINGS_PAGINATION = 'show-pagination';
const SEARCH_SETTINGS_SORTKEY = 'sort-key';
const SEARCH_SETTINGS_COUNT = 'result-count';
const SEARCH_SETTINGS_DESCRIPTION = 'show-description';
const SEARCH_SETTINGS_FILTERTAG = 'filter-by';

// FUSE.js relevance scoring options https://www.fusejs.io/concepts/scoring-theory.html#fuzziness-score
const fuseOptionsRelevance = {
	includeScore: true,
	includeMatches: true,
	threshold: 0.4,
	minMatchCharLength: 3,
	keys: [
		{ name: 'path', weight: 0.2 },
		{ name: 'body', weight: 0.1 },
		{ name: 'tags', weight: 0.5 },
		{ name: 'keywords', weight: 0.5 },
		{ name: 'h2s', weight: 0.2 },
		{ name: 'description', weight: 0.5 },
		{ name: 'title', weight: 1 },
		{ name: 'publicationDate', weight: 0.5 },
	]
};

const fuseOptionsTags = {
	includeMatches: true,
	threshold: 0,
	ignoreLocation: true,
	keys: [
		'tags', // will be assigned a `weight` of 1
	]
};

class SearchBlock {
	/**
	* Constructor for the SearchBlock class.
		* @param {HTMLElement} block - The block element to which the search functionality will be added.  This should be the `<div class="search">` element.
	*/
	constructor( block ) {
		/** @member {HTMLElement} */
		this.block = block;
		/** @member {string} */
		this.blockClassDynamicCollection = block.classList.contains( 'dynamic-collection' );
		/** @member {object} */
		this.placeholders = null;
		/** @member {string} */
		// Getting text content since the hostname is stripped in the href
		this.source = this.block.querySelector( 'a[href]' )?.href || '/query-index.json'; // Use optional chaining
		/** @member {number} */
		this.limit = 10;
		/** @member {number} */
		this.count = 3;
		/** @member {boolean} */
		this.showPagination = true;
		/** @member {boolean} */
		this.showDescription = false;
		/** @member {boolean} */
		this.showSearchBox = true;
		/** @member {boolean} */
		this.externalUrl = new URL( this.source ).hostname;
		/** @member {string} */
		this.sort = 'relevance';
		/** @member {string|null} */
		this.filter = null;
		/** @member {HTMLFormElement|null} */
		this.form = null;
		/** @member {Array<object>|null} */
		this.allData = null;
		/** @member {HTMLInputElement|null} */
		this.offset = null;
		/** @member {HTMLInputElement|null} */
		this.query = null;
		/** @member {URLSearchParams} */
		this.urlParams = new URLSearchParams( window.location.search ); // Store URLSearchParams
		/** @member {string|null} */
		this.previousSearchTerm = null;
	}

	/**
		* Initializes the search block.  Fetches data, placeholders, and applies settings.
		* @async
		* @function init
		* @returns {Promise<void>}
		*/
	async init() {
		try {
			this.allData = await ffetch( this.source ).all();
			this.placeholders = await fetchPlaceholders();
			// Get Settings
			[...this.block.children].forEach( ( row, index ) => {
				if ( index > 0 ) {
					const settingName = row.firstElementChild;
					this.checkSettings( settingName, row );
				}
			} );

			this.filterData();
			this.render();
			this.attachEventListeners();
			this.handleInitialSearch();
			decorateIcons( this.block );
		} catch ( error ) {
			// Handle the error gracefully, e.g., display an error message to the user
			console.error( 'Error initializing SearchBlock:', error );
		}
	}

	/**
		 * Checks settings for a specific setting name in a row and applies them to the SearchBlock instance.
		 * @function checkSettings
		 * @param {HTMLElement} settingName - The first element in the row containing the setting name.
		 * @param {HTMLElement} row - The row element containing the setting.
		 */
	checkSettings( settingName, row ) {
		const invalidValues = ['false', 'no'];
		const key = settingName.querySelector( 'p' ).textContent;
		const setting = row.firstElementChild.nextSibling.nextSibling.querySelector( 'p' )?.textContent;
		const settingVal = invalidValues.includes( setting?.toLowerCase().trim() ) ? false : true;

		if ( key === SEARCH_SETTINGS_BOX ) {
			this.showSearchBox = settingVal;
		}

		if ( key === SEARCH_SETTINGS_PAGINATION ) {
			this.showPagination = settingVal;
		}

		if ( key === SEARCH_SETTINGS_DESCRIPTION) {
			this.showDescription = settingVal;
		}

		if ( key === SEARCH_SETTINGS_SORTKEY && settingVal ) {
			this.sort = setting;
		}

		if ( key === SEARCH_SETTINGS_FILTERTAG && settingVal ) {
			this.filter = setting;
		}

		if ( key === SEARCH_SETTINGS_COUNT && settingVal && setting <= this.limit) {
			this.count = setting;
		}
	}

	/**
		 * Filters the search data based on the configured filter tag and sorts the data if a sort key is provided.
		 * @function filterData
		*/
	filterData() {
		if ( this.sort !== 'relevance' ) {
			const fuseTags = new Fuse( this.allData, fuseOptionsTags );
			this.allData = this.flattenSearch( fuseTags.search( this.filter ? this.filter.toLowerCase().trim() : '' ) );
			const comparisonFunction = this.sort === 'publicationDate' ? this.sortByPublicationDate.bind( this ) : this.sortBy( this.sort );
			this.allData.sort( comparisonFunction );
		}

		this.allData = this.allData.filter( item => {
			return item.title && item.title.trim() !== '' && item.path && item.path.trim() !== '';
		} );
	}

	/**
		 * Sorts the search results by publication date.
		 * @function sortByPublicationDate
		 * @param {object} a - The first object to compare.
		 * @param {object} b - The second object to compare.
		 * @returns {number} - A number indicating the order of the objects.
		 */
	sortByPublicationDate( a, b ) {
		let dateA, dateB;
		try {
			dateA = new Events( a.publicationDate ).getDate(); // Make sure publicationDate is always in 'May 16, 2024 - 8:00 am' format
		} catch ( error ) {
			console.warn( 'Could not parse publicationDate for item:', a, error );
			dateA = null; // Handle parsing errors
		}

		try {
			dateB = new Events( b.publicationDate ).getDate();
		} catch ( error ) {
			console.warn( 'Could not parse publicationDate for item:', b, error );
			dateB = null; // Handle parsing errors
		}

		if ( dateA && dateB ) {
			return dateB.getTime() - dateA.getTime(); // Sort in descending order (most recent first)
		} else if ( dateA ) {
			return -1; // dateA is valid, dateB is not, so a comes first
		} else if ( dateB ) {
			return 1; // dateB is valid, dateA is not, so b comes first
		} else {
			return 0; // Both dates are invalid, so maintain the original order
		}
	}

	/**
		 * Returns a comparison function to sort an array of objects by a specified key.
		 * Sorts strings ascending and other types (e.g., timestamps) descending.
		 * @function sortBy
		 * @param {string} key - The key to sort the array by.
		 * @returns {function(object, object): number} A comparison function for sorting.
		 */
	sortBy( key ) {
		return function innerSort( a, b ) {
			if ( !Object.hasOwn( a, key ) || !Object.hasOwn( b, key ) ) {
				return 0;
			}

			const varA = a[key];
			const varB = b[key];

			// If its not a number (i.e a timestamp), sort ascending else sort descending (greater time away from the epoch should come first)
			const isString = typeof varA === 'string' && typeof varB === 'string';

			let comparison = 0;
			if ( varA > varB ) {
				comparison = 1;
			} else if ( varA < varB ) {
				comparison = -1;
			}

			const order = isString ? 1 : -1;
			return comparison * order;
		};
	}

	/**
		 * Renders the search UI, including the search form and the container for the search results.
		 * @function render
		*/
	render() {
		this.block.innerHTML = '';
		this.block.append(
			this.createSearchForm(),
			this.createManualCollection()
		);
		this.form = this.block.querySelector( 'form' );
	}

	/**
		 * Attaches event listeners to the search form.
		 * @function attachEventListeners
		 */
	attachEventListeners() {
		this.form.addEventListener( 'submit', ( e ) => {
			e.preventDefault();
			this.handleSearch( true );
		} );

		if ( this.showPagination ) {
			this.offset = this.form.querySelector( 'input[name="offset"]' );
		}
		if ( this.showSearchBox ) {
			this.query = this.form.querySelector( 'input[name="q"]' );
		}
	}

	/**
		 * Handles the initial search when the page loads with existing query parameters.
		 * @function handleInitialSearch
		 */
	handleInitialSearch() {
		const offsetParam = this.urlParams.get( OFFSET_PARAM );
		const queryParam = this.urlParams.get( QUERY_PARAM );

		if ( ( offsetParam && this.showPagination ) || ( queryParam && this.showSearchBox ) ) {
			if ( offsetParam && this.showPagination ) {
				this.offset.value = offsetParam;
			}
			if ( queryParam && this.showSearchBox ) {
				this.query.value = queryParam;
			}
			this.handleSearch( false );
		} else {
			this.handleSearch( true ); // Load everything on load if no search box
		}
	}

	/**
		 * Clears the search results container and pagination.
		 * @function clearSearchResults
		*/
	clearSearchResults() {
		const searchResults = this.block.querySelector( '.' + SEARCH_RESULTS_CONTAINER_CLASS.split( ' ' ).join( '.' ) );
		const pagination = this.block.querySelector( '.usa-pagination' );

		if ( pagination ) {
			pagination.remove();
		}

		searchResults.innerHTML = '';
	}

	/**
		 * Clears search results, resets URL parameters, and optionally performs a new search if a filter is present to show all results.
		 * @function clearSearch
		*/
	clearSearch() {
		this.clearSearchResults();

		if ( window.history.replaceState ) {
			const url = new URL( window.location.href );
			url.search = '';

			if ( this.showPagination ) {
				if ( !this.filter ) { this.urlParams.delete( OFFSET_PARAM ); }
				this.offset.value = 0;
			}
			if ( this.showSearchBox ) {
				if ( !this.filter ) { this.urlParams.delete( QUERY_PARAM ); }
				this.query.value = '';
			}

			window.history.replaceState( {}, '', url.toString() );
		}

		if ( this.filter ) {
			this.handleSearch( true );
		}
	}

	/**
		 * Renders search results in the search block.
		 * @async
		 * @function renderResults
		 * @param {Array<object>} filteredData - Filtered search results.
		 * @param {Array<string>} searchTerms - Search terms to highlight.
		 */
	async renderResults( filteredData, searchTerms ) {
		this.clearSearchResults();

		const searchResults = this.block.querySelector( '.' + SEARCH_RESULTS_CONTAINER_CLASS.split( ' ' ).join( '.' ) );
		const headingTag = searchResults.dataset.h;

		if ( filteredData.length ) {
			let data = filteredData;
			let currentOffset;

			if ( this.showPagination ) {
				currentOffset = parseInt( this.offset.value, 10 );
				data = filteredData.slice( currentOffset, ( currentOffset + this.limit ) );
				createPagination( currentOffset, filteredData, this.limit, this.block );

				const paginationContainerEle = this.block.querySelector( '.usa-pagination' );
				paginationContainerEle.addEventListener( 'click', ( e ) => {
					e.preventDefault();
					if ( e.target.matches( 'a' ) ) {
						this.offset.value = e.target.dataset.paginationButton;
						this.handleSearch( false );
						this.form.scrollIntoView( { behavior: 'smooth', block: 'start' } );
					}
				} );
			} else if ( this.blockClassDynamicCollection ) {
				data = filteredData.slice( 0, this.count ); // only first 3 results
			}

			searchResults.classList.remove( NO_RESULTS_CLASS );
			data.forEach( result => {
				searchResults.append( renderResult( result, searchTerms, headingTag, this.filter, this.blockClassDynamicCollection, this.sort, this.externalUrl, this.showDescription ) );
			} );
		} else {
			searchResults.classList.add( NO_RESULTS_CLASS );
			searchResults.append( li( { class: 'usa-collection__item' }, this.placeholders.searchNoResults || 'No results found.' ) );
		}
	}

	/**
		 * Flattens an array of Fuse.js search results into a simple array of the original data items.
		 * @function flattenSearch
		 * @param {Array<object>} filteredData - An array of Fuse.js search result objects.
		 * @returns {Array<object>} A flattened array of data items.
		 */
	flattenSearch( filteredData ) {
		const flattendArray = [];

		filteredData.forEach( ( entry ) => {
			flattendArray.push( entry.item );
		} );

		return flattendArray;
	}

	/**
		 * Handles search input events, updating the URL parameters and rendering the search results.
		 * @async
		 * @function handleSearch
		 * @param {boolean} resetOffset - Whether to reset the offset to 0.
		 */
	async handleSearch( resetOffset ) {
		let searchTerms = null;
		let searchTermsFuse = null;
		let filteredData = null;

		if ( this.showSearchBox ) {
			const searchValue = this.query.value;
			this.urlParams.set( QUERY_PARAM, searchValue );
			searchTerms = searchValue.toLowerCase().split( /\s+/ ).filter( term => !!term );
			searchTermsFuse = searchTerms.join( ', ' );
		}

		if ( this.showPagination ) {
			if ( resetOffset ) {
				this.offset.value = 0;
			}
			this.urlParams.set( OFFSET_PARAM, this.offset.value );
		}

		if ( window.history.replaceState ) {
			const url = new URL( window.location.href );
			url.search = this.urlParams.toString();
			window.history.replaceState( {}, '', url.toString() );
		}

		const fuse = new Fuse( this.allData, fuseOptionsRelevance );

		if ( this.filter && ( !searchTerms || !searchTerms.length ) ) {
			filteredData = this.allData;
		} else if ( searchTerms && searchTerms.length ) {
			filteredData = this.flattenSearch( fuse.search( searchTermsFuse ) );
		}

		await this.renderResults( filteredData, searchTerms );
	}

	/**
		 * Creates a container for search results.
		 * @function createSearchResultsContainer
		 * @returns {HTMLElement} The search results container element.
		 */
	createSearchResultsContainer() {
		let container = ul( { class: SEARCH_RESULTS_CONTAINER_CLASS } );
		container.dataset.h = 'H4';
		// TODO: make this conditional -- needs to be h2 on search and h3 on homepage
		return container;
	}

	/**
		 * Creates the search icon/button element.
		 * @function createSearchIcon
		 * @returns {HTMLElement} The search icon element.
		 */
	createSearchIcon() {
		const searchTxt = this.placeholders.searchPlaceholder || 'Search';
		return domEl( 'button', {
			class: 'usa-button',
			type: 'submit',
		},
		span( {
			class: 'usa-search__submit-text'
		}, searchTxt ),
		domEl( 'img', {
			class: 'usa-search__submit-icon',
			alt: searchTxt,
			src: '../../icons/usa-icons-bg/search--white.svg'
		} )
		);
	}

	/**
		 * Creates the search input field.
		 * @function createSearchInput
		 * @returns {HTMLElement} The search input element.
		 */
	createSearchInput() {
		const searchPlaceholder = ( this.placeholders.searchPlaceholder || 'Search' ) + '...';
		const searchLabelEl = domEl( 'label', { class: 'usa-sr-only', for: 'search-block-field' } );
		const searchInputEl = input( {
			type: 'search',
			class: 'usa-input usa-text-input',
			id: 'search-block-field',
			name: 'q',
			placeholder: searchPlaceholder,
			'aria-label': searchPlaceholder,
			onkeyup: ( e ) => {
				if ( e.code === 'Escape' ) {
					this.clearSearch();
				}
			}
		} );
		return domEl( 'div', { class: 'usa-input__wrapper' }, searchLabelEl, searchInputEl, this.createSearchIcon() );
	}

	/**
		 * Creates the search box container with input and icon/button.
		 * @function createSearchForm
		 * @returns {HTMLElement} The search box container.
		 */
	createSearchForm() {
		let paginationInput = '';
		let searchInputEl = '';

		if ( this.showPagination ) {
			paginationInput = input( { type: 'hidden', id: 'search-block-offset', name: 'offset', value: this.offset || 0 } );
		}
		if ( this.showSearchBox ) {
			searchInputEl = this.createSearchInput();
		}

		return domEl( 'form', { class: 'usa-search usa-search--big', role: 'search' }, paginationInput, searchInputEl );
	}

	/**
		 * Creates manual collection container.
		 * @function createManualCollection
		 * @returns {HTMLElement} The manual collection container.
		*/
	createManualCollection() {
		return domEl( 'div', {
			class: 'manual-collection'
		}, this.createSearchResultsContainer() );
	}
}

/**
 * Decorates the search block with search functionality
 * @async
 * @function decorate
 * @param {HTMLElement} block - The block element to decorate
 */
export default async function decorate( block ) {
	const searchBlock = new SearchBlock( block );
	await searchBlock.init();
}
