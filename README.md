# Maden

Write AI skills and prompts without thinking about Markdown syntax.

Maden is a fast, reliable, Notion-inspired Markdown editor for VS Code.  
It opens your `*.md` files in a friendly interface with beautiful text rendering, so you can focus on content instead of Markdown symbols.

## Value Proposition

- Content-first writing for AI skills, prompts, and docs
- Notion-like editing UX inside VS Code
- Beautiful, readable rendering while preserving real Markdown files
- Fast and reliable live sync to disk
- No need to remember all Markdown rules while drafting

## Key Features

- Custom editor view type: `maden.plateMarkdownEditor` (default for `*.md`)
- Plate-based editing toolkit:
  - headings, paragraphs, lists, links, code, quotes
  - tables, media, slash commands, drag-and-drop blocks
  - math and additional rich-text plugins from the Plate stack
- Export from editor UI:
  - HTML
  - PDF
  - DOCX
- Paste/import handling for common GitHub-style Markdown + HTML snippets

## Install

1. Install **Maden** from the VS Code Marketplace.
2. Open any `.md` file.
3. Maden opens automatically as the default Markdown editor.

If needed, you can still use VS Code’s native Markdown editor via **Reopen Editor With...**.

## Configuration

Maden contributes the following settings:

- `maden.liveWriteDebounceMs` (`number`, default: `300`, min: `50`)
  - Delay before writing editor changes back to the file.

AI provider settings are managed from the editor UI and stored by the VS Code
extension host in SecretStorage. API keys are not persisted in the webview.

## Behavior Notes

- External changes (including edits from other editors/tools) are applied immediately.
- Markdown is kept as Markdown on disk; Maden does not rewrite document titles from filenames.
- Line endings are normalized to LF when the extension writes a document.

## Requirements

- VS Code `^1.95.0`

## For Contributors

```bash
npm install
npm run build:extension
```

Use `npm run build` only when you explicitly need both extension and webview
assets rebuilt.

Architecture docs:
- [AI Features Architecture Plan](./docs/ai-architecture-plan.md)

Watch mode:

```bash
npm run watch:extension
npm run watch:webview
```

Unit tests:

```bash
npm run test:unit
```

Type checks:

```bash
npm run typecheck:extension
npm run typecheck:webview
```

## License

MIT
