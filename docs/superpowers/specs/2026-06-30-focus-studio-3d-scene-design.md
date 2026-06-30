# Focus Studio 3D Scene Design

Date: 2026-06-30

## Context

Codims is a local, static Three.js monitor for Codex threads and subagents. It renders projects as rooms, parent threads as larger agents, child agents as smaller workers, active handoffs as arcs, and finished work as digest objects.

The current visual language is dark, neon, and operational. It already supports useful states, but many scene elements share similar glow and contrast. That can make the scene feel busier than needed during long productivity sessions.

## Assumptions

- The 3D scene is a work surface, not a game or landing-page hero.
- Visual polish should improve status scanning and reduce distraction.
- No new build step, framework, hosted dependency, or heavyweight post-processing pipeline should be added.
- Existing interaction behavior remains: click rooms or agents to focus/inspect, use labels, use the action inbox for review.
- The implementation should be surgical and should follow the current `app.js` and `style.css` patterns.

## Goal

Adopt a "Focus Studio" visual direction: dim workspace, bright work. The default scene should be calm and readable. Only live work, pending review, and selected focus should receive strong visual energy.

Success means:

- Active agents and running parent groups are easier to spot within one glance.
- Finished digest objects show urgency only when unreviewed.
- Idle rooms and agents recede without disappearing.
- Labels remain legible but do not dominate the scene.
- The scene feels cleaner without reducing density or workflow speed.

## Non-Goals

- No new workflow states.
- No new dashboard panels or controls.
- No model imports, sprite assets, or image dependencies.
- No broad refactor of scene reconciliation or visual-model data shaping.
- No decorative ambient motion unrelated to status, selection, or handoff flow.

## Considered Approaches

### A. Operations Map

Sharper grid, stronger room boundaries, more status glow. This would improve fast scanning but keep the current high-energy sci-fi feel.

### B. Focus Studio

Lower global glow, disciplined contrast, and visual energy reserved for meaningful states. This best matches productivity-oriented use and long-running monitoring.

### C. Status Terrain

Encode workload shape through floor zones and color fields. This could be useful later, but it adds visual semantics that need more design and testing.

Selected approach: Focus Studio.

## Scene Design

### Lighting And Atmosphere

Reduce ambient intensity and neon saturation so neutral geometry reads as graphite/slate rather than glowing blue. Keep the scene background dark, but avoid large bright gradients or decorative haze.

Directional light and shadows should define shape more than emissive materials do. Shadows should stay soft enough to make rooms and agents feel grounded without creating heavy contrast patches.

### Rooms

Rooms should become quiet work bays:

- Neutral floor and wall materials.
- Lower floor-glow opacity.
- Lower border and rail opacity when not selected or active.
- Fainter grid helper so it supports spatial orientation without competing with agents.

Project signs should remain readable, but their border glow should be less dominant. The sign is a label, not the primary status indicator.

### Agents

Agent body color should still identify parent grouping, but idle agents should be visually subdued. Active agents should stand out through:

- Green ring and label treatment.
- Slightly stronger emissive body accent.
- Existing bobbing motion, kept subtle.

Done agents should be warm but muted. They should not compete with active work unless they are part of an unreviewed digest.

### Digest Objects

Digest objects should carry review urgency:

- Amber token and ring when the parent group has unreviewed finished items.
- Neutral gray token and low-opacity ring once all items are reviewed.
- No strong pulse for reviewed digest objects.

The existing review state model already provides `doneObjectInactive`; implementation should use that instead of adding new state.

### Handoffs

Handoff arcs should be visible only when useful:

- Active handoffs use a clearer but controlled line/packet treatment.
- Inactive handoffs remain very faint or hidden according to current behavior.
- Packet animation should communicate active flow, not decoration.

### Selection And Focus

Selected focus should be visually explicit. When a room, parent, agent, or digest is selected, the scene should provide one calm focus cue:

- Thin outline, brighter ring, or focused material intensity.
- Optional label brightening for the selected object.
- No large camera effects beyond existing focus movement.

Selection state should reuse existing `state.selectedId`, `state.selectedParentKey`, and `state.selectedDigest` rather than introducing a parallel selection model.

### Labels

Labels should be less visually loud by default:

- Slightly lower background opacity.
- Less glow on non-active labels.
- Active and selected labels remain bright.
- Dense-label behavior remains unchanged.

The label layer should stay HTML/CSS-based because it is already readable, accessible, and easier to tune than 3D text.

## Architecture

Implementation should stay in the existing frontend files:

- `app.js`: material constants, object creation, state-based visual updates, selected-state styling.
- `style.css`: label opacity, label state treatment, scene shell background if needed.
- `visual-model.mjs`: unchanged unless a pure helper is needed for a testable visual-state decision.

No new files are required for the initial implementation.

## Data Flow

Existing refresh flow remains:

1. Fetch thread data.
2. Build project and parent groups.
3. Reconcile rooms, parent agents, child agents, digest objects, and handoffs.
4. Apply visual state from thread state, review state, density, privacy, and selection.
5. Animate only active agents, active handoffs, and unreviewed digest objects.

The selected visual state should be updated during reconciliation and when details are shown or cleared.

## Error Handling

No new network or persistence paths are introduced. If visual update data is missing, objects should fall back to quiet neutral styling. Existing refresh and detail error handling remains unchanged.

## Testing And Verification

Use current lightweight checks:

- `node --check app.js`
- `node test_visual_model.mjs`
- Browser smoke test with local server

Visual verification should check:

- Active agents are immediately distinguishable from idle and done agents.
- Reviewed digest objects become neutral.
- Unreviewed digest objects remain amber.
- Selection cue appears and clears correctly.
- Labels remain readable at normal and compact density.
- Scene is nonblank and framed correctly on desktop and mobile viewport widths.

## Implementation Scope

Initial implementation should be a small visual pass:

1. Tune scene lighting, grid, room material, floor glow, sign glow.
2. Tune agent, digest, and handoff materials by state.
3. Add selected-object visual treatment.
4. Tune HTML label default/active/selected styles.
5. Verify with current tests and browser screenshots.

Anything beyond this, such as terrain encoding, post-processing bloom, model assets, or new controls, should be deferred.
