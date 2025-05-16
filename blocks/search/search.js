import { decorateIcons, fetchPlaceholders } from '../../scripts/aem.js';
import { li, span, ul, input, domEl } from '../../scripts/dom-helpers.js';
import ffetch from '../../scripts/ffetch.js';

import { Fuse } from '../../scripts/deps/bundle-uswds.js';
import renderResult from './search-result.js';
import createPagination from './search-pagination.js';

// Settings for search
const SEARCH_RESULTS_CONTAINER_CLASS = 'search-results usa-collection';
const NO_RESULTS_CLASS = 'no-results';
const OFFSET_PARAM = 'offset';
const QUERY_PARAM = 'q';
const SEARCH_SETTINGS_BOX = 'show-search-box';
const SEARCH_SETTINGS_PAGINATION = 'show-pagination';
const SEARCH_SETTINGS_SORTKEY = 'sort-key';
const SEARCH_SETTINGS_FILTERTAG = 'filter-by';

// FUSE.js relevance scoring options https://www.fusejs.io/concepts/scoring-theory.html#fuzziness-score
const fuseOptionsRelevance = {
	includeScore: true,
	includeMatches: true,
	threshold: 0.4,
	minMatchCharLength: 3,
	keys: [
		{ name: 'path',weight: 0.2 },
		{ name: 'body',weight: 0.1 },
		{ name: 'tags',weight: 0.5 },
		{ name: 'keywords',weight: 0.5 },
		{ name: 'h2s',weight: 0.2 },
		{ name: 'description',weight: 0.5 },
		{ name: 'title',weight: 1 }
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
	constructor( block ) {
		this.block = block;
		this.placeholders = null;
		this.source = this.block.querySelector( 'a[href]' )?.href || '/query-index.json'; // Use optional chaining
		this.limit = 1;
		this.showPagination = true;
		this.showSearchBox = true;
		this.sort = 'relevance';
		this.filter = null;
		this.form = null;
		this.allData = null;
		this.offset = null;
		this.query = null;
		this.urlParams = new URLSearchParams( window.location.search ); // Store URLSearchParams
		this.previousSearchTerm = null;
	}

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
	
	checkSettings( settingName, row ) {
		const invalidValues = ['false', 'no'];
		const key = settingName.querySelector( 'p' ).textContent;
		const setting = row.firstElementChild.nextSibling.nextSibling.querySelector( 'p' ).textContent;
		const settingVal = invalidValues.includes( setting.toLowerCase().trim() ) ? false : true;

		if ( key === SEARCH_SETTINGS_BOX ) {
			this.showSearchBox = settingVal;
		} 

		if ( key === SEARCH_SETTINGS_PAGINATION ) {
			this.showPagination = settingVal;
		}
		
		if ( key === SEARCH_SETTINGS_SORTKEY && settingVal ) {
			this.sort = setting;
		}
		
		if ( key === SEARCH_SETTINGS_FILTERTAG && settingVal ) {
			this.filter = setting;
		}
	}
	
	filterData() {
		if ( this.sort !== 'relevance' ) {
			const fuseTags = new Fuse( this.allData, fuseOptionsTags );
			this.allData = this.flattenSearch( fuseTags.search( this.filter.toLowerCase().trim() ) );
			const comparisonFunction = this.sortBy( this.sort );
			this.allData.sort( comparisonFunction );
		}
			
		this.allData = this.allData.filter( item => {
			return item.title && item.title.trim() !== '' && item.path && item.path.trim() !== '';
		} );
	}
	
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

	render() {
		this.block.innerHTML = '';
		this.block.append(
			this.createSearchForm(),
			this.createManualCollection()
		);
		this.form = this.block.querySelector( 'form' );
	}

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
     * Clears the search results container
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
     * Clears search results and resets URL parameters
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
     * Renders search results in the search block
     * @param {Array} filteredData - Filtered search results
     * @param {string[]} searchTerms - Search terms to highlight
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
						//todo: add scroll to top handler
					}
				} );
			}

			searchResults.classList.remove( NO_RESULTS_CLASS );
			data.forEach( result => {
				searchResults.append( renderResult( result, searchTerms, headingTag, this.filter ) );
			} );
		} else {
			searchResults.classList.add( NO_RESULTS_CLASS );
			searchResults.append( li( { class: 'usa-collection__item' }, this.placeholders.searchNoResults || 'No results found.' ) );
		}
	}
	
	flattenSearch( filteredData ) {
		const flattendArray = [];
		
		filteredData.forEach( ( entry ) => {
			flattendArray.push( entry.item );
		} );
		
		return flattendArray;
	}

	/**
     * Handles search input events
     * @param {boolean} resetOffset - Whether to reset the offset to 0
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
		console.log( searchTerms.length );
		if ( this.filter && !searchTerms.length ) {
			filteredData = this.allData; 
		} else if ( searchTerms && searchTerms.length ) {
			filteredData = this.flattenSearch( fuse.search( searchTermsFuse ) );
		}

		await this.renderResults( filteredData, searchTerms );
	}

	/**
     * Creates a container for search results
     * @returns {HTMLElement} - The search results container element
     */
	createSearchResultsContainer() {
		let container = ul( { class: SEARCH_RESULTS_CONTAINER_CLASS } );
		container.dataset.h = 'H4';
		return container;
	}

	/**
     * Creates the search icon element
     * @returns {HTMLElement} - The search icon element
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
     * Creates the search input field
     * @returns {HTMLElement} - The search input element
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
     * Creates the search box container with input and icon
     * @returns {HTMLElement} - The search box container
     */
	createSearchForm() {
		let paginationInput = '';
		let searchInputEl = '';

		if ( this.showPagination ) {
			paginationInput = input( { type: 'hidden', id: 'search-block-offset', name: 'offset', value: this.offset } );
		}
		if ( this.showSearchBox ) {
			searchInputEl = this.createSearchInput();
		}

		return domEl( 'form', { class: 'usa-search usa-search--big', role: 'search' }, paginationInput, searchInputEl );
	}

	/**
     * Creates manual collection container
     * @returns {HTMLElement} - The manual collection container
     */
	createManualCollection() {
		return domEl( 'div', {
			class: 'manual-collection'
		}, this.createSearchResultsContainer() );
	}
}

/**
 * Decorates the search block with search functionality
 * @param {HTMLElement} block - The block element to decorate
 */
export default async function decorate( block ) {
	const searchBlock = new SearchBlock( block );
	await searchBlock.init();
}