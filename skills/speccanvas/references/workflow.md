# Spec Canvas Workflow Notes

Primary authoring sources in this skill:
- `references/ui-spec-format-0-0-3.yaml`
- `references/data-spec-format-0-0-1.yaml`

Primary validation sources bundled in this skill:
- `schemas/ui-spec.schema.json`
- `schemas/data-spec.schema.json`

Upstream sources to sync from when the Spec Canvas repo changes:
- In a local `spec-canvas` checkout:
  `spec-canvas-ui/src/features/ui-spec/schemas/ui-spec.schema.json`
- In a local `spec-canvas` checkout:
  `spec-canvas-ui/src/features/data-spec/schemas/data-spec.schema.json`
- In a local `spec-canvas` checkout:
  `spec-canvas-ui/src/features/ui-spec/services/validation.service.ts`
- In a local `spec-canvas` checkout:
  `spec-canvas-ui/src/features/data-spec/features/validation/services/ValidationService.ts`

## Working order

1. Read the appropriate original format file.
2. Decide whether the request is semantic enough to change the spec.
3. Draft or repair the YAML around that format.
4. Run `scripts/validate-spec.mjs` if available.
5. Fix blocking validation errors.
6. Return the final YAML and mention whether validation was run.

## Granularity gate

Spec-first does not mean spec-for-every-tweak. Apply this gate before editing a UI Spec.

Update the UI Spec when the change affects product intent or user-facing structure:

- screens, screen groups, major blocks, or major responsive structure
- navigation, entry points, user journeys, or available actions
- important states, modes, permissions, empty/error/recovery flows
- meaningful terminology or label changes
- boundaries between product areas such as public/admin/editor/player

Do not update the UI Spec for implementation micro-details:

- padding, margin, gap, line-height, exact pixel sizes, font sizes
- CSS/Tailwind classes, component/file names, or framework internals
- exact colors, shadows, border radius, icons, or decorative styling
- local alignment, ordering, wrapping, or cosmetic reflow inside an already-described block
- animation timings, debounce timings, crossfade seconds, toast positions
- logging, platform workarounds, or browser implementation details unless they are core product capabilities
- local copy edits without a meaning change
- user-invisible refactors

If the request is only a cosmetic/layout micro-change, change code directly and leave the UI Spec untouched.

## Practical rules

- Use the format YAML files as the writing guide.
- Use schema validation as the post-check, not as the authoring guide.
- Keep specs portable and repo-friendly.
- Keep specs compact and intent-first; do not let UI Specs become CSS notes or implementation changelogs.
- Keep UI and Data naming aligned when both exist.
- For UI Spec, the local format file, bundled schema, and local validator are expected to support the same field set, including responsive constructs from `ui-spec-format-0-0-3.yaml`.
- If the original format file allows a construct that the local schema rejects, call out the mismatch explicitly as a skill bug.

## Review checklist

- Is the chosen spec type correct for the task?
- Does the YAML follow the original format file?
- Does schema validation pass?
- Do local custom validation rules pass?
- Are broken references fixed?
- If UI and data specs coexist, do they describe the same product model?
- Is the UI Spec free of pixel-level implementation details and cosmetic micro-tweaks?
