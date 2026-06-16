/**
 * Submit interceptor for the `form (search-redirect)` block variant.
 *
 * Captures the form's submit event before any AEM Adaptive Forms rule-engine
 * listener can fire, gathers non-empty field values, and navigates to the
 * configured results page with the values appended as query params. The form
 * never POSTs to its AEM submit-action endpoint.
 *
 * Redirect target resolution order:
 *   1. block.dataset.redirectTo  (set in form.js from row 2 of the EDS block)
 *   2. form.dataset.redirectUrl  (from the AEM form definition; see form.js:539)
 *
 * Per-field "required" semantics are handled natively via form.checkValidity()
 * against the AEM Adaptive Form's own required attributes.
 */

function collectFieldValues( form ) {
	const values = {};
	for ( const [name, value] of new FormData( form ) ) {
		if ( typeof value !== 'string' ) continue; // skip File entries
		const trimmed = value.trim();
		if ( !trimmed ) continue;
		values[name] = name in values ? `${values[name]},${trimmed}` : trimmed;
	}
	return values;
}

export function handleSearchRedirect( e, form, block ) {
	e.preventDefault();
	e.stopImmediatePropagation();

	if ( !form.checkValidity() ) {
		const firstInvalid = form.querySelector( ':invalid:not(fieldset)' );
		if ( firstInvalid ) {
			firstInvalid.focus();
			firstInvalid.scrollIntoView( { behavior: 'smooth' } );
		}
		return;
	}

	const redirectTo = block.dataset.redirectTo || form.dataset.redirectUrl;
	if ( !redirectTo ) {
		// eslint-disable-next-line no-console
		console.error( 'search-redirect form has no redirect target.' );
		return;
	}

	const params = new URLSearchParams( collectFieldValues( form ) );
	const qs = params.toString();
	window.location.assign( qs ? `${redirectTo}?${qs}` : redirectTo );
}
