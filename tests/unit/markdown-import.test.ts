import { describe, expect, it } from 'vitest';

import { normalizeImportedMarkdown } from '../../src/webview/lib/markdown-import';

describe('normalizeImportedMarkdown', () => {
  it('keeps paragraph badge links inline like GitHub HTML paragraphs', () => {
    const source = `<p>
  <a href="https://example.com/release"><img src="https://img.shields.io/badge/release-v2.5.0-blue" alt="release"></a>
  <a href="https://example.com/rules"><img src="https://img.shields.io/badge/rules-161-green" alt="rules"></a>
  <a href="https://example.com/styles"><img src="https://img.shields.io/badge/styles-67-purple" alt="styles"></a>
</p>`;

    const normalized = normalizeImportedMarkdown(source).trim();

    expect(normalized).toBe(
      '| ![release](<https://img.shields.io/badge/release-v2.5.0-blue>) | ![rules](<https://img.shields.io/badge/rules-161-green>) | ![styles](<https://img.shields.io/badge/styles-67-purple>) |\n| --- | --- | --- |'
    );
  });

  it('converts image wrapped in anchor tags to markdown image', () => {
    const source =
      '<a href="https://nextlevelbuilder.io"><img src="https://example.com/banner.png" alt="banner" /></a>';

    const normalized = normalizeImportedMarkdown(source).trim();

    expect(normalized).toBe(
      '![banner](<https://example.com/banner.png>)'
    );
  });
});
