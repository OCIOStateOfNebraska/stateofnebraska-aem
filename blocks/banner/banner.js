import {
	fetchPlaceholders,
} from '../../scripts/aem.js';
import {
	domEl,
	p,
} from '../../scripts/dom-helpers.js';

export default async function decorate( block ) {
	const bannerTextId = 'usa-banner-text';

	const placeholders = await fetchPlaceholders();
	const { banner } = placeholders;
	
	const section = domEl( 'section', { class: 'usa-banner', 'aria-labelledby': bannerTextId } );
	const innerDiv = domEl( 'div', { class: 'usa-banner__header usa-banner__inner' } );
	const pEle = p( { class: 'usa-banner__header-text', id: bannerTextId}, banner ? banner : 'An official website of the State of Nebraska' );
	innerDiv.append( pEle );
	section.append( innerDiv );

	block.textContent = '';
	block.appendChild( section );
}


/***
 * <section
  class="usa-banner"
  aria-label="Official website of the United States government"
>
  <div class="usa-accordion">
    <header class="usa-banner__header">
      <div class="usa-banner__inner">
        
        <div class="grid-col-fill tablet:grid-col-auto" aria-hidden="true">
          <p class="usa-banner__header-text">
            An official website of the United States government
          </p>
          <p class="usa-banner__header-action">Here’s how you know</p>
        </div>
        <button
          type="button"
          class="usa-accordion__button usa-banner__button"
          aria-expanded="false"
          aria-controls="gov-banner-default"
        >
          <span class="usa-banner__button-text">Here’s how you know</span>
        </button>
      </div>
    </header>
 */