# Balanced Cinematic Grid Design

Date: 2026-07-02

## Goal

Enhance the current Tron-inspired Codims scene with the approved "Balanced Cinematic" direction: a stronger light-trail network plus more recognizable Grid program agents.

This is a focused visual pass on top of the existing room-and-character model. It should make activity flow easier to read and make agents feel less generic, without adding visual noise that makes dense scenes unreadable.

## Approved Direction

Use direction B from the visual companion:

- Combine Light Trail Network and Program Identity System.
- Keep intensity balanced, not full arcade glow.
- Preserve current packed room layout, HUD, action inbox, settings, inspector, and server behavior.
- Stay inside the existing Tron palette already enforced by tests.

## Assumptions

- "Tron-like" means Grid-inspired energy flow, program silhouettes, black glass, cyan circuits, and amber done/review accents.
- Exact film assets, logos, vehicles, recognizers, or branded character designs are out of scope.
- Current static/no-build architecture remains required.
- Dense monitoring readability matters more than screenshot drama.

## In Scope

### Active Data Lanes

Add stronger visual connections that communicate active work flow:

- Parent-to-agent trails become clearer, wider, and more directional.
- Room-to-room data lanes may appear when there are active handoffs or active projects.
- Trail pulse speed and opacity should distinguish active work from idle context.
- Reduced-motion mode must freeze or simplify trail animation.

### Program Model Upgrade

Improve agent and parent models using existing Three.js primitives:

- More recognizable helmets and visor shapes.
- Stronger shoulder/chest silhouettes.
- Identity-disc motif on parent and child programs.
- State aura rings for active and selected items.
- Done/reviewed states remain amber/slate and less visually dominant than active states.

### Room Circuit Pulse

Rooms should react to activity without overwhelming labels:

- Active rooms get subtle floor/rail circuit pulses.
- Idle rooms keep low ambient glow.
- Done/review-heavy rooms can use amber highlights sparingly.
- Selected room treatment remains visually distinct from active room treatment.

### Label Discipline

Do not solve Tron feel by making every label glow harder:

- Labels must remain readable over dense scenes.
- Primary glow should live in 3D scene geometry and materials.
- Label treatments may be tuned only if needed to reduce clutter or preserve contrast.

## Out Of Scope

- New build step, framework, renderer, GLTF/GLB asset pipeline, or external model dependency.
- Theme toggle or alternate non-Tron mode.
- Major layout rewrite beyond small placement/focus tuning needed for the new visuals.
- New server APIs or thread payload fields.
- Changes to review workflow, inbox filtering semantics, privacy mode, or settings behavior.
- Heavy bloom/post-processing dependency.

## Architecture

Keep existing file ownership:

- `app.js` owns Three.js materials, geometry, animation, picking, labels, and scene reconciliation.
- `visual-model.mjs` owns pure layout/state math that can be tested without WebGL.
- `style.css` owns HUD, labels, overlays, and responsive CSS.
- `smoke/codims-smoke.spec.mjs` owns rendered workflow and visual invariant checks.
- `test_visual_model.mjs` owns pure geometry/layout/state expectations.

Prefer local helpers in `app.js` for repeated procedural geometry. Move logic to `visual-model.mjs` only when it is deterministic and worth testing outside WebGL.

## Visual Design

### Data Lanes

Data lanes are additive emissive geometry, not DOM labels.

- Use cyan as base active flow.
- Use amber only for done/review-oriented flow.
- Use transparent additive materials and modest geometry width.
- Avoid filling the entire scene with constant trails; show lanes only when they clarify relationships.

### Program Agents

Agents should read as Grid programs at a glance:

- Parent programs are taller and more detailed.
- Child programs are smaller with simplified detail.
- Identity discs are visible but not oversized.
- Active aura rings should pulse lightly.
- Selected program state should still override ambient state clearly.

### Rooms

Rooms should feel energized but not noisy:

- Floor circuits can pulse in active rooms.
- Rails can brighten when rooms contain active threads.
- Project signs remain readable and respect privacy mode.
- Dense scenes keep room floors legible behind agents and labels.

## Motion

Motion should support monitoring:

- Active trails animate directionally.
- Active programs pulse or breathe subtly.
- Idle/done motion remains low.
- Reduced motion disables pulsing trails, packet movement, and excessive aura animation.

## Data Flow

No data flow changes are required.

- Existing thread payloads drive project, parent, child, state, and review visuals.
- Existing `handoffShouldAnimate()` remains the source for active parent-child flow.
- Existing room/project state remains enough to decide room pulse intensity.
- Existing selection state remains enough to decide selected aura/outline treatment.

## Testing

Required automated checks after implementation:

- `npm run test:js`
- `npm run test:smoke`
- `python3 -m unittest -v`
- `git diff --check`

Expected test additions:

- Pure visual-model tests only if new deterministic lane/focus/layout math is introduced.
- Smoke checks for new scene invariants, such as active lanes/aura parts existing without requiring brittle pixel-perfect assertions.
- Existing palette guard must continue to pass.

Required rendered QA:

- Desktop default scene.
- Desktop dense scene with many projects.
- Mobile scene.
- Action inbox and settings still clickable.
- No relevant console errors or framework overlays.

## Success Criteria

- Active work flow is easier to see before reading labels.
- Agents look more like Grid programs than generic capsule markers.
- Dense scenes remain readable and do not become glow clutter.
- Current room, inbox, settings, inspector, privacy, and selection workflows still work.
- No new runtime dependency or build step is introduced.
- Existing Tron palette remains enforced.

## Risks And Mitigations

- Risk: glow trails compete with labels.
  - Mitigation: keep label glow restrained and use limited active-only 3D trails.
- Risk: more geometry hurts dense-scene performance.
  - Mitigation: use lightweight primitives, reuse materials where practical, and keep inactive detail subdued.
- Risk: reduced-motion users get distracting animation.
  - Mitigation: route new pulsing and lane animation through existing reduced-motion handling.
- Risk: visual state becomes confusing.
  - Mitigation: keep active cyan/green-cyan, done amber, reviewed slate, selected cyan-white.
