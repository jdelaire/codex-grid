# Immersive 3D Scene Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After the minimalist UI shell lands, make the scene itself more immersive with in-world labels, a stronger infinite-grid illusion, richer procedural rooms/workers, and preserved crowded-scene readability.

**Architecture:** Keep the static Three.js frontend and existing server APIs. Add testable layout helpers in `visual-model.mjs` only where scene math changes; keep WebGL object construction, texture helpers, animation, and material updates in `app.js`; keep remaining HTML overlay styling in `style.css`.

**Tech Stack:** Static HTML/CSS, vanilla JavaScript modules, Three.js canvas textures, Node test scripts, Playwright smoke tests, Python unittest server tests.

---

## Source Documents

- Minimal shell design: `docs/superpowers/specs/2026-07-01-minimalist-ui-shell-design.md`
- Procedural studio design: `docs/superpowers/specs/2026-07-01-procedural-studio-upgrade-design.md`
- Current scene implementation: `app.js`
- Current pure visual model: `visual-model.mjs`
- Current labels/styles: `style.css`
- Current tests: `test_visual_model.mjs`, `smoke/codims-smoke.spec.mjs`

## Preconditions

- The minimalist UI shell implementation is merged or this work starts from its branch.
- The first viewport already uses the full-canvas scene with HUD and overlays.
- Do not reintroduce a permanent header, toolbar, or side panel.

## File Structure

- Modify `app.js`: add procedural text/nameplate helpers, richer room/worker construction, infinite-grid update, and scene-state material updates.
- Modify `visual-model.mjs`: add or refine pure helpers for label visibility, crowded scale falloff, and deterministic layout values.
- Modify `test_visual_model.mjs`: test any helper added or changed.
- Modify `style.css`: reduce DOM label dominance if DOM labels remain as fallback.
- Modify `smoke/codims-smoke.spec.mjs`: add visual smoke assertions for scene nonblank, in-world labels where inspectable, and mobile non-overlap.

## Task 1: Baseline And Guardrails

**Files:**
- Modify: `smoke/codims-smoke.spec.mjs`

- [ ] **Step 1: Add a smoke guard that shell UI remains minimal**

Add or preserve this smoke assertion in the main render test:

```js
await expect(page.locator(".app-header")).toHaveCount(0);
await expect(page.locator(".details-panel")).toHaveCount(0);
await expect(page.locator("#scene canvas")).toBeVisible();
await expect(page.locator("#inboxToggle")).toBeVisible();
await expect(page.locator("#settingsToggle")).toBeVisible();
```

- [ ] **Step 2: Run baseline tests**

```bash
npm run test:js
python3 -m unittest -v
npm run test:smoke
```

Expected: PASS before any scene revamp work. If baseline fails, stop and fix or report before continuing.

- [ ] **Step 3: Commit smoke guard only if changed**

```bash
git add smoke/codims-smoke.spec.mjs
git commit -m "Guard minimalist shell during scene revamp"
```

If no change was needed, do not commit.

## Task 2: Infinite Grid That Tracks Camera Focus

**Files:**
- Modify: `app.js`
- Modify: `smoke/codims-smoke.spec.mjs`

- [ ] **Step 1: Add failing smoke check for larger canvas detail**

In `smoke/codims-smoke.spec.mjs`, keep `hasNonBlankScreenshot()` and add an assertion after scene load:

```js
const sceneCanvas = page.locator("#scene canvas");
const nonBlank = await hasNonBlankScreenshot(page, sceneCanvas);
expect(nonBlank).toBe(true);
```

This already exists in older smoke tests; keep it as the guard for grid/scene rendering.

- [ ] **Step 2: Add infinite grid constants in `app.js`**

Near the grid creation, add:

```js
const GRID_CELL_SIZE = 1;
const GRID_WORLD_SIZE = 260;
```

Replace any fixed `GridHelper(80, 80, ...)` with:

```js
const grid = new THREE.GridHelper(
  GRID_WORLD_SIZE,
  GRID_WORLD_SIZE / GRID_CELL_SIZE,
  focusStudio.gridCenter,
  focusStudio.gridLine,
);
grid.position.y = -0.03;
scene.add(grid);
```

- [ ] **Step 3: Add grid recentering helper**

Add:

```js
function updateInfiniteGrid() {
  grid.position.x = Math.round(controls.target.x / GRID_CELL_SIZE) * GRID_CELL_SIZE;
  grid.position.z = Math.round(controls.target.z / GRID_CELL_SIZE) * GRID_CELL_SIZE;
}
```

In `animate()`, call it before `renderer.render(scene, camera);`:

```js
updateInfiniteGrid();
```

- [ ] **Step 4: Run checks**

```bash
npm run test:js
npm run test:smoke -- --grep "renders"
```

Expected: PASS and scene remains nonblank.

- [ ] **Step 5: Commit**

```bash
git add app.js smoke/codims-smoke.spec.mjs
git commit -m "Make scene grid feel infinite"
```

## Task 3: Canvas Textures For In-World Nameplates

**Files:**
- Modify: `app.js`
- Modify: `style.css`

- [ ] **Step 1: Add texture helper near existing canvas texture helpers**

In `app.js`, near `drawRoundedRect()` and project display texture helpers, add:

```js
function fitLabelFont(ctx, text, maxWidth, startSize = 54, minSize = 24) {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `800 ${size}px Inter, Arial, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) {
      break;
    }
    size -= 2;
  }
  return size;
}

function createNameplateTexture(text, options = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = options.width || 768;
  canvas.height = options.height || 192;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  updateNameplateTexture(texture, text, options);
  return texture;
}

function updateNameplateTexture(texture, text, options = {}) {
  const canvas = texture.image;
  const ctx = canvas.getContext("2d");
  const accent = options.accent || "#22d3ee";
  const label = text || "";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(5, 10, 20, 0.92)";
  drawRoundedRect(ctx, 14, 18, canvas.width - 28, canvas.height - 36, 28);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = accent;
  ctx.stroke();
  ctx.fillStyle = "#edf3fb";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fontSize = fitLabelFont(ctx, label, canvas.width - 96, options.startSize || 54, 24);
  ctx.font = `800 ${fontSize}px Inter, Arial, sans-serif`;
  ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 2);
  texture.needsUpdate = true;
}
```

- [ ] **Step 2: Add billboard nameplate helper**

Add:

```js
function createNameplate(text, options = {}) {
  const texture = createNameplateTexture(text, options);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  const width = options.worldWidth || 2.2;
  const height = options.worldHeight || 0.55;
  sprite.scale.set(width, height, 1);
  sprite.renderOrder = options.renderOrder || 9;
  sprite.userData.nameplateTexture = texture;
  return sprite;
}

function updateNameplate(sprite, text, options = {}) {
  const texture = sprite?.userData?.nameplateTexture;
  if (!texture) {
    return;
  }
  updateNameplateTexture(texture, text, options);
}
```

- [ ] **Step 3: Reduce fallback DOM label dominance**

In `style.css`, reduce non-active label opacity:

```css
.agent-label,
.digest-label,
.parent-label {
  opacity: 0.72;
}

.agent-label.is-active,
.parent-label.is-active,
.agent-label.is-selected,
.digest-label.is-selected,
.parent-label.is-selected {
  opacity: 1;
}
```

- [ ] **Step 4: Run syntax check**

```bash
node --check app.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app.js style.css
git commit -m "Add reusable scene nameplate textures"
```

## Task 4: Move Parent And Digest Labels Into 3D Nameplates

**Files:**
- Modify: `app.js`
- Modify: `style.css`
- Modify: `smoke/codims-smoke.spec.mjs`

- [ ] **Step 1: Attach parent nameplates**

In the parent agent creation function, after the parent group object is created, add a nameplate:

```js
const nameplate = createNameplate(visibleActivityLabel(privacyLabel(thread.nickname || thread.title || "thread", state.privacy), thread.state === "ACTIVE"), {
  accent: cssHexColor(parentColor(thread)),
  worldWidth: 2.8,
  worldHeight: 0.64,
  renderOrder: 12,
});
nameplate.position.set(0, 2.35, 0);
group.add(nameplate);
```

Store it in `group.userData.parts.nameplate`.

- [ ] **Step 2: Update parent nameplates during reconciliation**

Where parent labels currently update text in `updatePrivacySensitiveUi()` or parent reconciliation, add:

```js
const nameplate = parentObject.userData.parts.nameplate;
updateNameplate(
  nameplate,
  visibleActivityLabel(privacyLabel(parentGroup.title, state.privacy), parentGroup.isActive),
  { accent: cssHexColor(parentGroupColor(parentGroup)) },
);
```

- [ ] **Step 3: Attach digest nameplates**

When digest objects are created, add:

```js
const nameplate = createNameplate(`DONE ${parentGroup.finishedCount || 0}`, {
  accent: "#f59e0b",
  worldWidth: 1.9,
  worldHeight: 0.48,
  renderOrder: 12,
});
nameplate.position.set(0, 1.35, 0);
group.add(nameplate);
```

Store it in `group.userData.parts.nameplate`.

- [ ] **Step 4: Hide DOM parent/digest labels only after 3D labels exist**

Keep DOM labels for child agents in this task. For parent and digest labels, add a CSS class during creation:

```js
label.classList.add("is-scene-label-fallback");
```

Then hide parent/digest DOM fallback labels after nameplates are working:

```css
.parent-label.is-scene-label-fallback,
.digest-label.is-scene-label-fallback {
  display: none;
}
```

- [ ] **Step 5: Run checks**

```bash
npm run test:js
npm run test:smoke
```

Expected: PASS and scene nonblank.

- [ ] **Step 6: Commit**

```bash
git add app.js style.css smoke/codims-smoke.spec.mjs
git commit -m "Move parent and digest labels into the scene"
```

## Task 5: Richer Procedural Studio Bays

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add small geometry helper**

Near `createRoom()`, add:

```js
function createBoxPart(width, height, depth, material, position) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.copy(position);
  return mesh;
}
```

- [ ] **Step 2: Add layered floor trim to `createRoom(project)`**

Inside `createRoom(project)`, after `insetFloor` is created, add:

```js
const trimMaterial = new THREE.MeshBasicMaterial({
  color: projectAccent,
  transparent: true,
  opacity: 0.18,
});
const frontTrim = createBoxPart(1, 0.04, 0.05, trimMaterial, new THREE.Vector3(0, 0.19, 0));
const rearTrim = createBoxPart(1, 0.04, 0.05, trimMaterial, new THREE.Vector3(0, 0.19, 0));
const leftTrim = createBoxPart(0.05, 0.04, 1, trimMaterial, new THREE.Vector3(0, 0.19, 0));
const rightTrim = createBoxPart(0.05, 0.04, 1, trimMaterial, new THREE.Vector3(0, 0.19, 0));
group.add(frontTrim, rearTrim, leftTrim, rightTrim);
```

Add these to `group.userData.parts`.

- [ ] **Step 3: Size trim in `updateRoomSize(room, layout)`**

After `frontRail` positioning, add:

```js
parts.frontTrim.scale.set(width - 0.5, 1, 1);
parts.frontTrim.position.set(0, 0.19, depth / 2 - 0.32);
parts.rearTrim.scale.set(width - 0.5, 1, 1);
parts.rearTrim.position.set(0, 0.19, -depth / 2 + 0.32);
parts.leftTrim.scale.set(1, 1, depth - 0.64);
parts.leftTrim.position.set(-width / 2 + 0.32, 0.19, 0);
parts.rightTrim.scale.set(1, 1, depth - 0.64);
parts.rightTrim.position.set(width / 2 - 0.32, 0.19, 0);
```

- [ ] **Step 4: Add wall light strips**

Inside `createRoom(project)`, after wall panels, add:

```js
const wallStripMaterial = new THREE.MeshBasicMaterial({
  color: projectAccent,
  transparent: true,
  opacity: 0.16,
});
const wallStrip = new THREE.Mesh(new THREE.BoxGeometry(1, 0.035, 0.035), wallStripMaterial);
group.add(wallStrip);
```

Store `wallStrip` in `parts`. In `updateRoomSize()`, position it:

```js
parts.wallStrip.scale.set(width * 0.72, 1, 1);
parts.wallStrip.position.set(0, 1.95, -depth / 2 + 0.16);
```

- [ ] **Step 5: Run checks**

```bash
node --check app.js
npm run test:smoke -- --grep "renders"
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app.js
git commit -m "Enrich procedural studio room bays"
```

## Task 6: More Recognizable Parent And Child Workers

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add parent worker silhouette parts**

In the parent worker creation function, add shoulders and a halo/status ring using existing material colors:

```js
const shoulderMaterial = new THREE.MeshStandardMaterial({
  color: parentColor(thread),
  roughness: 0.54,
  metalness: 0.12,
  emissive: parentColor(thread),
  emissiveIntensity: 0.025,
});
const shoulders = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.22, 0.42), shoulderMaterial);
shoulders.position.set(0, 0.92, 0);
group.add(shoulders);

const halo = new THREE.Mesh(
  new THREE.TorusGeometry(0.58, 0.025, 8, 36),
  new THREE.MeshBasicMaterial({ color: focusStudio.active, transparent: true, opacity: 0.34 }),
);
halo.position.set(0, 1.55, 0);
halo.rotation.x = Math.PI / 2;
group.add(halo);
```

Store `shoulders` and `halo` in `parts`.

- [ ] **Step 2: Add child worker status marker**

In the child worker creation function, add:

```js
const marker = new THREE.Mesh(
  new THREE.SphereGeometry(0.075, 12, 8),
  new THREE.MeshBasicMaterial({ color: focusStudio.active, transparent: true, opacity: 0.8 }),
);
marker.position.set(0, 1.02, 0);
group.add(marker);
```

Store `marker` in `parts`.

- [ ] **Step 3: Update animation for new parts**

In `animateAgents(elapsed)`, when an object is active, make parent halo rotate:

```js
if (parts.halo) {
  parts.halo.rotation.z = elapsed * 0.8;
  parts.halo.visible = thread.state === "ACTIVE";
}
if (parts.marker) {
  parts.marker.visible = thread.state === "ACTIVE";
}
```

Use existing selected/active state checks and do not add new data state.

- [ ] **Step 4: Run checks**

```bash
node --check app.js
npm run test:smoke -- --grep "renders"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "Improve procedural worker silhouettes"
```

## Task 7: Crowded Layout Scale Falloff

**Files:**
- Modify: `visual-model.mjs`
- Modify: `test_visual_model.mjs`
- Modify: `app.js`

- [ ] **Step 1: Add tests for smooth outer-ring falloff**

In `test_visual_model.mjs`, add assertions around `childVisualLayout()` using a 96-child scenario:

```js
const crowdedFirst = childVisualLayout(0, 96);
const crowdedMiddle = childVisualLayout(48, 96);
const crowdedLast = childVisualLayout(95, 96);
assert.equal(crowdedFirst.scale >= crowdedMiddle.scale, true);
assert.equal(crowdedMiddle.scale >= crowdedLast.scale, true);
assert.equal(crowdedLast.scale >= 0.42, true);
```

- [ ] **Step 2: Run tests and verify current behavior**

```bash
node test_visual_model.mjs
```

Expected: PASS if current layout already satisfies this, or FAIL if scale falloff needs refinement.

- [ ] **Step 3: Refine `childVisualLayout()` only if test fails**

If the test fails, adjust `childVisualLayout()` in `visual-model.mjs` so larger ring indexes reduce scale smoothly:

```js
const ringScale = Math.max(0.42, 1 - ring * 0.07);
```

Use existing variable names in the function; do not rewrite layout wholesale.

- [ ] **Step 4: Confirm `app.js` uses returned scale**

Verify child reconciliation applies:

```js
agent.scale.setScalar(layout.scale * densityScale(state.density));
```

If equivalent code already exists, leave it unchanged.

- [ ] **Step 5: Run checks**

```bash
npm run test:js
```

Expected: PASS.

- [ ] **Step 6: Commit if changed**

```bash
git add visual-model.mjs test_visual_model.mjs app.js
git commit -m "Refine crowded worker scale falloff"
```

If only tests were added and they pass with existing code, commit just the test:

```bash
git add test_visual_model.mjs
git commit -m "Cover crowded worker scale falloff"
```

## Task 8: Final Visual Verification

**Files:**
- Modify only if verification finds issues.

- [ ] **Step 1: Run full checks**

```bash
npm run test:js
python3 -m unittest -v
npm run test:smoke
```

Expected: PASS.

- [ ] **Step 2: Run local app**

```bash
python3 server.py --port 8765
```

Open `http://127.0.0.1:8765/` and verify:

- Scene still fills the first viewport.
- HUD and overlays from the minimalist shell still work.
- Grid appears larger and continuous while orbiting/focusing.
- Project rooms still frame workers.
- Parent and digest labels are readable in the 3D scene.
- Child labels remain readable enough when active/selected.
- Active handoff arcs still render.
- Parent and child workers are more recognizable than plain cylinder/sphere forms.
- A crowded room remains organized.

- [ ] **Step 3: Self-review diff**

```bash
git diff --stat main...HEAD
git diff main...HEAD -- app.js visual-model.mjs style.css test_visual_model.mjs smoke/codims-smoke.spec.mjs
```

Check:

- No framework or build tool added.
- No server API changed.
- No permanent header/sidebar restored.
- No child agents hidden or collapsed.
- No unbounded animation or per-frame texture recreation.
- Textures/materials created during reconciliation are disposed through existing disposal paths.

- [ ] **Step 4: Commit verification fixes if needed**

```bash
git add app.js visual-model.mjs style.css test_visual_model.mjs smoke/codims-smoke.spec.mjs
git commit -m "Verify immersive scene revamp"
```

If no fixes were needed, do not create an empty commit.
