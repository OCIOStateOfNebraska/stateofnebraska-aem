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
	h1.classList.add( 'usa-hero__heading' );
	content.appendChild( h1 );

	const svg = `
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1727 86.298" preserveAspectRatio="none">
			<path class="usa-hero__svg-back" d="M1727 64.146c-295.4 32.475-530.69 19.402-695.6 0C807.283 37.782 675.19-4.221 479.723 25.283c-40.637 6.131-147.045 24.889-295.829 30.178-78.055 2.773-142.128.941-183.894-1.04V87.01l1727 .952V64.137v.01Z"/>
			<path class="usa-hero__svg-mid" d="M0 72.109c107.878 2.852 275.051 3.773 479.723-10.3C801.636 39.683 922.646.661 1159.33.008c133.62-.357 328.71 11.439 567.67 72.101v14.9H0v-14.9Z"/>
			<path class="usa-hero__svg-fore" d="M0 87.009h1727V51.508c-99-10.815-245.72-22.601-423.75-20.6-230.38 2.595-376.166 26.751-519.703 41.201C597.654 90.818 332.528 94.195 0 54.42v32.589Z"/>
		</svg>
	`;
	const svgDiv = div( { class: 'usa-hero__svg' } );
	svgDiv.innerHTML = svg;
	
	block.innerText = '';
	block.appendChild( container );
	if( backgroundImg ) { container.before( backgroundImg ); }
	block.appendChild( svgDiv );
}
