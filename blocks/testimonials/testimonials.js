import { domEl } from '../../scripts/dom-helpers.js';
import { getIndividualIcon } from '../../scripts/utils.js';

const WIDE_CARD_CHARACTER_LIMIT = 600;
const WIDE_CARD_MINIMUM_LENGTH = 300;
const WIDE_CARD_LENGTH_RATIO = 1.75;

function parseRating( cell ) {
	const value = cell?.textContent.trim();
	if ( !value ) return null;

	const rating = Number( value );
	return Number.isFinite( rating ) && rating >= 0 && rating <= 5 ? rating : null;
}

function widenItem( item ) {
	item.classList.remove( 'tablet:grid-col-6', 'desktop:grid-col-4' );
	item.classList.add( 'tablet:grid-col-12', 'desktop:grid-col-8' );
}

function makeTabletFullWidth( item ) {
	item.classList.remove( 'tablet:grid-col-6' );
	item.classList.add( 'tablet:grid-col-12' );
}

function widenOutlierItems( items ) {
	const lengths = items.map( ( item ) => Number( item.dataset.quoteLength ) );
	const pairedItems = new Set();

	items.forEach( ( item, index ) => {
		if ( pairedItems.has( index ) ) return;

		const length = lengths[index];
		const nextLength = lengths[index + 1];
		if ( length > WIDE_CARD_CHARACTER_LIMIT ) {
			widenItem( item );
			pairedItems.add( index );
			if ( nextLength > 0 && nextLength <= WIDE_CARD_CHARACTER_LIMIT && length >= nextLength * WIDE_CARD_LENGTH_RATIO ) {
				makeTabletFullWidth( items[index + 1] );
				pairedItems.add( index + 1 );
			}
			return;
		}

		if ( length < WIDE_CARD_MINIMUM_LENGTH ) return;
		if ( nextLength > 0 && length >= nextLength * WIDE_CARD_LENGTH_RATIO ) {
			widenItem( item );
			makeTabletFullWidth( items[index + 1] );
			pairedItems.add( index );
			pairedItems.add( index + 1 );
			return;
		}

		const previousIndex = index - 1;
		if ( previousIndex >= 0 && !pairedItems.has( previousIndex ) && lengths[previousIndex] <= WIDE_CARD_CHARACTER_LIMIT && length >= lengths[previousIndex] * WIDE_CARD_LENGTH_RATIO ) {
			widenItem( item );
			makeTabletFullWidth( items[previousIndex] );
			pairedItems.add( previousIndex );
			pairedItems.add( index );
		}
	} );
}

async function addMarker( card, rating ) {
	if ( rating === null ) {
		const quoteMark = domEl( 'span', { class: 'testimonials__quote-mark', 'aria-hidden': 'true' } );
		await getIndividualIcon( quoteMark, 'format_quote' );
		card.append( quoteMark );
		return;
	}

	const ratingElement = domEl( 'div', {
		class: 'testimonials__rating',
		role: 'img',
		'aria-label': `${rating} out of 5 stars`,
	} );
	const visualRating = Math.round( rating * 2 ) / 2;
	const starPromises = Array.from( { length: 5 }, ( _, index ) => {
		const star = domEl( 'span', { class: 'testimonials__star' } );
		let iconName = 'star_outline';
		if ( visualRating >= index + 1 ) {
			iconName = 'star';
		} else if ( visualRating >= index + 0.5 ) {
			iconName = 'star_half';
		}
		return getIndividualIcon( star, iconName ).then( () => star );
	} );

	ratingElement.append( ...( await Promise.all( starPromises ) ) );
	card.append( ratingElement );
}

async function createCard( row ) {
	const [ratingCell, contentCell] = row.children;
	if ( !contentCell || !contentCell.textContent.trim() ) return null;

	const card = domEl( 'article', { class: 'testimonials__card' } );
	await addMarker( card, parseRating( ratingCell ) );

	contentCell.classList.add( 'testimonials__content' );
	const paragraphs = [...contentCell.querySelectorAll( ':scope > p' )];
	const lastIndex = paragraphs.length - 1;
	const authorIndex = paragraphs[lastIndex]?.firstElementChild?.tagName === 'STRONG'
		? lastIndex
		: paragraphs[lastIndex - 1]?.firstElementChild?.tagName === 'STRONG' ? lastIndex - 1 : -1;
	const quoteParagraphs = authorIndex >= 0 ? paragraphs.slice( 0, authorIndex ) : paragraphs;
	const attributionParagraphs = authorIndex >= 0 ? paragraphs.slice( authorIndex ) : [];
	const quoteLength = quoteParagraphs.reduce( ( total, paragraph ) => total + paragraph.textContent.trim().length, 0 );
	quoteParagraphs.forEach( ( paragraph, index ) => {
		paragraph.classList.add( 'testimonials__quote' );
		if ( index === quoteParagraphs.length - 1 ) paragraph.classList.add( 'testimonials__quote--last' );
	} );
	attributionParagraphs.forEach( ( paragraph ) => paragraph.classList.add( 'testimonials__attribution' ) );
	card.append( contentCell );

	const item = domEl(
		'li',
		{ class: 'testimonials__item grid-col-12 tablet:grid-col-6 desktop:grid-col-4' },
		card,
	);
	item.dataset.quoteLength = quoteLength;
	return item;
}

export default async function decorate( block ) {
	const items = ( await Promise.all( [...block.children].map( createCard ) ) ).filter( Boolean );
	widenOutlierItems( items );
	const list = domEl( 'ul', { class: 'testimonials__grid grid-row grid-gap' }, ...items );
	block.replaceChildren( list );
}