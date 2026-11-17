import { getMetadata } from './aem.js';
import { div } from './dom-helpers.js';

const BLOCK_TYPES = {
	cards: ['linked-card-grid', 'info-card-grid', 'icon-button-grid', 'backdrop-grid', 'testimonials'],
	list: ['accordion', 'manual-collection', 'events-list', 'search'],
	media: ['figure', 'gallery', 'carousel', 'video', 'embed'],
	panel: ['alert', 'summary-box', 'intro'],
	table: ['table'],
	columns: ['columns'],
};
const activeSkeletons = new WeakMap();

function shape( type = 'line' ) {
	return div( { class: `page-skeleton__shape page-skeleton__${type}` } );
}

function text( lines = 3 ) {
	return div( { class: 'page-skeleton__text' }, ...Array.from( { length: lines }, () => shape() ) );
}

function card( media = false ) {
	const element = div( { class: 'page-skeleton__card' } );
	if ( media ) element.append( shape( 'media' ) );
	element.append( shape( 'heading' ), text(), shape( 'button' ) );
	return element;
}

function firstBlock( main ) {
	return [...main?.querySelectorAll( '[data-block-name], :scope > div > div[class]' ) || []]
		.find( ( block ) => {
			const name = block.dataset.blockName || block.classList[0];
			return !['section-metadata', 'hero', 'hero-homepage', 'event', 'side-navigation', 'side-bar', 'in-page-navigation', 'grid-container'].includes( name );
		} );
}

function blockSkeleton( block, narrow ) {
	const name = block?.dataset.blockName || block?.classList[0] || 'default-content';
	const type = Object.keys( BLOCK_TYPES ).find( ( key ) => BLOCK_TYPES[key].includes( name ) ) || 'text';
	const component = div( {
		class: `page-skeleton__component page-skeleton__component--${type}`,
		'data-skeleton-block': name,
	} );
	const count = Math.max( 1, Math.min( block?.children.length || 3, 4 ) );

	switch ( type ) {
		case 'cards': {
			const columns = Math.min( count, narrow ? 2 : 3 );
			component.style.setProperty( '--skeleton-columns', columns );
			component.style.setProperty( '--skeleton-tablet-columns', Math.min( 2, columns ) );
			component.style.setProperty( '--skeleton-wide-columns', narrow || name === 'testimonials' ? columns : count );
			component.append( ...Array.from( { length: count }, () => card( !!block.querySelector( 'picture, img' ) ) ) );
			break;
		}
		case 'columns': {
			const columns = Math.max( 1, Math.min( block.firstElementChild?.children.length || 2, 4 ) );
			component.style.setProperty( '--skeleton-columns', columns );
			component.style.setProperty( '--skeleton-tablet-columns', Math.min( 2, columns ) );
			component.append( ...Array.from( { length: columns }, () => div( {}, shape( 'heading' ), text( 5 ) ) ) );
			break;
		}
		case 'list':
			component.append( ...Array.from( { length: count }, () => div( { class: 'page-skeleton__list-item' }, shape( 'heading' ), text( name === 'accordion' ? 0 : 2 ) ) ) );
			break;
		case 'table':
			component.append( ...Array.from( { length: Math.max( 3, count ) }, () => div( { class: 'page-skeleton__table-row' }, shape(), shape(), shape() ) ) );
			break;
		case 'media':
			component.append( shape( 'media' ), text( 2 ) );
			break;
		case 'panel':
			component.append( card() );
			break;
		default:
			component.append( shape( 'heading' ), text( 4 ), text( 3 ) );
	}

	return component;
}

function headerSkeleton() {
	return div( { class: 'page-skeleton__header' },
		div( { class: 'grid-container' },
			div( { class: 'page-skeleton__branding' }, shape( 'logo' ), shape( 'heading' ), shape( 'search' ), shape( 'menu' ) ),
			div( { class: 'page-skeleton__navigation' }, shape(), shape(), shape() ),
		),
	);
}

function sidebarSkeleton( layout ) {
	const sidebar = div( { class: 'page-skeleton__sidebar' } );
	if ( layout === 'side-bar' ) {
		sidebar.append(
			shape( 'profile' ),
			div( { class: 'page-skeleton__social' }, shape(), shape(), shape() ),
			shape( 'heading' ),
			...Array.from( { length: 3 }, () => div( { class: 'page-skeleton__list-item' }, shape( 'heading' ), text( 3 ) ) ),
		);
	} else {
		sidebar.append( shape( 'heading' ), text( 5 ) );
	}
	return sidebar;
}

function heroSkeleton( homepage ) {
	const content = div( { class: 'grid-container' }, shape( 'heading' ) );
	if ( homepage ) content.append( text( 2 ), shape( 'button' ) );
	return div( { class: 'page-skeleton__hero' }, content );
}

function footerSkeleton() {
	return div( { class: 'page-skeleton__footer' },
		div( { class: 'grid-container' },
			div( { class: 'page-skeleton__navigation' }, shape(), shape(), shape() ),
			div( { class: 'page-skeleton__branding' }, shape( 'logo' ), text( 2 ) ),
		),
	);
}

export default function showPageSkeleton( doc ) {
	activeSkeletons.get( doc )?.();
	const main = doc.querySelector( 'main' );
	const template = getMetadata( 'template' ) || 'default';
	const layout = ['homepage', 'events'].includes( template )
		? 'default'
		: getMetadata( 'layout' ).toLowerCase().trim().replace( /\s+/g, '-' );
	const hasSidebar = ['side-nav', 'side-bar', 'in-page-nav'].includes( layout );
	const skeleton = div( {
		class: `page-skeleton page-skeleton--${['homepage', 'events'].includes( template ) ? template : 'default'}`,
		'data-skeleton-layout': hasSidebar ? layout : 'default',
		'aria-hidden': 'true',
	} );
	const status = div( { class: 'usa-sr-only', role: 'status' }, 'Loading page...' );
	const regions = [...doc.querySelectorAll( 'body > header, body > main, body > footer' )].map( ( element ) => ( {
		element,
		busy: element.getAttribute( 'aria-busy' ),
		inert: element.hasAttribute( 'inert' ),
	} ) );

	if ( doc.querySelector( 'header' ) ) skeleton.append( headerSkeleton() );
	if ( main ) {
		if ( main.querySelector( 'h1' ) || template === 'events' ) skeleton.append( heroSkeleton( template === 'homepage' ) );
		const content = div( { class: 'page-skeleton__content' } );
		if ( template === 'events' ) {
			content.append( div( { class: 'page-skeleton__event-details' }, card(), card(), card() ) );
		}
		content.append( blockSkeleton( firstBlock( main ), hasSidebar ) );
		const layoutContainer = div( { class: 'grid-container page-skeleton__layout' } );
		if ( hasSidebar ) layoutContainer.append( sidebarSkeleton( layout ) );
		layoutContainer.append( content );
		skeleton.append( layoutContainer );
	}
	if ( doc.querySelector( 'footer' ) ) skeleton.append( footerSkeleton() );

	regions.forEach( ( { element } ) => {
		element.setAttribute( 'aria-busy', 'true' );
		element.inert = true;
	} );
	doc.body.classList.add( 'page-loading' );
	doc.body.prepend( skeleton, status );

	let finished = false;
	const finish = () => {
		if ( finished ) return;
		finished = true;
		window.clearTimeout( timeout );
		activeSkeletons.delete( doc );
		skeleton.remove();
		status.remove();
		regions.forEach( ( { element, busy, inert } ) => {
			if ( busy === null ) element.removeAttribute( 'aria-busy' );
			else element.setAttribute( 'aria-busy', busy );
			element.inert = inert;
		} );
		doc.body.classList.remove( 'page-loading' );
		doc.body.classList.add( 'appear' );
	};
	// A stalled request must not leave the entire site hidden indefinitely.
	const timeout = window.setTimeout( () => {
		console.warn( 'Page loading exceeded 15 seconds; revealing available content.' );
		finish();
	}, 15000 );
	activeSkeletons.set( doc, finish );

	return finish;
}
