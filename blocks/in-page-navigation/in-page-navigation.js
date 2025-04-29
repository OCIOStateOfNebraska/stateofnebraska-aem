import { domEl } from '../../scripts/dom-helpers.js';
import { inPageNavigation } from '../../scripts/deps/bundle-uswds.js';

export default async function decorate( block ) {
	const sidenav = domEl( 'aside', {
		'class': 'usa-in-page-nav',
		'data-title-text': 'On this page',
		'data-title-heading-level': 'h2',
		'data-scroll-offset': '0',
		'data-root-margin': '0px 0px 0px 0px',
		'data-threshold': '1',
		'data-main-content-selector': '.main-content',
	} );

	block.textContent = '';
	block.appendChild( sidenav );

	block.parentNode.classList.add( 'usa-in-page-nav-container' );
	inPageNavigation.on();
}