import {
	domEl,
	a,
	li,
	ol,
	span
} from '../../scripts/dom-helpers.js';

const getPageTitle = async ( url ) => {
	const resp = await fetch( url );
	if ( resp.ok ) {
		const html = document.createElement( 'div' );
		html.innerHTML = await resp.text();
		return html.querySelector( 'title' ).innerText;
	}

	return '';
};

const getAllPathsExceptCurrent = async ( paths ) => {
	const result = [];
	// remove first and last slash characters
	const pathsList = paths.replace( /^\/|\/$/g, '' ).split( '/' );
	for ( let i = 0; i < pathsList.length - 1; i += 1 ) {
		const pathPart = pathsList[i];
		const prevPath = result[i - 1] ? result[i - 1].path : '';
		const path = `${prevPath}/${pathPart}`;
		const url = `${window.location.origin}${path}/`;
		/* eslint-disable-next-line no-await-in-loop */
		const name = await getPageTitle( url );
		if ( name ) {
			result.push( { path, name, url, position: i + 2 } );
		}
	}
	return result;
};

const createLi = ( path ) => {
	//TODO: strip | from title
	//TODO: placeholders
	const linkMeta = domEl( 'meta', { property: 'position', content: path.position } );
	const linkSpan = span( { property: 'name' }, path.name );
	let pathLink;
	if ( path.url ) {
		pathLink = a( { href: path.url, property: 'item', typeof: 'WebPage', class: 'usa-breadcrumb__link' }, linkSpan );
	}
	const liEle = li(
		{ property: 'itemListElement', typeof: 'ListItem', class: 'usa-breadcrumb__list-item', ...( path.current && { 'aria-current': 'page' } ) },
		pathLink ? pathLink : linkSpan
	);
	liEle.appendChild( linkMeta );
	return liEle;
};

export default async function decorate( block ) {
	const breadcrumbNav = domEl( 'nav', { class: 'usa-breadcrumb', 'aria-label': 'Breadcrumbs' } );
	const olEle = ol( { class: 'usa-breadcrumb__list', vocab: 'https://schema.org/', typeof: 'BreadcrumbList' } );

	// Add home link
	const homeLink = createLi( { path: '', name: 'Home', url: '/', position: 1 } );
	const breadcrumbLinks = [homeLink.outerHTML];

	// Gather all ancestor paths
	const path = window.location.pathname;
	const paths = await getAllPathsExceptCurrent( path );

	paths.forEach( ( pathPart ) => breadcrumbLinks.push( createLi( pathPart ).outerHTML ) );

	// Add current page
	const currentPathLi = createLi( { path: path, name: document.querySelector( 'title' ).innerText, position: paths.length + 2, current: true } );
	breadcrumbLinks.push( currentPathLi.outerHTML );

	olEle.innerHTML = breadcrumbLinks.join( '' );
	breadcrumbNav.append( olEle );
	block.append( breadcrumbNav );
}