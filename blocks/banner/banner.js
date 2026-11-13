import {
	fetchPlaceholders,
} from '../../scripts/utils.js';
import {
	domEl,
	p,
} from '../../scripts/dom-helpers.js';
import { getAssetBasePath } from '../../scripts/utils.js';

export default async function decorate( block, originUrl = '' ) {
	const bannerTextId = 'usa-banner-text';

	const placeholders = await fetchPlaceholders( 'default', originUrl );
	const { banner } = placeholders;
	const iconBasePath = getAssetBasePath( block, originUrl );

	const wrapper = domEl( 'div', { class: 'usa-banner usa-banner--ne' } );
	const innerDiv = domEl( 'div', { class: 'usa-banner__header usa-banner__inner' } );
	const pEle = p( { class: 'usa-banner__header-text', id: bannerTextId}, banner ? banner : 'An official website of the State of Nebraska' );
	const iconImg = domEl( 'img', { src: `${iconBasePath}/icons/nebraska-icon.svg`, alt: '', 'aria-hidden': 'true', class: 'usa-banner__header-flag', loading: 'lazy'} );
	pEle.prepend( iconImg );
	innerDiv.append( pEle );
	wrapper.append( innerDiv );

	block.textContent = '';
	block.appendChild( wrapper );
}
