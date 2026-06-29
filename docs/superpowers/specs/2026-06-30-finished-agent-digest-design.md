# Finished Agent Digest Design

## Context

Codims renders Codex projects as 3D rooms, parent threads as larger agents, and child agents as smaller workers. Finished child agents are now distinguishable from active agents, but the parent thread does not yet provide a quick way to read what recently finished agents reported.

The requested feature is a clickable object beside each main thread. Clicking it should show a digest of recent finished agents that belong to that parent thread.

## Goals

- Add one digest object per parent thread when that parent has recently finished child agents.
- Use the existing right-side details panel to show the digest.
- Start with a raw/local digest: no generated summary in version 1.
- Preserve existing parent-agent and child-agent click behavior.
- Keep the implementation small and consistent with the current static frontend and Python stdlib backend.

## Non-Goals

- No generated or LLM-written summary in version 1.
- No in-scene floating digest popover.
- No new dependency, bundler, database, or hosted backend.
- No changes to message sending behavior.

## User Experience

Each parent thread gets a small amber digest object near the parent agent when it has at least one recent finished child agent. The object should look different from both parent agents and child agents, such as a small console or terminal block with an amber glow and a count badge.

Clicking the digest object selects a digest mode in the existing details panel. The details panel shows:

- Parent task title.
- `Finished digest` state label.
- Summary row such as `3 finished agents - last 12h`.
- One digest card per recent finished child agent, newest first.
- Each card shows child agent nickname, finish age, title or prompt snippet, and last response snippet.
- Clicking a card opens that child agent in the existing normal thread-detail view.

The digest object is not itself a thread. The message composer stays hidden while digest mode is selected.

## Data Model

Parent groups need a derived finished-agent digest:

- `finishedChildren`: child threads with `state === "DONE"` inside the current max-age window.
- `finishedCount`: count of finished children.
- `latestFinishedAt`: latest `updated_at_ms` among finished children.
- `digestItems`: lightweight data for panel cards:
  - `id`
  - `nickname`
  - `title`
  - `age_seconds`
  - `updated_at_ms`
  - `last_response_snippet`

The initial panel should be fast. Full thread content is loaded only if the user opens an individual digest card.

## Backend

The server already reads thread details to classify recent threads. Version 1 should reuse that read path to expose lightweight `last_response_snippet` for finished child agents. Snippets should be bounded to 280 characters and fall back to `No response captured` when no response is available.

The existing `/api/thread/<thread-id>` endpoint remains the source of full prompt and last-response text when a user opens a card.

## Frontend

The visual model should attach digest metadata to each parent group. The renderer should create and reconcile one digest object for every parent group where `finishedCount > 0`.

The digest object should:

- Be selectable through the existing raycaster.
- Store parent group key and digest data in `userData`.
- Sit near the parent agent without overlapping normal children.
- Use amber styling aligned with existing done-state colors.
- Be removed automatically when `finishedCount` becomes zero.

Click handling should branch:

- Room click: existing camera behavior.
- Thread click: existing thread detail behavior.
- Digest object click: set selected mode to `digest` and render digest panel.

## Details Panel

The current details panel can be extended with a digest render path rather than adding a new sidebar.

Digest mode should:

- Hide thread message composer.
- Show parent title and digest state.
- Render digest cards in the existing content area.
- Keep card text compact and wrapped.
- Provide an accessible button or clickable card for each child agent to open full child details.

## Edge Cases

- If no finished agents exist for a parent, no digest object appears.
- If finished agents age out, the digest object disappears on next refresh.
- If a digest is selected and the parent loses all digest items, keep digest mode selected and show `No finished agents in the current window`.
- If snippets are unavailable, show `No response captured`.
- If many finished agents exist, version 1 shows the most recent five cards and a compact overflow note. Full pagination or show-more control can be added later.
- Dense scenes should still avoid label clutter; the digest object count badge should be more important than a long label.

## Testing

Model tests:

- Parent group with done children exposes stable digest count and order.
- Parent group with no done children has no digest.
- Digest ordering is newest finished first but does not affect physical child-agent slot order.

Server tests:

- Completed child thread includes bounded last-response snippet.
- Missing response falls back to `No response captured`.

Frontend/browser checks:

- Digest object appears beside parent with finished children.
- Clicking digest object changes the right panel to digest mode.
- Clicking a digest card opens that child thread detail.
- Message composer stays hidden in digest mode.
- Console has no relevant errors or warnings.

## Later Generated Digest

Generated digest can be added later as a new layer above raw digest cards. It should not block the raw/local version. A later design should decide whether generation comes from a local model, OpenAI API, or another Codex app-server capability.
