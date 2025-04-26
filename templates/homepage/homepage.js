import { div } from '../../scripts/dom-helpers.js';

/**
 * Decorates the document to align with USWDS Documentation Page Template
 * @param {Element} doc current document
 */
export default async function decorate( doc ) {
	const main = doc.querySelector( 'main' );
	const usaContentDiv = div( { class: 'usa-prose main-content' } );
	const usaContainerDiv = div( { class: 'grid-container' }, usaContentDiv );
	const usaSectionDiv = div( { class: 'usa-section' }, usaContainerDiv );
	
	main.parentNode.append( usaSectionDiv );

	main.append( usaSectionDiv );
	[...main.children].forEach( ( child ) => {
		if ( child !== usaSectionDiv ) {
			usaContentDiv.appendChild( child );
		}
	} );
}

