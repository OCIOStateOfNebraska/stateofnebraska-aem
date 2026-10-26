import { loadPage } from './page.js';

export { decorateMain, decorateInner, loadPage } from './page.js';

if ( !window.hlx.suppressLoadPage ) await loadPage();

window.setTimeout( () => document.body.classList.add( 'appear' ), 2000 );

if ( new URL( window.location.href ).searchParams.has( 'dapreview' ) ) {
	import( 'https://da.live/scripts/dapreview.js' ).then( ( { default: daPreview } ) => daPreview( loadPage ) );
}

if ( new URL( window.location.href ).searchParams.has( 'quick-edit' ) ) {
	import( '../tools/quick-edit/quick-edit.js' ).then( ( mod ) => mod.default() );
}
