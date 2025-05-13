import { getMetadata, decorateBlock, loadBlock, buildBlock } from '../../scripts/aem.js';
import { div } from '../../scripts/dom-helpers.js';

function buildBreadcrumbBlock( breadcrumbContainer ) {
	const hideBreadcrumbVal = getMetadata( 'hide-breadcrumb' ) || 'no';
	const hideBreadcrumb = hideBreadcrumbVal.toLowerCase() === 'yes' || hideBreadcrumbVal.toLowerCase() === 'true';
	if ( !hideBreadcrumb && window.location.pathname !== '/' && window.isErrorPage !== true ) {
		const section = document.createElement( 'div' );
		const breadcrumbs = buildBlock( 'breadcrumb', { elems: [] } );
		section.append( breadcrumbs );
		decorateBlock( breadcrumbs );
		loadBlock( breadcrumbs );
		breadcrumbContainer.prepend( breadcrumbs );
	}
}

export default function decorate( block ) {
	block.classList.add( 'usa-hero' );
	const container = div( { class: 'grid-container' } );
	const content = div( { class: 'usa-hero__callout' } );
	container.appendChild( content );

	buildBreadcrumbBlock( content );

	const backgroundImg = block.querySelector( 'picture' );

	const h1 = block.querySelector( 'h1' );
	if ( h1 ) {
		h1.classList.add( 'usa-hero__heading' );
		content.appendChild( h1 );
	}

	const svg = `
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1727 86" preserveAspectRatio="none">
			<path class="usa-hero__svg-back" d="M1727,64c-295.4,32.5-530.7,19.4-695.6,0C807.3,37.6,675.2-4.4,479.7,25.1c-40.6,6.1-147,24.9-295.8,30.2C105.8,58.1,41.8,56.3,0,54.3v32.6l1727,1v-23.8h0s0,0,0,0Z"/>
			<path class="usa-hero__svg-mid" d="M0,72c107.9,2.9,275.1,3.8,479.7-10.3C801.6,39.5,922.6.5,1159.3-.1c133.6-.4,328.7,11.4,567.7,72.1v14.9H0v-14.9Z"/>
			<path class="usa-hero__svg-fore" d="M0,86.9h1727v-35.5c-99-10.8-245.7-22.6-423.8-20.6-230.4,2.6-376.2,26.8-519.7,41.2C597.7,90.7,332.5,94,0,54.3v32.6Z"/>
		</svg>
	`;
	const svgDiv = div( { class: 'usa-hero__svg' } );
	svgDiv.innerHTML = svg;

	block.innerText = '';
	block.appendChild( container );
	if ( backgroundImg ) { container.before( backgroundImg ); }
	block.appendChild( svgDiv );
}
