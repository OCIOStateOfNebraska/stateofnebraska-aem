import {
	loadScript, loadBlock, buildBlock, decorateBlock,
} from '../../scripts/aem.js';

const CONVERGE_SDK_URL = 'https://api.demo.convergepay.com/hosted-payments/PayWithConverge.js';
const SESSION_URL = '/bin/elavon';

const TOKEN_REQUEST_FIELDS = [
	'transactionType',
	'amount',
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
	'description',
];

function createFormBlock( sourceBlock ) {
	const link = sourceBlock.querySelector( 'a[href]' );
	const formBlock = buildBlock( 'form', link?.outerHTML || '' );
	formBlock.classList.add('full-width');
	const wrapper = document.createElement( 'div' );
	wrapper.append( formBlock );
	decorateBlock( formBlock );
	sourceBlock.replaceChildren( wrapper );
	return formBlock;
}

function getStatusElements( block ) {
	let status = block.querySelector( '.elavon-pay-button__status' );
	let response = block.querySelector( '.elavon-pay-button__response' );
	if ( !status ) {
		const wrapper = document.createElement( 'div' );
		wrapper.className = 'elavon-pay-button__result';
		wrapper.innerHTML = `
			<p>Transaction Status: <span class="elavon-pay-button__status"></span></p>
			<pre class="elavon-pay-button__response"></pre>
		`;
		block.append( wrapper );
		status = wrapper.querySelector( '.elavon-pay-button__status' );
		response = wrapper.querySelector( '.elavon-pay-button__response' );
	}
	return { status, response };
}

function showResult( block, status, msg ) {
	const { status: statusEl, response: responseEl } = getStatusElements( block );
	statusEl.textContent = status;
	responseEl.textContent = typeof msg === 'string' ? msg : JSON.stringify( msg, null, '\t' );
}

async function fetchSessionToken( form ) {
	const formData = new FormData( form );
	const params = new URLSearchParams();
	TOKEN_REQUEST_FIELDS.forEach( ( field ) => {
		const raw = formData.get( field );
		if ( raw == null ) return;
		let value = String( raw ).trim();
		// ssl_amount needs a bare number, so strip everything but digits/decimal.
		if ( field === 'amount' ) {
			value = value.replace( /[^\d.]/g, '' );
		}
		if ( value !== '' ) {
			params.set( field, value );
		}
	} );

	const response = await fetch( SESSION_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'text/plain',
		},
		body: params.toString(),
	} );

	if ( !response.ok ) {
		throw new Error( `Session token request failed with status ${response.status}` );
	}

	const token = ( await response.text() ).trim();
	if ( !token ) {
		throw new Error( 'Empty session token returned' );
	}
	return token;
}

function openConvergeLightbox( token, block ) {
	const paymentFields = { ssl_txn_auth_token: token };
	const callback = {
		onError: ( error ) => showResult( block, 'error', error ),
		onCancelled: () => showResult( block, 'cancelled', '' ),
		onDeclined: ( response ) => showResult( block, 'declined', response ),
		onApproval: ( response ) => showResult( block, 'approval', response ),
	};
	window.PayWithConverge.open( paymentFields, callback );
}

export default async function decorate( block ) {
	// Wrap the authored content in a nested form block.
	const formBlock = createFormBlock( block );
	await loadBlock( formBlock );

	const form = formBlock.querySelector( 'form' );
	if ( !form ) return;

	// Override form submit.
	const submitBtn = form.querySelector( 'button[type="submit"]' );
	if ( !submitBtn ) return;

	submitBtn.addEventListener( 'click', async ( e ) => {
		e.preventDefault();
		e.stopImmediatePropagation();

		if ( !form.checkValidity() ) {
			form.reportValidity();
			return;
		}

		try {
			await loadScript( CONVERGE_SDK_URL );
			const token = await fetchSessionToken( form );
			openConvergeLightbox( token, block );
		} catch ( error ) {
			showResult( block, 'error', error.message || String( error ) );
		}
	}, { capture: true } );
}