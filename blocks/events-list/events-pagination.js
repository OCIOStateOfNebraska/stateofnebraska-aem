import { domEl } from '../../scripts/dom-helpers.js';
import { getIndividualIcon } from '../../scripts/utils.js';

function getPageHref( offset ) {
	const url = new URL( window.location.href );
	url.searchParams.set( 'offset', offset );
	return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Create pagination for events list
 * @param { Number } offset // start index
 * @param { Array } events // all events
 * @param { Number } perPage // items per page  
 * @param { HTMLElement } block 
 */
function createPagination( offset, events, perPage, block ) {
	const items = [];
	for ( let i = 0; i < events.length; i += perPage ) {
		items.push( domEl( 'li', {
			class: 'usa-pagination__item usa-pagination__page-no '
		},
		domEl( 'a', {
			class: `usa-pagination__button ${i === offset ? 'usa-current' : ''}`,
			title: 'Page ' + ( i / perPage + 1 ), ['data-pagination-button']: i,
			role: 'button', 'aria-current': i === offset ? 'page' : '', href: getPageHref( i )
		}, i / perPage + 1 ) )
		);
	}

	const prevIconContainer = domEl( 'div', { class: 'usa-icon__wrap', 'aria-hidden': 'true' } );
	getIndividualIcon( prevIconContainer,'navigate_before' );
	const nextIconContainer = domEl( 'div', { class: 'usa-icon__wrap', 'aria-hidden': 'true' } );
	getIndividualIcon( nextIconContainer,'navigate_next' );
	const container = domEl( 'nav', { class: 'usa-pagination', 'aria-label': 'Pagination' } );
	const list = domEl( 'ul', { class: 'usa-pagination__list' } );
	items.forEach( i => list.appendChild( i ) );
	container.appendChild( list );
	const next = domEl( 'li', { class: 'usa-pagination__item usa-pagination__arrow' },
		domEl( 'a', {
			class: `usa-pagination__link usa-pagination__next-page ${offset + perPage >= events.length ? 'usa-pagination__link--disabled' : ''}`,
			title: 'Next', ['data-pagination-button']: offset + perPage,
			role: 'button', href: getPageHref( offset + perPage )
		},
		domEl( 'span', { class: 'usa-pagination__link-text' }, 'Next' ),
		nextIconContainer
		) );
	const prev = domEl( 'li', { class: 'usa-pagination__item usa-pagination__arrow' },

		domEl( 'a', {
			class: `usa-pagination__link usa-pagination__prev-page ${offset === 0 ? 'usa-pagination__link--disabled' : ''}`,
			title: 'Previous', ['data-pagination-button']: offset - perPage,
			role: 'button', href: getPageHref( offset - perPage )
		},
		prevIconContainer,
		domEl( 'span', { class: 'usa-pagination__link-text' }, 'Previous' )
		) );
	container.prepend( prev );
	container.appendChild( next );
	block.appendChild( container );
}

export default function handlePagination( offset, events, perPage, block ) {
	createPagination( offset, events, perPage, block );
	return events.slice( offset, offset + perPage );
}

