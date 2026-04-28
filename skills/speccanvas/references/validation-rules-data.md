# Data Spec Validation Rules

Use this file as a compact summary of the current local Data Spec validation behavior from the Spec Canvas project.

Primary implementation sources:
- Bundled schema in this skill: `schemas/data-spec.schema.json`
- Upstream Spec Canvas source file inside a local `spec-canvas` checkout:
  `spec-canvas-ui/src/features/data-spec/features/validation/services/ValidationService.ts`

## Schema-level checks

- The schema validates overall structure and supported fields.
- Unknown or misplaced fields can be rejected by the schema.

## Custom validation checks

- Field types that are not built-in types are treated as enum references and must exist in `enums`.
- Foreign keys must point to an existing entity.
- Foreign keys must point to an existing field on that entity.
- Each relation must reference existing entities.
- Relation cardinality must be one of:
  - `one_to_one`
  - `one_to_many`
  - `many_to_many`

## Built-in logical field types

- `string`
- `integer`
- `decimal`
- `boolean`
- `datetime`
- `uuid`
- `json`
