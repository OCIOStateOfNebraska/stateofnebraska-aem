import { domEl } from '../../scripts/dom-helpers.js';

function getDateValue ( date ) {
	return date + 'T12:00:00';
}

function getDateText ( date ) {
	const dateObj = new Date( date );
	const options = { year: 'numeric', month: 'long', day: 'numeric' };
	const formattedDate = new Intl.DateTimeFormat( 'en-US', options ).format( dateObj );
	return formattedDate;
}

export default function decorate( block ) {
	const ul = domEl( 'ul', { class: 'usa-collection' } );
	[...block.children].forEach( ( row ) => {
		const li = document.createElement( 'li' );
		li.className = 'usa-collection__item';
		while ( row.firstElementChild ) li.append( row.firstElementChild );
		[...li.children].forEach( ( div ) => {
			if ( div.children.length === 1 && div.querySelector( 'picture' ) ) {
				const imgTag = domEl( 'img', { 'class': 'usa-collection__img', 'src': div.querySelector( 'picture > img' ).getAttribute( 'src' ) } );
				li.prepend( imgTag );
				div.remove();
			} else {
				div.classList.add( 'usa-collection__body' );
				const h4 = div.querySelector( 'h4' );
				h4.classList.add( 'usa-collection__heading' );
				const anchor = h4.querySelector( 'a' );
				anchor.classList.add( 'usa-link' );
				const para = div.querySelector( 'p' );
				para.classList.add( 'usa-collection__description' );
				let date = div.lastElementChild.innerHTML;
				const timeTag = document.createElement( 'time' );
				timeTag.setAttribute( 'datetime', getDateValue( date ) );
				timeTag.innerHTML = getDateText( getDateValue( date ) );
				div.lastElementChild.remove();
				const metaUl = document.createElement( 'ul' );
				metaUl.classList.add( 'usa-collection__meta' );
				metaUl.setAttribute( 'aria-label', 'More information' );
				const metaLi = document.createElement( 'li' );
				metaLi.classList.add( 'usa-collection__meta-item' );
				metaLi.append( timeTag );
				metaUl.append( metaLi );
				div.appendChild( metaUl );
			}
		} );
		li.querySelector( '.usa-collection__img' ).setAttribute( 'alt', li.querySelector( '.usa-collection__heading > a' ).innerHTML );
		ul.append( li );
	} );
	block.textContent = '';
	block.append( ul );
}