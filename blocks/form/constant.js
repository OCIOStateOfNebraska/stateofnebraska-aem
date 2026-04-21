export const fileAttachmentText = 'Attach';
export const dragDropText = 'Drag and Drop To Upload';

export const DEFAULT_THANK_YOU_MESSAGE = 'Thank you for your submission.';

// Logging Configuration
// Control logging via URL parameter: ?log=<level>
// Valid levels: debug, info, error, off, warn → returns that level
// Invalid/empty values (including 'on') → returns 'warn' (fallback)
// AEM preview/live URLs (*.page, *.live) or localhost → returns 'warn'
const VALID_LOG_LEVELS = ['error', 'debug', 'warn', 'info', 'off'];

export const getLogLevelFromURL = ( urlString = null ) => {
	const DEFAULT_LOG_LEVEL = 'off';
	const FALLBACK_LOG_LEVEL = 'warn';

	try {
		let url;
		if ( urlString ) {
			url = new URL( urlString );
		} else if ( typeof window !== 'undefined' && window.location ) {
			url = new URL( window.location.href );
		} else {
			return DEFAULT_LOG_LEVEL;
		}

		const { searchParams, hostname } = url;
		const logParam = searchParams.get( 'log' );
		if ( logParam !== null || hostname.match( /\.(page|live)$|^localhost$/ ) ) {
			if ( VALID_LOG_LEVELS.includes( logParam ) ) return logParam;
			return FALLBACK_LOG_LEVEL;
		}

		return DEFAULT_LOG_LEVEL;
	} catch ( error ) {
		return DEFAULT_LOG_LEVEL;
	}
};

export const LOG_LEVEL = getLogLevelFromURL();

export const defaultErrorMessages = {
	accept: 'The specified file type not supported.',
	maxFileSize: 'File too large. Reduce size and try again.',
	maxItems: 'Specify a number of items equal to or less than $0.',
	minItems: 'Specify a number of items equal to or greater than $0.',
	pattern: 'Specify the value in allowed format : $0.',
	minLength: 'Please lengthen this text to $0 characters or more.',
	maxLength: 'Please shorten this text to $0 characters or less.',
	maximum: 'Value must be less than or equal to $0.',
	minimum: 'Value must be greater than or equal to $0.',
	required: 'Please fill in this field.',
};

// eslint-disable-next-line no-useless-escape
export const emailPattern = '([A-Za-z0-9][._]?)+[A-Za-z0-9]@[A-Za-z0-9]+(\.?[A-Za-z0-9]){2}\.([A-Za-z0-9]{2,4})?';

export const submitBaseUrl = 'https://publish-p149152-e1521617.adobeaemcloud.com';

export const SUBMISSION_SERVICE = 'https://forms.adobe.com/adobe/forms/af/submit/';

export function getSubmitBaseUrl() {
	return submitBaseUrl;
}
