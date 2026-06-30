# Implementation Workflow

Use this reference when creating or storing a screen implementation for a Spec Canvas UI Spec.

## Before Implementation

1. Read the relevant UI Spec screen and its important blocks.
2. Do not change the UI Spec for CSS-only or layout-only tweaks.
3. If the implementation changes product intent, update or create the UI Spec first.
4. If using MCP, read [mcp-workflow.md](./mcp-workflow.md) and resolve model identity before saving.

## HTML Implementation Rules

- Produce complete single-file HTML unless the user asks for a framework or multi-file output.
- Do not use external CDN assets unless the user explicitly allows external dependencies.
- Include enough realistic sample data to evaluate layout, states, and scanning behavior.
- Cover core states implied by the screen: empty, active, selected, loading, error, or disabled when relevant.
- Keep implementation faithful to the UI Spec intent, but do not copy spec wording as visible explanatory text.
- Make controls ergonomic and predictable for the app domain.
- Ensure text does not overflow buttons, tabs, cards, sidebars, or compact panels.

## MCP Persistence Rules

- Use `resolve_model_identity` before `add_implementation` when a separate `modelId` is useful, or pass `modelIdentity` directly to `add_implementation`.
- Pass stable model identity data as `{ identityKey, provider, model, version }`.
- `add_implementation` requires `modelIdentity`. For agent-authored implementations, pass the real model identity object and omit `agentName`.
- Prefer stable `identityKey` plus provider/model/version; do not rely on remembering UUIDs between sessions.
- Do not invent new model identities. If the active model is unknown or not registered in the global agent rules, ask the user before saving an agent-authored implementation.
- If `revisionId` is unknown, omit it. The SpecCanvas backend attaches the implementation to the latest UI Spec revision or creates the initial revision.
- Manual or legacy flows may use `agentName` only with `modelIdentity: null`. CLI/MCP agents should use stable model identity.
- Save only HTML that is complete enough to preview.
