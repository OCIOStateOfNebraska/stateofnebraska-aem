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
		const mobileBreakpoint = 640;
		const nav = block.querySelector( '.usa-in-page-nav' );
		const navList = nav.querySelector( '.usa-in-page-nav__list' );
		const navTop = block.getBoundingClientRect().top + window.scrollY;
		if ( window.scrollY > navTop && window.innerWidth < mobileBreakpoint && window.matchMedia( '(orientation: portrait)' ).matches ) {
			nav.classList.add( 'usa-in-page-nav--scrolled' );
			const currentLink = navList.querySelector( '.usa-current' );
			if ( currentLink ) {
				navList.scrollTo( {
					left: currentLink.parentElement.offsetLeft,
				} );
			}
		}
		else {
			nav.classList.remove( 'usa-in-page-nav--scrolled' );
		}
	}

	block.textContent = '';
	block.appendChild( sidenav );
	
	block.parentNode.classList.add( 'usa-in-page-nav-container' );
	inPageNavigation.on();
	
	sidenav.addEventListener( 'click', mobileNavCurrent );

	let debouncer = null;
	document.addEventListener( 'scroll', () =>{
		if( debouncer ) return;
	
		debouncer = setTimeout( () => {
			mobileNavCurrent();
			debouncer = null;
		}, 100 );
	}, { passive: true } );

}