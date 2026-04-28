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
2. Draft or repair the YAML around that format.
3. Run `scripts/validate-spec.mjs` if available.
4. Fix blocking validation errors.
5. Return the final YAML and mention whether validation was run.

## Practical rules

- Use the format YAML files as the writing guide.
- Use schema validation as the post-check, not as the authoring guide.
- Keep specs portable and repo-friendly.
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
