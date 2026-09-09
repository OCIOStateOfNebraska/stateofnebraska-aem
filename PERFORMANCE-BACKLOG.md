# Performance Execution Backlog

Scope: homepage, search results, and form-heavy pages.

Priority model:
- P0: Highest user impact and likely Lighthouse gain.
- P1: Important improvements after P0 is shipped.
- P2: Hardening and regression prevention.

## P0 Tasks

### P0-1 Eager Header Decomposition ✅ COMPLETED
- Goal: reduce work in the critical render path before LCP.
- Files:
  - scripts/scripts.js
  - blocks/header/header.js
  - scripts/aem.js (**prohibited — no changes made; behavior is inherited from aem.js loadHeader; improvement delivered through header.js dynamic import**)
- Change implemented:
  - Removed static top-level `import { header, accordion }` from bundle-uswds in blocks/header/header.js.
  - Added dynamic `import()` at the end of decorate(), after all structural HTML is appended to the DOM.
  - USWDS accordion and header behavior now attaches after markup is rendered, not at module parse time.
  - Added `document.body.classList.add( 'appear' )` immediately after the first section loads in scripts/scripts.js so text LCP is not gated by header completion or the 2s fallback.
- Change:
  - Keep a minimal, above-the-fold header shell in eager.
  - Move non-critical header behaviors (complex nav enhancements, deferred interactions) to lazy where possible.
- Owner-ready task statement:
  - Refactor header initialization so loadEager only includes essential markup and accessibility-critical behavior, with advanced features loaded after first section render.
- Acceptance criteria:
  - Homepage LCP improves compared to baseline.
  - No regression in keyboard navigation and skip links.
  - Mobile nav remains functional after lazy hydration.
- Validation:
  - Lighthouse mobile run on homepage before and after.
  - Manual nav/a11y smoke test.

### P0-2 Hero Media Critical Path Policy ✅ COMPLETED
- Goal: prevent heavy hero media from degrading LCP.
- Files:
  - scripts/scripts.js
  - blocks/hero/hero.js
  - blocks/hero-homepage/hero-homepage.js
- Change implemented:
  - Changed `preload:'auto'` → `preload:'none'` in buildHeroBlock video creation in scripts/scripts.js. Video no longer competes with LCP resources for network bandwidth.
  - Added `fetchpriority="high"` to the hero `<img>` in both blocks/hero/hero.js and blocks/hero-homepage/hero-homepage.js when a background image is present, giving the browser an explicit LCP candidate hint.
- Change:
  - Apply strict first-section media policy.
  - Avoid preload auto for autoplay video in first section unless explicitly required and justified.
  - Ensure first visual candidate is optimized for LCP.
- Owner-ready task statement:
  - Implement first-section hero media guards so default behavior favors low-byte LCP assets over autoplay video preload.
- Acceptance criteria:
  - LCP element request starts earlier with lower transfer cost.
  - No blank/flash state for hero during initial render.
- Validation:
  - Waterfall inspection for first 5 seconds.
  - Lighthouse LCP sub-audit checks.

### P0-3 Search Runtime Split and On-Demand Fuse ✅ COMPLETED
- Goal: reduce initial JS parse/execute cost on search pages and non-search pages.
- Files:
  - blocks/search/search.js
  - scripts/bundle-uswds.js
  - scripts/bundle-fuse.js (new source file)
  - scripts/deps/fuse.js (new compiled output — 17.8KB)
  - package.json
  - blocks/header/header.js
- Change implemented:
  - Removed Fuse from scripts/bundle-uswds.js source. bundle-uswds.js reduced from ~31.5KB to ~13.5KB (saves ~18KB on all non-search pages).
  - Created scripts/bundle-fuse.js as a dedicated Fuse source entry point.
  - Added `bundle:uswds` and `bundle:fuse` scripts to package.json with cross-platform Node.js rename (replaces Unix-only mv).
  - Updated `bundle` and `dev` scripts to build both bundles.
  - Compiled scripts/deps/fuse.js (17.8KB) — only loaded by search pages.
  - Updated blocks/search/search.js to import Fuse from `../../scripts/deps/fuse.js`.
  - Note: the header.js dynamic import change (P0-1) also means non-search pages no longer load the bundle during module parse.
- Change:
  - Load Fuse only when search block is active and needed.
  - Avoid carrying search-specific dependency cost into unrelated page flows.
- Owner-ready task statement:
  - Split shared bundle responsibilities and shift Fuse import to search-specific on-demand loading.
- Acceptance criteria:
  - Lower JS execution time on search entry.
  - No behavior change in search relevance, filtering, or pagination.
- Validation:
  - Lighthouse compare on search results page.
  - Manual query and pagination test matrix.

## P1 Tasks

### P1-1 Font Delivery Simplification
- Goal: reduce render dependency and stabilize text rendering.
- Files:
  - head.html
  - scripts/scripts.js
  - styles/styles.css
- Change:
  - Move toward self-hosted subset fonts and fewer active weights.
  - Keep loading strategy aligned with non-blocking rendering goals.
- Owner-ready task statement:
  - Replace broad remote font dependency with subsetted local font assets and update CSS/font loading to minimize critical-path cost.
- Acceptance criteria:
  - Font transfer bytes decrease.
  - No visual regressions in typography hierarchy.
  - CLS does not worsen.
- Validation:
  - Compare font-related network requests and transfer size.
  - Cross-page typography spot-check.

### P1-2 Form Engine Initialization Budget
- Goal: improve form interaction responsiveness.
- Files:
  - blocks/form/form.js
  - blocks/form/rules/index.js
  - blocks/form/rules/RuleEngineWorker.js
- Change:
  - Gate advanced rule processing by complexity and visible fields.
  - Review initialization sequence to avoid avoidable main-thread bursts.
- Owner-ready task statement:
  - Introduce a staged form initialization path that prioritizes first-interaction readiness over full upfront rule processing.
- Acceptance criteria:
  - Improved responsiveness on first field interaction.
  - No regression in rule correctness and submission behavior.
- Validation:
  - First-input responsiveness checks on representative form.
  - Regression tests for key rule workflows.

### P1-3 Third-Party Search Script Governance
- Goal: constrain third-party execution impact.
- Files:
  - blocks/google-results/google-results.js
- Change:
  - Keep external search script strictly scoped to pages using google-results.
  - Confirm no global event listener leakage across navigations.
- Owner-ready task statement:
  - Harden google-results integration so external script and listeners activate only when needed and cleanly coexist with page interactions.
- Acceptance criteria:
  - Search results behavior unchanged.
  - No extra listener buildup after repeated interactions.
- Validation:
  - Manual repeated-query interaction test.
  - Performance trace spot-check during search submit cycle.

## P2 Tasks

### P2-1 Performance Budgets in CI
- Goal: prevent regressions after optimization work ships.
- Files:
  - .github/workflows (new or updated workflow)
  - docs or markdown report location for trend output
- Change:
  - Add page-class budgets for homepage, search, and form scenarios.
  - Fail or warn on budget overages.
- Owner-ready task statement:
  - Add CI-based performance budget checks and publish diff-friendly trend output for prioritized pages.
- Acceptance criteria:
  - CI exposes clear pass/fail result for key budgets.
  - Team has a visible baseline and trend history.
- Validation:
  - Dry-run workflow and threshold tuning.

### P2-2 Bundle Segmentation Policy
- Goal: maintain low transfer/parse cost as features grow.
- Files:
  - scripts/bundle-uswds.js
  - blocks/* where shared bundle imports occur
- Change:
  - Define and enforce when dependencies belong in shared bundle vs block-local loading.
- Owner-ready task statement:
  - Create and apply bundle segmentation rules so only broadly shared runtime code remains in shared bundle.
- Acceptance criteria:
  - Reduced shared bundle footprint over baseline.
  - No functional regressions in dependent blocks.
- Validation:
  - Bundle diff and page-level JS execution comparison.

## Recommended Execution Order
1. P0-1 Eager Header Decomposition
2. P0-2 Hero Media Critical Path Policy
3. P0-3 Search Runtime Split and On-Demand Fuse
4. P1-2 Form Engine Initialization Budget
5. P1-1 Font Delivery Simplification
6. P1-3 Third-Party Search Script Governance
7. P2-1 Performance Budgets in CI
8. P2-2 Bundle Segmentation Policy

## Suggested KPI Targets
- Homepage LCP: at or below 2.5s on mobile test profile.
- Search INP: at or below 200ms for first query and first pagination action.
- Form INP: at or below 200ms for first input and submit click.
- CLS on all prioritized pages: at or below 0.10.

## Notes
- This backlog is based on repository-level code analysis and should be paired with measured before/after Lighthouse runs for precise scoring deltas.
- **scripts/aem.js is prohibited from modification.** Any aem.js-related guidance is documentation-only and must be addressed through scripts/scripts.js, block-level overrides, or template customization.
- P0 tasks are implemented. Run `npm run bundle` after any change to scripts/bundle-uswds.js or scripts/bundle-fuse.js to regenerate compiled output in scripts/deps/.
- Lighthouse run `utils/localhost_3000-20260827T074515.json` measured homepage Performance 62, FCP 2.9s, LCP 4.5s, TBT 0ms, CLS 0.015. Treat Chrome extension payloads and `__internal__/livereload.js` as local-test noise, not production bottlenecks.