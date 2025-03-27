import {
	getMetadata,
} from '../../scripts/aem.js';
import {
	domEl,
	p,
	img,
	span,
	button,
} from '../../scripts/dom-helpers.js';

export default function decorate( block ) {
	const setType = getMetadata( 'domain' );
	let type = 'gov';
	if ( setType === 'mil' ) {
		type = 'mil';
	} else {
		type = 'gov';
	}

	const bannerText = 'An official website of the State of Nebraska';
	let buttonText;
	let officialText;
	let secureText;

	if ( /^es\b/.test( navigator.language ) ) {
		buttonText = 'Así es como usted puede verificarlo';
		officialText = `<strong>Los sitios web oficiales usan .${type}</strong><br/>Un sitio web <strong>.${type}</strong> pertenece a una organización oficial del Gobierno de Estados Unidos.`;
		secureText = `<strong>Los sitios web seguros .${type} usan HTTPS</strong><br/>Un <strong>candado</strong> (  <span class="icon-lock"><svg xmlns="http://www.w3.org/2000/svg" width="52" height="64" viewBox="0 0 52 64" class="usa-banner__lock-image" role="img" aria-labelledby="banner-lock-description" focusable="false"><title id="banner-lock-title">Lock</title><desc id="banner-lock-description">Locked padlock icon</desc><path fill="#000000" fill-rule="evenodd" d="M26 0c10.493 0 19 8.507 19 19v9h3a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V32a4 4 0 0 1 4-4h3v-9C7 8.507 15.507 0 26 0zm0 8c-5.979 0-10.843 4.77-10.996 10.712L15 19v9h22v-9c0-6.075-4.925-11-11-11z"/></svg></span>) o <strong>https://</strong> significa que usted se conectó de forma segura a un sitio web .${type}.  Comparta información sensible sólo en sitios web oficiales y seguros.`;
	} else {
		buttonText = 'Here\'s how you know';
		officialText = `<strong>Official websites use .${type}</strong><br/>A <strong>.${type}</strong> website belongs to an official government organization in the United States.`;
		secureText = `<strong>Secure .${type} websites use HTTPS</strong><br/>A <strong>lock</strong> (  <span class="icon-lock"><svg xmlns="http://www.w3.org/2000/svg" width="52" height="64" viewBox="0 0 52 64" class="usa-banner__lock-image" role="img" aria-labelledby="banner-lock-description" focusable="false"><title id="banner-lock-title">Lock</title><desc id="banner-lock-description">Locked padlock icon</desc><path fill="#000000" fill-rule="evenodd" d="M26 0c10.493 0 19 8.507 19 19v9h3a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V32a4 4 0 0 1 4-4h3v-9C7 8.507 15.507 0 26 0zm0 8c-5.979 0-10.843 4.77-10.996 10.712L15 19v9h22v-9c0-6.075-4.925-11-11-11z"/></svg></span>) or <strong>https://</strong> means you've safely connected to the .${type} website. Share sensitive information only on official, secure websites.`;
	}

	const banner = domEl( 'section', { class: 'usa-banner', 'aria-label': bannerText } );
	const accordion = domEl( 'div', { class: 'usa-accordion' } );
	const header = domEl( 'header', { class: 'usa-banner__header' } );
	const inner = domEl( 'div', { class: 'usa-banner__inner' } );
	const grid = domEl( 'div', { class: 'grid-col-auto' } );

	const col = domEl( 'div', { class: 'grid-col-fill tablet:grid-col-auto', 'aria-hidden': 'true' } );
	const text = p( { class: 'usa-banner__header-text' }, bannerText );
	const action = p( { class: 'usa-banner__header-action' }, buttonText );
	col.appendChild( text );
	col.appendChild( action );

	const btn = button( {
		type: 'button',
		class: 'usa-banner__button usa-accordion__button',
		'aria-expanded': 'false',
		'aria-controls': 'gov-banner-default',
	} );
	const btnText = span( { class: 'usa-banner__button-text' }, buttonText );
	btn.appendChild( btnText );

	inner.appendChild( grid );
	inner.appendChild( col );
	inner.appendChild( btn );
	header.appendChild( inner );
	accordion.appendChild( header );

	// dropdown content
	const dropdown = domEl( 'div', { class: 'usa-banner__content usa-accordion__content', id: 'gov-banner-default', hidden: '' } );
	const row = domEl( 'div', { class: 'grid-row grid-gap-lg' } );

	const col1 = domEl( 'div', { class: 'usa-banner__guidance tablet:grid-col-6' } );
	const col1Img = img( {
		class: 'usa-banner__icon usa-media-block__img',
		'aria-hidden': 'true',
		role: 'img',
		alt: '',
		src: '/icons/icon-dot-gov.svg',
	} );
	col1.appendChild( col1Img );
	const col1Body = domEl( 'div', { class: 'usa-media-block__body' } );
	const col1Text = document.createElement( 'p' );
	col1Text.innerHTML = officialText;
	col1Body.appendChild( col1Text );
	col1.appendChild( col1Body );
	row.appendChild( col1 );

	const col2 = domEl( 'div', { class: 'usa-banner__guidance tablet:grid-col-6' } );
	const col2Img = img( {
		class: 'usa-banner__icon usa-media-block__img',
		'aria-hidden': 'true',
		role: 'img',
		alt: '',
		src: '/icons/icon-https.svg',
	} );
	col2.appendChild( col2Img );
	const col2Body = domEl( 'div', { class: 'usa-media-block__body' } );
	const col2Text = document.createElement( 'p' );
	col2Text.innerHTML = secureText;
	col2Body.appendChild( col2Text );
	col2.appendChild( col2Body );
	row.appendChild( col2 );

	dropdown.appendChild( row );
	accordion.appendChild( dropdown );
	banner.appendChild( accordion );
	block.textContent = '';
	block.appendChild( banner );
}
