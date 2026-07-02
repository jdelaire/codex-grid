# Balanced Cinematic Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the existing Tron-inspired 3D scene with balanced cinematic data lanes, stronger Grid program agents, and active room circuit pulses while preserving dense-scene readability.
**Architecture:** Keep all renderer and procedural geometry work in `app.js`; add rendered invariant checks in `smoke/codims-smoke.spec.mjs`; avoid new build steps, dependencies, assets, or data contracts.
**Tech Stack:** Vanilla JavaScript, Three.js primitives, existing DOM labels/CSS, Playwright smoke tests, current Node and Python test scripts.

---

## Source Spec

Approved spec: `docs/superpowers/specs/2026-07-02-balanced-cinematic-grid-design.md`

Approved direction:

- Add clearer active parent-to-agent data lanes.
- Improve agent and parent silhouettes with helmets, visors, shoulders, identity discs, and aura rings.
- Add subtle active room circuit pulses.
- Keep labels readable by putting most new energy in 3D geometry.
- Stay inside the existing Tron palette enforced by `test_tron_palette.mjs`.

## Pre-Flight

- [ ] Run `git status --short --branch`.
  - Verify current branch is `main`.
  - Existing dirty files may include `app.js`, `smoke/codims-smoke.spec.mjs`, and `style.css`.
  - Do not revert user changes.
  - If those files are still dirty, review current diffs before editing:
    ```bash
    git diff -- app.js smoke/codims-smoke.spec.mjs style.css
    ```
- [ ] Confirm no new dependency is needed.
  - Expected: no `package.json` or lockfile change.
- [ ] Keep implementation commits scoped.
  - If dirty pre-existing hunks remain in touched files, stage only owned hunks.
  - If owned hunks cannot be isolated safely, leave code unstaged and report that commit was skipped to protect user work.

## File Structure

Planned code edits:

```text
app.js
  createHandoff()
  updateHandoffGeometry()
  sceneDebugSnapshot()
  createParentAgent()
  createAgent()
  updateParentVisualState()
  updateAgentVisualState()
  createRoom()
  updateRoomVisualState()
  animateAgents()

smoke/codims-smoke.spec.mjs
  "renders nonblank scene and action inbox"
  "reduced motion keeps scene animation static"
```

No planned edits:

```text
visual-model.mjs
style.css
package.json
```

Only touch `style.css` if rendered QA shows label contrast or overlap regressed due to the new 3D geometry.

---

## Task 1: Add Rendered Invariant Tests

### Intent

Lock the desired visual primitives before changing the scene. These checks should fail before implementation and pass after `app.js` exposes the new debug counters.

### Steps

- [ ] Open `smoke/codims-smoke.spec.mjs`.
- [ ] In `renders nonblank scene and action inbox`, after existing `programDetailParts` and `glowShells` assertions, add:
  ```js
  expect(sceneDebug.activeDataLanes).toBeGreaterThanOrEqual(1);
  expect(sceneDebug.animatedDataLanes).toBeGreaterThanOrEqual(1);
  expect(sceneDebug.programAuraRings).toBeGreaterThanOrEqual(2);
  expect(sceneDebug.roomCircuitPulseSurfaces).toBeGreaterThanOrEqual(1);
  ```
- [ ] In `reduced motion keeps scene animation static`, after `#activeCount` assertion and before screenshot waits, add:
  ```js
  const sceneDebug = await page.evaluate(() => window.__codimsSceneDebug?.());
  expect(sceneDebug.reducedMotionActive).toBe(true);
  expect(sceneDebug.activeDataLanes).toBeGreaterThanOrEqual(1);
  expect(sceneDebug.animatedDataLanes).toBe(0);
  ```
- [ ] Run targeted smoke tests:
  ```bash
  npm run test:smoke -- --grep "renders nonblank scene|reduced motion keeps scene animation static"
  ```
- [ ] Expected red result before implementation:
  ```text
  Expected: >= 1
  Received: undefined
  ```
- [ ] Commit if hunks are isolated from pre-existing user changes:
  ```bash
  git add smoke/codims-smoke.spec.mjs
  git commit -m "Test Balanced Cinematic Grid invariants"
  ```

### Verification

- [ ] Test fails only because new debug counters are missing or zero.
- [ ] No CSS or application logic changed in this task.

---

## Task 2: Upgrade Active Parent-To-Agent Data Lanes

### Intent

Use the existing handoff path instead of building a separate lane system. Active work should read as a directional cyan/amber data lane, not a faint line.

### Steps

- [ ] Open `app.js`.
- [ ] Add a small marker helper near `markProgramDetails()`:
  ```js
  function markDataLanePart(object) {
    object.userData.dataLanePart = true;
    return object;
  }
  ```
- [ ] In `createHandoff()`, add a wider additive beam and a packet halo. Keep existing `line`, `beam`, and `packet`.
  ```js
  const wideBeamMaterial = new THREE.MeshBasicMaterial({
    color: gridStudio.cyan,
    transparent: true,
    opacity: 0.1,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const wideBeam = markDataLanePart(new THREE.Mesh(curveTubeGeometry(curve, 0.06), wideBeamMaterial));
  wideBeam.renderOrder = 9;

  const packetHaloMaterial = new THREE.MeshBasicMaterial({
    color: gridStudio.cyan,
    transparent: true,
    opacity: 0.24,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const packetHalo = markDataLanePart(new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), packetHaloMaterial));
  packetHalo.renderOrder = 10;
  ```
- [ ] Add new parts to the group before `packet` so packet remains the crisp leading point:
  ```js
  group.add(line, wideBeam, beam, packetHalo, packet);
  ```
- [ ] Extend `group.userData.parts` with:
  ```js
  wideBeam,
  packetHalo,
  wideBeamMaterial,
  packetHaloMaterial,
  ```
- [ ] Mark existing handoff primitives as lane parts after they are created:
  ```js
  markDataLanePart(line);
  markDataLanePart(beam);
  markDataLanePart(packet);
  ```
- [ ] In `updateHandoffGeometry()`, dispose and replace `wideBeam.geometry` with the current curve:
  ```js
  parts.wideBeam.geometry.dispose();
  parts.wideBeam.geometry = curveTubeGeometry(curve, active ? 0.075 : 0.02);
  ```
- [ ] In `updateHandoffGeometry()`, update active visibility and debug state for all lane objects:
  ```js
  const laneParts = [parts.line, parts.beam, parts.wideBeam, parts.packet, parts.packetHalo];
  for (const part of laneParts) {
    part.userData.activeDataLane = active;
    part.userData.animatedDataLane = active;
  }
  ```
- [ ] In `updateHandoffGeometry()`, set wider visual state:
  ```js
  parts.wideBeamMaterial.color.setHex(color);
  parts.wideBeamMaterial.opacity = active ? 0.12 : 0.015;
  parts.packetHaloMaterial.color.setHex(color);
  parts.packetHaloMaterial.opacity = active ? 0.28 : 0;
  parts.packetHalo.visible = active;
  parts.wideBeam.visible = active;
  ```
- [ ] In `animateAgents()`, inside the active handoff loop after packet position is updated, move the halo with the packet:
  ```js
  parts.packetHalo.visible = true;
  parts.packetHalo.position.copy(parts.packet.position);
  parts.packetHalo.scale.setScalar(0.75 + Math.sin(phase * Math.PI) * 0.7);
  parts.wideBeamMaterial.opacity = 0.1 + Math.sin(elapsed * 2.2 + phase * Math.PI) * 0.025;
  ```
- [ ] In the reduced-motion branch for active handoffs, keep lane visible but freeze moving parts:
  ```js
  parts.packet.visible = false;
  parts.packetHalo.visible = false;
  parts.wideBeamMaterial.opacity = 0.1;
  ```
- [ ] Run fast syntax and rendered test:
  ```bash
  npm run test:js
  npm run test:smoke -- --grep "renders nonblank scene|reduced motion keeps scene animation static"
  ```
- [ ] Commit if hunks are isolated:
  ```bash
  git add app.js smoke/codims-smoke.spec.mjs
  git commit -m "Add active Grid data lanes"
  ```

### Verification

- [ ] At least one active handoff lane is visible in default scene.
- [ ] Reduced motion keeps `animatedDataLanes` at `0`.
- [ ] No room-to-room lane is added in this task; parent-to-agent handoff lanes satisfy the approved minimum.

---

## Task 3: Add Program Identity Aura And Helmet Detail

### Intent

Make agents read as Grid programs with stronger silhouettes while keeping primitive count modest.

### Steps

- [ ] Open `app.js`.
- [ ] Add aura helper near `createProgramGlowShell()`:
  ```js
  function createProgramAuraRing(radius, color, opacity) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.018, 8, 72),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.userData.programAuraRing = true;
    ring.userData.programDetailPart = true;
    return ring;
  }
  ```
- [ ] In `createParentAgent(parentGroup)`, add helmet and chest parts after `head` and `shoulder`:
  ```js
  const helmetBrow = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.08, 0.11), bodyMaterial);
  helmetBrow.position.set(0, 1.76, 0.18);
  helmetBrow.castShadow = true;
  group.add(helmetBrow);

  const visorGlow = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.035, 0.04), visorMaterial);
  visorGlow.position.set(0, 1.62, 0.315);
  group.add(visorGlow);

  const chestYoke = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.07), glowMaterial);
  chestYoke.position.set(0, 1.03, 0.39);
  group.add(chestYoke);
  ```
- [ ] In `createParentAgent(parentGroup)`, add an outer aura ring:
  ```js
  const auraRing = createProgramAuraRing(0.76, parentGroup.isActive ? gridStudio.active : color, parentGroup.isActive ? 0.18 : 0.06);
  auraRing.position.y = 0.07;
  group.add(auraRing);
  ```
- [ ] Add parent details to `markProgramDetails()`:
  ```js
  markProgramDetails(helmetBrow, visorGlow, chestYoke, auraRing);
  ```
- [ ] Add parent parts:
  ```js
  helmetBrow,
  visorGlow,
  chestYoke,
  auraRing,
  ```
- [ ] In `createAgent(thread)`, add smaller helmet and chest parts after `head` and `shoulder`:
  ```js
  const helmetBrow = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.055, 0.08), bodyMaterial);
  helmetBrow.position.set(0, 1.29, 0.14);
  helmetBrow.castShadow = true;
  group.add(helmetBrow);

  const visorEdge = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.028, 0.035), statusLightMaterial);
  visorEdge.position.set(0, 1.18, 0.225);
  group.add(visorEdge);

  const chestStripe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.05), glowMaterial);
  chestStripe.position.set(0, 0.78, 0.285);
  group.add(chestStripe);
  ```
- [ ] In `createAgent(thread)`, add child aura:
  ```js
  const auraRing = createProgramAuraRing(0.5, glow.color, thread.state === "ACTIVE" ? 0.16 : 0.05);
  auraRing.position.y = 0.065;
  group.add(auraRing);
  ```
- [ ] Add child details to `markProgramDetails()`:
  ```js
  markProgramDetails(helmetBrow, visorEdge, chestStripe, auraRing);
  ```
- [ ] Add child parts:
  ```js
  helmetBrow,
  visorEdge,
  chestStripe,
  auraRing,
  ```
- [ ] In `updateParentVisualState()`, set aura opacity and selected scale:
  ```js
  parts.auraRing.material.opacity = selected ? 0.24 : parentGroup?.isActive ? 0.18 : 0.06;
  parts.auraRing.scale.setScalar(selected ? 1.12 : 1);
  ```
- [ ] In `updateAgentVisualState()`, set aura opacity and selected scale:
  ```js
  const glow = agentGlowForState(agent.userData.thread);
  parts.auraRing.material.color.setHex(glow.color);
  parts.auraRing.material.opacity = selected ? 0.24 : agent.userData.thread?.state === "ACTIVE" ? 0.16 : 0.05;
  parts.auraRing.scale.setScalar(selected ? 1.12 : 1);
  ```
- [ ] In `animateAgents()`, update parent reduced-motion reset:
  ```js
  parts.auraRing.scale.setScalar(selected ? 1.12 : 1);
  ```
- [ ] In `animateAgents()`, update parent active animation:
  ```js
  parts.auraRing.scale.setScalar(selected ? Math.max(1.12, discScale) : discScale);
  ```
- [ ] In `animateAgents()`, update child reduced-motion reset:
  ```js
  parts.auraRing.scale.setScalar(selected ? 1.12 : 1);
  ```
- [ ] In `animateAgents()`, update child active/done/idle branches wherever `parts.ring.scale` is set:
  ```js
  parts.auraRing.scale.setScalar(selected ? Math.max(1.12, ringScale) : ringScale);
  ```
  For branches without `ringScale`, use:
  ```js
  parts.auraRing.scale.setScalar(selected ? 1.12 : 1);
  ```
- [ ] Run:
  ```bash
  npm run test:js
  npm run test:smoke -- --grep "renders nonblank scene|reduced motion keeps scene animation static"
  ```
- [ ] Commit if hunks are isolated:
  ```bash
  git add app.js
  git commit -m "Refine Grid program agent silhouettes"
  ```

### Verification

- [ ] `programAuraRings >= 2` in the default scene.
- [ ] Parent remains taller and more visually dominant than children.
- [ ] Done/review agents stay quieter than active agents.

---

## Task 4: Add Room Circuit Pulse

### Intent

Active rooms should feel energized through floor and rail circuits, without making labels brighter.

### Steps

- [ ] Open `app.js`.
- [ ] Add marker helper near the other marker helpers:
  ```js
  function markRoomCircuitPulseSurface(object) {
    object.userData.roomCircuitPulseSurface = true;
    return object;
  }
  ```
- [ ] In `createRoom(project)`, mark the existing circuit and rail primitives after creation:
  ```js
  markRoomCircuitPulseSurface(floorCircuits);
  markRoomCircuitPulseSurface(backLightRail);
  markRoomCircuitPulseSurface(sideLightRail);
  markRoomCircuitPulseSurface(linkRail);
  ```
- [ ] Store baseline room pulse state before `updateRoomSize()`:
  ```js
  group.userData.roomPulsePhase = (hashString(project) % 100) / 100;
  group.userData.roomPulseStrength = 0;
  ```
- [ ] In `updateRoomVisualState(room, project)`, compute active and selected strength:
  ```js
  const activeStrength = room.userData.hasActiveThreads ? 1 : 0;
  room.userData.roomPulseStrength = selected ? 1 : activeStrength;
  ```
- [ ] In `updateRoomVisualState(room, project)`, adjust static opacities:
  ```js
  const circuitOpacity = selected ? 0.62 : room.userData.hasActiveThreads ? 0.5 : 0.32;
  for (const circuit of parts.floorCircuits.children) {
    circuit.material.opacity = circuitOpacity;
  }
  parts.backLightRail.material.opacity = selected ? 0.48 : room.userData.hasActiveThreads ? 0.36 : 0.22;
  parts.sideLightRail.material.opacity = selected ? 0.38 : room.userData.hasActiveThreads ? 0.28 : 0.16;
  parts.linkRail.material.opacity = selected ? 0.42 : room.userData.hasActiveThreads ? 0.32 : 0.2;
  ```
- [ ] In `animateAgents(elapsed)`, add a room pulse loop after digest animation:
  ```js
  for (const room of state.rooms.values()) {
    const parts = room.userData.parts;
    const strength = room.userData.roomPulseStrength || 0;
    if (!strength || state.reducedMotion) {
      continue;
    }
    const pulse = 0.5 + Math.sin(elapsed * 1.6 + room.userData.roomPulsePhase * Math.PI * 2) * 0.5;
    const circuitOpacity = 0.42 + pulse * 0.16 * strength;
    for (const circuit of parts.floorCircuits.children) {
      circuit.material.opacity = circuitOpacity;
    }
    parts.backLightRail.material.opacity = 0.3 + pulse * 0.12 * strength;
    parts.sideLightRail.material.opacity = 0.22 + pulse * 0.08 * strength;
    parts.linkRail.material.opacity = 0.26 + pulse * 0.1 * strength;
  }
  ```
- [ ] Confirm no DOM label classes or label glow CSS changed.
- [ ] Run:
  ```bash
  npm run test:js
  npm run test:smoke -- --grep "renders nonblank scene|reduced motion keeps scene animation static"
  ```
- [ ] Commit if hunks are isolated:
  ```bash
  git add app.js
  git commit -m "Pulse active Grid room circuits"
  ```

### Verification

- [ ] Active room floor circuits and rails pulse subtly.
- [ ] Idle rooms keep low ambient glow.
- [ ] Reduced motion keeps screenshot delta under existing threshold.
- [ ] Labels remain unchanged unless QA proves contrast issue.

---

## Task 5: Expose Debug Counters

### Intent

Make smoke tests verify scene-level invariants without pixel-perfect assertions.

### Steps

- [ ] Open `app.js`.
- [ ] Extend `sceneDebugSnapshot()` initial snapshot:
  ```js
  const snapshot = {
    capsuleAgents: 0,
    glowShells: 0,
    pointLights: 0,
    programDetailParts: 0,
    activeDataLanes: 0,
    animatedDataLanes: 0,
    programAuraRings: 0,
    roomCircuitPulseSurfaces: 0,
  };
  ```
- [ ] Add traversal counters:
  ```js
  if (object.userData.activeDataLane && object.visible !== false) {
    snapshot.activeDataLanes += 1;
  }
  if (object.userData.animatedDataLane && object.visible !== false && !state.reducedMotion) {
    snapshot.animatedDataLanes += 1;
  }
  if (object.userData.programAuraRing) {
    snapshot.programAuraRings += 1;
  }
  if (object.userData.roomCircuitPulseSurface) {
    snapshot.roomCircuitPulseSurfaces += 1;
  }
  ```
- [ ] Add reduced-motion flag to returned object:
  ```js
  reducedMotionActive: state.reducedMotion,
  ```
- [ ] Run:
  ```bash
  npm run test:js
  npm run test:smoke -- --grep "renders nonblank scene|reduced motion keeps scene animation static"
  ```
- [ ] Commit if hunks are isolated:
  ```bash
  git add app.js smoke/codims-smoke.spec.mjs
  git commit -m "Expose Balanced Cinematic scene debug counters"
  ```

### Verification

- [ ] Default scene reports nonzero active lanes, animated lanes, aura rings, and room pulse surfaces.
- [ ] Reduced-motion scene reports `reducedMotionActive: true` and `animatedDataLanes: 0`.

---

## Task 6: Full Verification And Rendered QA

### Intent

Prove the visual pass did not break current workflows, tests, or palette constraints.

### Steps

- [ ] Run all required automated checks:
  ```bash
  npm run test:js
  npm run test:smoke
  python3 -m unittest -v
  git diff --check
  ```
- [ ] Start the app if no dev server is running:
  ```bash
  ./launch.sh 0.0.0.0
  ```
  If `launch.sh` uses flags instead of positional host, inspect it and use the existing supported host argument.
- [ ] Open the app URL shown by `launch.sh`.
- [ ] Check desktop default scene.
  - Active flow visible before reading labels.
  - Program agents have helmet/visor/identity/aura cues.
  - No label glow clutter.
- [ ] Check dense project scene using the existing smoke fixture or local data that shows many projects.
  - Rooms remain packed without wasting space.
  - Labels do not overlap more than the current baseline.
  - Active lanes do not create cyan haze over clusters.
- [ ] Check mobile viewport through Playwright or the in-app browser responsive mode.
  - HUD usable.
  - Inbox and settings still clickable.
  - Scene remains nonblank.
- [ ] Check browser console.
  - No relevant runtime errors.
  - No WebGL material or geometry disposal warnings introduced by repeated reconciliation.
- [ ] Commit final polish only if needed and isolated:
  ```bash
  git add app.js smoke/codims-smoke.spec.mjs style.css
  git commit -m "Polish Balanced Cinematic Grid visuals"
  ```

### Verification

- [ ] All commands pass.
- [ ] Rendered QA passes desktop, dense, and mobile views.
- [ ] `git status --short` shows only intentional remaining changes.

---

## Risk Controls

- [ ] Do not add colors outside the enforced Tron palette.
  - Use existing `gridStudio.cyan`, `gridStudio.active`, `gridStudio.done`, `gridStudio.reviewed`, and existing dark room colors.
- [ ] Do not add GLTF, image, or shader asset pipelines.
- [ ] Do not alter inbox filter semantics, review workflows, privacy mode, settings behavior, server code, or payload shape.
- [ ] Keep new geometry lightweight:
  - Handoff: one wider tube and one halo sphere.
  - Parent: three small detail meshes and one aura ring.
  - Child: three small detail meshes and one aura ring.
  - Room: reuse existing circuit and rail meshes.
- [ ] Keep reduced-motion behavior centralized in existing `state.reducedMotion` branches.

## Final Success Criteria

- [ ] `npm run test:js` passes.
- [ ] `npm run test:smoke` passes.
- [ ] `python3 -m unittest -v` passes.
- [ ] `git diff --check` passes.
- [ ] Default scene shows clearer active work flow through 3D data lanes.
- [ ] Agents read as Grid programs instead of generic capsule markers.
- [ ] Dense scenes remain readable.
- [ ] Labels remain disciplined and readable.
- [ ] No new runtime dependency or build step exists.
