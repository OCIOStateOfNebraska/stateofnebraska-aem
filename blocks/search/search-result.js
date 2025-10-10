import { li, div, a, p, ul, domEl } from '../../scripts/dom-helpers.js';
import { getIndividualIcon } from '../../scripts/utils.js'; // Assuming this is how getIndividualIcon is imported
import Events from '../../scripts/Events.class.js';

/**
* Highlights search terms within text elements by wrapping them in <mark> tags
* @param {string[]} terms - Array of search terms to highlight
* @param {HTMLElement[]} elements - Array of elements to search within
*/
function highlightTextElements( terms, elements ) {
	elements.forEach( ( element ) => {
		if ( !element?.textContent.trim() ) return; 

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

function renderTitle( result, titleTag, searchTerms, collectionBody, externalURL ) {
	if ( result.title ) {
		const titleLink = a( { href: ( 'https://' + externalURL + result.path ), class: 'usa-link' }, result.title );
		if ( searchTerms ) {
			highlightTextElements( searchTerms, [titleLink] );
		}
		const heading = domEl( titleTag, { class: 'usa-collection__heading' }, titleLink );
		collectionBody.appendChild( heading );
	}
}

function renderDate( result, titleTag, searchTerms, collectionBody, filter, sort ) {
	if ( filter && ( sort === 'lastModified' || sort === 'publicationDate' ) ) {
		const date = new Events( result[sort] );

		const dateWrap = domEl( 'li', { class: 'usa-collection__meta-item position-relative' }, date.longDate() );
		getIndividualIcon( dateWrap, 'calendar_today', true );
		const metaWrap = domEl( 'ul', { class: 'usa-collection__meta', 'aria-label': 'More Information' }, dateWrap );
		collectionBody.appendChild( metaWrap );
	}
}

function renderDescription( result, titleTag, searchTerms, collectionBody ) {
	if ( result.description ) {
		const description = p( { class: 'usa-collection__description' }, result.description );
		if ( searchTerms ) {
			highlightTextElements( searchTerms, [description] );
		}
		collectionBody.appendChild( description );
	}
}

function renderTags( result, titleTag, searchTerms, collectionBody ) {
	if ( result.tags?.length > 0 ) {
		const tagsList = ul( { class: 'usa-collection__meta', 'aria-label': 'Topics' } );
		result.tags.forEach( ( tag, index ) => {
			const tagClass = index === 0 && result.isNew ? 'usa-collection__meta-item usa-tag usa-tag--new' : 'usa-collection__meta-item usa-tag';
			tagsList.appendChild( li( { class: tagClass }, tag ) );
		} );
		collectionBody.appendChild( tagsList );
	}
}

/**
 * Renders a single search result item using the USA collection item template
 * @param {Object} result - The search result data
 * @param {string[]} searchTerms - Terms to highlight in the result
 * @param {string} titleTag - HTML tag to use for the result title
 * @param {Object} searchBlock - The SearchBlock instance, needed for context and methods like highlightTextElements and filter
 * @param {Boolean} filter - whether or not the search has been filtered
 * @param {Boolean} showDescription
 * @param {string} sort - the item to sort by
 * @param {string} externalURL - whether or not the rendered results should go to a different url
 * @returns {HTMLElement} - The rendered search result list item
 */
export default function renderResult( result, searchTerms, titleTag, filter, dynamicCollection, sort, externalURL , showDescription) {
	const resultItem = li( { class: 'usa-collection__item' } );
	const collectionBody = div( { class: 'usa-collection__body' } );
	
	if ( dynamicCollection ) {
		renderTitle( result, titleTag, searchTerms, collectionBody, externalURL );
		if(showDescription) renderDescription( result, titleTag, searchTerms, collectionBody, externalURL );
		renderDate( result, titleTag, searchTerms, collectionBody, filter, sort );
	} else {
		renderTitle( result, titleTag, searchTerms, collectionBody, externalURL );
		if ( filter ) {
			renderDate( result, titleTag, searchTerms, collectionBody, filter, sort );
		}
		renderDescription( result, titleTag, searchTerms, collectionBody, filter );
		if ( !filter ) {
			renderTags( result, titleTag, searchTerms, collectionBody );
		}
	}

	resultItem.appendChild( collectionBody );
	return resultItem;
}