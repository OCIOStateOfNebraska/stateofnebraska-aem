/* eslint-disable no-console */

import * as sass from 'sass';
import fs from 'fs';
import path from 'path';
import { readdir } from 'fs/promises';
import { fileURLToPath, pathToFileURL } from 'url';
import * as process from 'process';
import { exec } from 'node:child_process';

// eslint-disable-next-line no-underscore-dangle
const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ignoredFiles = [];
const LINT = 'npm run lint:css';
const LINT_HANDLER = ( error, stdout, stderr ) => {
	if ( error ) {
		console.error( `exec error: ${error}` );
		return;
	}
	if ( stdout ) {
		console.log( stdout );
	}
	if ( stderr ) {
		console.error( stderr );
	}
};

const compileAndSave = async ( sassFile ) => {
	const dest = sassFile.replace( path.extname( sassFile ), '.css' );

	try {
		const compileResult = sass.compile( sassFile, {
			style: 'compressed',
			// TODO: sourceMap: true (https://sass-lang.com/documentation/js-api/interfaces/options/#sourceMap)
			loadPaths: [
				'node_modules/@uswds',
				'node_modules/@uswds/uswds/packages',
			],
			importers: [{
				// Shortcuts for node_modules folders
				findFileUrl( url ) {
					const USWDS_PREFIX = '~uswds';
					if ( url.startsWith( USWDS_PREFIX ) ) return new URL( pathToFileURL( 'node_modules/@uswds/uswds/packages' ) + url.substring( USWDS_PREFIX.length ) );
					if ( url.startsWith( '~' ) ) return new URL( url.substring( 1 ), pathToFileURL( 'node_modules' ) );

					return null;
				},
			}],
			// deprecation warnings from uswds
			silenceDeprecations: [
				'mixed-decls',
				'global-builtin',
				'color-functions',
			],
		} );

		fs.writeFile( dest, compileResult.css, ( fileError ) => {
			if ( fileError ) console.log( fileError );
			console.log( `Compiled ${sassFile} to ${dest}` );
		} );
	} catch ( e ) {
		console.error( e );
	}
};

const processFiles = async ( parent ) => {
	const files = await readdir( parent, { withFileTypes: true } );
	for ( const file of files ) {
		const fileName = file.name;
		if ( file.isDirectory() ) {
			await processFiles( path.join( parent, fileName ) );
		}
		if ( path.extname( fileName ) === '.scss' ) {
			if ( !ignoredFiles.includes( file.name ) ) {
				if ( !path.basename( fileName ).startsWith( '_' ) ) {
					console.log( `${path.basename( fileName )} compiling...` );
					await compileAndSave( path.join( parent, fileName ) );
				}
			} else {
				console.log( `${fileName} has been explicitly ignored for compilation` );
			}
		}
	}
};

const processAllScssFiles = async () => {
	for ( const folder of ['styles', 'blocks'] ) {
		try {
			await processFiles( path.join( __dirname, folder ) );
		} catch ( err ) {
			console.error( err );
		}
	}

	console.log( 'Linting CSS...' );
	exec( LINT, LINT_HANDLER );
};

// Initial build
processAllScssFiles();

// Watcher
if ( process.argv[2]?.trim().toLowerCase() === 'watch' ) {
	fs.watch( '.', { recursive: true }, ( eventType, fileName ) => {
		if ( path.extname( fileName ) === '.scss' && eventType === 'change' ) {
			if ( !ignoredFiles.includes( fileName ) ) {
				if ( path.basename( fileName ).startsWith( '_' ) ) {
					// updating a potential dependency, compile all of them again
					processAllScssFiles();
				} else {
					// compile just this css file directly
					compileAndSave( path.join( __dirname, fileName ) );
					console.log( 'Linting CSS...' );
					exec( LINT, LINT_HANDLER );
				}
			} else {
				console.log( `${fileName} has been explicitly ignored for compilation` );
			}
		}
	} );
}
