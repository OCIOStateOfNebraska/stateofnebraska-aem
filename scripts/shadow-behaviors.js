const initialized = new WeakSet();

function setExpanded( button, expanded ) {
	const id = button.getAttribute( 'aria-controls' );
	const target = button.getRootNode().querySelector( `#${CSS.escape( id )}` );
	if ( !target ) throw new Error( `Missing controlled element: ${id}` );
	button.setAttribute( 'aria-expanded', String( expanded ) );
	target.hidden = !expanded;
}

export function initShadowAccordion( block, context ) {
	block.querySelectorAll( '.usa-accordion__button[aria-controls]' ).forEach( ( button ) => {
		if ( initialized.has( button ) ) return;
		initialized.add( button );
		setExpanded( button, button.getAttribute( 'aria-expanded' ) === 'true' );
		button.addEventListener( 'click', () => {
			const expanded = button.getAttribute( 'aria-expanded' ) !== 'true';
			const accordion = button.closest( '.usa-accordion, .usa-accordion--bordered' );
			if ( expanded && accordion && !accordion.hasAttribute( 'data-allow-multiple' ) ) {
				accordion.querySelectorAll( '.usa-accordion__button[aria-controls]' ).forEach( ( other ) => {
					if ( other !== button && other.closest( '.usa-accordion, .usa-accordion--bordered' ) === accordion ) {
						setExpanded( other, false );
					}
				} );
			}
			setExpanded( button, expanded );
		}, { signal: context.signal } );
	} );
}

export function initShadowHeader( block, context ) {
	initShadowAccordion( block, context );
	const nav = block.querySelector( '.usa-nav' );
	const menu = block.querySelector( '.usa-menu-btn' );
	const close = block.querySelector( '.usa-nav__close' );
	const overlay = block.querySelector( '.usa-overlay' );
	if ( !nav || !menu || !close || !overlay ) throw new Error( 'Header navigation is incomplete' );
	const options = { signal: context.signal };
	const desktop = window.matchMedia( '(min-width: 64em)' );
	const toggle = ( open ) => {
		nav.classList.toggle( 'is-visible', open );
		overlay.classList.toggle( 'is-visible', open );
		menu.setAttribute( 'aria-expanded', String( open ) );
		block.closest( '.aem-embed-content' ).classList.toggle( 'usa-js-mobile-nav--active', open );
		( open ? close : menu ).focus();
	};
	const closeDropdowns = () => {
		nav.querySelectorAll( '.usa-nav__link[aria-expanded="true"]' ).forEach( ( button ) => setExpanded( button, false ) );
	};
	menu.addEventListener( 'click', () => toggle( true ), options );
	close.addEventListener( 'click', () => toggle( false ), options );
	overlay.addEventListener( 'click', () => toggle( false ), options );
	desktop.addEventListener( 'change', () => {
		if ( desktop.matches && nav.classList.contains( 'is-visible' ) ) toggle( false );
	}, options );
	block.addEventListener( 'click', ( event ) => {
		if ( event.target.closest( '.usa-nav a' ) ) {
			closeDropdowns();
			if ( nav.classList.contains( 'is-visible' ) ) toggle( false );
		}
		if ( !event.target.closest( '.usa-nav__primary' ) ) closeDropdowns();
	}, options );
	nav.addEventListener( 'focusout', ( event ) => {
		if ( !nav.contains( event.relatedTarget ) ) closeDropdowns();
	}, options );
	block.addEventListener( 'keydown', ( event ) => {
		if ( event.key === 'Escape' ) {
			const expanded = nav.querySelector( '.usa-nav__link[aria-expanded="true"]' );
			if ( expanded ) {
				closeDropdowns();
				expanded.focus();
			} else if ( nav.classList.contains( 'is-visible' ) ) {
				toggle( false );
			}
		}
		if ( event.key !== 'Tab' || !nav.classList.contains( 'is-visible' ) ) return;
		const focusable = [...nav.querySelectorAll( 'a[href], button, input, select, textarea, [tabindex]' )]
			.filter( ( element ) => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length );
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if ( event.shiftKey && event.target === first ) {
			event.preventDefault();
			last.focus();
		} else if ( !event.shiftKey && event.target === last ) {
			event.preventDefault();
			first.focus();
		}
	}, options );
}
