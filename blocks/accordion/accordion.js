import { domEl } from '../../scripts/dom-helpers.js';
import { createId } from '../../scripts/utils.js';
import { accordion } from '../../scripts/deps/bundle-uswds.js';

export default function decorate( block ) {
	let accordions = block.children;
	let usaAccordion = domEl( 'div', { class: 'usa-accordion' } );

	Array.from( accordions ).forEach( ( accordion ) => {
		let heading = accordion.querySelector( 'h2, h3, h4, h5, h6' );
		let content = accordion.querySelector( 'div:last-child' );
		let accordionId = createId( heading.innerText );

		// Create a new button for the heading
		let button = domEl( 'button', {
			type: 'button',
			class: 'usa-accordion__button',
			'aria-expanded': 'false',
			'aria-controls': accordionId,
		} );
		button.innerText = heading.innerText;
		heading.textContent = '';
		heading.classList.add( 'usa-accordion__heading' );
		heading.appendChild( button );

		// Create new content div
		let contentEl = domEl( 'div', { class: 'usa-accordion__content usa-prose', id: accordionId, 'hidden': 'true' } );
		contentEl.appendChild( content );

		// Append new elements
		usaAccordion.appendChild( heading );
		usaAccordion.appendChild( contentEl );
	} );

	block.textContent = '';
	block.appendChild( usaAccordion );
	accordion.on();
}