# MCP Workflow

Use this reference when a configured MCP server named `speccanvas` is available.

## Connection Boundary

This skill does not contain connection details. Configure the MCP server outside the skill.

Recommended convention:

- MCP server name: `speccanvas`
- Endpoint examples:
  - local: `http://localhost:3000/mcp`
  - staging: `https://<staging-host>/mcp`
  - production: `https://<production-host>/mcp`
- Bearer token environment variable: `SPECCANVAS_MCP_TOKEN`

Never commit bearer tokens, local URLs, staging URLs, or production URLs into the skill.

## Resource Flow

When MCP is available:

1. Read `speccanvas://guides/agent-workflow` for the server-side tool guide.
2. Read `speccanvas://formats/ui-spec` or `speccanvas://formats/data-spec` when authoring specs through MCP.
3. Use local skill references for workflow judgment and MCP resources for live server format hints.

## Tool Mapping

- Create or find project: use project tools.
- Create UI Spec or Data Spec document: use spec creation tools and the matching format reference.
- Save a meaningful UI Spec evolution: create a UI Spec revision.
- Create implementation: resolve agent identity, then call `add_implementation`.
- Export handoff archive: use export tools after project/spec/implementation data is complete.

## Agent Identity

Resolve identity when the creator is known:

```json
{
  "identityKey": "runtime:provider:model",
  "runtime": "codex",
  "agentName": "Codex",
  "displayName": "Codex / GPT-5.5 Codex",
  "role": "implementation-agent",
  "modelRef": {
    "provider": "openai",
    "model": "gpt-5.5-codex",
    "version": "5.5",
    "displayName": "GPT-5.5 Codex"
  }
}
```

Use the actual identity from the local `AGENTS.md`, environment, or agent profile. The JSON above is an example shape, not a universal default.

## Failure Handling

- If MCP tools are unavailable, do not fabricate tool calls or connection details.
- If auth fails, ask the user to configure the MCP token or server.
- If a target project, document, screen, or revision is ambiguous, list the concrete candidates and ask which one to use.
- If a tool rejects the spec, fix the spec according to the error and retry once.
