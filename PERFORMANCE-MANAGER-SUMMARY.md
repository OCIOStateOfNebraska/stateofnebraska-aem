# Performance Manager Summary

Project: stateofnebraska-aem  
Date: 2026-08-20  
Prepared for: engineering and delivery leads

## 1. What Matters Most

- Primary business risk: slow first impression on homepage and delayed interaction response on search/form experiences.
- Primary technical risk: too much work in the early render path and too much client-side processing on high-traffic journeys.
- Primary goal: improve user experience and conversion confidence by reducing LCP and INP regressions on top page classes.

## 2. KPI Targets

- Homepage LCP: <= 2.5s (mobile profile)
- Search INP: <= 200ms (first query + first pagination)
- Form INP: <= 200ms (first input + submit click)
- CLS across all three page classes: <= 0.10

## 3. Work Plan by Priority

## P0 (Start Immediately)

### P0-1 Reduce eager header workload
- Outcome: faster first render and LCP improvement on homepage.
- Scope: scripts/scripts.js, scripts/aem.js, blocks/header/header.js.
- Estimated effort: Medium.
- Risk: Medium (navigation and accessibility behavior must remain stable).

### P0-2 Enforce first-section hero media policy
- Outcome: lower initial bytes and more reliable LCP.
- Scope: scripts/scripts.js, hero block files.
- Estimated effort: Medium.
- Risk: Medium (visual/authoring expectations).

### P0-3 Split search dependencies and load on demand
- Outcome: lower JS execution cost and better INP/TBT on search.
- Scope: blocks/search/search.js, scripts/bundle-uswds.js.
- Estimated effort: Medium.
- Risk: Medium (must preserve search behavior parity).

## P1 (After P0 Stabilizes)

### P1-1 Simplify font delivery
- Outcome: improved consistency for LCP/CLS and lower external dependency cost.
- Scope: head.html, scripts/scripts.js, styles/styles.css.
- Estimated effort: Medium.
- Risk: Low to Medium.

### P1-2 Stage form engine initialization
- Outcome: better responsiveness during first interaction.
- Scope: blocks/form/form.js, blocks/form/rules/index.js, worker path.
- Estimated effort: Medium to Large.
- Risk: Medium to High (rules regression risk).

### P1-3 Tighten third-party search script lifecycle
- Outcome: reduced runtime overhead and cleaner interaction behavior.
- Scope: blocks/google-results/google-results.js.
- Estimated effort: Small to Medium.
- Risk: Low to Medium.

## P2 (Hardening and Governance)

### P2-1 CI performance budgets
- Outcome: prevents regressions and provides trend visibility.
- Scope: .github/workflows and reporting output.
- Estimated effort: Medium.
- Risk: Low.

### P2-2 Shared bundle segmentation policy
- Outcome: sustained JS footprint control as features grow.
- Scope: scripts/bundle-uswds.js and dependent block imports.
- Estimated effort: Medium.
- Risk: Medium.

## 4. Suggested Owners

- Platform/frontend runtime owner:
  - P0-1, P0-2, P1-1, P2-2
- Search feature owner:
  - P0-3, P1-3
- Forms feature owner:
  - P1-2
- DevOps/quality owner:
  - P2-1

## 5. Delivery Timeline (Suggested)

- Week 1:
  - Baseline capture for homepage/search/form.
  - Start and complete P0-1 and P0-2.
- Week 2:
  - Complete P0-3 and validate all P0 KPI movement.
- Week 3:
  - Complete P1-1 and begin P1-2.
- Week 4:
  - Complete P1-2 and P1-3.
- Week 5:
  - Implement P2 governance work (budgets, bundle policy).

## 6. Definition of Success

- KPI targets are met on the three prioritized page classes.
- No accessibility regressions in navigation or forms.
- Lighthouse before/after evidence is attached to each completed P0/P1 item.
- CI contains enforceable performance guardrails.

## 7. Source Artifacts

- Detailed technical report: PERFORMANCE-DEVELOPER-REPORT.md
- File-level backlog and acceptance criteria: PERFORMANCE-BACKLOG.md