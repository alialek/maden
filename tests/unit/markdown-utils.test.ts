import { describe, expect, it } from 'vitest';

import {
  compactMarkdownTableWhitespace,
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

  it('preserves unchanged angle-bracket placeholders when serializer escapes them', () => {
    const previous = [
      'Epic Link: <Ссылка на Epic в JIRA>',
      '',
      '| **Product Owner** | <@ ФИО PO> | |',
      '',
    ].join('\n');
    const next = [
      'Epic Link: \\<Ссылка на Epic в JIRA>',
      '',
      '| **Product Owner** | \\<@ ФИО PO> | ​ |',
      '',
      '```mermaid',
      '```',
      '',
    ].join('\n');

    const reconciled = reconcileMarkdownPreservingUnchangedFormatting(previous, next);

    expect(reconciled).toContain('Epic Link: <Ссылка на Epic в JIRA>');
    expect(reconciled).toContain('| **Product Owner** | <@ ФИО PO> | |');
    expect(reconciled).not.toContain('\\<Ссылка');
  });

  it('preserves unchanged emphasis, nbsp, empty table cell, and code fence adjacency', () => {
    const previous = [
      '*Примеры:*',
      '',
      '<br> &nbsp;&nbsp;1.1. *Кнопка отображается*',
      '',
      '| **Product Owner** | <@ ФИО PO> | |',
      '',
      'Пример структуры:',
      '```',
      'Проблема: <описание текущей проблемы>',
      '```',
      '',
      'Tail',
      '',
    ].join('\n');

    const next = [
      '```mermaid',
      'classDiagram',
      '    Animal <|-- Dog',
      '```',
      '',
      '_Примеры:_',
      '',
      '<br/>   1.1. _Кнопка отображается_',
      '',
      '| **Product Owner** | <@ ФИО PO> | ​ |',
      '',
      'Пример структуры:',
      '',
      '```',
      'Проблема: <описание текущей проблемы>',
      '```',
      '',
      'Tail',
      '',
    ].join('\n');

    const reconciled = reconcileMarkdownPreservingUnchangedFormatting(previous, next);

    expect(reconciled).toContain('```mermaid\nclassDiagram');
    expect(reconciled).toContain('*Примеры:*');
    expect(reconciled).not.toContain('_Примеры:_');
    expect(reconciled).toContain('<br> &nbsp;&nbsp;1.1. *Кнопка отображается*');
    expect(reconciled).not.toContain('<br/>   1.1. _Кнопка отображается_');
    expect(reconciled).toContain('| **Product Owner** | <@ ФИО PO> | |');
    expect(reconciled).not.toContain('| **Product Owner** | <@ ФИО PO> |  |');
    expect(reconciled).toContain(
      'Пример структуры:\n```\nПроблема: <описание текущей проблемы>'
    );
    expect(reconciled).not.toContain('Пример структуры:\n\n```');
  });

  it('preserves star italic markers when inserting an empty Mermaid block', () => {
    const previous = [
      'Пример:',
      '*курсив*',
      '',
      '## Эпик',
      '',
    ].join('\n');

    const next = [
      'Пример:',
      '_курсив_',
      '',
      'Привет',
      '',
      '```mermaid',
      '```',
      '',
      '## Эпик',
      '',
    ].join('\n');

    const reconciled = reconcileMarkdownPreservingUnchangedFormatting(previous, next);

    expect(reconciled).toContain('*курсив*');
    expect(reconciled).not.toContain('_курсив_');
    expect(reconciled).toContain('Привет\n\n```mermaid\n```');
    expect(reconciled).toContain('```\n\n## Эпик');
  });

  it('preserves thematic break marker when inserting content after it', () => {
    const previous = ['---', '', '## Эпик', ''].join('\n');
    const next = [
      '***',
      '',
      'Пример:',
      'Привет',
      '',
      '```mermaid',
      '```',
      '',
      '## Эпик',
      '',
    ].join('\n');

    const reconciled = reconcileMarkdownPreservingUnchangedFormatting(previous, next);

    expect(reconciled).toContain('---\n\nПример:');
    expect(reconciled).not.toContain('***');
  });

  it('does not rewrite inserted Mermaid code lines from previous markdown text', () => {
    const previous = ['*курсив*', '', '## Эпик', ''].join('\n');
    const next = [
      '*курсив*',
      '',
      '```mermaid',
      '_курсив_',
      '```',
      '',
      '## Эпик',
      '',
    ].join('\n');

    const reconciled = reconcileMarkdownPreservingUnchangedFormatting(previous, next);

    expect(reconciled).toContain('```mermaid\n_курсив_\n```');
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

  it('compacts serializer-padded edited table rows', () => {
    const previous = [
      '| Поле | Описание |',
      '| --- | --- |',
      '| id | Старое описание |',
      '',
    ].join('\n');

    const next = [
      '| Поле              | Описание                       |',
      '| ----------------- | ------------------------------ |',
      '| id                | Новое описание                 |',
      '',
    ].join('\n');

    const reconciled = reconcileMarkdownPreservingUnchangedFormatting(previous, next);

    expect(reconciled).toContain('| Поле | Описание |');
    expect(reconciled).toContain('| --- | --- |');
    expect(reconciled).toContain('| id | Новое описание |');
    expect(reconciled).not.toContain('Новое описание                 |');
  });

  it('keeps newly inserted empty paragraphs from Plate serialization', () => {
    const emptyParagraphMarker = '\u200B';
    const previous = ['A', '', 'B', ''].join('\n');
    const next = [
      'A',
      '',
      emptyParagraphMarker,
      '',
      emptyParagraphMarker,
      '',
      'B',
      '',
    ].join('\n');

    const reconciled = reconcileMarkdownPreservingUnchangedFormatting(previous, next);

    expect(reconciled).toBe(next);
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

describe('compactMarkdownTableWhitespace', () => {
  it('does not treat Mermaid inheritance arrows inside fenced code as table rows', () => {
    const markdown = [
      '```mermaid',
      'classDiagram',
      '    Animal <|-- Dog',
      '```',
      '',
      '| A     | B       |',
      '| ----- | ------- |',
      '| value | another |',
      '',
    ].join('\n');

    expect(compactMarkdownTableWhitespace(markdown)).toBe(
      [
        '```mermaid',
        'classDiagram',
        '    Animal <|-- Dog',
        '```',
        '',
        '| A | B |',
        '| --- | --- |',
        '| value | another |',
        '',
      ].join('\n')
    );
  });

  it('compacts empty trailing table cells to a single space cell', () => {
    expect(
      compactMarkdownTableWhitespace('| **Product Owner** | <@ ФИО PO> | ​ |')
    ).toBe('| **Product Owner** | <@ ФИО PO> | |');
  });
});
