import { describe, expect, it } from 'vitest';

import { normalizeOpenDocumentMarkdown } from '../../src/webview/lib/markdown-open-normalize';

describe('normalizeOpenDocumentMarkdown', () => {
  it('rewrites image-only html paragraphs to markdown images', () => {
    const source = `<p align="center">
  <a href="https://example.com/release"><img src="https://img.shields.io/badge/release-v2.5.0-blue" alt="release"></a>
  <img src="https://img.shields.io/badge/rules-161-green" alt="rules">
  <img src="https://img.shields.io/badge/styles-67-purple" alt="styles">
</p>`;

    const normalized = normalizeOpenDocumentMarkdown(source).trim();
    expect(normalized).toBe(
      '| ![release](<https://img.shields.io/badge/release-v2.5.0-blue>) | ![rules](<https://img.shields.io/badge/rules-161-green>) | ![styles](<https://img.shields.io/badge/styles-67-purple>) |\n| --- | --- | --- |'
    );
  });

  it('keeps non-image links untouched and converts b/i tags', () => {
    const source =
      '<p><b>bold</b> and <i>italic</i> <a href="https://example.com">link</a></p>';

    const normalized = normalizeOpenDocumentMarkdown(source);
    expect(normalized).toContain('**bold**');
    expect(normalized).toContain('*italic*');
    expect(normalized).toContain('<a href="https://example.com">link</a>');
  });
});
