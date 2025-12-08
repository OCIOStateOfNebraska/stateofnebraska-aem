import { domEl } from '../../scripts/dom-helpers.js';
import { inPageNavigation } from '../../scripts/deps/bundle-uswds.js';

export default async function decorate( block ) {
	const sidenav = domEl( 'aside', {
		'class': 'usa-in-page-nav',
		'data-title-text': 'On this page',
		'data-title-heading-level': 'h2',
		'data-scroll-offset': '48',
		'data-root-margin': '48px 0px -90% 0px',
		'data-threshold': '1',
		'data-main-content-selector': '.main-content',
	} );

	// stick nav to top on mobile and scroll to current item
	function mobileNavCurrent() {
		const px = parseFloat( getComputedStyle( document.documentElement ).fontSize ) ;
		const nav = document.querySelector( '.usa-in-page-nav__list' );
		const navTop = document.querySelector( '.usa-in-page-nav' ).getBoundingClientRect().top + window.scrollY;
		if ( window.scrollY > navTop && window.innerWidth < px * 40 && window.matchMedia( '(orientation: portrait)' ).matches ) {
			nav.style.position = 'fixed';
			nav.style.top = 0;
			nav.style.left = 0;
			setTimeout( () => {
				const currentLink = nav.querySelector( '.usa-current' );
				if ( currentLink ) {
					nav.scrollTo( {
						left: currentLink.parentElement.offsetLeft,
					} );
					nav.style.backgroundColor = 'white';
				}

			}, 200 );
		}
		else {
			nav.style.position = 'static';
			nav.style.backgroundColor = 'transparent';

		}
	}

	document.addEventListener( 'scroll', mobileNavCurrent );
	sidenav.addEventListener( 'click', mobileNavCurrent );

	block.textContent = '';
	block.appendChild( sidenav );

	block.parentNode.classList.add( 'usa-in-page-nav-container' );
	inPageNavigation.on();
}