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
- Create implementation: resolve model identity when the creator model is known, then call `add_implementation`.
- Export handoff archive: use export tools after project/spec/implementation data is complete.

## Model Identity

Resolve model identity when the creator model is known. The current SpecCanvas MCP contract uses the compact model identity shape:

```json
{
  "identityKey": "codex:openai:gpt-5.5",
  "provider": "openai",
  "model": "GPT",
  "version": "5.5"
}
```

Use the actual identity from the local global agent rules, environment, or agent profile. The JSON above is an example shape, not a universal default.

Identity resolution order:

1. If `AGENT_IDENTITY_KEY` is set, use it as the source of truth and find the matching registered provider/model/version.
2. If `AGENT_MODEL_PROVIDER`, `AGENT_MODEL`, and `AGENT_MODEL_VERSION` are set, pass those values with the matching identity key.
3. If the current CLI/session exposes the active model unambiguously, map it to the registered model identity.
4. If the active model is unknown or ambiguous, do not invent a new identity. Ask the user or omit model identity for manual/legacy flows.

Use `resolve_model_identity` with `{ identityKey, provider, model, version }` when a tool call needs a `modelId`. For `add_implementation`, prefer passing `modelIdentity` directly unless a resolved `modelId` is already available.

Do not use `agentName` as identity metadata. `agentName` is only a manual fallback for legacy/UI-created implementations when no model identity is available.

## Failure Handling

- If MCP tools are unavailable, do not fabricate tool calls or connection details.
- If auth fails, ask the user to configure the MCP token or server.
- If a target project, document, screen, or revision is ambiguous, list the concrete candidates and ask which one to use.
- If model identity is ambiguous, ask the user to provide the active model identity instead of creating a new model silently.
- If a tool rejects the spec, fix the spec according to the error and retry once.
