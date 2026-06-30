# Progressive Precision Levels

Use this reference when creating or revising a UI Spec with an explicit precision level: L0, L1, L2, L3, control level, exploration, structure, behavior, or implementation-ready.

## Global Rule

User intent overrides level defaults. The level controls typical depth, not permission.

If the user asks for theme, colors, blocks, navigation, behavior, or detailed structure, include those details even at L0. If the user asks for a single-screen concept, do not force templates or navigation just because a level normally allows them.

## L0 / Exploration

Purpose: discover what screens and features are needed, not how every part works.

Required:
- `metadata.name`
- `metadata.description`
- screens with `id`, `title`, and `purpose`

Optional when requested or helpful:
- theme or visual direction
- basic blocks for explicitly mentioned sections
- navigation hints for described user flows

Keep it light, but reflect concrete user requirements. Exploration does not mean empty; it means choosing the right product structure before deeper detail.

## L1 / Structure

Purpose: define screen layout and major visible structure.

Include:
- `metadata.theme` when relevant
- meaningful screen `blocks`
- columns, major regions, reusable templates, and basic navigation when useful

Avoid detailed behavior, exact styling, and implementation mechanics.

## L2 / Behavior

Purpose: define detailed structure, user-facing states, interactions, and semantic behavior.

Include:
- block hierarchy
- important states and modes
- interactions and conditional visibility
- semantic palette and responsive intent
- templates and navigation when they clarify reuse or flow

Avoid exact px/rem values, CSS mechanics, and implementation-only details unless the user asks for them.

## L3 / Implementation Ready

Purpose: provide enough product and UI detail for direct implementation.

May include:
- exact layout constraints when they express required behavior
- detailed visual styling
- specific interaction behavior
- animation or effect intent
- responsive rules

Still keep product intent separate from incidental CSS churn, framework internals, and post-implementation polish.
