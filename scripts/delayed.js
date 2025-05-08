// add delayed functionality here
import {
	loadScript,
	getMetadata,
} from './aem.js';

// sample NDBF scripts
// const TAG_SCRIPT_URL = 'https://assets.adobedtm.com/3d206049ddd4/1573c112b903/launch-c41d32c94db7-development.min.js';
// const TAG_SCRIPT_URL = 'https://assets.adobedtm.com/3d206049ddd4/1573c112b903/launch-9a705aacd041-staging.min.js';
// const TAG_SCRIPT_URL = 'https://assets.adobedtm.com/3d206049ddd4/1573c112b903/launch-b9572fdc519f.min.js';
const TAG_SCRIPT_URL = getMetadata( 'tag-manager-url' );

async function loadTagMgrScript() {
	try {
		// Load the script asynchronously
		await loadScript( TAG_SCRIPT_URL, { async: true } );
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error( 'Error loading Tag Mgr script:', error );
	}
}

if ( TAG_SCRIPT_URL ) {
	loadTagMgrScript();
}