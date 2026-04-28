# Speccanvas Skills

Agent Skills repository for working with Spec Canvas UI Spec and Data Spec files.

## Skills

- `speccanvas`: create, revise, audit, explain, hand off, and validate Spec Canvas YAML specs using bundled format references, schemas, and validation logic.

## Install

Install for Codex with the skills CLI:

```powershell
npx skills add https://github.com/<owner>/speccanvas-skills --skill speccanvas -a codex -g
```

After publishing, replace `<owner>` with the GitHub owner.

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

Create a public GitHub repository and publish a versioned release:

```powershell
gh repo create <owner>/speccanvas-skills --public --source . --push
gh skill publish --tag v1.0.0
```
