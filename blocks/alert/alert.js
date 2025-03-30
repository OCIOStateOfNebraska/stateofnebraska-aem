import { domEl, p } from '../../scripts/dom-helpers.js';
import { addClassToLists, addClassToLinks } from '../../scripts/utils.js';

export default function decorate( block ) {
	const alert = block.querySelector( ':scope div' );
	const headingText = alert?.querySelector( ':scope div:first-child' ).textContent.trim();
	const bodyEle = alert?.querySelector( ':scope div:last-child' );

	//
	// Tweaking Block
	//
	block.classList.add( 'usa-site-alert' );
	block.classList.add( block.classList.contains( 'emergency' ) ? 'usa-site-alert--emergency' : 'usa-site-alert--info' );
	if( !headingText || !headingText.length ) {
		block.classList.add( 'usa-site-alert--no-heading' );
	}

	//
	// Alert Wrapper
	// Note: slightly different structure than USWDS, since we can't swap the AEM-created <div> for a <section> without losing references
	//
	const newInner = domEl( 'section', {
		class: 'usa-alert',
		'aria-label': `Site Alert${ headingText && headingText.length ? `: ${headingText}` : '' }`
	} );

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
