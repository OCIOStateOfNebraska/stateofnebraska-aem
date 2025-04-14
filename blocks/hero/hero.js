import { getMetadata, decorateBlock, loadBlock, buildBlock } from '../../scripts/aem.js';

function buildBreadcrumbBlock( heroBlock ) {
	const hideBreadcrumbVal = getMetadata( 'hide-breadcrumb' ) || 'no';
	const hideBreadcrumb = hideBreadcrumbVal.toLowerCase() === 'yes' || hideBreadcrumbVal.toLowerCase() === 'true';
	if ( window.location.pathname !== '/' && window.isErrorPage !== true && !hideBreadcrumb ) {
		const section = document.createElement( 'div' );
		const breadcrumbs = buildBlock( 'breadcrumb', { elems: [] } );
		section.append( breadcrumbs );
		decorateBlock( breadcrumbs );
		loadBlock( breadcrumbs );
		heroBlock.prepend( section );
	}
}

export default function decorate( block ) {
	buildBreadcrumbBlock( block );
}
