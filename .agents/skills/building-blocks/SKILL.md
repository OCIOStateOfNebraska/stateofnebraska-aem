---
name: building-blocks
description: Guide for implementing code changes in the State of Nebraska Sower Design System on AEM Edge Delivery Services. Handles USWDS-based block development, SCSS/CSS styling, authoring models, and core functionality changes. Use during implementation in the content-driven-development workflow.
license: Apache-2.0
metadata:
  version: "2.0.0"
---

# Building Blocks

This skill guides you through implementing AEM Edge Delivery blocks following established patterns and best practices. Blocks transform authored content into rich, interactive experiences through JavaScript decoration and CSS styling.

## Repository Conventions

- Read the repo's `AGENTS.md` and `README.md` for current architecture and commands. Follow a nearby block before introducing a new pattern; `blocks/columns/` is one example of a block using the local DOM helper and USWDS Sass utilities.
- A block's source styles live in `<block-name>.scss`; the site serves the generated `<block-name>.css`. Compile with `npm run sass` and review the generated CSS. Do not hand-edit generated CSS.
- Block SCSS commonly imports `@use '../../styles/ne-global-imports' as *;`. Reuse USWDS modules, mixins, and theme tokens already in use, such as `units(...)`, `at-media(...)`, and `color(...)`, rather than introducing generic CSS variables or hard-coded values without need.
- Reuse local utilities such as `scripts/dom-helpers.js` and `scripts/utils.js` where they fit. `domEl()` and its shorthand helpers (`div()`, `figure()`, `button()`, and others) return DOM elements, so one helper call can be passed as a child to another to build nested markup. See `blocks/gallery/gallery.js` for this pattern. Preserve authored elements when decorating content, and match the block's existing DOM and variant conventions.
- Authoring schemas belong beside blocks as `_<block-name>.json`; shared models live under `models/`. After changing models or schemas, run `npm run build:json` and review the generated root `component-*.json` files. Do not edit generated root files directly.
- `scripts/aem.js` is the protected AEM runtime: never edit, replace, or delete it. Shared page decoration belongs in `scripts/scripts.js`; preserve its `decorateInner()` ordering and avoid redecorating initialized blocks. Fragment rendering also uses the shared decoration pipeline.
- The project requires Node.js 22+ and npm 10+. On Windows, use the commands documented in `AGENTS.md`; `npm run lint` is the CI check, `npm run sass` compiles SCSS, and there is no configured `npm test` script.

**IMPORTANT: This skill should ONLY be invoked from the content-driven-development skill during Step 5 (Implementation).**

If you are not already following the CDD process, STOP and invoke the **content-driven-development** skill first.

## Related Skills

- **content-driven-development**: MUST be invoked before using this skill to ensure content and content models are ready
- **da-auth**: Obtain a valid Adobe IMS token if test content needs to be pushed to DA before implementation can begin
- **block-collection-and-party**: Use to find similar blocks for patterns
- **testing-blocks**: Automatically invoked during Step 5 for comprehensive testing

## When to Use This Skill

This skill is invoked automatically by **content-driven-development** during Step 5 (Implementation). It handles:

**Block Development:**
- Creating new block files and structure
- Implementing JavaScript decoration
- Adding CSS styling

**Core Functionality:**
- Scripts.js modifications (decoration, utilities, auto-blocking)
- Global styles (styles.css, lazy-styles.css)
- Delayed functionality (delayed.js)
- Configuration changes

**Combined:**
- Blocks with supporting core changes (utilities, global styles, etc.)

Prerequisites (verified by CDD):
- ✅ Test content exists (in CMS or local drafts)
- ✅ Content model is defined/documented (if applicable)
- ✅ Test content URL is available
- ✅ Dev server is running

## Block Implementation Workflow

Track your progress:
- [ ] Step 1: Find similar blocks for patterns (if new block or major changes)
- [ ] Step 2: Create or modify block structure (files and directories)
- [ ] Step 3: Implement JavaScript decoration (skip if CSS-only)
- [ ] Step 4: Add CSS styling
- [ ] Step 5: Test implementation (invokes testing-blocks skill)

**Note:** If your changes require core modifications (utilities in scripts.js, global styles, etc.), make those changes first, test them, then return to this workflow. See "When Modifying Core Files" below.

## Step 1: Find Similar Blocks

**When to use:** Creating new blocks or making major structural modifications

**Skip this step when:** Making minor modifications to existing blocks (CSS tweaks, small decoration changes)

**Quick start:**

1. Inspect similar blocks under `blocks/` and their authored schemas, if present.
2. Use the **block-collection-and-party** skill when a useful local reference is not available.
3. Review patterns from similar blocks:
   - DOM manipulation strategies
   - CSS architecture
   - Variant handling
   - Performance optimizations

## Step 2: Create or Modify Block Structure

### For New Blocks:

1. Add the source files next to their generated stylesheet, following nearby blocks:

  - `blocks/{block-name}/{block-name}.js`
  - `blocks/{block-name}/{block-name}.scss`
  - `blocks/{block-name}/{block-name}.css` (generated by `npm run sass`)

  Add `blocks/{block-name}/_{block-name}.json` only when the block needs an authoring schema.

2. Follow local JavaScript style and existing helper usage. Block modules typically export a default `decorate` function:

    ```javascript
    import { domEl } from '../../scripts/dom-helpers.js';

    export default function decorate( block ) {
      const wrapper = domEl(
        'div',
        { class: 'example__content' },
        domEl( 'p', { class: 'example__text' }, 'Content' ),
      );
      block.replaceChildren( wrapper );
    }
    ```

3. Compile SCSS to the served CSS with `npm run sass`; do not create or maintain generated CSS by hand.

### For Existing Blocks:

1. Locate `blocks/{block-name}/` and read its JavaScript, SCSS, generated CSS, and schema if present.
2. Check the relevant authored content and variants before changing decoration or styles. Use the test content and dev server established by CDD.
3. Edit source files, then regenerate CSS or component JSON only when the corresponding source changed.

## Step 3: Implement JavaScript Decoration

**Essential pattern - re-use existing authored DOM elements and local helpers:**

```javascript
export default function decorate( block ) {
  // Platform delivers images as <picture> elements with <source> tags
  const picture = block.querySelector('picture');
  const heading = block.querySelector('h2');

  // Create new structure, re-using existing elements
  const figure = document.createElement( 'figure' );
  figure.append( picture );

  const wrapper = document.createElement( 'div' );
  wrapper.className = 'content-wrapper';
  wrapper.append( heading, figure );

  block.replaceChildren( wrapper );

  // Only check variants when they affect decoration logic
  // CSS-only variants like 'dark', 'wide' don't need JS
  if (block.classList.contains('carousel')) {
    // Apply behavior only when the variant requires it.
    setupCarousel(block);
  }
}
```

**For complete JavaScript guidelines including:**
- Advanced DOM manipulation patterns
- Fetching data and loading modules
- Performance optimization techniques
- Helper functions from aem.js
- Code style and linting rules

**Read [references/js-guidelines.md](references/js-guidelines.md)**

## Step 4: Add CSS Styling

**Essential patterns - follow the project's USWDS Sass conventions:**

```scss
@use '../../styles/ne-global-imports' as *;

.my-block {
  margin-bottom: units($component-spacing-sm);

  @include at-media('desktop') {
    // Add desktop-specific rules when needed.
  }
}
```

Write these styles in `<block-name>.scss`; `npm run sass` generates the corresponding CSS. Keep selectors consistent with the block's established DOM and naming rather than imposing a universal `main .<block>` selector.

**For complete CSS guidelines including:**
- All available CSS custom properties
- Modern CSS features (grid, logical properties, etc.)
- Performance optimization
- Naming conventions
- Common patterns and anti-patterns

**Read [references/css-guidelines.md](references/css-guidelines.md)**

**Note on iterative validation:** While building, you can test changes in your browser as you go (load test content URL, check console, verify layout and functionality). For comprehensive testing guidance including browser testing techniques, responsive testing, and validation approaches, see the testing-blocks skill invoked in Step 5.

## Step 5: Test Implementation

**After implementation is complete, invoke the testing-blocks skill and adapt its checks to this repository.** Run `npm run lint`; run `npm run sass` after SCSS changes. This repository does not define `npm test` or `npm run lint:fix`, so do not report those as available checks. Use the CDD test content in the local AEM preview for browser validation.

The testing-blocks skill will guide you through:
- Browser testing (functionality, responsive behavior across viewports)
- Linting and fixing issues
- Writing unit tests for logic-heavy utilities (if needed)
- Screenshot capture for validation
- Performance validation

**Provide the testing-blocks skill with:**
- Block name being tested
- Test content URL(s) (from step 4 of CDD process)
- Any variants that need testing
- Screenshots of existing implementation/design/mockup to verify against
- Acceptance criteria to verify (from step 2 of CDD process)

**After testing is complete, return to CDD workflow.**

For changes to shared decoration or core page behavior, also validate affected pages and fragments, first-section visibility, and relevant templates/themes. Check the browser console and network for errors.

---

## When Modifying Core Files

If your changes require modifying core files (scripts.js, styles.css, delayed.js), follow these principles:

**Common core files:**
- **scripts.js** - Decoration utilities, auto-blocking logic, page loading
- **styles.css** - Global styles (eager), CSS custom properties
- **lazy-styles.css** - Global styles (lazy loaded)
- **delayed.js** - Marketing, analytics, third-party integrations

**Key principles:**

1. **Make core changes first** (before block changes that depend on them). Never modify `scripts/aem.js`.
2. **Test core changes independently** with existing content before using in blocks; shared authored-content behavior may also affect fragments.
3. **Consider impact** - core changes can affect multiple blocks/pages
4. **Test thoroughly** - verify no regressions in existing functionality
5. **Keep it minimal** - only add what's necessary
6. **Document with code comments** - most core changes don't need separate docs

**Testing core changes:**
- Test with existing content URLs that use affected functionality
- For auto-blocking: test pages that should/shouldn't trigger it
- For global styles: test across multiple blocks and pages
- Check console for errors
- Verify responsive behavior

**For detailed patterns:**
- JavaScript: See [references/js-guidelines.md](references/js-guidelines.md)
- CSS: See [references/css-guidelines.md](references/css-guidelines.md)

---

## Reference Materials

- [references/js-guidelines.md](references/js-guidelines.md) - Complete JavaScript patterns and best practices
- [references/css-guidelines.md](references/css-guidelines.md) - Complete CSS patterns and best practices
