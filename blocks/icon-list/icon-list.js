import { div } from '../../scripts/dom-helpers.js';
import { removeEmptyChildren } from '../../scripts/utils.js';


function namedNodeMapToObject( namedNodeMap ) {
	const obj = {};
	for( let i = 0; i < namedNodeMap.length; i++ ) {
		const attr = namedNodeMap.item( i );
		obj[attr.name] = attr.value;
	}
	return obj;
}

export default function decorate( block ) {
	const iconEle = block.querySelector( '.icon' );
	
	// change the icon element to a div
	const iconWrapper = div( namedNodeMapToObject( iconEle.attributes ) );
	iconWrapper.classList.add( 'usa-icon-list__icon' );
	iconEle.childNodes.forEach( ( child ) => { iconWrapper.appendChild( child ); } );
	iconEle.remove();

	block.querySelectorAll( 'ul' ).forEach( ( ul ) => {
		ul.classList.add( 'usa-icon-list' );
	} );

	block.querySelectorAll( 'li' ).forEach( ( li, i ) => {
		li.classList.add( 'usa-icon-list__item' );

		const contentWrapper = div( { class: 'usa-icon-list__content' } );
		while( li.firstChild ) {
			contentWrapper.appendChild( li.firstChild );
		}
		li.appendChild( contentWrapper );
		
		if( i === 0 ) {
			li.prepend( iconWrapper );
		} else {
			li.prepend( iconWrapper.cloneNode( true ) );
		}
	} );

	block.querySelectorAll( 'div, p' ).forEach( el => {
		removeEmptyChildren( el );
	} );
}
