import { domEl } from '../../scripts/dom-helpers.js';
import { getIndividualIcon } from '../../scripts/utils.js';

/**
* Generates a the content in the card.
* @param {HTMLElement} div - The `div` element to be transformed into a card media section.
* @param {HTMLElement} container - The card wrapper the content should be in.
*/
function generateContent( div, container ) {
	const wrap = div.querySelector( 'p:has(a)' ); //
	wrap.className = 'usa-button__wrap';
	const a = div.querySelector( 'a' ) ? div.querySelector( 'a' ) : null;
	const heading = div.querySelector( 'h2, h3, h4, h5, h6' );
	let header = '';
	div.className = 'usa-card__body';
	
	// take out the heading and put into its own container
	if ( heading ) {
		heading.classList.add( 'usa-card__heading' );
		header = domEl( 'div', { class: 'usa-card__header' }, heading );
		container.prepend( header );
		
		// Wrap the link in the header 
		if ( a ) {
			a.textContent = ''; 
			a.className = '';
			heading.append( a );
			getIndividualIcon( wrap, 'arrow_forward' );
		} 
	} else {
		if ( wrap ) {
			wrap.remove();
			// eslint-disable-next-line no-console
			console.error( 'No heading provided. Please re-author with the appropriate heading' );
		}
	}
}

/**
* Generates in the card.
* @param {HTMLElement} container - The card wrapper the content should be in. child of the li
*/
function generateWholeCard( container ) {
	[...container.children].forEach( ( div ) => {
		generateContent( div, container );
	} );
}

/**
* Generates all content in the card
* @param {HTMLElement} block - The card grid generated by EDS
*/
export default function decorate( block ) {
	const grid = 'grid-col-12 tablet:grid-col-6 desktop:grid-col-4';
	const ul = domEl( 'ul', { class: 'usa-card-group grid-row' } );

	[...block.children].forEach( ( row ) => {
		const li = domEl( 'li', { class: `usa-card ${grid}` } );
		const cardContainer = domEl( 'div', { class: 'usa-card__container' } );

		// add all the table row contents into a li with a container wrapper inside
		while ( row.firstElementChild ) {
			cardContainer.append( row.firstElementChild );
			li.append( cardContainer );
		}
		
		generateWholeCard( cardContainer );
		ul.append( li );
	} );

	block.textContent = '';
	block.append( ul );
}
