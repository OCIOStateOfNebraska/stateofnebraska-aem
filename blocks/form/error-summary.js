import { loadCSS } from '../../scripts/aem.js';
import {
	a, div, h2, li, ul,
} from '../../scripts/dom-helpers.js';
import { checkValidation } from './util.js';

const INVALID_CONTROLS = 'input:invalid, select:invalid, textarea:invalid';
let summaryCount = 0;

function getFieldLabel( control, field ) {
	const label = field.querySelector( ':scope > .field-label' )?.cloneNode( true );
	label?.querySelectorAll( 'abbr' ).forEach( ( required ) => required.remove() );
	return label?.textContent.trim() || control.getAttribute( 'aria-label' ) || control.name;
}

function collectErrors( container ) {
	const errors = new Map();
	container.querySelectorAll( INVALID_CONTROLS ).forEach( ( control ) => {
		if ( control.closest( '[data-visible="false"]' ) ) return;
		checkValidation( control );
		// Checkbox and radio options share one field and one message.
		const field = control.closest( '.field-invalid' );
		if ( !field || errors.has( field ) ) return;
		const message = field.querySelector( ':scope > .field-description' )?.textContent.trim() || control.validationMessage;
		errors.set( field, {
			control,
			text: `${getFieldLabel( control, field )}: ${/[.!?]$/.test( message ) ? message : `${message}.`}`,
		} );
	} );
	return [...errors.entries()];
}

function focusField( control, field ) {
	control.focus( { preventScroll: true } );
	field.scrollIntoView( { behavior: 'smooth', block: 'center' } );
}

export function clearErrorSummary( container ) {
	container.querySelector( ':scope > .form-error-summary' )?.remove();
}

/**
 * Lists every invalid field, with its label and error, in a summary that receives
 * focus so screen readers announce all errors at once.
 * @param {HTMLElement} container The form or wizard step to validate
 * @returns {boolean} Whether a summary was shown
 */
export function showErrorSummary( container ) {
	const errors = collectErrors( container );
	clearErrorSummary( container );
	if ( !errors.length ) return false;

	loadCSS( `${window.hlx.codeBasePath}/blocks/alert/alert.css` );
	summaryCount += 1;
	const id = `form-error-summary-${summaryCount}`;
	const list = ul( { class: 'usa-list', id: `${id}-list` },
		...errors.map( ( [field, { control, text }] ) => li( a( {
			class: 'usa-link',
			href: `#${control.id}`,
			onclick: ( event ) => {
				event.preventDefault();
				focusField( control, field );
			},
		}, text ) ) ),
	);
	const summary = div( {
		class: 'form-error-summary usa-alert usa-alert--error',
		role: 'group',
		tabindex: '-1',
		'aria-labelledby': `${id}-heading`,
		'aria-describedby': `${id}-list`,
	}, div( { class: 'usa-alert__body' },
		h2( { class: 'usa-alert__heading', id: `${id}-heading` },
			errors.length === 1 ? 'There is 1 error in this form' : `There are ${errors.length} errors in this form` ),
		list,
	) );

	const legend = container.querySelector( ':scope > legend' );
	if ( legend ) legend.after( summary );
	else container.prepend( summary );
	summary.focus( { preventScroll: true } );
	summary.scrollIntoView( { behavior: 'smooth', block: 'start' } );
	return true;
}
