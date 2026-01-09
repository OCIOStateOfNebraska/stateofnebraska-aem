import {
	fetchPlaceholders,
} from '../../scripts/aem.js';
import {
	domEl,
	p,
} from '../../scripts/dom-helpers.js';

export default async function decorate( block ) {
	const bannerTextId = 'usa-banner-text';

	const placeholders = await fetchPlaceholders();
	const { banner } = placeholders;

	const section = domEl( 'section', { class: 'usa-banner usa-banner--ne', 'aria-labelledby': bannerTextId } );
	const innerDiv = domEl( 'div', { class: 'usa-banner__header usa-banner__inner' } );
	const pEle = p( { class: 'usa-banner__header-text', id: bannerTextId}, banner ? banner : 'An official website of the State of Nebraska' );
	const iconImg = domEl( 'img', { src: '/icons/nebraska-icon.svg', alt: '', 'aria-hidden': 'true', class: 'usa-banner__header-flag', loading: 'lazy'} );
	pEle.prepend( iconImg );
	innerDiv.append( pEle );
	section.append( innerDiv );

	block.textContent = '';
	block.appendChild( section );
}
