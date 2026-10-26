import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer. Note that the main content of the footer is in footer-navigation
 * @param {Element} block The footer block element
 */
export default async function decorate( block, originUrl = '' ) {
	// load footer as fragment
	const footer = block;
	const footerMeta = getMetadata( 'footer' );
	const footerPath = footerMeta
		? new URL( footerMeta, originUrl || window.location.href ).pathname
		: '/footer';
	const footerUrl = originUrl ? new URL( footerPath, originUrl ).href : footerPath;
	const fragment = await loadFragment( footerUrl );
	if ( originUrl ) {
		fragment?.querySelectorAll( 'a[href]' ).forEach( ( link ) => {
			const href = link.getAttribute( 'href' );
			if ( href && !/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test( href ) ) {
				link.href = new URL( href, `${originUrl}/` ).href;
			}
		} );
	}

	block.textContent = '';
	while ( fragment?.firstElementChild ) footer.append( fragment.firstElementChild );
}