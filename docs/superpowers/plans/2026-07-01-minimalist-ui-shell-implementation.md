# Minimalist UI Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert Codims from a header-plus-sidebar layout into a full-canvas 3D scene with corner HUD controls and overlay workflows.

**Architecture:** Keep the static no-build frontend. Move existing DOM sections rather than replacing app state: `index.html` defines the shell, `style.css` defines HUD/overlay layout, `app.js` keeps data/render behavior and adds overlay open/close state. Add only small pure helpers to `visual-model.mjs` if needed for automatic density.

**Tech Stack:** Static HTML/CSS, vanilla JavaScript modules, Three.js, Node test scripts, Playwright smoke tests, Python unittest server tests.

---

## Source Documents

- Design spec: `docs/superpowers/specs/2026-07-01-minimalist-ui-shell-design.md`
- Current app entry: `index.html`
- Current UI logic: `app.js`
- Current styles: `style.css`
- Smoke tests: `smoke/codims-smoke.spec.mjs`
- Pure visual tests: `test_visual_model.mjs`

## File Structure

- Modify `index.html`: replace permanent header/sidebar structure with one full-screen app shell, HUD layer, inbox drawer, inspector overlay, settings dialog.
- Modify `style.css`: add full-canvas layout, corner HUD, drawer, inspector, settings dialog, responsive overlay behavior; remove or repurpose old header/sidebar styles.
- Modify `app.js`: update DOM selectors, remove deleted controls, add overlay state and open/close handlers, update inbox badge, keep scene rendering intact.
- Modify `visual-model.mjs`: add a small `autoDensityMode(projectGroups)` helper only if automatic density is not trivial in `app.js`.
- Modify `test_visual_model.mjs`: cover `autoDensityMode()` if added.
- Modify `smoke/codims-smoke.spec.mjs`: assert new shell, drawer, settings, inspector, and removed composer/header/sidebar controls.

## Task 1: Full-Screen Shell And HUD

**Files:**
- Modify: `index.html`
- Modify: `style.css`
- Modify: `app.js`
- Modify: `smoke/codims-smoke.spec.mjs`

- [ ] **Step 1: Update smoke test expectations first**

In `smoke/codims-smoke.spec.mjs`, update the first test to assert the new shell/HUD selectors. Replace the old first assertions inside `test("renders nonblank scene and action inbox", ...)` with:

```js
await page.goto(`${baseUrl}/index.html`);
await expect(page.locator(".app-shell")).toBeVisible();
await expect(page.locator(".app-header")).toHaveCount(0);
await expect(page.locator(".details-panel")).toHaveCount(0);
await expect(page.locator("#scene canvas")).toBeVisible();
await expect(page.locator("#statusText")).toBeVisible();
await expect(page.locator("#activeCount")).toHaveText("1");
await expect(page.locator("#visibleCount")).toHaveText("3");
await expect(page.locator("#projectCount")).toHaveText("1");
await expect(page.locator("#inboxToggle")).toBeVisible();
await expect(page.locator("#settingsToggle")).toBeVisible();
```

Keep the later nonblank screenshot assertion in the test.

- [ ] **Step 2: Run smoke test and verify it fails**

Run:

```bash
npm run test:smoke -- --grep "renders nonblank scene and action inbox"
```

Expected: FAIL because `.app-shell`, `#inboxToggle`, and `#settingsToggle` do not exist yet.

- [ ] **Step 3: Replace the body shell in `index.html`**

Replace the current `<body>` contents before `<script type="module" src="./app.js"></script>` with this structure. Keep existing element IDs where shown because `app.js` relies on them:

```html
<body>
  <main class="app-shell">
    <section class="scene-shell" aria-label="3D Codex worker rooms">
      <div id="scene"></div>
      <div id="labels" class="labels-layer"></div>
    </section>

    <div class="hud-layer" aria-label="Codims controls">
      <div class="hud-status" role="status" aria-live="polite">
        <span class="status-dot" aria-hidden="true"></span>
        <span id="statusText">Loading Codex rooms...</span>
      </div>

      <div class="counters hud-counters" aria-label="Codims counters">
        <div class="counter">
          <span id="activeCount">0</span>
          <span class="counter-label">running now</span>
        </div>
        <div class="counter">
          <span id="visibleCount">0</span>
          <span class="counter-label">visible threads</span>
        </div>
        <div class="counter">
          <span id="projectCount">0</span>
          <span class="counter-label">projects</span>
        </div>
      </div>

      <div class="hud-actions" aria-label="Overlay actions">
        <button id="inboxToggle" class="hud-icon-button" type="button" aria-expanded="false" aria-controls="inboxDrawer" title="Action inbox">
          <span aria-hidden="true">Inbox</span>
          <span id="inboxBadge" class="hud-badge">0</span>
        </button>
        <button id="settingsToggle" class="hud-icon-button" type="button" aria-haspopup="dialog" aria-controls="settingsDialog" title="Settings">
          <span aria-hidden="true">Settings</span>
        </button>
      </div>
    </div>

    <!-- Temporary overlay containers follow; later tasks refine their contents. -->
  </main>

  <script type="module" src="./app.js"></script>
</body>
```

Also add temporary hidden overlay containers in this same task so existing `app.js` selectors do not become null before later tasks rewire them:

- Move the current `<section class="review-lane">...</section>` into `<aside id="inboxDrawer" class="inbox-drawer" hidden>...</aside>`.
- Move the current `#detailsEmpty`, `#detailsContent`, and send dialog markup into `<aside id="inspectorOverlay" class="inspector-overlay" hidden>...</aside>`.
- Move `#maxAgeHours`, `#densityMode`, `#privacyToggle`, and `#inactiveToggle` into a temporary `<dialog id="settingsDialog" class="settings-dialog">`.

Do not keep `.app-header`, `.app-layout`, `.controls`, `#emptyState`, `#threadSearch`, `#liveToggle`, or `#labelsToggle` in the default shell. `#privacyToggle` and `#inactiveToggle` remain in the temporary settings dialog until Task 4 refines settings.

- [ ] **Step 4: Add full-screen shell CSS**

In `style.css`, replace the `body` grid setup and old `.app-header` layout rules with these base rules. Keep existing label, scene object, review, and detail styles below for later reuse.

```css
html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  min-width: 320px;
}

.app-shell {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #05070d;
}

.scene-shell {
  position: absolute;
  inset: 0;
  overflow: hidden;
  min-width: 0;
  min-height: 0;
  background:
    linear-gradient(180deg, rgba(12, 18, 32, 0.34), rgba(3, 5, 10, 0.88)),
    #050711;
}

.hud-layer {
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: none;
}

.hud-status,
.hud-counters,
.hud-actions {
  pointer-events: auto;
}

.hud-status {
  position: absolute;
  left: 14px;
  top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  max-width: min(420px, calc(100vw - 120px));
  min-height: 32px;
  padding: 6px 9px;
  border: 1px solid rgba(172, 188, 209, 0.18);
  border-radius: 7px;
  background: rgba(7, 11, 20, 0.68);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2), 0 1px 0 rgba(255, 255, 255, 0.04) inset;
  backdrop-filter: blur(14px);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--active);
  box-shadow: 0 0 12px rgba(52, 211, 153, 0.66);
}

.hud-counters {
  position: absolute;
  left: 14px;
  bottom: 14px;
}

.hud-actions {
  position: absolute;
  right: 14px;
  top: 12px;
  display: inline-flex;
  gap: 8px;
}

.hud-icon-button {
  position: relative;
  min-width: 38px;
  min-height: 34px;
  border: 1px solid rgba(172, 188, 209, 0.2);
  border-radius: 7px;
  background: rgba(7, 11, 20, 0.74);
  color: var(--text);
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  font-weight: 760;
  padding: 7px 9px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2), 0 1px 0 rgba(255, 255, 255, 0.04) inset;
  backdrop-filter: blur(14px);
}

.hud-icon-button:hover,
.hud-icon-button:focus-visible {
  border-color: rgba(34, 211, 238, 0.58);
  outline: none;
}

.hud-badge {
  position: absolute;
  right: -6px;
  top: -6px;
  display: grid;
  min-width: 18px;
  height: 18px;
  place-items: center;
  border: 1px solid rgba(52, 211, 153, 0.62);
  border-radius: 999px;
  background: rgba(4, 35, 28, 0.96);
  color: #dcfce7;
  font-size: 10px;
  line-height: 1;
}
```

- [ ] **Step 5: Update `app.js` DOM map for shell-only selectors**

In the `dom` object, remove selectors for deleted default controls and add:

```js
inboxToggle: document.querySelector("#inboxToggle"),
inboxBadge: document.querySelector("#inboxBadge"),
settingsToggle: document.querySelector("#settingsToggle"),
inboxDrawer: document.querySelector("#inboxDrawer"),
inspectorOverlay: document.querySelector("#inspectorOverlay"),
settingsDialog: document.querySelector("#settingsDialog"),
```

Keep `statusText`, `activeCount`, `visibleCount`, `projectCount`, `scene`, `labels`, `maxAgeHours`, `densityMode`, `privacyToggle`, `inactiveToggle`, and the existing review/detail selectors that were moved into temporary overlays.

- [ ] **Step 6: Temporarily disable event bindings for missing controls**

In `bindEvents()`, remove listeners for:

```js
dom.controls
dom.threadSearch
dom.liveToggle
dom.labelsToggle
```

Keep resize, pointer events, `maxAgeHours`, `densityMode`, `privacyToggle`, and `inactiveToggle` listeners because those controls still exist in the temporary settings dialog. Overlay open/close listeners are added in later tasks.

In startup code, remove `setLabels(prefs.labels);` and `setLive(true);`. Replace them with:

```js
state.labels = true;
state.live = true;
dom.labels.classList.toggle("is-hidden", false);
```

- [ ] **Step 7: Run syntax and targeted smoke checks**

Run:

```bash
npm run test:js
npm run test:smoke -- --grep "renders nonblank scene and action inbox"
```

Expected: JavaScript tests pass. Smoke may still fail on inbox/detail assertions until overlay tasks are implemented.

- [ ] **Step 8: Commit shell/HUD work**

```bash
git add index.html style.css app.js smoke/codims-smoke.spec.mjs
git commit -m "Build full-screen Codims HUD shell"
```

## Task 2: Action Inbox Drawer

**Files:**
- Modify: `index.html`
- Modify: `style.css`
- Modify: `app.js`
- Modify: `smoke/codims-smoke.spec.mjs`

- [ ] **Step 1: Add failing smoke assertions for drawer behavior**

In `smoke/codims-smoke.spec.mjs`, update the first test after HUD assertions:

```js
await expect(page.locator("#inboxDrawer")).toBeHidden();
await page.locator("#inboxToggle").click();
await expect(page.locator("#inboxDrawer")).toBeVisible();
await expect(page.locator("#reviewList")).toContainText("Review sidebar");
await expect(page.locator("#reviewPanelToggle")).toHaveCount(0);
await expect(page.locator("#reviewStaleToggle")).toHaveCount(0);
await expect(page.locator("#reviewUnreviewedToggle")).toHaveCount(0);
await expect(page.locator(".review-toggle")).toHaveAttribute("aria-label", /Mark .* reviewed/);
```

- [ ] **Step 2: Run smoke test and verify it fails**

```bash
npm run test:smoke -- --grep "renders nonblank scene and action inbox"
```

Expected: FAIL because `#inboxDrawer` and drawer toggle behavior do not exist.

- [ ] **Step 3: Add inbox drawer markup**

In `index.html`, inside `.app-shell` after `.hud-layer`, add:

```html
<aside id="inboxDrawer" class="inbox-drawer" aria-label="Action inbox" hidden>
  <section class="review-lane" aria-labelledby="reviewLaneTitle">
    <div class="review-lane-header">
      <div>
        <h2 id="reviewLaneTitle">Action inbox</h2>
        <p id="reviewCount">0 needs review / 0 running / 0 stale / 0 reviewed</p>
      </div>
      <button id="inboxClose" class="overlay-close" type="button" aria-label="Close action inbox">Close</button>
    </div>
    <div class="action-inbox-filters" aria-label="Action inbox filters">
      <button type="button" data-action-inbox-filter="needs_review" aria-pressed="false">
        <span data-action-inbox-count="needs_review">0</span>
        <span>Needs review</span>
      </button>
      <button type="button" data-action-inbox-filter="running" aria-pressed="false">
        <span data-action-inbox-count="running">0</span>
        <span>Running</span>
      </button>
      <button type="button" data-action-inbox-filter="stale" aria-pressed="false">
        <span data-action-inbox-count="stale">0</span>
        <span>Stale</span>
      </button>
      <button type="button" data-action-inbox-filter="reviewed" aria-pressed="false">
        <span data-action-inbox-count="reviewed">0</span>
        <span>Reviewed</span>
      </button>
    </div>
    <div id="reviewList" class="review-list"></div>
  </section>
</aside>
```

- [ ] **Step 4: Add drawer CSS**

Add:

```css
.inbox-drawer,
.inspector-overlay {
  position: absolute;
  z-index: 30;
  border: 1px solid rgba(172, 188, 209, 0.2);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(17, 24, 39, 0.96), rgba(5, 8, 14, 0.96)),
    var(--bg);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.36), 0 1px 0 rgba(255, 255, 255, 0.04) inset;
  backdrop-filter: blur(18px);
}

.inbox-drawer[hidden],
.inspector-overlay[hidden] {
  display: none;
}

.inbox-drawer {
  right: 14px;
  top: 58px;
  width: min(620px, calc(100vw - 28px));
  max-height: calc(100vh - 86px);
  overflow: auto;
  padding: 16px;
}

.overlay-close {
  border: 1px solid rgba(172, 188, 209, 0.2);
  border-radius: 6px;
  background: rgba(8, 12, 22, 0.72);
  color: var(--text);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 8px;
}
```

- [ ] **Step 5: Add drawer state and DOM selectors in `app.js`**

Add DOM selectors:

```js
inboxDrawer: document.querySelector("#inboxDrawer"),
inboxClose: document.querySelector("#inboxClose"),
```

Add state:

```js
inboxOpen: false,
```

Add function:

```js
function setInboxOpen(nextOpen) {
  state.inboxOpen = nextOpen;
  dom.inboxDrawer.hidden = !nextOpen;
  dom.inboxToggle.setAttribute("aria-expanded", String(nextOpen));
}
```

Add listeners:

```js
dom.inboxToggle.addEventListener("click", () => setInboxOpen(!state.inboxOpen));
dom.inboxClose.addEventListener("click", () => setInboxOpen(false));
```

- [ ] **Step 6: Merge stale/unreviewed behavior into filter chips**

In `visibleActionInboxItems()`, call `filterActionInboxItems()` with:

```js
return filterActionInboxItems(inbox, {
  unreviewedOnly: false,
  filter: state.actionInboxFilter,
  showStale: true,
});
```

Remove event bindings and DOM updates for `reviewStaleToggle`, `reviewUnreviewedToggle`, and `reviewPanelToggle`.

- [ ] **Step 7: Update inbox badge and compact reviewed button**

In `renderReviewLane()`, after `counts` is computed, add:

```js
dom.inboxBadge.textContent = String(counts.needs_review || 0);
dom.inboxToggle.setAttribute(
  "aria-label",
  `${counts.needs_review || 0} items need review`,
);
```

Replace review toggle text handling with:

```js
toggle.className = "review-toggle";
toggle.textContent = item.reviewed ? "✓" : "";
toggle.setAttribute(
  "aria-label",
  item.reviewed ? `Mark ${item.title || "item"} unreviewed` : `Mark ${item.title || "item"} reviewed`,
);
toggle.setAttribute("aria-pressed", String(item.reviewed));
```

Keep the click handler `toggleReviewedThread(item.id)`.

- [ ] **Step 8: Run checks**

```bash
npm run test:js
npm run test:smoke -- --grep "renders nonblank scene and action inbox"
```

Expected: this smoke test passes until it reaches detail/inspector assertions, which are implemented in Task 3.

- [ ] **Step 9: Commit drawer work**

```bash
git add index.html style.css app.js smoke/codims-smoke.spec.mjs
git commit -m "Move action inbox into drawer overlay"
```

## Task 3: Floating Inspector And Remove Composer

**Files:**
- Modify: `index.html`
- Modify: `style.css`
- Modify: `app.js`
- Modify: `smoke/codims-smoke.spec.mjs`

- [ ] **Step 1: Update smoke test for inspector**

Replace old sidebar/detail assertions with:

```js
await page.locator(".review-item-main").filter({ hasText: "Review sidebar" }).click();
await expect(page.locator("#inspectorOverlay")).toBeVisible();
await expect(page.locator("#detailTitle")).toContainText("Review sidebar");
await expect(page.locator("#threadMessageForm")).toHaveCount(0);
await expect(page.locator("#threadMessageInput")).toHaveCount(0);
await expect(page.locator("#threadMessagePreview")).toHaveCount(0);
await expect(page.locator("#threadMessageSubmit")).toHaveCount(0);
await page.locator("#inspectorClose").click();
await expect(page.locator("#inspectorOverlay")).toBeHidden();
```

- [ ] **Step 2: Run smoke test and verify failure**

```bash
npm run test:smoke -- --grep "renders nonblank scene and action inbox"
```

Expected: FAIL because `#inspectorOverlay` and `#inspectorClose` do not exist.

- [ ] **Step 3: Add inspector markup without message composer**

In `index.html`, inside `.app-shell` after `#inboxDrawer`, add:

```html
<aside id="inspectorOverlay" class="inspector-overlay" aria-label="Thread details" hidden>
  <div class="inspector-header">
    <span class="inspector-kicker">Thread details</span>
    <button id="inspectorClose" class="overlay-close" type="button" aria-label="Close thread details">Close</button>
  </div>
  <div id="detailsContent" class="details-content">
    <div class="details-heading">
      <h2 id="detailNickname"></h2>
      <span id="detailState"></span>
    </div>
    <dl>
      <dt>Role</dt>
      <dd id="detailRole"></dd>
      <dt>Project</dt>
      <dd id="detailProject"></dd>
      <dt>Age</dt>
      <dd id="detailAge"></dd>
      <dt>Title / content</dt>
      <dd id="detailTitle" class="wrapped"></dd>
      <dt id="detailThreadContentLabel">Agent prompt + last response</dt>
      <dd id="detailThreadContent" class="wrapped thread-content"></dd>
      <dt>Parent thread</dt>
      <dd id="detailParent" class="wrapped"></dd>
      <dt>CWD</dt>
      <dd id="detailCwd" class="wrapped mono"></dd>
      <dt>Thread id</dt>
      <dd id="detailId" class="wrapped mono"></dd>
    </dl>
  </div>
</aside>
```

Do not include `#detailsEmpty`, `#threadMessageForm`, `#sendConfirmDialog`, or any send UI.

- [ ] **Step 4: Add inspector CSS**

Add:

```css
.inspector-overlay {
  right: 14px;
  bottom: 14px;
  width: min(520px, calc(100vw - 28px));
  max-height: min(720px, calc(100vh - 92px));
  overflow: auto;
  padding: 16px;
}

.inspector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.inspector-kicker {
  color: var(--muted);
  font-size: 11px;
  font-weight: 740;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
```

- [ ] **Step 5: Update DOM selectors and state**

In `app.js`, add:

```js
inspectorOverlay: document.querySelector("#inspectorOverlay"),
inspectorClose: document.querySelector("#inspectorClose"),
```

Remove selectors for:

```js
detailsEmpty
threadMessageForm
threadMessageInput
threadMessagePreview
threadMessageSubmit
threadMessageStatus
sendConfirmDialog
sendConfirmTarget
sendConfirmMessage
sendConfirmSubmit
```

Add function:

```js
function setInspectorOpen(nextOpen) {
  dom.inspectorOverlay.hidden = !nextOpen;
}
```

Add listener:

```js
dom.inspectorClose.addEventListener("click", () => setInspectorOpen(false));
```

- [ ] **Step 6: Remove message composer functions and calls**

Delete these functions entirely:

```js
canSendToThread
updateThreadSendControls
updateMessageComposer
onThreadMessageSubmit
showSendConfirmation
updateSendConfirmTarget
onSendConfirmClose
sendConfirmedThreadMessage
sendThreadMessage
```

Remove calls to `updateMessageComposer(...)`, `threadMessageInput.value`, and `threadMessageStatus.textContent`.

- [ ] **Step 7: Open inspector from render paths**

In `renderDetails(thread, parentGroup = null)`, replace the old details visibility lines with:

```js
setInspectorOpen(true);
```

In `renderDigestDetails(parentGroup)`, add:

```js
setInspectorOpen(true);
```

In `showRoomFocus(room)`, close the inspector:

```js
setInspectorOpen(false);
```

- [ ] **Step 8: Run checks**

```bash
npm run test:js
npm run test:smoke -- --grep "renders nonblank scene and action inbox"
```

Expected: PASS.

- [ ] **Step 9: Commit inspector work**

```bash
git add index.html style.css app.js smoke/codims-smoke.spec.mjs
git commit -m "Move thread details into floating inspector"
```

## Task 4: Settings Overlay And Automatic Defaults

**Files:**
- Modify: `index.html`
- Modify: `style.css`
- Modify: `app.js`
- Modify: `visual-model.mjs`
- Modify: `test_visual_model.mjs`
- Modify: `smoke/codims-smoke.spec.mjs`

- [ ] **Step 1: Add failing pure tests for automatic density**

In `test_visual_model.mjs`, add `autoDensityMode` to the import list and add:

```js
assert.equal(autoDensityMode([]), "normal");
assert.equal(autoDensityMode([{ threads: new Array(24).fill({}) }]), "normal");
assert.equal(autoDensityMode([{ threads: new Array(25).fill({}) }]), "compact");
assert.equal(
  autoDensityMode(new Array(7).fill(null).map(() => ({ threads: [{}] }))),
  "compact",
);
```

- [ ] **Step 2: Run JS tests and verify failure**

```bash
npm run test:js
```

Expected: FAIL because `autoDensityMode` is not exported.

- [ ] **Step 3: Add `autoDensityMode()`**

In `visual-model.mjs`, export:

```js
export function autoDensityMode(projectGroups) {
  const groups = Array.isArray(projectGroups) ? projectGroups : [];
  const visibleThreads = groups.reduce((total, group) => {
    return total + (Array.isArray(group.threads) ? group.threads.length : 0);
  }, 0);
  return visibleThreads > 24 || groups.length > 6 ? "compact" : "normal";
}
```

In `app.js`, import `autoDensityMode`.

- [ ] **Step 4: Add settings markup**

In `index.html`, inside `.app-shell` after `#inspectorOverlay`, add:

```html
<dialog id="settingsDialog" class="settings-dialog">
  <form id="settingsForm" method="dialog" class="settings-form">
    <div class="settings-header">
      <h2>Settings</h2>
      <button id="settingsClose" class="overlay-close" value="close" type="submit">Close</button>
    </div>
    <label>
      Max age
      <span class="settings-inline-control">
        <input id="maxAgeHours" name="maxAgeHours" type="number" min="0" step="1" value="8">
        <span>h</span>
      </span>
    </label>
    <button id="privacyToggle" class="settings-toggle" type="button" aria-pressed="false">Privacy</button>
    <button id="inactiveToggle" class="settings-toggle" type="button" aria-pressed="false">Show idle</button>
    <p id="densityStatus" class="settings-status">Density: Auto</p>
  </form>
</dialog>
```

- [ ] **Step 5: Add settings CSS**

Add:

```css
.settings-dialog {
  width: min(360px, calc(100vw - 28px));
  border: 1px solid rgba(172, 188, 209, 0.24);
  border-radius: 8px;
  background: #0b1120;
  color: var(--text);
  padding: 0;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.42);
}

.settings-dialog::backdrop {
  background: rgba(0, 0, 0, 0.48);
}

.settings-form {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.settings-header h2 {
  font-size: 15px;
}

.settings-form label {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.settings-inline-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.settings-form input {
  width: 82px;
  min-height: 34px;
  border: 1px solid rgba(172, 188, 209, 0.18);
  border-radius: 6px;
  background: rgba(4, 7, 14, 0.74);
  color: var(--text);
  padding: 7px 8px;
  font: inherit;
  font-weight: 650;
}

.settings-toggle {
  min-height: 34px;
  border: 1px solid rgba(172, 188, 209, 0.2);
  border-radius: 6px;
  background: rgba(8, 12, 22, 0.72);
  color: var(--text);
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  padding: 7px 10px;
}

.settings-toggle[aria-pressed="true"] {
  border-color: rgba(34, 211, 238, 0.62);
  background: rgba(34, 211, 238, 0.12);
}

.settings-status {
  color: var(--muted);
  font-size: 12px;
}
```

- [ ] **Step 6: Wire settings DOM and events**

In `app.js`, add selectors:

```js
settingsDialog: document.querySelector("#settingsDialog"),
settingsForm: document.querySelector("#settingsForm"),
densityStatus: document.querySelector("#densityStatus"),
maxAgeHours: document.querySelector("#maxAgeHours"),
privacyToggle: document.querySelector("#privacyToggle"),
inactiveToggle: document.querySelector("#inactiveToggle"),
```

Add listeners:

```js
dom.settingsToggle.addEventListener("click", () => dom.settingsDialog.showModal());
dom.settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  dom.settingsDialog.close();
});
dom.maxAgeHours.addEventListener("change", () => {
  savePreferences();
  refreshThreads();
});
dom.privacyToggle.addEventListener("click", () => setPrivacy(!state.privacy));
dom.inactiveToggle.addEventListener("click", () => setShowInactive(!state.showInactive));
```

Keep `setPrivacy()` and `setShowInactive()`, but they now update settings buttons instead of HUD buttons.

- [ ] **Step 7: Force labels/live defaults and automatic density**

Remove `setLabels()` and `setLive()` UI calls. During startup, set:

```js
state.labels = true;
state.live = true;
dom.labels.classList.toggle("is-hidden", false);
```

After project groups are computed in the refresh/render flow and before scene reconciliation, set:

```js
state.density = autoDensityMode(state.projectGroups);
dom.densityStatus.textContent = `Density: Auto (${state.density})`;
```

- [ ] **Step 8: Add settings smoke assertions**

Add a smoke test:

```js
test("settings overlay controls privacy and idle filters", async ({ page }) => {
  await page.goto(`${baseUrl}/index.html`);
  await page.locator("#settingsToggle").click();
  await expect(page.locator("#settingsDialog")).toBeVisible();
  await expect(page.locator("#maxAgeHours")).toHaveValue("8");
  await page.locator("#privacyToggle").click();
  await page.locator("#settingsClose").click();
  await page.locator("#inboxToggle").click();
  await expect(page.locator("#reviewList")).toContainText("Hidden");
});
```

- [ ] **Step 9: Run checks**

```bash
npm run test:js
npm run test:smoke
```

Expected: PASS.

- [ ] **Step 10: Commit settings work**

```bash
git add index.html style.css app.js visual-model.mjs test_visual_model.mjs smoke/codims-smoke.spec.mjs
git commit -m "Move filters into settings overlay"
```

## Task 5: Responsive Overlay Polish And Infinite Grid Pass

**Files:**
- Modify: `app.js`
- Modify: `style.css`
- Modify: `smoke/codims-smoke.spec.mjs`

- [ ] **Step 1: Update mobile smoke test**

Replace the old mobile test body with:

```js
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${baseUrl}/index.html`);
await expect(page.locator("#scene canvas")).toBeVisible();
await expect(page.locator(".app-shell")).toBeVisible();
await expect(page.locator(".details-panel")).toHaveCount(0);
await page.locator("#inboxToggle").click();
await expect(page.locator("#inboxDrawer")).toBeVisible();
const drawerBox = await page.locator("#inboxDrawer").boundingBox();
expect(drawerBox.width).toBeLessThanOrEqual(390);
await page.locator("#inboxClose").click();
await page.locator("#settingsToggle").click();
await expect(page.locator("#settingsDialog")).toBeVisible();
```

- [ ] **Step 2: Run smoke test and verify current responsive gaps**

```bash
npm run test:smoke -- --grep "mobile layout"
```

Expected: FAIL if drawer/settings width or old `.details-panel` expectation still exists.

- [ ] **Step 3: Add narrow-screen CSS**

Replace old `@media (max-width: 980px)` and `@media (max-width: 520px)` layout rules with:

```css
@media (max-width: 720px) {
  .hud-status {
    max-width: calc(100vw - 118px);
  }

  .hud-counters {
    right: 14px;
    width: auto;
    min-width: 0;
    grid-template-columns: repeat(3, minmax(62px, 1fr));
  }

  .counter {
    padding: 7px 6px;
  }

  .counter > span:not(.counter-label) {
    font-size: 18px;
  }

  .counter-label {
    font-size: 9px;
    letter-spacing: 0.04em;
  }

  .inbox-drawer,
  .inspector-overlay {
    left: 10px;
    right: 10px;
    width: auto;
    max-height: calc(100vh - 78px);
  }

  .inspector-overlay {
    top: auto;
    bottom: 10px;
  }
}
```

- [ ] **Step 4: Make grid feel larger**

In `app.js`, replace:

```js
const grid = new THREE.GridHelper(80, 80, focusStudio.gridCenter, focusStudio.gridLine);
```

with:

```js
const grid = new THREE.GridHelper(240, 240, focusStudio.gridCenter, focusStudio.gridLine);
```

Keep `grid.position.y = -0.03;`.

- [ ] **Step 5: Run all checks**

```bash
npm run test:js
python3 -m unittest -v
npm run test:smoke
```

Expected: PASS.

- [ ] **Step 6: Commit responsive/grid work**

```bash
git add app.js style.css smoke/codims-smoke.spec.mjs
git commit -m "Polish responsive overlays and scene grid"
```

## Task 6: Final Verification And Review Prep

**Files:**
- Modify only if verification finds failures.

- [ ] **Step 1: Run complete automated suite**

```bash
npm run test:js
python3 -m unittest -v
npm run test:smoke
```

Expected: PASS.

- [ ] **Step 2: Run manual local app**

```bash
python3 server.py --port 8765
```

Open `http://127.0.0.1:8765/` and verify:

- No permanent header.
- No permanent right panel.
- Scene fills viewport.
- Status appears top-left.
- Inbox and settings buttons appear top-right.
- Counters appear bottom-left.
- Inbox drawer opens, filters, and closes.
- Inspector opens from inbox row and closes.
- Settings opens and privacy hides inbox content.
- Narrow viewport keeps overlays within screen bounds.

- [ ] **Step 3: Final self-review**

Run:

```bash
git diff --stat main...HEAD
git diff main...HEAD -- index.html style.css app.js smoke/codims-smoke.spec.mjs visual-model.mjs test_visual_model.mjs
```

Check:

- No deleted behavior beyond the spec removals.
- No search UI.
- No message composer UI.
- No `.app-header`, `.app-layout`, `.details-panel`, or `#emptyState` references in runtime HTML/CSS/JS.
- No references to removed DOM selectors in `app.js`.

- [ ] **Step 4: Commit any verification fixes**

If Step 3 found and fixed issues:

```bash
git add index.html style.css app.js smoke/codims-smoke.spec.mjs visual-model.mjs test_visual_model.mjs
git commit -m "Verify minimalist UI shell"
```

If no fixes were needed, do not create an empty commit.
