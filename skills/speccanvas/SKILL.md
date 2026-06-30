---
name: speccanvas
description: Work with Spec Canvas specifications and SpecCanvas MCP servers using the original Spec Canvas format files plus local schema validation. Use when Codex needs to create, revise, audit, explain, hand off, or persist a Spec Canvas UI Spec, Data Spec, revision, or screen implementation; turn a rough product idea into YAML; reconstruct a spec from code, screenshots, or notes; validate specs against bundled schemas; or use a configured speccanvas MCP server. Treat "SpecCanvas MCP", "live SpecCanvas", "MCP Speccanvas", "in Speccanvas", "create a project in Speccanvas", and similar phrases as requests to use the live speccanvas MCP server instead of creating local files.
---

# Speccanvas

Use this skill to produce and maintain Spec Canvas artifacts as portable YAML specs or to persist them through a configured SpecCanvas MCP server.

Treat the spec as the source of truth for structure and intent. Favor compact, reusable specs that can be pasted into Spec Canvas, an IDE, a terminal agent, or a repository without extra explanation.

Use the format-description YAML files in this skill as the writing guide. Use the bundled JSON Schema copies in this skill plus the local validation logic as the post-check.

## Core Philosophy

Spec Canvas specs are a compact bridge between product intent and implementation. They should help agents and humans agree on the shape of the product before code changes, but they should not become a running log of every CSS, layout, or component tweak.

- **UI Spec describes intent and structure.** Capture screens, major blocks, navigation, key user tasks, important states, and meaningful responsive structure.
- **Data Spec describes the logical domain.** Capture entities, fields, enums, relationships, and domain constraints; avoid physical database or framework details.
- **Spec-first applies to semantic changes.** Update specs before implementation when the request changes product meaning, user journeys, or domain structure.
- **Implementation micro-changes can skip the spec.** If the request is cosmetic, layout-only, or invisible to users, change the implementation directly and leave the spec untouched.
- **Compact specs are better specs.** Prefer short purpose statements that explain why a screen/block exists over implementation prose about how it is built.

## Granularity Gate

Before editing a UI Spec, decide whether the requested change is semantic enough to belong in the spec.

Update the UI Spec when the request changes:

- screens, screen groups, or major blocks;
- user journeys, navigation, entry points, or available actions;
- important user-facing states, modes, permissions, or empty/error/recovery flows;
- the purpose or behavior of a major component;
- meaningful responsive structure, such as distinct desktop/mobile experiences;
- product terminology or labels when their meaning changes;
- boundaries between public, admin, editor, player, onboarding, or similar product areas.

Do **not** update the UI Spec for implementation micro-tweaks:

- spacing: padding, margin, gap, line-height;
- exact sizes: pixel values, font-size, width/height unless they express high-level layout intent;
- CSS classes, Tailwind classes, component names, file names, or framework-specific structure;
- exact colors, gradients, shadows, border-radius, icons, or decorative styling;
- local alignment, ordering, wrapping, or cosmetic reflow inside an already-described block;
- animation timings, debounce timings, crossfade seconds, toast positions, loading-spinner mechanics;
- browser/platform implementation details unless they are a core user-facing capability;
- local copy edits that do not change meaning;
- refactors that are invisible to users.

If the user asks for a cosmetic or layout micro-change, do the code change directly and explicitly avoid touching the UI Spec.


## Default File Placement

Unless the user explicitly asks for a different location, create and update Spec Canvas files in the project root under `spec/`.

- UI Spec path: `spec/ui-spec.yaml`
- Data Spec path: `spec/data-spec.yaml`

If the `spec/` directory does not exist, create it. When only one artifact is requested, create only the relevant file.

## MCP Mode

Use the configured MCP server named `speccanvas` when the user asks to work with a live SpecCanvas project, document, revision, implementation, archive, or when MCP tools are clearly available in the environment.

- **Live MCP intent words:** `SpecCanvas MCP`, `live SpecCanvas`, `MCP Speccanvas`, `Speccanvas server`, `in Speccanvas`, `на MCP сервере Speccanvas`, `в Speccanvas`, `создай проект в Speccanvas`.
- If the user asks to create, list, inspect, update, or save a project "in Speccanvas" or "through SpecCanvas MCP", use MCP tools. Do not create local `spec/`, `docs/spec/`, or repository files unless the user explicitly asks for file output.
- If MCP is available, read [references/mcp-workflow.md](./references/mcp-workflow.md) before creating or updating live SpecCanvas data.
- If the task uploads existing local `*.yaml` Spec Canvas files to a live MCP server, prefer [scripts/upload-spec.mjs](./scripts/upload-spec.mjs) instead of writing ad-hoc JSON-RPC upload scripts or pasting large documents into direct tool calls.
- If the task creates or updates a UI Spec, also read [references/ui-spec-workflow.md](./references/ui-spec-workflow.md).
- If the task mentions L0, L1, L2, L3, control level, exploration, structure, behavior, or implementation-ready UI Spec depth, also read [references/progressive-precision.md](./references/progressive-precision.md).
- If the task creates a screen implementation, also read [references/implementation-workflow.md](./references/implementation-workflow.md).
- If MCP is not available, do not invent connection details. Work with portable YAML files or ask the user to configure the `speccanvas` MCP server.
- Do not store MCP URLs, bearer tokens, staging hosts, or local secrets in this skill. Those belong in the agent's MCP configuration and environment variables.

### MCP Model Identity Rule

When saving an agent-authored screen implementation through MCP, always provide stable model identity as `{ identityKey, provider, model, version }`.

- Resolve the active model from global agent rules, environment variables, or the current session before calling `add_implementation`.
- For `add_implementation`, pass `modelIdentity` directly. Do not replace it with `agentName`.
- `agentName` is only a manual/legacy fallback. Use it only with `modelIdentity: null` when the implementation is uploaded by a human or the model identity is intentionally unavailable.
- If the active model is unknown, ambiguous, or not registered, stop and ask for clarification instead of silently saving with `agentName`.

## Workflow

1. Identify the artifact boundary.
Determine whether the task needs:
- UI Spec only
- Data Spec only
- both specs
- explanation, review, cleanup, or validation of an existing spec
- no spec change at all because the request is an implementation micro-tweak
- live MCP persistence for projects, specs, revisions, implementations, or archives

If the user says "in Speccanvas", "SpecCanvas MCP", or "live SpecCanvas", classify the task as live MCP persistence first. File output is secondary and only happens when explicitly requested.

2. Apply the granularity gate.
For UI work, decide whether the request changes product intent/structure or only implementation details. If it is only a micro-tweak, leave the spec alone.

3. Gather source material.
Use only the inputs that define structure:
- product idea or feature request
- existing screenshots or UI descriptions
- codebase structure
- current YAML spec
- entity lists, API notes, or domain rules

4. Read the required workflow and format references.
- For live MCP project/document/revision/implementation work, read [references/mcp-workflow.md](./references/mcp-workflow.md) before deciding on local files.
- For UI Spec creation or revision, read [references/ui-spec-workflow.md](./references/ui-spec-workflow.md).
- For UI Spec precision levels L0-L3, read [references/progressive-precision.md](./references/progressive-precision.md).
- For screen implementation creation, read [references/implementation-workflow.md](./references/implementation-workflow.md).
- For live MCP persistence, read [references/mcp-workflow.md](./references/mcp-workflow.md).
- For UI Spec authoring, read [references/ui-spec-format-0-0-3.yaml](./references/ui-spec-format-0-0-3.yaml).
- For Data Spec authoring, read [references/data-spec-format-0-0-1.yaml](./references/data-spec-format-0-0-1.yaml).
- For local validation behavior and review heuristics, read [references/workflow.md](./references/workflow.md), [references/validation-rules-ui.md](./references/validation-rules-ui.md), and [references/validation-rules-data.md](./references/validation-rules-data.md) as needed.
- The current bundled schemas live at [schemas/ui-spec.schema.json](./schemas/ui-spec.schema.json) and [schemas/data-spec.schema.json](./schemas/data-spec.schema.json).

5. Draft or revise the spec.
Keep the document valid YAML and stay inside the format fields. Do not invent custom top-level sections unless the format explicitly allows them. Make the smallest semantic update that preserves intent; do not expand the spec with pixel-level implementation notes.

6. Validate the result.
If [scripts/validate-spec.mjs](./scripts/validate-spec.mjs) is available, run it against the final YAML before returning the result. Fix validation errors before returning the spec.

7. Return the result.
Return validated YAML or, for review tasks, return the issues first and the corrected snippet or file after that.

For live MCP persistence of existing local YAML files, use `scripts/upload-spec.mjs` after validation. The helper reads local UI/Data Spec YAML, validates it, parses it to JSON, creates or finds the live project, uploads documents, creates a UI revision, and sets the UI document `viewRevisionId`. Do not hand-roll one-off upload scripts unless the helper cannot run in the current environment.

## Core Rules

### Use the format file as the writing source

The format-description YAML files are the primary authoring reference for this skill. Follow their structure, field naming, examples, and guidance first. For UI Spec, `references/ui-spec-format-0-0-3.yaml` is the current local truth source and is expected to stay aligned with the bundled schema and validator.

### Use schema validation as a post-check

Schema validation is not the writing guide. It is the final verification step.

- Write the spec from the format file.
- Validate the written spec with `scripts/validate-spec.mjs`.
- Fix schema and validation-rule failures before returning the final YAML.

The bundled schemas in `schemas/` should stay synchronized with the Spec Canvas implementation and with the format-description references in this skill. If they appear to differ, treat that as a skill bug and call it out explicitly instead of silently inventing a compromise.

### Keep UI and data aligned

When both specs exist:
- match naming between screens, entities, and actions
- ensure UI actions imply real entities or workflows
- ensure Data Spec relations support the UI structure
- flag gaps instead of silently inventing backend concepts

### Keep the format portable

Produce plain YAML files that can live in a repo and be reused by any agent. Do not make the spec depend on Spec Canvas UI state, hidden metadata, or chat-only assumptions.

### Keep UI Spec above implementation detail

Do not use UI Spec as a replacement for CSS, component docs, or changelogs. A good `purpose` explains what the screen or block is for from the user's point of view. It should not enumerate exact spacing, class names, pixel sizes, transient implementation mechanics, or every small control if those details do not change the product meaning.

## Task Patterns

### Create a new UI Spec

- Start with `docType`, `format_version`, and `metadata`.
- In UI Spec, `metadata.description` is required and should carry the top-level product intent.
- Add `screens` as soon as the main app shape is known.
- Add `blocks` when the user wants visible structure; `blocks` may be omitted at exploration stage.
- Add `templates`, `navigation`, or responsive fields only when they materially help.
- If the user asks for L0, L1, L2, L3, a control level, exploration, structure, behavior, or implementation-ready depth, apply [references/progressive-precision.md](./references/progressive-precision.md).
- UI responsive authoring supported by the current local format includes `metadata.breakpoints`, adaptive `screen.template`, adaptive `block.columns`, and `block.visible`.
- Preserve the original format-file conventions, including quoting guidance from the UI format file.
- Validate the completed file with `scripts/validate-spec.mjs` when available.

### Create a new Data Spec

- Describe the logical domain model, not the physical database.
- Add `enums` only when shared controlled vocabularies matter.
- Define `entities` with business-meaningful `fields`.
- Use `relations` for logical cross-entity structure.
- Avoid leaking implementation-only concerns like indexes, migrations, or ORM-specific syntax unless the user explicitly asks for them outside the spec.
- Validate the completed file with `scripts/validate-spec.mjs` when available.

### Review or repair an existing spec

Check for:
- invalid or unsupported fields
- missing required sections
- broken screen, template, or navigation references
- enum, foreign key, or relation errors in Data Spec
- custom validation failures surfaced by the local validation rules
- schema-format mismatches between the original format file and the current local implementation
- over-detailed UI `purpose` text that describes implementation mechanics instead of product intent

When repairing, preserve the original product intent and make the smallest correction that restores clarity.

### Compact an over-detailed UI Spec

- Keep existing screen, template, region, and block IDs stable unless the product structure truly changes.
- Replace long `purpose` paragraphs with one-sentence summaries of user-facing intent.
- Preserve screens, major blocks, navigation, important states, and meaningful modes.
- Remove CSS/layout microdetails, platform quirks, exact timings, logging behavior, and component-internal mechanics.
- Avoid whole-file YAML reformatting; use targeted edits so diffs stay reviewable.
- Validate after editing.

### Reconstruct a spec from an existing app

- infer screens from visible workflows
- infer blocks from repeated regions and user tasks
- infer entities from domain nouns and state changes
- separate what is observed from what is guessed
- call out uncertainty explicitly when the source material is incomplete

## Validation

Use [scripts/validate-spec.mjs](./scripts/validate-spec.mjs) when available.

- Input: path to a YAML spec file
- Detect document type from `docType`
- Validate against the bundled JSON Schema from this skill
- Run the relevant custom validation rules
- Treat warnings as advisory
- Treat errors as blockers to final output when you are returning a corrected spec

If the script cannot run because the local Spec Canvas dependencies are missing, say so briefly and fall back to manual review using the format file plus the validation-rules references.

## Output Expectations

When returning specs:
- provide valid YAML
- keep IDs in snake_case where the format expects them
- keep field names exactly as defined by the format file
- mention assumptions when they materially affect structure
- mention whether validation was run

When returning a review instead of a rewritten file:
- list structural issues first
- then give concrete fixes
- then provide a corrected snippet or full spec if useful
