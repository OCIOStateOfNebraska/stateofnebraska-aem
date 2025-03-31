import { getMetadata, decorateBlock, loadBlock, buildBlock, fetchPlaceholders } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { p, a, domEl } from '../../scripts/dom-helpers.js';

function decorateSkipnav( block, placeholders ) {
	const { skipnav } = placeholders;
	const skipNav = a( { class: 'usa-skipnav', href: '#main-content' }, skipnav ? skipnav : 'Skip to main content' );
	return skipNav;
}

async function loadBanner() {
	const bannerWrapper = domEl( 'div', { class: 'banner-wrap' } );
	const bannerBlock = buildBlock( 'banner', '' );

	bannerWrapper.appendChild( bannerBlock );
	decorateBlock( bannerBlock );

	return loadBlock( bannerBlock );
}

// TODO: Leverage block
// eslint-disable-next-line no-unused-vars
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
	if( !alertMeta ) { return null; }

	const alertPath = new URL( alertMeta, window.location ).pathname;
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
	const placeholders = await fetchPlaceholders();

	const skipNav = decorateSkipnav( block, placeholders );
	const alertEle = await loadAndDecorateAlert( block );
	const bannerEle = await loadBanner( block );
	const navEle = await loadAndDecorateNav( block );

	block.innerHTML = '';

	block.append( skipNav );
	if( alertEle ) { block.append( alertEle ); }
	block.appendChild( bannerEle );
	block.appendChild( navEle );
}
