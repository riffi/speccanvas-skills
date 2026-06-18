# UI Spec Validation Rules

Use this file as a compact summary of the current local UI validation behavior from the Spec Canvas project.

Primary implementation sources:
- Bundled schema in this skill: `schemas/ui-spec.schema.json`
- Upstream Spec Canvas source file inside a local `spec-canvas` checkout:
  `spec-canvas-ui/src/features/ui-spec/services/validation.service.ts`

## Schema-level checks

- `format_version`, `metadata`, and `screens` are required.
- `screens` is an object keyed by `screen_id`.
- `metadata.name` and `metadata.description` are required.
- `metadata.description` and `metadata.breakpoints` are supported.
- `screen.title` and `screen.purpose` are required.
- `block.id` and `block.purpose` are required.
- `screen.template` accepts a string template ID or an object with `default/mobile/tablet/desktop`.
- `block.columns` accepts an integer or an object with `default/mobile/tablet/desktop`.
- `block.visible` accepts a breakpoint string, an array of breakpoint names, or an object with `show/hide`.
- Unknown properties are rejected in many places because the schema uses `additionalProperties: false`.

## Custom validation checks

- Template must contain exactly one `content` region.
- `static` and `floating` regions must contain blocks.
- `content` region must not contain blocks.
- `default_template` must point to an existing template.
- `screen.template` must point to an existing template when it is a string.
- `navigation.items[].target` must point to an existing screen.
- `screen_groups[].screens[]` must point to an existing screen.
- `screen_groups[].id` should be unique.
- A screen appearing in multiple `screen_groups` is a warning.
- Template block IDs should be unique within a region.
- Screen block IDs should be unique within a screen, including nested blocks.
- If navigation items exist but no template renders `type: main_navigation`, that is a warning.
- `fixed: true` on a non-`static` region is a warning.
- Floating regions must use floating positions.
- Static and content regions must use regular positions.
- Grid rows with incomplete `columns` totals are warnings.


## Human review heuristics

These checks are not enforced by the schema, but reviewers and agents should apply them before treating a UI Spec as good handoff context.

- `purpose` fields should describe user-facing intent, not CSS or component implementation.
- Screen and block descriptions should stay compact enough to be scanned quickly by another agent.
- Exact spacing, pixel sizes, font sizes, Tailwind/CSS classes, decorative colors, shadows, border radius, and icon choices usually do not belong in the spec.
- Animation timings, debounce timings, crossfade seconds, toast positions, loading-spinner mechanics, console logging, and platform workarounds should stay in implementation notes unless they define a core product capability.
- Local text/copy edits belong in the spec only when they change product meaning or terminology.
- Cosmetic/layout micro-changes should be implemented in code without changing the UI Spec.
