import {
	decorateIcons,
	fetchPlaceholders
} from '../../scripts/aem.js';
import {
	a, div, li, p, span, ul, input, domEl
} from '../../scripts/dom-helpers.js';
import ffetch from '../../scripts/ffetch.js';
import createPagination from '../../scripts/pagination.js';

const SEARCH_RESULTS_CONTAINER_CLASS = 'search-results usa-collection';
const NO_RESULTS_CLASS = 'no-results';
const OFFSET_PARAM = 'offset';
const QUERY_PARAM = 'q';
const SEARCH_SETTINGS_BOX = 'show-search-box';
const SEARCH_SETTINGS_PAGINATION = 'show-pagination';

class SearchBlock {
	constructor( block ) {
		this.block = block;

		this.placeholders = null;
		this.source = this.block.querySelector( 'a[href]' )?.href || '/query-index.json'; // Use optional chaining
		this.limit = 1;
		this.showPagination = true;
		this.showSearchBox = true;
		this.form = null;
		this.allData = null;
		this.offset = null;
		this.query = null;
		this.urlParams = new URLSearchParams( window.location.search ); // Store URLSearchParams
	}

	async init() {
		try {
			this.allData = await ffetch( this.source ).all();
			this.placeholders = await fetchPlaceholders();
			
			// Set Pagination and Search Box
			[...this.block.children].forEach( ( row, index ) => {
				if ( index > 0 ) {
					const settingName = row.firstElementChild;
					this.checkSettings( settingName, row );
				}
			} );

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
		const validValues = ['yes', 'true'];
		const key = settingName.querySelector( 'p' ).textContent;
		const setting = row.firstElementChild.nextSibling.nextSibling.querySelector( 'p' ).textContent.toLowerCase().trim();
		const settingVal = validValues.includes( setting ) ? true : false;

		if ( key === SEARCH_SETTINGS_BOX ) {
			this.showSearchBox = settingVal;
		} 

		if ( key === SEARCH_SETTINGS_PAGINATION ) {
			this.showPagination = settingVal;
		}
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
		} else if ( !this.showSearchBox ) {
			this.handleSearch( true ); // Load everything on load if no search box
		}
	}

	/**
     * Highlights search terms within text elements by wrapping them in <mark> tags
     * @param {string[]} terms - Array of search terms to highlight
     * @param {HTMLElement[]} elements - Array of elements to search within
     */
	highlightTextElements( terms, elements ) {
		elements.forEach( ( element ) => {
			if ( !element?.textContent ) return; 

			const matches = [];
			const { textContent } = element;

			terms.forEach( ( term ) => {
				let start = 0;
				let offset = textContent.toLowerCase().indexOf( term.toLowerCase(), start );
				while ( offset >= 0 ) {
					matches.push( {
						offset,
						term: textContent.substring( offset, offset + term.length )
					} );
					start = offset + term.length;
					offset = textContent.toLowerCase().indexOf( term.toLowerCase(), start );
				}
			} );

			if ( !matches.length ) { return; }

			matches.sort( ( a, b ) => a.offset - b.offset );

			let currentIndex = 0;
			const fragment = matches.reduce( ( acc, { offset, term } ) => {
				if ( offset < currentIndex ) return acc;

				const textBefore = textContent.substring( currentIndex, offset );
				if ( textBefore ) {
					acc.appendChild( document.createTextNode( textBefore ) );
				}

				const markedTerm = domEl( 'mark', term );
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
     * Renders a single search result item using the USA collection item template
     * @param {Object} result - The search result data
     * @param {string[]} searchTerms - Terms to highlight in the result
     * @param {string} titleTag - HTML tag to use for the result title
     * @returns {HTMLElement} - The rendered search result list item
     */
	renderResult( result, searchTerms, titleTag ) {
		const resultItem = li( { class: 'usa-collection__item' } );
		const collectionBody = div( { class: 'usa-collection__body' } );

		if ( result.title ) {
			const titleLink = a( { href: result.path, class: 'usa-link' }, result.title );
			if ( searchTerms ) {
				this.highlightTextElements( searchTerms, [titleLink] );
			}
			const heading = domEl( titleTag, { class: 'usa-collection__heading' }, titleLink );
			collectionBody.appendChild( heading );
		}

		if ( result.description ) {
			const description = p( { class: 'usa-collection__description' }, result.description );
			if ( searchTerms ) {
				this.highlightTextElements( searchTerms, [description] );
			}
			collectionBody.appendChild( description );
		}

		if ( result.tags?.length > 0 ) {
			const tagsList = ul( { class: 'usa-collection__meta', 'aria-label': 'Topics' } );
			result.tags.forEach( ( tag, index ) => {
				const tagClass = index === 0 && result.isNew ? 'usa-collection__meta-item usa-tag usa-tag--new' : 'usa-collection__meta-item usa-tag';
				tagsList.appendChild( li( { class: tagClass }, tag ) );
			} );
			collectionBody.appendChild( tagsList );
		}

		resultItem.appendChild( collectionBody );
		return resultItem;
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
				this.urlParams.delete( OFFSET_PARAM );
				this.offset.value = 0;
			}
			if ( this.showSearchBox ) {
				this.urlParams.delete( QUERY_PARAM );
			}

			window.history.replaceState( {}, '', url.toString() );
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
						console.log( 'click pagination' );
						this.offset.value = e.target.dataset.paginationButton;
						this.handleSearch( false );
						//todo: add scroll to top handler
					}
				} );
			}

			searchResults.classList.remove( NO_RESULTS_CLASS );
			data.forEach( result => {
				searchResults.append( this.renderResult( result, searchTerms, headingTag ) );
			} );
		} else {
			searchResults.classList.add( NO_RESULTS_CLASS );
			searchResults.append( li( { class: 'usa-collection__item' }, this.placeholders.searchNoResults || 'No results found.' ) );
		}
	}

	/**
     * Comparison function for sorting search results by match position
     * @param {Object} hit1 - First search hit with minIdx property
     * @param {Object} hit2 - Second search hit with minIdx property
     * @returns {number} - Comparison result for sorting
     */
	compareFound( hit1, hit2 ) {
		return hit1.minIdx - hit2.minIdx;
	}

	/**
     * Filters data based on search terms
     * @param {string[]} searchTerms - Array of search terms
     * @param {Array} data - Data to filter
     * @returns {Array} - Filtered data sorted by relevance
     */
	sortRelevance( searchTerms, data ) {
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

			const metaContents = `${result.title} ${result.description} ${result.path.split( '/' ).pop()} ${result.tags?.join( ' ' )} ${result.keywords} ${result.h2s?.join( ' ' )} ${result.body}`.toLowerCase();
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
			...foundInHeader.sort( this.compareFound ),
			...foundInMeta.sort( this.compareFound ),
		].map(  ( item ) => item.result );
	}

	/**
     * Handles search input events
     * @param {boolean} resetOffset - Whether to reset the offset to 0
     */
	async handleSearch( resetOffset ) {
		let searchTerms = null;

		if ( this.showSearchBox ) {
			const searchValue = this.query.value;
			this.urlParams.set( QUERY_PARAM, searchValue );
			searchTerms = searchValue.toLowerCase().split( /\s+/ ).filter( term => !!term );
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

		const filteredData = this.showSearchBox ? this.sortRelevance( searchTerms, this.allData ) : this.allData;
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