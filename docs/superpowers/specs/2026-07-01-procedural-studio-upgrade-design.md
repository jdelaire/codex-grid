# Procedural Studio Upgrade Design

## Context

Codims is a local, no-build Three.js monitor for Codex threads and subagents. The current scene renders projects as rooms, parent threads as larger workers, child agents as smaller workers, finished work as digest objects, and active parent-child work as handoff beams.

This design improves the 3D model while preserving the existing app shape:

- Python stdlib server.
- Static browser frontend.
- Vendored Three.js runtime.
- No React, bundler, database, hosted backend, or asset pipeline for the first pass.

## Approved Direction

Use the current rooms/workers metaphor and upgrade it into procedural "studio bays."

Approved choices:

- Improve both visual polish and crowded-scene readability.
- Keep all child agents visible, including crowded 96+ child cases.
- Do not collapse children into count pods.
- Prefer procedural Three.js primitives for the first pass.
- Leave room for local GLB assets later if a future change proves they are worth the workflow cost.

## Scope

In scope:

- Richer procedural room bays with layered floors, wall panels, rails, accent glows, and cleaner project signs.
- More recognizable parent and child worker silhouettes.
- Improved crowded layouts that remain intentional at 96+ children per parent.
- More controlled dense-mode labels so active and selected items stay readable.
- Refined lighting, materials, and animation within the existing Three.js scene.
- Existing selection, details panel, privacy mode, action inbox, digest object, and handoff beam behavior.

Out of scope:

- GLB, OBJ, or external 3D asset loading in this first pass.
- New frontend framework or build step.
- Replacing the rooms/workers metaphor.
- Collapsing agents into aggregate count pods.
- Changing server APIs or thread data semantics.

## Architecture

Keep the existing file responsibilities:

- `visual-model.mjs` owns pure deterministic scene math and testable visual decisions.
- `app.js` owns Three.js object creation, materials, updates, animation, picking, and disposal.
- `style.css` owns HTML overlay labels and surrounding UI styles.

Implementation structure:

- Keep object factories for rooms, parent workers, child workers, digest objects, and handoff beams.
- Add small procedural geometry helpers in `app.js` only where they reduce repeated primitive construction.
- Move crowd-sensitive math into `visual-model.mjs` when it can be tested without WebGL.
- Continue using `userData.parts` for object updates so reconciliation and disposal stay simple.
- Continue using existing pickable body/head objects for workers and existing room pickables.

## Visual Model

### Studio Bays

Rooms should read as work bays rather than plain boxes:

- Add a layered base floor and inset work surface.
- Keep a front rail and project-colored accent edge.
- Add subtle back-wall panel divisions or light strips.
- Keep side/back walls restrained so workers remain dominant.
- Keep project sign texture behavior, including privacy mode, but improve physical support and proportions.

### Workers

Parent workers should look like lead operators:

- Body, head, base ring, halo/status ring, and simple torso/shoulder detail.
- Stronger silhouette than child workers.
- Active parents pulse and bob more visibly.
- Idle parents move minimally.

Child workers should stay compact but more distinct:

- Body, head, small base ring, and a status light or antenna-like marker.
- Active children pulse and bob.
- Done children use muted warm state colors.
- Idle children have only subtle motion.
- All child workers remain individually visible and pickable.

### Digest Objects

Digest objects keep the existing pedestal/token concept:

- Preserve reviewed vs unreviewed material states.
- Keep selection ring behavior.
- Avoid adding motion that competes with active handoff beams.

### Handoff Beams

Handoffs remain active-only visual connections:

- Keep curved parent-to-child path.
- Keep moving packet on active handoffs.
- Avoid rendering inactive beams prominently in crowded rooms.
- Use parent accent color to preserve relationship cues.

## Crowded Layout Behavior

Crowded rooms must remain intentional at 96+ children per parent.

Layout rules:

- Preserve the current parent-centered ring layout.
- Refine child scale falloff so outer rings shrink smoothly.
- Keep all child positions inside room bounds.
- Keep room size expansion deterministic through `projectRoomLayout()`.
- Ensure parent group spacing still prevents overlap between groups in the same room.

Visibility rules:

- All child workers remain visible.
- Outer-ring workers may become smaller and visually simpler through scale and material restraint.
- Dense labels hide more aggressively than the current behavior.
- Active, selected, and high-priority visible items retain labels where possible.
- Handoff beams show only for active children to reduce clutter.

## Data Flow

No data flow changes are required.

- `refreshThreads()` fetches and filters thread data.
- `buildProjectParentGroups()` groups thread data by project and parent.
- `projectRoomLayout()` and `childVisualLayout()` produce deterministic layout values.
- `reconcileRooms()` creates, removes, positions, resizes, and updates rooms.
- `reconcileAgents()` creates, removes, positions, scales, and updates parent workers, child workers, digest objects, labels, and handoffs.
- `animateAgents()` applies time-based motion, pulses, halo rotation, digest token rotation, and handoff packet motion.

## Error Handling

No new failure class is introduced in the first pass:

- No asset loading, so no model fetch or parse fallback is needed.
- No new network requests.
- No new local storage writes.
- Existing disposal through `disposeObject3D()` remains the cleanup path for procedural geometry and materials.

## Testing And Verification

Automated checks:

- `node --check app.js`
- `node test_visual_model.mjs`
- `python3 -m unittest -v` if server code or shared behavior is touched.

Targeted test updates:

- Extend `test_visual_model.mjs` if `childVisualLayout()` changes.
- Preserve or strengthen 96-child bounds checks.
- Verify outer-ring scale falloff remains monotonic enough to reduce clutter.
- Preserve project room sizing and parent group spacing checks.

Visual checks:

- Normal room with a small number of parent and child workers.
- Crowded room with 96+ children under one parent.
- Multiple parent groups in one room.
- Selected room, parent worker, child worker, and digest object.
- Privacy mode labels and project signs.
- Active handoff beams and moving packets.

## Success Criteria

The change is successful when:

- The first viewport still communicates project rooms and worker relationships immediately.
- Parent and child workers look more intentional than the current cylinder/sphere models.
- A 96+ child parent remains visually organized without hiding children.
- Active and selected states are easier to spot.
- Existing click selection and details behavior is preserved.
- No framework, bundler, server API, or asset pipeline is added.
