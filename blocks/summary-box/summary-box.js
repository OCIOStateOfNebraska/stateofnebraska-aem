export default function decorate( block ) {

	// function to get all lists in the box and add a class 
	function getAllLists( lists ) {
		if ( !lists ) { return; }
		lists.forEach( ( list ) => {
			list.classList.add( 'usa-list' );
		} );
	}
	
	// function to get all links the box and add a class 
	function getAllLinks( links ) {
		if ( !links ) { return; }
		links.forEach( ( link ) => {
			link.classList.add( 'usa-summary-box__link' );
		} );
	}
	
	// the content of the summary-box
	let summary = block.querySelector( '.summary-box div div' );
	let ulLists = block.querySelectorAll( 'ul' );
	let olLists = block.querySelectorAll( 'ol' );
	let links = block.querySelectorAll( 'a' );
	getAllLists( ulLists );
	getAllLists( olLists );
	getAllLinks( links );
	
	// the USWDS wrapper around the entire box 
	let usaWrapper = summary.parentNode;
	
	// Set Title ONLY if we have one 
	let titleId = '';
	let title = block.querySelector( 'h2:first-child, h3:first-child, h4:first-child, h5:first-child, h6:first-child' ) ? block.querySelector( 'h2:first-child, h3:first-child, h4:first-child, h5:first-child, h6:first-child' ) : null;
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
