import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { p, domEl } from '../../scripts/dom-helpers.js';

async function loadAndDecorateNav( block ) {
	// load nav as fragment
	const navMeta = getMetadata( 'nav' );
	const navPath = navMeta ? new URL( navMeta, window.location ).pathname : '/nav';
	// TODO: Do something with the navFragment
	// eslint-disable-next-line no-unused-vars
	const navFragment = await loadFragment( navPath );

	const nav = domEl( 'nav', {	
		'aria-label': 'Primary navigation',
		'class': 'usa-nav'
	} );
	nav.appendChild( p( {}, 'TODO: Global Navigation' ) );
	return nav;
}

async function loadAlert() {
	const alertMeta = getMetadata( 'alert' );
	const alertPath = alertMeta ? new URL( alertMeta, window.location ).pathname : '/alert';
	const alertFragment = await loadFragment( alertPath );

	// remove <main> from fragment
	const alertWrap = alertFragment.querySelector( '.alert-container' );
	return alertWrap;
}

/**
 * loads and decorates the header, including nav and global alerts
 * @param {Element} block The header block element
 */
export default async function decorate( block ) {
	const alertEle = await loadAlert( block );
	const navEle = await loadAndDecorateNav( block );

	block.innerHTML = '';
	if( alertEle ) { block.appendChild( alertEle ); }
	block.appendChild( navEle );
}
