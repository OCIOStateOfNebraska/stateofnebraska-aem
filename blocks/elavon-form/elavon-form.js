import {
	loadScript, loadBlock, buildBlock, decorateBlock,
} from '../../scripts/aem.js';

const CONVERGE_SDK_PATH = 'hosted-payments/PayWithConverge.js';
const CONVERGE_SDK_HOSTS = {
	demo: 'https://api.demo.convergepay.com',
	prod: 'https://api.convergepay.com',
};
const DEFAULT_SESSION_URL = '/bin/elavon';

function convergeSdkUrl( block ) {
	const host = block.classList.contains( 'demo' ) ? CONVERGE_SDK_HOSTS.demo : CONVERGE_SDK_HOSTS.prod;
	return `${ host }/${ CONVERGE_SDK_PATH }`;
}

const BILLING_FIELDS = [
	'firstName',
	'lastName',
	'avsAddress',
	'address2',
	'city',
	'state',
	'avsZip',
	'country',
	'email',
	'phone',
];

function sessionUrl( block ) {
	const row = block.children[ 1 ];
	if ( !row ) return DEFAULT_SESSION_URL;
	const link = row.querySelector( 'a[href]' );
	return link?.getAttribute( 'href' ) || row.textContent.trim() || DEFAULT_SESSION_URL;
}

function createFormBlock( sourceBlock ) {
	// Scope to the first row so an optional session-URL row can't be mistaken
	// for the form-definition link.
	const link = sourceBlock.firstElementChild?.querySelector( 'a[href]' );
	const formBlock = buildBlock( 'form', link?.outerHTML || '' );
	formBlock.classList.add( 'full-width' );
	const wrapper = document.createElement( 'div' );
	wrapper.append( formBlock );
	decorateBlock( formBlock );
	sourceBlock.replaceChildren( wrapper );
	return formBlock;
}

function errorMessage( error ) {
	if ( typeof error === 'string' && error.trim() ) return error;
	return error?.errorMessage || error?.errorName || error?.message
		|| 'There was a problem processing your payment. Please try again.';
}

// On a payment error, show a USWDS error alert above the form (form stays so the
// user can retry). Replaces any prior error alert so they don't stack.
async function showErrorAlert( block, message ) {
	block.querySelector( '.elavon-form__error' )?.remove();
	const alertBlock = buildBlock( 'alert', [ [ 'Payment Error', `<p>${ message }</p>` ] ] );
	alertBlock.classList.add( 'error' );
	const wrapper = document.createElement( 'div' );
	wrapper.className = 'elavon-form__error';
	wrapper.append( alertBlock );
	decorateBlock( alertBlock );
	block.prepend( wrapper );
	await loadBlock( alertBlock );
	wrapper.scrollIntoView( { behavior: 'smooth', block: 'center' } );
}

// On approval, replace the form with a USWDS success alert
async function showSuccessAlert( block ) {
	const body = '<p>Your payment was processed successfully. A receipt has been sent to your email.</p>';
	const alertBlock = buildBlock( 'alert', [ [ 'Payment Successful', body ] ] );
	alertBlock.classList.add( 'success' );
	const wrapper = document.createElement( 'div' );
	wrapper.append( alertBlock );
	decorateBlock( alertBlock );
	block.replaceChildren( wrapper );
	await loadBlock( alertBlock );
}

// Collect the cart items (code, quantity, optional conditional input) from the
// repeatable fieldsets.
function buildCartItems( form ) {
	return [ ...form.querySelectorAll( 'fieldset[data-repeatable="true"]' ) ]
		.map( ( fieldset ) => {
			const code = fieldset.querySelector( 'select[name="transactionItemDropdown"]' )?.value?.trim();
			if ( !code ) return null;
			const qty = fieldset.querySelector( 'input[name="quantityInput"]' )?.value?.trim() || '';
			let cond = '';
			const condWrapper = fieldset.querySelector( '.field-conditionalinfoinput' );
			if ( condWrapper && condWrapper.dataset.visible !== 'false' ) {
				cond = condWrapper.querySelector( 'input[name="conditionalInfoInput"]' )?.value?.trim() || '';
			}
			return { code, qty, cond };
		} )
		.filter( Boolean );
}

async function fetchSessionToken( form, url ) {
	const formData = new FormData( form );
	const params = new URLSearchParams();

	const formPath = form.dataset.formpath;
	if ( !formPath ) {
		throw new Error( 'Missing form path; cannot request a session token.' );
	}
	params.set( 'formPath', formPath );

	BILLING_FIELDS.forEach( ( field ) => {
		const raw = formData.get( field );
		if ( raw == null ) return;
		const value = String( raw ).trim();
		if ( value !== '' ) {
			params.set( field, value );
		}
	} );

	// Itemized cart: code + quantity + optional conditional input, indexed per item.
	buildCartItems( form ).forEach( ( item, i ) => {
		params.set( `items[${ i }].code`, item.code );
		if ( item.qty !== '' ) params.set( `items[${ i }].qty`, item.qty );
		if ( item.cond !== '' ) params.set( `items[${ i }].cond`, item.cond );
	} );

	const response = await fetch( url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'text/plain',
		},
		body: params.toString(),
	} );

	if ( !response.ok ) {
		throw new Error( `Payment failed with status ${ response.status }` );
	}

	const token = ( await response.text() ).trim();
	if ( !token ) {
		throw new Error( 'Empty session token returned' );
	}
	return token;
}

function openConvergeLightbox( token, block ) {
	// eslint-disable-next-line camelcase
	const paymentFields = { ssl_txn_auth_token: token };
	const callback = {
		onError: ( error ) => { showErrorAlert( block, errorMessage( error ) ); },
		onCancelled: () => {},
		onDeclined: () => {},
		onApproval: () => { showSuccessAlert( block ); },
	};
	window.PayWithConverge.open( paymentFields, callback );
}

export default async function decorate( block ) {
	const sdkUrl = convergeSdkUrl( block );
	const tokenUrl = sessionUrl( block );

	// Wrap the authored content in a nested form block.
	const formBlock = createFormBlock( block );
	await loadBlock( formBlock );

	const form = formBlock.querySelector( 'form' );
	if ( !form ) return;

	const submitBtn = form.querySelector( 'button[type="submit"]' );
	form.querySelector( '.wizard-button-wrapper' )?.append( submitBtn );
	if ( !submitBtn ) return;

	submitBtn.addEventListener( 'click', async ( e ) => {
		e.preventDefault();
		e.stopImmediatePropagation();

		if ( !form.checkValidity() ) {
			form.reportValidity();
			return;
		}

		try {
			await loadScript( sdkUrl );
			const token = await fetchSessionToken( form, tokenUrl );
			openConvergeLightbox( token, block );
		} catch ( error ) {
			showErrorAlert( block, errorMessage( error ) );
		}
	}, { capture: true } );
}