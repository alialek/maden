# Changelog

## 0.0.6

### Added

#### AI writing

- Added AI actions for selected text: improve writing, comment, emojify, make longer, make shorter, fix spelling and grammar, simplify language, insert below, and try again.
- Added focused AI rewrite context so Maden sends nearby Markdown paragraphs around the selected fragment and asks the model to edit only that fragment.
- Added subtle shimmer loading state over the selected block while AI rewrite/comment actions are running.
- Added support for local CLI-based AI providers without requiring an API token in Maden.

#### Editing workflow

- Added source-view split button to open the underlying Markdown beside the visual editor.
- Added editing, viewing, and suggestion modes.
- Added comments and suggestions UI for reviewing changes.
- Added wider editor layout, topbar visibility toggle, and typography choices.

#### Markdown blocks

- Added Excalidraw block support with Markdown/MDX persistence.
- Added Code Drawing blocks for diagram-style code fences, including Mermaid, Graphviz, and Flowchart.
- Added document outline/TOC block.
- Added richer slash-menu insertion for callouts, toggles, columns, media, files, equations, dates, and diagrams.

#### Appearance

- Added Maden settings for theme selection: inherit VS Code, light, dark, and Confluence.
- Added typography modes: default, serif, and mono.

#### Export

- Added export actions from the editor menu for HTML, PDF, and DOCX.

#### Developer diagnostics

- Added Markdown conversion debug commands: `npm run debug:markdown -- <file.md>` and `npm run debug:plate -- <plate.json> --compare <file.md>`.
- Added save-stability debug outputs for raw serializer output and reconciled Markdown output.

### Changed

- Improved Markdown save stability by reconciling Plate serialization with the original source formatting for unchanged content.
- Improved Markdown import/open normalization for HTML images, paragraph HTML, placeholders, `<br>` handling, and formatted soft breaks.
- Reworked AI command payloads to send focused Markdown context around the selected fragment instead of broad editor state.
- Improved editor toolbar, slash menu, popover placement, hover states, and suggestion/comment UI behavior.

### Fixed

- Fixed unwanted Markdown serializer noise around emphasis markers, thematic breaks, escaped placeholders, table whitespace, and fenced code blocks.
- Fixed preservation of empty paragraphs during Markdown roundtrip/save.
- Fixed table row whitespace normalization after edits.
- Fixed content placement after diagram fences on reopen/save.
- Fixed AI rewrite loading state to use a subtle shimmer over the selected block.
- Fixed hover behavior for AI menu items and suggestion action buttons.
- Fixed Codex CLI provider flow so it does not require entering an API token in Maden.
