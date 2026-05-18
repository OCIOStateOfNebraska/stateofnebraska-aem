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

	const wrapper = domEl( 'div', { class: 'usa-banner usa-banner--ne' } );
	const innerDiv = domEl( 'div', { class: 'usa-banner__header usa-banner__inner' } );
	const pEle = p( { class: 'usa-banner__header-text', id: bannerTextId}, banner ? banner : 'An official website of the State of Nebraska' );
	const iconImg = domEl( 'img', { src: '/icons/nebraska-icon.svg', alt: '', 'aria-hidden': 'true', class: 'usa-banner__header-flag', loading: 'lazy'} );
	pEle.prepend( iconImg );
	innerDiv.append( pEle );
	wrapper.append( innerDiv );

	block.textContent = '';
	block.appendChild( wrapper );
}
