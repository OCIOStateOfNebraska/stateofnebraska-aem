/* eslint-disable
    import/no-extraneous-dependencies,
    no-console, no-restricted-syntax,
    no-await-in-loop
*/
import * as sass from 'sass';
import fs from 'fs';
import path from 'path';
import { readdir } from 'fs/promises';
import { fileURLToPath, pathToFileURL } from 'url';

// eslint-disable-next-line no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ignoredFiles = [];

const compileAndSave = async (sassFile) => {
  const dest = sassFile.replace(path.extname(sassFile), '.css');

  fs.writeFile(dest, sass.compile(sassFile, {
    outputStyle: 'compressed',
    loadPaths: [
      'node_modules/@uswds',
      'node_modules/@uswds/uswds/packages',
    ],
    importers: [{
      // Shortcuts for node_modules folders
      findFileUrl(url) {
        const USWDS_PREFIX = '~uswds';
        if (url.startsWith(USWDS_PREFIX)) return new URL(pathToFileURL('node_modules/@uswds/uswds/packages') + url.substring(USWDS_PREFIX.length));
        if (url.startsWith('~')) return new URL(url.substring(1), pathToFileURL('node_modules'));

        return null;
      },
    }],
    // deprecation warnings from uswds
    silenceDeprecations: [
      'mixed-decls',
      'global-builtin',
    ],
  }).css, (err) => {
    if (err) console.log(err);
    console.log(`Compiled ${sassFile} to ${dest}`);
  });
};

const processFiles = async (parent) => {
  const files = await readdir(parent, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      await processFiles(path.join(parent, file.name));
    }
    if (path.extname(file.name) === '.scss') {
      if (!ignoredFiles.includes(file.name)) {
        await compileAndSave(path.join(parent, file.name));
      } else {
        console.log(`${file.name} has been explicitly ignored for compilation`);
      }
    }
  }
};

// Program execution process
for (const folder of ['styles', 'blocks']) {
  try {
    await processFiles(path.join(__dirname, folder));
  } catch (err) {
    console.error(err);
  }
}

fs.watch('.', { recursive: true }, (eventType, fileName) => {
  if (path.extname(fileName) === '.scss' && eventType === 'change') {
    if (!ignoredFiles.includes(fileName)) {
      compileAndSave(path.join(__dirname, fileName));
    } else {
      console.log(`${fileName} has been explicitly ignored for compilation`);
    }
  }
});
