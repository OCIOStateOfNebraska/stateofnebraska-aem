# Agent Guide

## Project

The State of Nebraska Sower Design System provides accessible, USWDS-based components for agency sites using Adobe Experience Manager Edge Delivery Services and Adobe Document Authoring (DA). About 1,500 tracked files use JavaScript, SCSS/CSS, JSON, YAML, and HTML. Read [README.md](README.md) first.

## Architecture and conventions

- **Blocks:** `blocks/<block-name>/` contains block-specific code, usually `<block-name>.js` with a default `decorate` function, SCSS, and generated CSS; blocks can also have supporting files and authoring schemas (`_*.json`). Follow neighboring blocks. Compile SCSS to CSS because the site serves the CSS files.
- **Styles:** Shared styles live in `styles/`; USWDS imports and theme overrides are in `styles/uswds/`. Follow USWDS conventions and prefer its utilities and design tokens (for example `color('secondary-lighter')`) over hard-coded values utilities here https://designsystem.digital.gov/utilities/. You can find . Add or override theme values in `_uswds-theme.scss`.
- **Page behavior:** `templates/` holds page-template decorators; `scripts/scripts.js` orchestrates the page. **Do not edit, replace, or delete `scripts/aem.js`.**
- **Authoring models:** Edit `models/` and block `_*.json` schemas as appropriate. `npm run build:json` merges these into the root `component-*.json` files; regenerate and review those outputs when changing models.
- **Agency configuration:** `helix-configs/index/*.yaml` contains per-site index definitions. Configuration deployment is manual through the AEM configuration service; see the README. Page JSON files may provide metadata used by dynamic blocks; check the relevant YAML under `helix-configs/index/` for indexed properties.
- **Imports:** `tools/importer/` contains agency-specific page import scripts. Run them with `aem import` when importing content; the tool serves locally on port 3001.

## Runtime: how the page becomes a site

[head.html](head.html) loads `scripts/aem.js` and `scripts/scripts.js` as browser ES modules, plus the compiled global stylesheet. AEM supplies the authored HTML; JavaScript decorates that DOM rather than mounting a framework application.

### `scripts/aem.js`: protected AEM runtime

- Runs `init()` on import. `setup()` initializes `window.hlx`, derives `window.hlx.codeBasePath` from the module URL, and sets Lighthouse/RUM flags. Asset loaders use this base path; do not assume the code always lives at `/`.
- Supplies shared helpers: `getMetadata()` reads head metadata; `readBlockConfig()` converts authored two-column rows to keyed values; `buildBlock()` creates the nested row/cell DOM; `createOptimizedPicture()` builds responsive images; `loadCSS()` and `loadScript()` return promises and avoid duplicate asset tags.
- `decorateBlock()` prepares, but does not load, a block: its **first CSS class** becomes `data-block-name`; it wraps cell text, adds `.block`, `<name>-wrapper` and `<name>-container`, and sets `data-block-status="initialized"`. Preserve this naming/DOM contract.
- `loadBlock()` sets status to `loading`, loads `blocks/<name>/<name>.css` and imports `<name>.js` in parallel, awaits the module's default decorator, then marks it `loaded`. Repeated loads skip loading/loaded blocks. Errors are logged, but status can still become `loaded`; check the console and rendered content, not status alone.
- `loadSection()` awaits blocks **sequentially**, optionally awaits a callback such as `waitForFirstImage()`, then reveals the previously hidden section. `loadSections()` processes sections in order and enables the RUM enhancer after the first. `loadHeader()`/`loadFooter()` build and load their named blocks; content fetching belongs to those block implementations.
- Also provides generic section/icon decoration and sampled real-user monitoring. Nebraska uses project-specific decoration in `scripts/scripts.js` instead of several generic decorators. **Never modify `aem.js`; consume its exports.**

### `scripts/scripts.js`: Nebraska decoration and orchestration

`loadPage()` executes `loadEager(document)` → `loadLazy(document)` → `loadDelayed()`. It normally runs on module import unless `window.hlx.suppressLoadPage` is set.

1. **Eager:** appends `brandslug` to the title, sets `lang="en"`, applies template/theme body classes (including Nebraska's `theme--<name>`), and starts the header without awaiting it. `decorateMain()` assigns `main-content` and calls `decorateInner()`. The first section loads with `waitForFirstImage()` before template decoration. `loadTemplate()` imports the metadata-selected `templates/<name>/<name>.js` and requests its CSS, falling back to `default` only when metadata is absent. Templates restructure the decorated main DOM. Auto-blocking then moves the heading/media into a `hero` or `hero-homepage` block.
2. **Lazy:** awaits remaining sections, scrolls to the URL hash, starts the footer, loads lazy styles and Google fonts, and registers Sidekick quick-edit/accessibility actions.
3. **Delayed:** schedules `scripts/delayed.js` after 3 seconds; that module loads the metadata-selected `tag-manager-url` script. Keep nonessential integrations here, not on the eager rendering path.

`decorateInner()` is the shared authored-content pipeline, also used by `blocks/fragment/fragment.js`: headings/images → USWDS buttons → YouTube/maps → SVG icons/icon lists → sections → blocks → unstyled link lists → external/PDF links. Its section decorator supports legacy section-metadata blocks and dataset metadata, applies styles, 12-column layouts, and theme/full-width backgrounds, then initializes hidden sections. Its block selector excludes background-image wrappers. Preserve this order and avoid redecorating initialized DOM.

Other entry points: `dapreview` imports DA preview support with `loadPage` as its callback; `quick-edit` enables the editor; a two-second timer adds `body.appear` as a visibility fallback. Change global authored-content behavior in `decorateInner()`, layout in `templates/`, component behavior in its block, and deferred integrations in `delayed.js`. Validate page **and fragment** rendering, first-section visibility, templates/themes, and browser console/network errors after runtime changes. Trust this guide; search further only when it is incomplete or inconsistent with the code.

## Setup, build, and validation

- Requirements: Node.js 22 (the GitHub workflow uses Node 22) and npm 10 or later. On a clean checkout, or after changing the lockfile, run `npm ci` before other npm commands. `package-lock.json` is authoritative.
- CI is `.github/workflows/main.yaml`: `npm ci`, then `npm run lint`. There is no `test` npm script or files in `test/`.
- `npm run lint` checks JavaScript/JSON with `.eslintrc.js` and SCSS with `.stylelintrc.json`. Windows CRLF warnings are non-fatal. For a Windows-only check: `npm run lint:js -- --rule "linebreak-style: [1, windows]"`. Avoid repository-wide `--fix` churn; keep committed line endings CI-compatible.
- `npm run sass` compiles non-partial SCSS under `blocks/` and `styles/` to CSS and runs CSS lint. It passed on Windows; Node emitted a non-fatal module-type warning. Review generated CSS diffs before committing.
- `npm run build:json` successfully generates component models, definitions, and filters from `models/` and block schemas. Review generated root JSON diffs before committing.
- `npm run dev` is the README's combined AEM/Sass development command. Its `bundle` step uses shell syntax including `mv`; that script has not been validated on Windows. On Windows, use `npm run sass` and `aem up` separately if the combined command fails. Do not edit generated bundle files directly.

Lint, Sass, and JSON builds passed on Windows with Node 25.4.0/npm 11.7.0; CI uses Node 22. Generated validation changes were cleaned up.

## Local preview

Install the AEM CLI if needed (`npm install -g @adobe/aem-cli`). The README describes setting `AEM_PAGES_URL` in a local `.env`, then running `aem up` to serve at `http://localhost:3000`. To preview another site, use `aem up --url https://main--<site>--ociostateofnebraska.aem.page`. The AEM CLI is environment-dependent; preview commands were not run as part of this guide.
