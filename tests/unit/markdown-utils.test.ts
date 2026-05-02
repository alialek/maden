import { describe, expect, it } from 'vitest';

import {
  enforceTitleHeading,
  reconcileMarkdownPreservingUnchangedFormatting,
} from '../../src/extension/markdownUtils';

describe('enforceTitleHeading', () => {
  it('keeps markdown text as-is (no implicit heading rewrite)', () => {
    const result = enforceTitleHeading('hello\nworld', '/tmp/my-note.md');

    expect(result).toBe('hello\nworld');
  });

  it('does not replace explicit headings', () => {
    const result = enforceTitleHeading('# Old title\n\ncontent', '/tmp/new-title.md');

    expect(result).toBe('# Old title\n\ncontent');
  });

  it('normalizes CRLF line endings only', () => {
    const original = '# exact-name\n\ncontent';
    const result = enforceTitleHeading(original.replace(/\n/g, '\r\n'), '/tmp/exact-name.md');

    expect(result).toBe(original);
  });
});

describe('reconcileMarkdownPreservingUnchangedFormatting', () => {
  it('keeps original formatting when semantic content is unchanged', () => {
    const previous = [
      '# note',
      '',
      '---',
      '',
      'Intro',
      '1. One',
      '2. Two',
      '',
      '- nested',
      '',
    ].join('\n');

    const next = [
      '# note',
      '',
      '***',
      '',
      'Intro',
      '',
      '1. One',
      '2. Two',
      '',
      '* nested',
      '',
    ].join('\n');

    const reconciled = reconcileMarkdownPreservingUnchangedFormatting(previous, next);
    expect(reconciled).toBe(previous);
  });

  it('applies edited lines but preserves unchanged lines formatting', () => {
    const previous = [
      '# note',
      '',
      '---',
      '',
      'Context line',
      '1. One',
      '2. Two',
      '',
      'Tail old',
      '',
    ].join('\n');

    const next = [
      '# note',
      '',
      '***',
      '',
      'Context line',
      '',
      '1. One',
      '2. Two',
      '',
      'Tail new',
      '',
    ].join('\n');

    const reconciled = reconcileMarkdownPreservingUnchangedFormatting(previous, next);

    expect(reconciled).toContain('---');
    expect(reconciled).toContain('1. One\n2. Two');
    expect(reconciled).toContain('Tail new');
    expect(reconciled).not.toContain('***');
  });

  it('preserves original markdown when Plate only normalizes formatting noise', () => {
    const previous = [
      '---',
      '',
      '- [link](#target)',
      '  - nested',
      '',
      '|  |  |',
      '| --- | --- |',
      '| *Пример:* <br> * https://example.com | [Требования <Продукт>] |',
      '',
      '**1.1. Цель**',
      'Что писать:',
      '',
    ].join('\n');

    const next = [
      '***',
      '',
      '* [link](#target)',
      '',
      '  * nested',
      '',
      '| ​ | ​ |',
      '| ---------------- | ---------------- |',
      '| _Пример:_ <br/> \\* [https://example.com](https://example.com) | \\[Требования <Продукт>] |',
      '',
      '**1.1. Цель**\\',
      'Что писать:',
      '',
    ].join('\n');

    expect(reconcileMarkdownPreservingUnchangedFormatting(previous, next)).toBe(previous);
  });

  it('keeps actual content edits while preserving unchanged surrounding formatting', () => {
    const previous = [
      '---',
      '',
      '| Поле | Описание |',
      '| --- | --- |',
      '| id | Старое описание |',
      '',
    ].join('\n');

    const next = [
      '***',
      '',
      '| Поле | Описание |',
      '| ----- | -------- |',
      '| id | Новое описание |',
      '',
    ].join('\n');

    const reconciled = reconcileMarkdownPreservingUnchangedFormatting(previous, next);

    expect(reconciled).toContain('---');
    expect(reconciled).toContain('| id | Новое описание |');
    expect(reconciled).not.toContain('***');
  });

  it('does not drop closing code fences when inserting a diagram before existing content', () => {
    const previous = ['# note', '', 'Content below diagram', ''].join('\n');
    const next = [
      '# note',
      '',
      '```mermaid',
      'sequenceDiagram',
      '    participant Client',
      '    participant Server',
      '    Client->>Server: Request data',
      '```',
      '',
      'Content below diagram',
      '',
    ].join('\n');

    const reconciled = reconcileMarkdownPreservingUnchangedFormatting(previous, next);

    expect(reconciled).toContain('```mermaid\nsequenceDiagram');
    expect(reconciled).toContain('Client->>Server: Request data\n```');
    expect(reconciled).toContain('```\n\nContent below diagram');
  });
});
