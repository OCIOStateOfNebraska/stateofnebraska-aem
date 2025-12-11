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
		const nav = document.querySelector( '.usa-in-page-nav' );
		const navList = nav.querySelector( '.usa-in-page-nav__list' );
		const navTop = document.querySelector( '.in-page-navigation.block' ).getBoundingClientRect().top + window.scrollY;
		if ( window.scrollY > navTop && window.innerWidth < px * 40 && window.matchMedia( '(orientation: portrait)' ).matches ) {
			nav.style.position = 'fixed';
			nav.style.top = '0';
			nav.style.left = '0';
			nav.style.right = '0';
			nav.querySelector( '.usa-in-page-nav__heading' ).style.display= 'none';

			
			nav.style.zIndex= 10;
			nav.style.isolation= 'isolate';
			setTimeout( () => {
				const currentLink = navList.querySelector( '.usa-current' );
				if ( currentLink ) {
					navList.scrollTo( {
						left: currentLink.parentElement.offsetLeft,
					} );
					nav.style.backgroundColor = 'white';
				}

			}, 100 );
		}
		else {
			nav.style.position = 'static';
			nav.style.backgroundColor = 'transparent';
			nav.querySelector( '.usa-in-page-nav__heading' ).style.display= 'block';
		}
	}

	document.addEventListener( 'scroll', mobileNavCurrent );
	sidenav.addEventListener( 'click', mobileNavCurrent );

	block.textContent = '';
	block.appendChild( sidenav );

	block.parentNode.classList.add( 'usa-in-page-nav-container' );
	inPageNavigation.on();
}