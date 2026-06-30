# UI Spec Workflow

Use this reference when creating, revising, compacting, or reviewing a Spec Canvas UI Spec.

## Core Rule

Treat UI Spec as the source of product intent and visible structure, not as CSS, component, or implementation documentation.

## Creation Flow

1. Define the app intent in `metadata.description`.
2. Add screens as soon as the main user-facing surface is known.
3. Add blocks only for meaningful visible structure: major regions, task areas, stateful panels, navigation surfaces, or repeated user workflows.
4. Add templates, navigation, and responsive structure only when they materially clarify reuse or user flow.
5. Keep IDs stable and use snake_case where the format expects identifiers.
6. Validate the finished YAML with `scripts/validate-spec.mjs` when working with files.

## Granularity Gate

Update the UI Spec when the request changes:

- screens, screen groups, or major blocks;
- user journeys, navigation, entry points, or available actions;
- important states, modes, permissions, empty states, errors, or recovery flows;
- the purpose or behavior of a major component;
- meaningful responsive structure;
- product terminology when the meaning changes.

Do not update the UI Spec for:

- spacing, padding, margins, gaps, line height, or exact pixel sizes;
- CSS classes, framework component names, file names, or implementation details;
- exact colors, shadows, border radius, icons, and decorative styling;
- local alignment, wrapping, order, or small visual polish inside an already-described block;
- animation timing, debounce timing, loading spinner mechanics, or toast placement;
- invisible refactors or copy edits that do not change product meaning.

## Writing Quality

- Prefer short purpose statements that explain what the user can understand or do.
- Avoid long paragraphs that enumerate CSS or layout mechanics.
- Keep the spec compact enough to compare, revise, and hand off.
- When reconstructing from an existing app, separate observed behavior from inferred intent.
- When UI and Data Specs both exist, ensure UI actions imply real entities or workflows in the Data Spec.
