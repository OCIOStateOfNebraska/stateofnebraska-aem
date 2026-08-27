# Performance Developer Report

Project: stateofnebraska-aem  
Audience: frontend and platform developers  
Scope: homepage, search results, and form-heavy pages

## 1. Executive Summary

The current performance risk is concentrated in three places:
- Critical-path work inside eager page loading, especially header and first-section media handling.
- Search runtime cost from client-side indexing/fuzzy matching and shared bundle dependencies.
- Form runtime initialization cost from rule engine setup and interaction orchestration.

Highest priority is reducing homepage LCP and search/form interaction latency (INP).

Measured Lighthouse homepage run from `utils/localhost_3000-20260827T074515.json` confirms the homepage bottleneck is LCP/render delay, not JavaScript blocking: Performance 62, FCP 2.9s, LCP 4.5s, TBT 0ms, CLS 0.015.

Follow-up Lighthouse run for `/test-pages/olek-test` measured Performance 80 with excellent FCP/LCP/TBT but failing CLS: FCP 0.3s, LCP 0.4s, TBT 0ms, CLS 0.459. The main shift target was `main#main-content`, indicating the page was revealed before the header structure reached its final height.

## 2. Key Metrics and Targets

### Core Web Vitals
- LCP (Largest Contentful Paint): measures load speed of the largest visible element.
  - Target: <= 2.5s on mobile profile.
- INP (Interaction to Next Paint): measures responsiveness after user input.
  - Target: <= 200ms.
- CLS (Cumulative Layout Shift): measures visual stability.
  - Target: <= 0.10.

### Supporting Lighthouse/Perf Signals
- TBT (Total Blocking Time): proxy for main-thread contention.
- Render-blocking resources: CSS/JS delaying first paint.
- Unused JS/CSS and JS transfer size: indicates code loading inefficiency.

## 3. Current Risk Posture by Page

## Homepage
- Primary risk metric: LCP.
- Risk level: High.
- Why:
  - Eager lifecycle includes header loading before first section completion.
  - Hero auto-block can choose heavy media paths, including autoplay + preload video behavior.
  - Font dependency remains external and can add variability to first render.
- Measured findings from local Lighthouse:
  - Performance score: 62.
  - LCP: 4.5s, target <= 2.5s.
  - FCP and Speed Index: 2.9s.
  - TBT: 0ms, so main-thread blocking is not the current homepage bottleneck.
  - CLS: 0.015, comfortably below the 0.10 threshold.
  - Render-blocking estimate: 370ms, mostly local dev livereload plus `/styles/styles.css`.
  - Resource profile: 228 KiB total, including 73 KiB fonts, 40 KiB CSS, and 85 KiB scripts.
  - LCP element was text in main content, not the hero image. This makes body visibility timing and critical CSS more important than image byte savings for this specific run.
  - Caveat: the run was against localhost with Chrome extensions and live reload enabled; ignore extension payloads and `__internal__/livereload.js` for production decisions.
- CLS follow-up from `/test-pages/olek-test`:
  - Performance score: 80.
  - FCP: 0.3s, LCP: 0.4s, TBT: 0ms.
  - CLS: 0.459, above the <= 0.10 target.
  - Main shifted elements: `main#main-content` and the first `.usa-section`.
  - Fix implemented: body reveal remains early after the first section loads, while eager global CSS now reserves header loading height until the header block reaches `loaded` status.

## Search Results Page
- Primary risk metrics: INP and TBT.
- Risk level: High.
- Why:
  - Client-side data loading and fuzzy matching work can grow with dataset size.
  - Search dependency surface includes shared bundle content not always needed by other pages.
  - Google results variant introduces third-party script and callback lifecycle overhead.

## Form-Heavy Page
- Primary risk metrics: INP and TBT.
- Risk level: Medium to High.
- Why:
  - Adaptive form/rule engine initialization path is complex.
  - Worker and state synchronization add startup/interaction cost.
  - Dynamic integrations must stay tightly scoped to avoid extra main-thread work.

## 4. What Developers Should Do (Action Plan)

## P0: Ship First

### P0-1 Reduce Eager Header Work
- Files:
  - scripts/scripts.js
  - scripts/aem.js (do not modify; inherited platform helper)
  - blocks/header/header.js
- Do:
  - Keep only minimal header shell and accessibility-critical behavior in eager.
  - Move complex nav enhancements and non-critical setup to lazy.
  - Keep `body.appear` after first-section load and reserve header loading height in eager global CSS.
- Expected metric lift:
  - Preserve fast LCP while reducing CLS caused by main content moving after header layout finalizes. TBT is already 0ms in measured runs.

### P0-2 Enforce Hero Critical-Path Media Policy
- Files:
  - scripts/scripts.js
  - blocks/hero/hero.js
  - blocks/hero-homepage/hero-homepage.js
- Do:
  - Favor optimized image LCP candidates for first section.
  - Avoid preload auto for autoplay first-section video unless explicitly justified.
- Expected metric lift:
  - Faster LCP and smaller initial transfer.

### P0-3 Split Search Runtime Dependencies
- Files:
  - blocks/search/search.js
  - scripts/bundle-uswds.js
- Do:
  - Load Fuse on demand in search context only.
  - Keep shared bundle focused on truly shared runtime dependencies.
- Expected metric lift:
  - Better INP/TBT and lower JS parse/execute cost.

## P1: Next Wave

### P1-1 Simplify Font Delivery
- Files:
  - head.html
  - scripts/scripts.js
  - styles/styles.css
- Do:
  - Move to subsetted self-hosted fonts and reduce active weights.
  - Keep rendering non-blocking and stable across page classes.
- Expected metric lift:
  - More stable LCP/CLS and lower external dependency cost. The measured homepage run loaded two Google font files totaling about 73 KiB.

### P1-2 Stage Form Engine Initialization
- Files:
  - blocks/form/form.js
  - blocks/form/rules/index.js
  - blocks/form/rules/RuleEngineWorker.js
- Do:
  - Prioritize first-interaction readiness.
  - Delay non-essential rule work when safe.
- Expected metric lift:
  - Better INP during initial form interaction.

### P1-3 Scope Third-Party Search Script Lifecycle
- Files:
  - blocks/google-results/google-results.js
- Do:
  - Keep external search script and listeners constrained to google-results pages.
  - Verify no listener accumulation during repeated search interactions.
- Expected metric lift:
  - Lower runtime overhead and more predictable responsiveness.

## P2: Hardening

### P2-1 Add Performance Budgets in CI
- Files:
  - .github/workflows (new or updated)
- Do:
  - Add budget checks for homepage/search/form page classes.
  - Surface pass/fail and trend reporting.

### P2-2 Enforce Bundle Segmentation Policy
- Files:
  - scripts/bundle-uswds.js
  - relevant blocks/* imports
- Do:
  - Define what belongs in shared bundle versus page/block-local loading.

## 5. Validation and Reporting Workflow

## Baseline and Re-Test Order
1. Homepage
2. Search Results
3. Form Page

## Minimum Test Set Per Iteration
- Lighthouse mobile runs, before and after, on each page class.
- Network waterfall review for:
  - LCP resource discovery timing
  - render-blocking CSS/JS
  - third-party script timing
- Interaction checks:
  - first search query + first pagination click
  - first form input + submit click

## Pass Criteria
- LCP <= 2.5s on homepage.
- INP <= 200ms on search and form interactions.
- CLS <= 0.10 across all three page classes.

## 6. Developer Handoff Checklist

- Confirm baseline metrics captured and attached to ticket.
- Confirm page class and template being changed.
- Confirm affected files mapped before coding.
- Confirm before/after Lighthouse report linked in PR.
- Confirm no regression in accessibility-critical behavior (nav, skip links, form flows).

## 7. Reference Backlog

Execution details are tracked in:
- PERFORMANCE-BACKLOG.md

Management summary is tracked in:
- PERFORMANCE-MANAGER-SUMMARY.md