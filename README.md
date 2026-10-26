# State of Nebraska Sower Design System
Design system based on USWDS

## Environments
- Preview: https://main--stateofnebraska-aem--ociostateofnebraska.aem.page/
- Live: https://main--stateofnebraska-aem--ociostateofnebraska.aem.live/

## Documentation

Before using the aem-boilerplate, we recommand you to go through the documentation on https://www.aem.live/docs/ and more specifically:
1. [Developer Tutorial](https://www.aem.live/developer/tutorial)
2. [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
3. [Web Performance](https://www.aem.live/developer/keeping-it-100)
4. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)


## EDS Index Configurations
- Index configurations have been moved to the [configuration service](https://www.aem.live/docs/config-service-setup) in order to allow different configurations per site.
- Current configurations are versioned in ./helix-configs/index, with each site's yaml configuration defined.
- Deployment of configurations is done manually via the [configuration service api](https://www.aem.live/docs/admin.html#tag/indexConfig/operation/updateIndexConfig).


## Node Version
This project requires Node.js 22.

## Installation

```sh
npm i
```

## Local Development
_Note that this will run a watcher for both SASS and AEM changes_
```sh
npm run dev
```

### AEM Development
If you don't want to make any style updates, and are only touching JS files, the following will run a watcher for just those AEM changes.

```sh
aem up
```

## Linting
Note that linting must pass before committing changes, otherwise the automated build will fail.

```sh
npm run lint
```

## Compile Just SASS

```sh
npm run sass
```

## Printing

The shared styles request that browsers preserve page colors when printing, including
dark backgrounds behind light text. Screen styles are unchanged. Browser or printer
preferences can override this request; enable **Background graphics** in the print
dialog if backgrounds are still missing.

## Shadow DOM embeds

Load `scripts/aem-embed.js` as an ES module on a trusted hosting page, then use:

```html
<aem-embed url="https://your-source-site.example/example" type="main"></aem-embed>
```

Supported types are `main` (default), `hero`, `header`, and `footer`. For a header,
point `url` to the navigation fragment; for a footer, point it to the footer
fragment. An optional `code-base-path` selects a code subdirectory on the source
origin, independently of the content URL.

The source must serve both the page HTML (for its metadata) and `.plain.html`,
and allow cross-origin requests for content and JavaScript modules. The host's
CSP must permit these requests, styles, images, and Google Fonts. Embed only
trusted source origins: Shadow DOM isolates styles, not script execution.

The runtime uses the compiled `styles/embed.css`, scoped block styles, source
metadata, and per-embed loader state. Recompile SASS after changing shared
styles. Font registration is intentionally shared with the document. Embeds
emit `aem-embed-ready` or `aem-embed-error`; failures show an alert instead of
leaving content hidden. Reconnecting an embed rerenders it and reinstalls its
scoped behavior.

The shared AEM library is unmodified; `scripts/block-loader.js` delegates normal
pages to the original loaders and handles embedded blocks separately.

New block dependencies must use the context passed as the decorator's third
argument: `context.loadStyle(url)` for CSS and `loadBlock(block, context)` /
`loadFragment(url, context)` for detached nested content. Scope selectors and
event handling to the block or `context.root`; do not use document-wide ID
lookups or page bootstrap imports. Header and accordion interactions provide
scoped alternatives to USWDS's document-level behavior. Other third-party
widgets that assume a document-wide DOM require equivalent adapters.

Browser integration tests are in `test/embed.html`. Serve this repository with
CORS enabled, map `/code/` to the repository root, and open that page using
`localhost` or `127.0.0.1`. The test uses the other hostname as the source origin
and checks isolation, all four embed types, nested dependencies, reconnects,
and explicit failures. Google Fonts can be stubbed with an empty stylesheet
for offline runs.

## Local development
1. Create .env file with the following content: AEM_PAGES_URL=https://main--stateofnebraska-aem--ociostateofnebraska.aem.page (where the url the env where you want to pull the content from)
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)


