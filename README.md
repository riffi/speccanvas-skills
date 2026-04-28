# Speccanvas Skills

Agent Skills repository for working with Spec Canvas UI Spec and Data Spec files.

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
