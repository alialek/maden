import { describe, expect, it } from 'vitest';

import {
  escapeMarkdownPlaceholderAngles,
  normalizeOpenDocumentMarkdown,
  unescapeMarkdownPlaceholderAngles,
} from '../../src/webview/lib/markdown-open-normalize';

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

  it('escapes angle-bracket placeholders that break MDX parsing', () => {
    expect(
      escapeMarkdownPlaceholderAngles(
        'Epic Link: <Ссылка на Epic в JIRA>\n\n<Alert type="info">ok</Alert>\n\n<https://example.com>'
      )
    ).toBe(
      'Epic Link: &lt;Ссылка на Epic в JIRA&gt;\n\n<Alert type="info">ok</Alert>\n\n<https://example.com>'
    );
  });

  it('unescapes markdown placeholder angles after serialization', () => {
    expect(
      unescapeMarkdownPlaceholderAngles(
        'Epic Link: \\<Ссылка на Epic в JIRA>\n\n<https://example.com>'
      )
    ).toBe('Epic Link: <Ссылка на Epic в JIRA>\n\n<https://example.com>');
  });

  it('keeps html line breaks inside markdown table rows', () => {
    const source =
      '| A | B |\n| --- | --- |\n| **БД** описание <br> **Фронт** описание | second |';

    expect(normalizeOpenDocumentMarkdown(source)).toBe(
      '| A | B |\n| --- | --- |\n| **БД** описание <br> **Фронт** описание | second |'
    );
  });

  it('still converts html line breaks outside markdown tables to newlines', () => {
    expect(normalizeOpenDocumentMarkdown('first <br> second')).toBe(
      'first \n second'
    );
  });

  it('does not escape placeholders inside fenced code blocks', () => {
    const source = [
        'Описание: <Верхнеуровневое описание эпика>',
        '',
        '```',
      'Проблема: <описание текущей проблемы>',
      'Решение: <как агент решает проблему>',
      '```',
    ].join('\n');

    expect(normalizeOpenDocumentMarkdown(source)).toBe(
      [
        'Описание: &lt;Верхнеуровневое описание эпика&gt;',
        '',
        '```',
        'Проблема: <описание текущей проблемы>',
        'Решение: <как агент решает проблему>',
        '```',
      ].join('\n')
    );
  });

  it('preserves soft breaks after standalone formatted lines', () => {
    expect(
      normalizeOpenDocumentMarkdown(
        '**1.1. Цель**\nЧто писать: 2-3 предложения'
      )
    ).toBe('**1.1. Цель**  \nЧто писать: 2-3 предложения');
  });

  it('preserves soft breaks after standalone italic example labels', () => {
    expect(
      normalizeOpenDocumentMarkdown(
        [
          '*Пример:*',
          '*Доработать JSON-структуру события <Ссылка на событие>* [Требования к аудиту <Наименование продукта>]',
        ].join('\n')
      )
    ).toBe(
      [
        '*Пример:*  ',
        '*Доработать JSON-структуру события &lt;Ссылка на событие&gt;* [Требования к аудиту &lt;Наименование продукта&gt;]',
      ].join('\n')
    );
  });
});
