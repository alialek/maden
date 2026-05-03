# Maden

Write Markdown documents, AI skills, prompts, and agent instructions in VS Code without fighting Markdown syntax.

Maden is a Notion-inspired visual editor for real `*.md` files. It gives you a document-first writing surface while keeping Markdown on disk, so your files still work with Git, agents, CLIs, docs tooling, and normal text editors.

## How to use

Maden opens automatically as the default Markdown editor.

If needed, you can still use VS Code's native Markdown editor via **Reopen Editor With...**.

## What You Can Do

### Draft structured Markdown without memorizing syntax

Use Maden when you want to write a skill, prompt, spec, README, checklist, or project note quickly, but still save it as plain Markdown.

- Write headings, paragraphs, quotes, code blocks, dividers, tables, and lists from a visual editor.
- Insert blocks from the toolbar or slash menu instead of typing Markdown markers.
- Drag blocks, use floating formatting controls, and keep common writing actions close to the selection.
- Paste GitHub-style Markdown and common HTML snippets without cleaning everything by hand.

### Use AI on selected text

Use Maden when you want AI help for a specific fragment, not a broad rewrite of the whole file.

- Select text and run actions such as improve writing, comment, emojify, make longer, make shorter, fix spelling and grammar, simplify language, insert below, and try again.
- Maden sends focused Markdown context around the selected fragment so the model can stay coherent while editing only the target text.
- AI settings live in the editor UI. API keys are stored by the VS Code extension host in `SecretStorage` and are not persisted in the webview.
- CLI-based providers can use your local CLI auth/session without requiring an API token in Maden.

### Work with richer document blocks

Use Maden when a Markdown file needs more than paragraphs and headings.

- Build tables, task lists, toggles/details, callouts, columns, and document outlines.
- Add images, videos, audio, file blocks, web embeds, links, dates, emoji, math, and inline equations.
- Create Excalidraw blocks that roundtrip through Markdown/MDX.
- Add Code Drawing blocks for diagram-style code fences, including Mermaid, Graphviz, and Flowchart.

### Review and refine content in place

Use Maden when you want review-style editing inside a Markdown document.

- Switch between editing, viewing, and suggestion modes.
- Add comments and suggestions while reviewing a document.
- Open the raw Markdown beside the visual editor with the source-view split button.

### Shape the editor for the current task

Use Maden when you want the same Markdown file to feel like a clean writing surface, a dense editing surface, or a review surface.

- Choose theme mode: inherit VS Code, light, dark, or Confluence.
- Switch typography between default, serif, and mono.
- Toggle wide mode for larger documents.
- Hide or show the topbar.

### Export when Markdown is not the final format

Use Maden when a Markdown draft needs to become a shareable document.

- Export from the editor menu to HTML, PDF, or DOCX.
- Save exported files through the normal VS Code save dialog.

## Requirements

- VS Code `^1.95.0`

## For Contributors

```bash
npm install
npm run build:extension
```

Use `npm run build` only when you explicitly need both extension and webview
assets rebuilt.

Markdown conversion diagnostics:

```bash
npm run debug:markdown -- <file.md>
npm run debug:plate -- <plate.json> --compare <file.md>
```

`serialized.md` is the save-stable output. `serialized.raw.md` is the raw Plate serializer output for debugging serializer noise.

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
