# Tron-Inspired Codims Restyle Design

Date: 2026-07-01

## Goal

Fully restyle Codims with a Tron Legacy-inspired visual language while preserving the current room-and-character monitoring model.

The first implementation should be a complete visual pass: 3D scene, rooms, characters, labels, HUD, overlays, motion, and smoke verification. It should replace the current default theme instead of adding a theme toggle.

## Decisions

- Keep project rooms and thread characters as the core metaphor.
- Use program-style humanoids for parent threads and child agents.
- Build models with existing Three.js primitives. Do not add GLTF, a bundler, React, or asset dependencies.
- Use rectangular Grid chambers for project rooms.
- Allow light UI shaping: component proportions, panel treatment, button styling, labels, and HUD framing may change, but workflows must not.
- Use a balanced visual intensity: strong cyan and orange glow, black glass, and readable dense controls.

## Assumptions

- "Tron Legacy-inspired" means black-glass surfaces, cyan energy rails, orange warning/review accents, luminous circuit lines, and program-like silhouettes.
- Exact Disney film assets, logos, character models, names, or recognizers are out of scope unless licensed assets are supplied separately.
- Codims remains a static browser app served by the current Python stdlib server.
- Current privacy expectations still apply; sensitive thread metadata must remain hidden when privacy mode is enabled.

## In Scope

- Replace the muted dark palette with a black, cyan, green-cyan, orange, and slate palette.
- Retune Three.js scene background, lights, grid, materials, and emissive values.
- Rebuild project rooms as rectangular Grid chambers with floor rails, inset circuit lines, wall panels, glowing project signs, and selected frames.
- Rebuild parent and child thread models as primitive program humanoids with visor slits, suit lines, identity-disc/ring elements, and distinct scale/detail levels.
- Retune handoff arcs as luminous light trails with moving packets.
- Restyle digest/review objects as orange data tokens, with reviewed states desaturated.
- Restyle HUD counters, status, action buttons, labels, action inbox, settings dialog, inspector, focus states, and reduced-motion states.
- Update smoke tests only where needed to keep visual and layout checks meaningful.

## Out Of Scope

- Exact Tron assets, logos, film models, or branded copy.
- New asset pipeline, GLTF loader, bundler, framework, or hosted backend.
- New theme preference or toggle.
- Changes to thread fetching, grouping, selection behavior, review behavior, privacy behavior, or API contracts.
- Broad refactors unrelated to the visual pass.

## Architecture

Keep existing file boundaries.

- `app.js` remains the Three.js scene owner. Replace `focusStudio` with a Grid-themed palette and update existing scene builders:
  - `createRoom`
  - `createParentAgent`
  - `createAgent`
  - `createDigestObject`
  - `createHandoff`
  - visual-state update helpers
- `style.css` remains the UI theme owner. Replace CSS variables and component treatments while keeping selectors and DOM structure stable.
- `visual-model.mjs` should remain mostly unchanged. Touch it only if new primitive sizes require minor spacing or layout tuning.
- `smoke/codims-smoke.spec.mjs` keeps existing behavioral assertions and may gain focused layout or screenshot guards.

Do not introduce a new module unless `app.js` becomes materially harder to manage. If extraction is needed, limit it to shared visual constants.

## Scene Design

### Project Rooms

Each project room becomes a rectangular Grid chamber:

- Deep black floor with cyan edge rails.
- Inset floor with subtle circuit-line geometry.
- Low back and side walls with glowing rails and panels.
- Project sign rendered as a luminous display.
- Selection frame that reads as an energized perimeter, not a generic outline.
- Existing room sizing and placement remain driven by current layout functions.

### Parent Threads

Parent threads become taller program humanoids:

- Dark metallic body.
- Bright cyan visor slit.
- Chest circuit/core line.
- Identity-disc back-ring motif.
- Stronger active and selected glow than child agents.
- Still clickable through existing parent pickables.

### Child Agents

Child agents become smaller program humanoids:

- Same visual language as parent threads.
- Fewer geometry details to reduce crowding.
- Scale still follows current density/layout behavior.
- Active, done, idle, and selected states remain distinguishable.

### Digest Objects

Digest/review objects become orange data tokens:

- Orange-gold glow for pending review.
- Lower-saturation slate treatment after all items are reviewed.
- Existing click and inspector behavior remain unchanged.

### Handoffs

Handoff arcs become light trails:

- Active handoffs use brighter colored beams and moving packets.
- Inactive handoffs remain faint circuit traces.
- Existing animation timing and reduced-motion behavior remain respected.

## UI Design

### HUD

The HUD uses black translucent panels, cyan borders, small radii, and tight spacing. Counters, status, inbox, and settings controls remain in their current positions unless small fit adjustments are required.

### Labels

Scene labels become hologram tags:

- Cyan borders for active/system state.
- Orange borders for digest/review state.
- Slate treatment for inactive/reviewed state.
- Text remains compact and readable on dense scenes.

### Overlays

Action inbox, inspector, and settings dialog become black-glass overlays:

- Edge-lit borders.
- Header emphasis through cyan rules or glow.
- Existing content hierarchy preserved.
- Mobile fit remains at least as good as current smoke-test expectations.

## Data Flow And Behavior

No data flow changes are planned.

- `/api/threads` payload remains unchanged.
- `/api/thread/<thread-id>` payload remains unchanged.
- Existing grouping, filtering, density, selection, camera focus, review, and privacy logic remains unchanged.
- Existing localStorage keys remain unchanged.
- No theme preference is added because the new style replaces the default.

## State Mapping

- System/Grid: cyan.
- Running/active: green-cyan pulse on a cyan base.
- Done/review-needed: orange.
- Reviewed/inactive: slate with low glow.
- Selected: bright cyan-white perimeter or label border.

## Accessibility And Motion

- Preserve readable contrast for labels, overlays, and control text.
- Preserve keyboard focus visibility.
- Avoid text overlap on mobile and desktop.
- Keep `prefers-reduced-motion: reduce` disabling pulsing or animated glow.
- Do not add visible instructional text.

## Testing

Required verification after implementation:

- `npm run test:js`
- `npm run test:smoke`
- Desktop visual check that rooms, characters, labels, handoffs, and overlays render.
- Mobile visual check that status, actions, counters, drawer, inspector, and settings fit without incoherent overlap.

Testing should stay behavior-focused. Do not add brittle exact pixel comparisons. Existing nonblank canvas sampling is useful and should remain.

## Success Criteria

- App launches with the new Grid-inspired look by default.
- Project rooms still read as rooms.
- Parent threads and child agents still read as characters.
- Current Codims workflows still work: select rooms/threads/digests, open inbox, open inspector, toggle privacy, toggle idle, and adjust max age.
- Dense scenes remain readable enough for monitoring.
- Smoke tests pass on desktop and mobile viewports.
- No new runtime dependencies are introduced.
