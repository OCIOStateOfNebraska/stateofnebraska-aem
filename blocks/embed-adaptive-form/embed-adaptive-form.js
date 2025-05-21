import {
	decorateInner,
} from '../../scripts/scripts.js';

import {
	loadSections,
} from '../../scripts/aem.js';

export default async function decorate(block) {
  console.log('hello');
  // Create observer to load form when block enters viewport
  const observer = new IntersectionObserver(async (entries) => {
    const [entry] = entries;
    if (entry.isIntersecting) {
      // Disconnect observer after loading to prevent multiple loads
      observer.disconnect();

      const container = block.querySelector('a[href]');
      // get the pathname from the href
      // const { pathname } = new URL(container.href);
      // const pathname = "https://main--forms--ociostateofnebraska.aem.live/test-form";
      const pathname = "https://publish-p149152-e1521617.adobeaemcloud.com/content/ne-forms/test-form";
      const form = await loadFragment(pathname);
      block.replaceChildren(form.children[0]);
    }
  });

  // Start observing the block
  observer.observe(block);
  return block;
}

/**
 * Loads a fragment.
 * @param {string} path The path to the fragment
 * @returns {HTMLElement} The root element of the fragment
 */
async function loadFragment( path ) {
	if ( path ) {
		const resp = await fetch( `${path}.plain.html` );
		if ( resp.ok ) {
			const container = document.createElement( 'div' );
			container.classList.add( 'fragment' );
			container.innerHTML = await resp.text();

			// reset base path for media to fragment base
			const resetAttributeBase = ( tag, attr ) => {
				container.querySelectorAll( `${tag}[${attr}^="./media_"]` ).forEach( ( elem ) => {
					elem[attr] = new URL( elem.getAttribute( attr ), new URL( path, window.location ) ).href;
				} );
			};
			resetAttributeBase( 'img', 'src' );
			resetAttributeBase( 'source', 'srcset' );

			decorateInner( container );
			await loadSections( container );
			return container;
		}
	}
	return null;
}
