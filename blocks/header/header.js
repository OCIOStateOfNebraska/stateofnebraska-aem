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

async function loadAndDecorateAlert() {
	const alertMeta = getMetadata( 'alert' );
	const alertPath = alertMeta ? new URL( alertMeta, window.location ).pathname : '/alert';
	const alertFragment = await loadFragment( alertPath );

	const alerts = alertFragment.querySelectorAll( '.alert-wrapper' );
	const alertContainer = domEl( 'div', { class: 'alert-container' } );

	// Adjust state classes that the block added - they're applied differently and are more on the global alerts
	Array.from( alerts ).forEach( wrap => {
		const alertEle = wrap.querySelector( '.usa-alert' );
		alertEle.parentNode.classList.add( 'usa-site-alert' );
		if( alertEle.classList.contains( 'usa-alert--emergency' ) ) {
			alertEle.classList.remove( 'usa-alert--emergency' );
			alertEle.parentNode.classList.add( 'usa-site-alert--emergency' );
		} else {
			alertEle.classList.remove( 'usa-alert--warning', 'usa-alert--error', 'usa-alert--success', 'usa-alert--info' );
			alertEle.parentNode.classList.add( 'usa-site-alert--info' );
		}

		alertEle.classList.remove( 'usa-alert--no-icon', 'usa-alert--slim' );

		alertContainer.append( wrap );
	} );

	return alerts.length && alertContainer;
}

/**
 * loads and decorates the header, including nav and global alerts
 * @param {Element} block The header block element
 */
export default async function decorate( block ) {
	const alertEle = await loadAndDecorateAlert( block );
	const navEle = await loadAndDecorateNav( block );

	block.innerHTML = '';
	if( alertEle ) { block.appendChild( alertEle ); }
	block.appendChild( navEle );
}
