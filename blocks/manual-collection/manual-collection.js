import { domEl } from '../../scripts/dom-helpers.js';

function getDateValue ( date ) {
	return date + 'T00:00:00';
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
		const li = domEl( 'li', { class: 'usa-collection__item' } );
		const div = row.querySelector( 'div' );
		div.classList.add( 'usa-collection__body' );
		const h4 = row.querySelector( 'h4' );
		h4.classList.add( 'usa-collection__heading' );
		const anchor = h4.querySelector( 'a' );
		anchor.classList.add( 'usa-link' );
		while ( row.firstElementChild ) {
			const divBody = row.firstElementChild;
			const para = divBody.querySelector( 'p' );
			para.classList.add( 'usa-collection__description' );
			li.append( divBody );
		}
		let date = div.lastElementChild.innerHTML;
		const timeTag = domEl( 'time', { 'datetime': getDateValue( date ) } );
		timeTag.innerHTML = getDateText( date );
		div.lastElementChild.remove();
		const metaUl = domEl( 'ul', { 'class': 'usa-collection__meta', 'aria-label': 'More information' } );
		const metaLi = domEl( 'li', { 'class': 'usa-collection__meta-item' } );
		metaLi.append( timeTag );
		metaUl.append( metaLi );
		div.appendChild( metaUl );
		ul.append( li );
	} );
	block.textContent = '';
	block.append( ul );
}