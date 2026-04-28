# Speccanvas Skills

Agent Skills repository for working with [Spec Canvas](https://speccanvas.dev) UI Spec and Data Spec files.

## What is Spec Canvas?

Spec Canvas is a methodology and tool for turning rough product ideas, existing interfaces, or app concepts into compact YAML specifications that are easy to discuss, refine, compare, and hand off to AI coding agents.

The core idea is **discovery before implementation**: start with a minimal spec, use AI to explore possible screens and data models, compare the results, refine the spec, and only then commit to production code.

Spec Canvas has three layers:

- **Methodology**: Evolutionary Specification, where validation happens before expensive implementation.
- **Formats**: UI Spec and Data Spec, two plain-text YAML formats for describing an application.
- **Tool**: Spec Canvas, the web app that helps create, preview, validate, and compare specs.

Learn more at https://speccanvas.dev.

## What are these specs?

**UI Spec** describes the interface: screens, blocks inside screens, each block's purpose, page templates, navigation, themes, and palettes. It is purpose-driven: it describes what the UI should communicate and enable, not the CSS or framework implementation.

**Data Spec** describes the logical data model: entities, fields, field types, enums, and relationships. It focuses on business meaning and domain structure rather than physical database details such as indexes, migrations, or ORM syntax.

Both formats are designed to be self-describing for AI agents. A spec can live in a repository as YAML, be pasted into an AI chat, used by an IDE agent, or imported into Spec Canvas for visual inspection.

## Why use this skill?

The `speccanvas` skill gives Codex a repeatable workflow for creating and maintaining Spec Canvas artifacts:

- Create a UI Spec or Data Spec from a product idea, notes, screenshots, code, or an existing app.
- Keep UI and data models aligned before implementation starts.
- Review and repair specs against bundled format references and JSON Schemas.
- Validate specs locally with the included validation script.
- Prepare specs as reusable handoff context for AI agents and developers.

## Skills

- `speccanvas`: create, revise, audit, explain, hand off, and validate Spec Canvas YAML specs using bundled format references, schemas, and validation logic.

## Install

Install for Codex with the skills CLI:

```powershell
npx skills add https://github.com/riffi/speccanvas-skills --skill speccanvas -a codex -g
```

The published repository is available at https://github.com/riffi/speccanvas-skills.

## Validate

Validate the skill metadata:

```powershell
npx skills add . --list
```

If GitHub CLI 2.90.0 or newer is installed, validate publish readiness:

```powershell
gh skill publish --dry-run
```

## Publish

This repository is already public. To publish a new version, commit the changes and create a versioned release:

```powershell
gh skill publish --tag v1.0.0
```
