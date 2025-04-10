import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer. Note that the main content of the footer is in footer-navigation
 * @param {Element} block The footer block element
 */
export default async function decorate( block ) {
	// load footer as fragment
	const footer = block;
	const footerMeta = getMetadata( 'footer' );
	const footerPath = footerMeta ? new URL( footerMeta, window.location ).pathname : '/footer';
	const fragment = await loadFragment( footerPath );

	block.textContent = '';
	while ( fragment.firstElementChild ) footer.append( fragment.firstElementChild );
}