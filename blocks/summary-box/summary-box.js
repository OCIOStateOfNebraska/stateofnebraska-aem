import { addClassToLists, addClassToLinks } from '../../scripts/utils.js';

export default function decorate( block ) {
	// the content of the summary-box
	let summary = block.querySelector( '.summary-box div div' );
	addClassToLists( block );
	addClassToLinks( block, 'usa-summary-box__link' );
	
	// the USWDS wrapper around the entire box 
	let usaWrapper = summary.parentNode;
	
	// Set Title ONLY if we have one 
	let titleId = '';
	let titleSelector = 'h2:first-child, h3:first-child, h4:first-child, h5:first-child, h6:first-child';
	let title = block.querySelector( titleSelector ) ? block.querySelector( titleSelector ) : null;
	if ( title ) {
		titleId = title.id;
		title.classList.add( 'usa-summary-box__heading' );
		usaWrapper.setAttribute( 'aria-labelledby', titleId );
		usaWrapper.prepend( title );
	}
	
	usaWrapper.classList.add( 'usa-summary-box' );
	usaWrapper.setAttribute( 'role', 'region' );
	summary.classList.add( 'usa-summary-box__text' );
}
