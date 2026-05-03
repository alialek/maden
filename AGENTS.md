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

## Markdown Conversion Debugging
- `npm run debug:markdown -- <file.md>` and `npm run debug:plate -- <plate.json>` must stay fully identical to extension conversion behavior.
- These utilities must import production conversion entrypoints from `src/webview/lib/markdown-plate-conversion.ts` and shared save-format reconcile from `src/shared/markdown-format-reconcile.ts`; do not add console-only or extension-only Markdown/Plate conversion logic.
- Use `debug:markdown` for Markdown -> Plate diagnostics and `debug:plate -- <plate.json> --compare <file.md>` for Plate -> Markdown/save-stability diagnostics.
- `serialized.md` is the save-stable output; `serialized.raw.md` is the raw Plate serializer output for debugging serializer noise.

## Conversion Fix Verification Rule
- When fixing Markdown/Plate conversion or save-stability bugs, prove that the fix is actually applied through the same production path used by the extension, not through an isolated helper or expectation-only test.
- Always cover both levels:
  - a minimal regression test that reproduces the exact symptom;
  - a full-file roundtrip/debug run that applies the real edit, removes only the intentionally inserted/changed fragment, and diffs the remaining document against the original.
- Treat serializer noise as a first-class failure: emphasis marker swaps (`*` vs `_`), thematic break swaps (`---` vs `***`), escaped placeholders (`<...>` vs `\<...>`), table whitespace, `<br>` normalization, and inserted blank lines can break save stability even when rendered content looks unchanged.
- In reconcile logic, compare semantic equality separately from source preservation: use semantic matching to identify unchanged lines, but write back the original line for unchanged content and never apply Markdown formatting preservation inside fenced code blocks.
- If a fix seems correct but the user still reproduces the issue, inspect the raw serializer output and the save-stable output side by side; the bug is often in the gap between parsed Plate state, raw serialization, and host-side reconcile.

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

## Checking the original solution
- If needed to check original plate solution navigate to this website via chrome mcp https://platejs.org/blocks/playground

## Checking our current soultion
- If needed to check how elements rendered or errors raised, run a web server of extension and navigate to localhost via MCP
