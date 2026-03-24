# AGENTS.md

## Confidence Rule
- If you are not confident in an answer or implementation detail, ask for clarification before guessing.

## Communication Style
- Keep responses concise and actionable.
- Prefer concrete status updates over long explanations.
- Include exact file paths/commands when reporting changes.

## Preferred DX Workflow
- By default, build only extension code: `npm run build:extension`.
- Do not run web build unless explicitly requested.
- After AI-related code changes, run extension build and report result.

## AI Editing Behavior (Important)
- For rewrite actions, send markdown context, not JSON blob.
- Context must include:
  - 2 nearest non-empty paragraphs above target
  - target fragment to edit
  - 2 nearest non-empty paragraphs below target
- Clearly mark target fragment in prompt/context.
- AI must edit only target fragment and return only replacement text (no headings like "Improved version", no extra wrappers).

## AI Logging (Output -> Maden)
- Log full outgoing AI request payload.
- Log normalized user content actually sent to model.
- Log full AI response text (or partial on failure).

## UI Expectations for AI
- Hover state must work for floating AI action menu items.
- Hover state must work for suggestion action buttons (Accept/Discard/Insert below/Try again).
- Loading state for rewrite should use subtle shimmer over selected block, not bright color glow.

## Codex CLI Provider
- For `codex-cli`, do not require entering API token in UI by default.
