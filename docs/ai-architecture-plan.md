# AI Features Architecture Plan

## Purpose
Define a stable high-level architecture for AI features in Maden so implementation can evolve without losing system clarity.

## Architectural Overview
- **Editor UI (Webview)**: Collects user intent (AI actions/settings) and renders AI output in Plate editor.
- **Host Bridge (Typed Messages)**: Transports requests/responses between webview and VS Code extension host.
- **AI Runtime (Extension Host)**: Owns provider selection, request orchestration, streaming normalization, and cancellation.
- **Provider Layer**: Pluggable adapters for OpenAI, Anthropic, Gemini, OpenRouter, Codex CLI, and GigaChat (native + OpenAI-compatible).
- **Configuration Layer**: Single active provider settings (non-secrets in config, secrets in VS Code SecretStorage).

## Key Architectural Decisions
- AI inference runs in the **extension host**, not directly in webview.
- Webview does not persist raw API keys.
- Provider integration follows **factory + adapter** pattern.
- Provider outputs are normalized into a single internal stream format before sending to UI.
- Existing AI text actions in editor are reused; transport/runtime is replaced behind them.

## GigaChat Strategy
- Support both modes under one provider family:
- **Native protocol adapter**.
- **OpenAI-compatible adapter**.
- Mode is selected in provider settings and resolved by provider factory.

## Codex CLI Strategy
- Support local `codex exec` as a provider mode for users with Codex subscription/authenticated CLI.
- Extension host invokes CLI and normalizes output into the same stream contract as API providers.

## Future Evolution Path
- Keep configuration model compatible with future profile support.
- Keep provider adapters isolated to reduce churn when APIs change.
- Keep host/webview message contracts versioned and backward-safe.

## Update Reminder
When any of the following changes, update this document in the same PR:
- AI message contract between webview and extension host.
- Provider set, provider factory rules, or provider runtime ownership.
- Secret/config storage boundaries.
- GigaChat mode behavior (native vs OpenAI-compatible).
