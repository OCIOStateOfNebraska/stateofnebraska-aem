import { domEl } from '../../scripts/dom-helpers.js';
import { getIndividualIcon } from '../../scripts/utils.js';


function createPagination( currentOffset, data, limit, block ) {
	const totalPages = Math.ceil( ( data.length ) / limit );
	const currentPage = Math.ceil( ( currentOffset + limit ) / limit );

	const nav = domEl( 'nav', { 'aria-label': 'Pagination', class: 'usa-pagination' } );
	const ulEl = domEl( 'ul', { class: 'usa-pagination__list' } );
	
	// Previous Page
	const prevLi = domEl( 'li', { class: 'usa-pagination__item usa-pagination__arrow' } );
	const prevA = domEl( 'a', {
		href: 'javascript:void(0);',
		class: 'usa-pagination__link usa-pagination__previous-page',
		'title': 'Previous',  
		'data-pagination-button': currentOffset - limit,
		'role': 'button'
	} );

	if ( currentPage === 1 ) {
		prevA.classList.add( 'usa-pagination__link--disabled' );
	}

	const prevSvg = domEl( 'div', { class: 'usa-icon__wrap', 'aria-hidden': 'true' } );
	getIndividualIcon( prevSvg, 'navigate_before' );
	const prevSpan = domEl( 'span', { class: 'usa-pagination__link-text' }, 'Previous' );
	prevA.appendChild( prevSvg );
	prevA.appendChild( prevSpan );
	prevLi.appendChild( prevA );
	ulEl.appendChild( prevLi );

	// Function to create a page number link
	function createPageLink( pageNumber ) {
		const pageLi = domEl( 'li', { class: 'usa-pagination__item usa-pagination__page-no' } );
		const pageA = domEl( 'a', {
			href: 'javascript:void(0);',
			class: 'usa-pagination__button',
			'title': `Page ${pageNumber}`,
			'data-pagination-button': ( pageNumber - 1 ) * limit,
			'role': 'button'
		}, pageNumber.toString() );
		
		if ( pageNumber === currentPage ) {
			pageA.classList.add( 'usa-current' );
			pageA.setAttribute( 'aria-current', 'page' );
		}
		
		pageLi.appendChild( pageA );
		return pageLi;
	}

	// Function to create an ellipsis
	function createEllipsis() {
		const overflowLi = domEl( 'li', {
			class: 'usa-pagination__item usa-pagination__overflow',
			'aria-label': 'ellipsis indicating non-visible pages',
		} );
		const overflowSpan = domEl( 'span', {}, '…' );
		overflowLi.appendChild( overflowSpan );
		return overflowLi;
	}
	// Logic to determine which page numbers to display
	if ( totalPages <= 6 ) {
	// Show all page numbers
		for ( let i = 1; i <= totalPages; i++ ) {
			ulEl.appendChild( createPageLink( i ) );
		}
	} else {
		ulEl.appendChild( createPageLink( 1 ) ); // Always show first

		if ( currentPage <= 4 ) {
		// Near the start: Show first 5, then ellipsis + last
			for ( let i = 2; i <= 5; i++ ) {
				ulEl.appendChild( createPageLink( i ) );
			}
			ulEl.appendChild( createEllipsis() );
		} else if ( currentPage >= totalPages - 3 ) {
		// Near the end: Show first + ellipsis + last 5
			ulEl.appendChild( createEllipsis() );
			for ( let i = totalPages - 4; i < totalPages; i++ ) {
				ulEl.appendChild( createPageLink( i ) );
			}
		} else {
		// Middle: Show first + ellipsis + current-1, current, current+1 + ellipsis + last
			ulEl.appendChild( createEllipsis() );
			for ( let i = currentPage - 1; i <= currentPage + 1; i++ ) {
				ulEl.appendChild( createPageLink( i ) );
			}
			ulEl.appendChild( createEllipsis() );
		}

		ulEl.appendChild( createPageLink( totalPages ) ); // Always show last
	}

	// Next Page
	const nextLi = domEl( 'li', { class: 'usa-pagination__item usa-pagination__arrow' } );
	const nextA = domEl( 'a', {
		href: 'javascript:void(0);',
		class: 'usa-pagination__link usa-pagination__next-page',
		'title': 'Next',
		'data-pagination-button': currentOffset + limit,
		'role': 'button'
	} );
	if ( currentPage === totalPages ) {
		nextA.classList.add( 'usa-pagination__link--disabled' );
	}

	const nextSvg = domEl( 'div', { class: 'usa-icon__wrap', 'aria-hidden': 'true' } );
	const nextSpan = domEl( 'span', { class: 'usa-pagination__link-text' }, 'Next',  nextSvg );
	getIndividualIcon( nextSvg, 'navigate_next' );
	nextA.appendChild( nextSpan );
	nextA.appendChild( nextSvg );
	nextLi.appendChild( nextA );
	ulEl.appendChild( nextLi );
	nav.appendChild( ulEl );
	block.appendChild( nav );
}

export default createPagination;