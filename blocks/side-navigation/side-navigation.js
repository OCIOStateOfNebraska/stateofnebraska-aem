import { fetchPlaceholders } from '../../scripts/aem.js';
import {
	fetchIndex,
} from '../../scripts/utils.js';
/**
 * Fetches the site index data.
 *
 * @param {string} [indexFile='query-index'] The name of the index file (e.g., 'query-index', 'index').
 * @returns {Promise<Array<object>>} A promise that resolves to the index data array.
 */
async function getIndexData( indexFile = 'query-index' ) {
	// Check if a shared caching function exists (RECOMMENDED)
	try {
		const index = await fetchIndex( indexFile ); // Use the shared function
		// Ensure the shared function returns the expected { data: [...] } structure
		return index && index.data ? index.data : [];
	} catch ( e ) {
		// eslint-disable-next-line no-console
		console.error( `Error using shared fetchIndex for ${indexFile}:`, e );
	}
}

/**
 * Normalizes a path for comparison.
 * Removes trailing slashes, `.html` extension, query strings, and fragments.
 * Ensures consistency when comparing window.location.pathname with index paths.
 * @param {string} path - The path to normalize.
 * @returns {string} The normalized path.
 */
function normalizePath( path ) {
	if ( !path ) return '';
	try {
		// Use URL constructor relative to a base to handle relative paths correctly
		const url = new URL( path, window.location.origin );
		let normPath = url.pathname;
		// Remove trailing slash if not the root path
		if ( normPath !== '/' && normPath.endsWith( '/' ) ) {
			normPath = normPath.slice( 0, -1 );
		}
		// Remove .html extension
		if ( normPath.endsWith( '.html' ) ) {
			normPath = normPath.slice( 0, -5 );
		}
		return normPath;
	} catch ( e ) {
		// Fallback for invalid paths or environments without URL constructor
		const mainPath = path.split( '?' )[0].split( '#' )[0];
		const noTrailingSlash = ( mainPath !== '/' && mainPath.endsWith( '/' ) ) ? mainPath.slice( 0, -1 ) : mainPath;
		return noTrailingSlash.endsWith( '.html' ) ? noTrailingSlash.slice( 0, -5 ) : noTrailingSlash;
	}
}

/**
 * Gets the normalized paths of all ancestor pages for a given path.
 * Example: getAncestors('/us/en/products/detail') returns ['/us', '/us/en', '/us/en/products']
 * @param {string} path - The normalized path of the page.
 * @returns {string[]} An array of normalized ancestor paths.
 */
function getAncestors( path ) {
	const ancestors = [];
	const segments = path.split( '/' ).filter( Boolean ); // Filter out empty strings
	let currentPath = '';
	// Iterate up to length - 1 to get ancestors, not the path itself
	for ( let i = 0; i < segments.length - 1; i += 1 ) {
		currentPath += `/${segments[i]}`;
		ancestors.push( currentPath );
	}
	return ancestors;
}

/**
 * Recursively builds the navigation UL/LI structure up to a max depth.
 *
 * @param {string} parentPath - The normalized path of the parent level.
 * @param {number} currentLevel - The current depth level (starting at 1).
 * @param {number} maxLevel - The maximum depth to render (e.g., 3).
 * @param {Array<object>} indexData - The full site index data.
 * @param {string} currentPagePath - Normalized path of the currently viewed page.
 * @param {string[]} ancestors - Array of normalized paths of the current page's ancestors (used for expansion).
 * @param {string | null} topLevelAncestorPath - Path of the Level 1 ancestor, if it exists.
 * @returns {HTMLUListElement | null} The generated UL element or null if no children found.
 */
function buildNavLevel( parentPath, currentLevel, maxLevel, indexData, currentPagePath, ancestors, topLevelAncestorPath ) {
	// Base case: Stop if we've exceeded the maximum level
	if ( currentLevel > maxLevel ) {
		return null;
	}

	// Find direct children of the parentPath
	const children = indexData.filter( page => {
		const pagePathNormalized = normalizePath( page.path );
		// Handle root level check
		if ( parentPath === '/' ) {
			// Child should have only one segment, e.g. /foo, not /foo/bar
			return pagePathNormalized.startsWith( '/' )
				&& pagePathNormalized !== '/'
				&& pagePathNormalized.substring( 1 ).indexOf( '/' ) === -1;
		}
		// Handle nested levels
		const expectedPrefix = `${parentPath}/`;
		// Check if it starts with the parent path AND has exactly one more segment
		return pagePathNormalized.startsWith( expectedPrefix )
			&& pagePathNormalized.substring( expectedPrefix.length ).indexOf( '/' ) === -1;
	} ).sort( ( a, b ) => ( a.navOrder || a.path ).localeCompare( b.navOrder || b.path ) ); // Sort by navOrder or path

	// If no children found for this level, stop recursion for this branch
	if ( children.length === 0 ) {
		return null;
	}

	// Create the list element for this level
	const ul = document.createElement( 'ul' );
	if ( currentLevel === 1 ) {
		ul.classList.add( 'usa-sidenav' ); // Main list class
	} else {
		ul.classList.add( 'usa-sidenav__sublist' ); // Nested list class
	}

	// Process each child page found
	children.forEach( page => {
		const invalidValues = ['false', 'no'];
		const pagePathNormalized = normalizePath( page.path );
		const isCurrent = pagePathNormalized === currentPagePath;
		const isHidden = page.hideInSideNav && !invalidValues.includes( page.hideInSideNav.toLowerCase().trim() ) ? true : false;
		// Check if this page is the specific top-level ancestor we identified
		const isTopLevelAncestor = pagePathNormalized === topLevelAncestorPath;
		// Still need to know if it's *any* ancestor for expansion logic
		const isActiveAncestor = ancestors.includes( pagePathNormalized );
		
		if ( !isHidden ) {
			// Create the list item (LI) and link (A)
			const li = document.createElement( 'li' );
			li.classList.add( 'usa-sidenav__item' );

			const a = document.createElement( 'a' );
			a.textContent = page.title || pagePathNormalized.split( '/' ).pop() || '';
			a.href = page.path;
			a.classList.add( 'usa-sidenav__link' );

			// --- Apply current/ancestor styling and ARIA attribute ---
			if ( isCurrent ) {
			// Actual current page: Add ARIA attribute and styling class
				a.setAttribute( 'aria-current', 'page' );
				a.classList.add( 'usa-current' );
			} else if ( isTopLevelAncestor && currentLevel === 1 ) {
			// Top-level ancestor (must be level 1): Add styling class only
				a.classList.add( 'usa-current' );
			}
			// --- End of styling logic ---

			li.appendChild( a );

			// --- Recursive Call ---
			// Check if we should render the next level down:
			// - We haven't reached the max level yet.
			// - EITHER this page IS the current page OR it's *any* ancestor of the current page.
			//   (This ensures we only expand the branch leading to the current page, using the full ancestor list)
			if ( currentLevel < maxLevel && ( isCurrent || isActiveAncestor ) ) {
				const nestedUl = buildNavLevel(
					pagePathNormalized,
					currentLevel + 1, // Increment level
					maxLevel,
					indexData,
					currentPagePath,
					ancestors, // Pass full ancestor list for expansion check
					topLevelAncestorPath // Pass specific top-level ancestor for styling check
				);

				// If the recursive call generated a list (found children), append it
				if ( nestedUl ) {
					li.appendChild( nestedUl );
				}
			}

			// Add the completed list item to the list for the current level
			ul.appendChild( li );
		}
	} );

	return ul;
}


/**
 * Decorates the side navigation block.
 * Fetches site index and builds navigation based on a fixed depth (3 levels) from the root.
 * Highlights the current page and its top-level ancestor.
 * @param {Element} block - The side navigation block element.
 */
export default async function decorate( block ) {
	block.textContent = '';
	const maxDepth = 3; // Define the fixed depth
	
	const indexData = await getIndexData();

	if ( !indexData || indexData.length === 0 ) {
		// eslint-disable-next-line no-console
		console.error( 'Side Navigation Error: Index data is empty or could not be loaded.' );
		return;
	}
	const placeholders = await fetchPlaceholders();

	const currentPagePath = normalizePath( window.location.pathname );
	const ancestors = getAncestors( currentPagePath );
	// Determine the single top-level ancestor path (first element of ancestors array)
	const topLevelAncestorPath = ancestors.length > 0 ? ancestors[0] : null;

	// Start building the navigation from the root ('/'), level 1, up to maxDepth
	const navList = buildNavLevel(
		'/',
		1,
		maxDepth,
		indexData,
		currentPagePath,
		ancestors, // Pass full list for expansion logic
		topLevelAncestorPath // Pass specific path for styling logic
	);

	if ( navList && navList.hasChildNodes() ) {
		// Wrap the generated list in a NAV element for accessibility
		const nav = document.createElement( 'nav' );
		nav.setAttribute( 'aria-label', placeholders.sidenavigation || 'Side navigation' );
		nav.appendChild( navList );
		block.appendChild( nav );
		block.style.display = ''; // Ensure block is visible
	} else {
		// If no navigation items were generated (e.g., empty site?), remove the block
		block.remove();
	}
}
