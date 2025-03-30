import { domEl, p } from '../../scripts/dom-helpers.js';
import { addClassToLists, addClassToLinks } from '../../scripts/utils.js';

export default function decorate( block ) {
	const alert = block.querySelector( ':scope div' );
	// has 2 divs, and the heading is the first one (just being defensive, so everything doesn't render as a header)
	const headingText = alert?.querySelector( ':scope div:first-child:nth-last-child(2)' ).textContent.trim();
	const bodyEle = alert?.querySelector( ':scope div:last-child' );

	//
	// Alert Wrapper
	// Note: slightly different structure than USWDS, since we can't swap the AEM-created <div> for a <section> without losing references
	//
	const newInner = domEl( 'section', {
		class: 'usa-alert',
		'aria-label': `Site Alert${ headingText && headingText.length ? `: ${headingText}` : '' }`
	} );
	if( block.classList.contains( 'emergency' ) ) {
		newInner.classList.add( 'usa-alert--emergency' );
	} else if( block.classList.contains( 'warning' ) ) {
		newInner.classList.add( 'usa-alert--warning' );
	} else if( block.classList.contains( 'error' ) ) {
		newInner.classList.add( 'usa-alert--error' );
	} else if( block.classList.contains( 'success' ) ) {
		newInner.classList.add( 'usa-alert--success' );
	} else {
		newInner.classList.add( 'usa-alert--info' );
	}

	if( block.classList.contains( 'no-icon' ) ) {
		newInner.classList.add( 'usa-alert--no-icon' );
	}

	if( block.classList.contains( 'slim' ) ) {
		newInner.classList.add( 'usa-alert--slim' );
	}

	if( !headingText || !headingText.length ) {
		newInner.classList.add( 'usa-alert--no-heading' );
	}

	//
	// Alert Body
	//
	bodyEle.classList.add( 'usa-alert__body' );
	addClassToLists( bodyEle );
	addClassToLinks( bodyEle );

	Array.from( bodyEle.querySelectorAll( ':scope > p' ) ).forEach( p => {
		p.classList.add( 'usa-alert__text' );
	} );

	//
	// Alert Heading
	//
	if( headingText && headingText.length ) {
		const headingEle = p( { class: 'usa-alert__heading' }, headingText );
		bodyEle.prepend( headingEle );
	}

	newInner.appendChild( bodyEle );

	//
	// Swapping Content
	//
	block.textContent = '';
	block.appendChild( newInner );
}
