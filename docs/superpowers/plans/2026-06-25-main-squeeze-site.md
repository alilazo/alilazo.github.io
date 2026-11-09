# The Main Squeeze Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone static HTML/CSS/JS pitch site for The Main Squeeze using direct Facebook-downloaded assets.

**Architecture:** The site is a single static page with local assets copied into an `assets/` directory. `index.html` owns content structure, `styles.css` owns visual presentation and responsive layout, `script.js` owns small progressive interactions, and `tests/smoke.test.mjs` verifies required files and content.

**Tech Stack:** HTML, CSS, JavaScript, Node.js built-in test/assert APIs.

---

### Task 1: Add Smoke Test

**Files:**
- Create: `projects/Business Revamp/The Main Squeeze/tests/smoke.test.mjs`

- [ ] **Step 1: Write the failing smoke test**

Create a Node script that reads `index.html`, `styles.css`, and `script.js`; verifies required copy, direct asset filenames, pricing, responsive CSS, and no `crop` references.

- [ ] **Step 2: Run the test to verify it fails**

Run: `node "projects/Business Revamp/The Main Squeeze/tests/smoke.test.mjs"`

Expected: FAIL because `index.html` does not exist yet.

### Task 2: Copy Direct Facebook Assets

**Files:**
- Create directory: `projects/Business Revamp/The Main Squeeze/assets`
- Copy from: `projects/Business Revamp/The Main Squeeze/source-assets`

- [ ] **Step 1: Copy approved direct Facebook images**

Copy the logo, product photos, promo graphics, and lemon texture into `assets/`.

- [ ] **Step 2: Verify no copied asset filename contains `crop`**

Run: `Get-ChildItem "projects/Business Revamp/The Main Squeeze/assets" | Where-Object Name -match crop`

Expected: no output.

### Task 3: Build Static Site

**Files:**
- Create: `projects/Business Revamp/The Main Squeeze/index.html`
- Create: `projects/Business Revamp/The Main Squeeze/styles.css`
- Create: `projects/Business Revamp/The Main Squeeze/script.js`

- [ ] **Step 1: Add semantic HTML**

Create the single-page structure with hero, featured sips, specials, gallery, visit, and website-care pitch sections.

- [ ] **Step 2: Add responsive beachy CSS**

Use a bright lemon/aqua/coral/pink palette, stable image cards, readable playful buttons, and mobile responsive layout.

- [ ] **Step 3: Add JavaScript interactions**

Implement smooth scrolling, rotating hero sip text, and the vibe button.

### Task 4: Verify

**Files:**
- Read: `projects/Business Revamp/The Main Squeeze/tests/smoke.test.mjs`
- Read: `projects/Business Revamp/The Main Squeeze/index.html`
- Read: `projects/Business Revamp/The Main Squeeze/styles.css`
- Read: `projects/Business Revamp/The Main Squeeze/script.js`

- [ ] **Step 1: Run the smoke test**

Run: `node "projects/Business Revamp/The Main Squeeze/tests/smoke.test.mjs"`

Expected: PASS.

- [ ] **Step 2: Start a static server and inspect the page**

Run a local static server from `projects/Business Revamp/The Main Squeeze` and open the page in a browser for visual verification.

- [ ] **Step 3: Check git diff**

Run: `git status --short` and `git diff --stat`

Expected: only intended site, spec, plan, and previously requested deleted files are present.
