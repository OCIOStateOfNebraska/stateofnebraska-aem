import { loadScript, readBlockConfig } from '../../scripts/aem.js';
import { domEl } from '../../scripts/dom-helpers.js';

/**
 * Loads and renders Google Programmable Search Engine results.
 * Reads `?gsc.q=` from the URL automatically
 * where the header search form submits to this page.
 *
 * Block options (authored as rows):
 *   search-engine-id  — Google PSE cx value
 *
 * @param {HTMLElement} block
 */
export default async function decorate( block ) {
	const config = readBlockConfig( block );
	
	const searchEngineId = config['search-engine-id'];

	block.innerHTML = '';

	const wrapper = domEl( 'div', { class: 'google-results-wrapper' } );

	const searchResults = domEl( 'div', {
		class: 'gcse-searchresults-only',
		'data-queryParameterName': 'q',
	} );
	wrapper.append( searchResults );
	block.append( wrapper );

	loadScript(
		`https://cse.google.com/cse.js?cx=${encodeURIComponent( searchEngineId )}`,
		{ async: 'true' },
	).catch( () => {
		wrapper.append(
			domEl( 'p', { class: 'google-search-error' }, 'Search is temporarily unavailable.' ),
		);
	} );
}
