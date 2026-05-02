# Plate empty blocks are lost on Markdown save

## Summary

When a user adds several empty blocks in the Plate editor, those blocks may not appear in the saved Markdown file. The visible editor state changes, but the host-side save pipeline can treat the resulting extra blank lines as serializer noise and write the previous Markdown back to disk.

This is a data-preservation issue for intentional spacing/empty paragraph edits.

## Current pipeline

1. The user adds empty paragraph blocks in Plate.
2. The webview serializes Plate value to Markdown through `serializePlateValueToMarkdown`.
3. The webview sends `documentChanged` with the serialized Markdown.
4. `MadenMarkdownEditorProvider` normalizes line endings and applies `enforceTitleHeading`.
5. The host calls `reconcileMarkdownPreservingUnchangedFormatting(previousText, serializedOutput)`.
6. The reconcile step may return `previousText` if the only semantic difference is blank lines.

Relevant files:

- `src/webview/lib/markdown-plate-conversion.ts`
  - `serializePlateValueToMarkdown`
  - `canonicalizeMarkdown`
  - `normalizeClipboardMarkdown`
- `src/extension/MadenMarkdownEditorProvider.ts`
  - `flushPendingMarkdownForDocument`
  - `flushPendingWrite`
  - `documentChanged` handler
- `src/shared/markdown-format-reconcile.ts`
  - `reconcileMarkdownPreservingUnchangedFormatting`

## Root cause

The aggressive save-stability reconcile logic removes empty semantic lines before deciding whether the new Markdown is meaningfully different:

```ts
const previousSemanticWithoutEmpty = previousSemantic.filter((line) => line.length > 0);
const nextSemanticWithoutEmpty = nextSemantic.filter((line) => line.length > 0);

if (
  previousSemanticWithoutEmpty.length === nextSemanticWithoutEmpty.length &&
  previousSemanticWithoutEmpty.every((line, index) => line === nextSemanticWithoutEmpty[index])
) {
  return previousNormalized;
}
```

This was added to avoid rewriting unchanged files because Plate serialization can produce formatting noise. However, it also makes intentional blank-line edits look insignificant.

## Why this happens

If the original Markdown is:

```md
First paragraph

Second paragraph
```

and Plate serializes a user edit as:

```md
First paragraph



Second paragraph
```

then both versions have the same non-empty semantic lines:

```txt
first paragraph
second paragraph
```

The reconcile step returns the previous Markdown, so the newly added empty blocks disappear from disk.

## Important distinction

There are other normalizers in the codebase, but they are not the primary save-loss cause here:

- `canonicalizeMarkdown(...).trimEnd()` is used for comparisons/sync and can hide trailing blank-line differences in equality checks.
- `normalizeClipboardMarkdown(...).replace(/\n{3,}/g, '\n\n')` is clipboard-specific.
- The direct Plate serializer path does not explicitly collapse all blank lines in `serializePlateValueToMarkdown`.

The critical behavior is the host-side `reconcileMarkdownPreservingUnchangedFormatting` returning `previousNormalized` when empty lines are the only difference.

## Expected behavior

Intentional empty Plate blocks should be preserved in Markdown save output when they come from a real webview `documentChanged` event.

Unchanged files should still avoid unnecessary rewrites caused by Markdown serializer punctuation/formatting changes.

## Suggested fix direction

Make reconcile less aggressive for blank lines:

- Do not ignore empty semantic lines unconditionally.
- Preserve the old exact-output optimization when `previousNormalized === nextNormalized`.
- Keep the same-line semantic formatting preservation for punctuation-only changes.
- Treat blank-line count/placement changes as meaningful when they come from webview save output.

Possible implementation options:

1. Remove the `previousSemanticWithoutEmpty` / `nextSemanticWithoutEmpty` early return.
2. Add a mode option, for example `{ preserveBlankLineChanges: true }`, and use it for webview-originated saves.
3. Replace the empty-line-insensitive early return with a narrower heuristic that only ignores known serializer noise around tables/details, not arbitrary blank lines between paragraphs.

## Acceptance checks

- Add a unit test for `reconcileMarkdownPreservingUnchangedFormatting` where only blank-line count changes and the new Markdown must be returned.
- Add a save-pipeline regression test, if practical, for Plate value containing consecutive empty paragraph nodes.
- Run:

```sh
npm run test:unit
npm run typecheck:webview
npm run build:extension
```

