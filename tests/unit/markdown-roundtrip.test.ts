import { describe, expect, it } from 'vitest';

import { deserializeMd, serializeMd, MarkdownPlugin } from '@platejs/markdown';
import { KEYS } from 'platejs';
import { createPlateEditor } from 'platejs/react';

import { MarkdownKit } from '../../src/webview/components/editor/plugins/markdown-kit';
import { CODE_DRAWING_PRESETS } from '../../src/webview/lib/code-drawing-presets';
import { normalizeOpenDocumentMarkdown } from '../../src/webview/lib/markdown-open-normalize';
import {
  deserializeMarkdownToPlateValue,
  serializePlateValueWithConversionEditor,
} from '../../src/webview/lib/markdown-plate-conversion';

describe('@platejs/markdown roundtrip', () => {
  it('deserializes and serializes common markdown blocks', () => {
    const editor = createPlateEditor({
      plugins: [MarkdownPlugin],
      value: [
        {
          children: [{ text: '' }],
          type: 'p',
        },
      ],
    });

    const source = '# title\n\nparagraph\n\n`code`';
    const value = deserializeMd(editor, source);
    const markdown = serializeMd(editor, { value });

    expect(markdown).toContain('# title');
    expect(markdown).toContain('paragraph');
    expect(markdown).toContain('`code`');
  });

  it('normalizes unsupported structures into serializable output', () => {
    const editor = createPlateEditor({
      plugins: [MarkdownPlugin],
      value: [
        {
          children: [{ text: '' }],
          type: 'p',
        },
      ],
    });

    const source = '# title\n\n<details><summary>x</summary>y</details>';
    const value = deserializeMd(editor, source);
    const markdown = serializeMd(editor, { value });

    expect(markdown.length).toBeGreaterThan(0);
    expect(markdown).toContain('# title');
  });

  it('serializes code drawing nodes to diagram code fences', () => {
    const editor = createPlateEditor({
      plugins: MarkdownKit,
      value: [
        {
          children: [{ text: '' }],
          type: 'p',
        },
      ],
    });

    const markdown = serializeMd(editor, {
      value: [
        {
          children: [{ text: '' }],
          data: {
            code: 'graph TD;\n  A-->B;',
            drawingMode: 'Both',
            drawingType: 'Mermaid',
          },
          type: KEYS.codeDrawing,
        },
      ],
    });

    expect(markdown).toContain('```mermaid');
    expect(markdown).toContain('graph TD;');
    expect(markdown).toContain('  A-->B;');
  });

  it('serializes graphviz and flowchart code drawing nodes to matching fences', () => {
    const editor = createPlateEditor({
      plugins: MarkdownKit,
      value: [
        {
          children: [{ text: '' }],
          type: 'p',
        },
      ],
    });

    const graphviz = serializeMd(editor, {
      value: [
        {
          children: [{ text: '' }],
          data: {
            code: 'digraph G { A -> B; }',
            drawingMode: 'Both',
            drawingType: 'Graphviz',
          },
          type: KEYS.codeDrawing,
        },
      ],
    });

    const flowchart = serializeMd(editor, {
      value: [
        {
          children: [{ text: '' }],
          data: {
            code: 'st=>start: Start',
            drawingMode: 'Both',
            drawingType: 'Flowchart',
          },
          type: KEYS.codeDrawing,
        },
      ],
    });

    expect(graphviz).toContain('```graphviz');
    expect(graphviz).toContain('digraph G { A -> B; }');
    expect(flowchart).toContain('```flowchart');
    expect(flowchart).toContain('st=>start: Start');
  });

  it('deserializes diagram code fences to code drawing nodes', () => {
    const editor = createPlateEditor({
      plugins: MarkdownKit,
      value: [
        {
          children: [{ text: '' }],
          type: 'p',
        },
      ],
    });

    const value = deserializeMd(editor, '```mermaid\ngraph TD;\n  A-->B;\n```');

    expect(value[0]).toMatchObject({
      data: {
        code: 'graph TD;\n  A-->B;',
        drawingMode: 'Both',
        drawingType: 'Mermaid',
      },
      type: KEYS.codeDrawing,
    });
  });

  it('roundtrips Excalidraw blocks through MDX without losing drawing data', () => {
    const markdown = serializePlateValueWithConversionEditor([
      {
        children: [{ text: '' }],
        data: {
          elements: [
            {
              id: 'rect-1',
              type: 'rectangle',
              x: 10,
              y: 20,
            },
          ],
          files: {
            'file-1': {
              dataURL: 'data:image/png;base64,abc',
              id: 'file-1',
              mimeType: 'image/png',
            },
          },
          state: {
            name: 'Architecture sketch',
            theme: 'dark',
          },
        },
        type: KEYS.excalidraw,
      } as any,
      {
        children: [{ text: 'Content below drawing' }],
        type: KEYS.p,
      },
    ]);

    const reopened = deserializeMarkdownToPlateValue(markdown).value;
    const serializedAgain = serializePlateValueWithConversionEditor(reopened);

    expect(markdown).toContain('<excalidraw ');
    expect(reopened[0]).toMatchObject({
      data: {
        elements: [
          {
            id: 'rect-1',
            type: 'rectangle',
          },
        ],
        files: {
          'file-1': {
            mimeType: 'image/png',
          },
        },
        state: {
          name: 'Architecture sketch',
          theme: 'dark',
        },
      },
      type: KEYS.excalidraw,
    });
    expect(reopened[1]).toMatchObject({
      children: [{ text: 'Content below drawing' }],
      type: KEYS.p,
    });
    expect(serializedAgain).toBe(markdown);
  });

  it('keeps content after a sequence diagram code drawing outside the drawing on reopen', () => {
    const preset = CODE_DRAWING_PRESETS.find(
      (item) => item.id === 'mermaid-sequence'
    );

    expect(preset).toBeTruthy();

    const markdown = serializePlateValueWithConversionEditor([
      {
        children: [{ text: '' }],
        data: {
          code: preset!.code,
          drawingMode: 'Both',
          drawingType: preset!.drawingType,
        },
        type: KEYS.codeDrawing,
      },
      {
        children: [{ text: 'Content below diagram' }],
        type: KEYS.p,
      },
    ]);

    const reopened = deserializeMarkdownToPlateValue(markdown).value;

    expect(markdown).toContain('```mermaid');
    expect(markdown).toContain('```\n\nContent below diagram');
    expect(reopened[0]).toMatchObject({
      data: {
        drawingType: 'Mermaid',
      },
      type: KEYS.codeDrawing,
    });
    expect(JSON.stringify((reopened[0] as any).data?.code)).not.toContain(
      'Content below diagram'
    );
    expect(reopened[1]).toMatchObject({
      children: [{ text: 'Content below diagram' }],
      type: KEYS.p,
    });
  });

  it('keeps non-diagram code fences as code blocks', () => {
    const editor = createPlateEditor({
      plugins: MarkdownKit,
      value: [
        {
          children: [{ text: '' }],
          type: 'p',
        },
      ],
    });

    const value = deserializeMd(editor, '```ts\nconst x = 1;\n```');

    expect(value[0]).toMatchObject({
      lang: 'ts',
      type: KEYS.codeBlock,
    });
  });

  it('continues parsing after angle-bracket placeholders in requirement templates', () => {
    const editor = createPlateEditor({
      plugins: MarkdownKit,
      value: [
        {
          children: [{ text: '' }],
          type: 'p',
        },
      ],
    });

    const source = [
      '# Описание User Story',
      '',
      '## Эпик',
      '',
      'Epic Link: <Ссылка на Epic в JIRA>',
      '',
      'Описание: <Верхнеуровневое описание эпика>',
      '',
      '---',
      '',
      '## US.1 <Наименование USER STORY>',
      '',
      '### Бекенд',
      '',
      'Текст после плейсхолдера должен сохраниться.',
    ].join('\n');
    const value = deserializeMd(editor, normalizeOpenDocumentMarkdown(source));
    const markdown = serializeMd(editor, { value });

    expect(markdown).toContain('US.1');
    expect(markdown).toContain('### Бекенд');
    expect(markdown).toContain('Текст после плейсхолдера должен сохраниться.');
  });

  it('keeps a table after a user story placeholder heading', () => {
    const editor = createPlateEditor({
      plugins: MarkdownKit,
      value: [
        {
          children: [{ text: '' }],
          type: 'p',
        },
      ],
    });

    const source = [
      '## US.1 <Наименование USER STORY>',
      '| Поле | Значение |',
      '| --- | --- |',
      '| Статус | Draft |',
    ].join('\n');
    const value = deserializeMd(editor, normalizeOpenDocumentMarkdown(source));
    const markdown = serializeMd(editor, { value });

    expect(value[0]).toMatchObject({ type: KEYS.h2 });
    expect(value[1]).toMatchObject({ type: KEYS.table });
    expect(markdown).toContain('US.1');
    expect(markdown).toContain('Поле');
    expect(markdown).toContain('Значение');
    expect(markdown).toContain('Статус');
    expect(markdown).toContain('Draft');
  });

  it('keeps text after br in the same markdown table cell', () => {
    const editor = createPlateEditor({
      plugins: MarkdownKit,
      value: [
        {
          children: [{ text: '' }],
          type: 'p',
        },
      ],
    });

    const source = [
      '| A | B | C |',
      '| --- | --- | --- |',
      '| left | middle | **БД** описание <br> **Фронт** описание |',
    ].join('\n');
    const value = deserializeMd(editor, normalizeOpenDocumentMarkdown(source));
    const table = value[0] as {
      children?: Array<{ children?: Array<{ children?: unknown[] }> }>;
    };
    const rows = table.children ?? [];
    const bodyRow = rows[1];
    const cells = bodyRow?.children ?? [];
    const thirdCell = cells[2];

    expect(rows).toHaveLength(2);
    expect(cells).toHaveLength(3);
    expect(JSON.stringify(thirdCell)).toContain('Фронт');
  });

  it('preserves table cell br paragraphs, formatting, and links', () => {
    const editor = createPlateEditor({
      plugins: MarkdownKit,
      value: [
        {
          children: [{ text: '' }],
          type: 'p',
        },
      ],
    });

    const source = [
      '| Field | Description |',
      '| --- | --- |',
      '| История | *Пример:* <br> ***Дополнительно*** <br> *Статьи о правильной формулировке US и критериев приемки:* <br> * https://mapp.sberbank.ru/app/mapp/318735047 <br> * https://habr.com/ru/companies/X5Tech/articles/723742/ <br> * https://www.visual-paradigm.com/guide/agile-software-development/what-is-user-story/ |',
    ].join('\n');
    const value = deserializeMd(editor, normalizeOpenDocumentMarkdown(source));
    const table = value[0] as {
      children?: Array<{ children?: Array<{ children?: unknown[] }> }>;
    };
    const descriptionCell = table.children?.[1]?.children?.[1] as
      | { children?: unknown[] }
      | undefined;
    const serialized = serializeMd(editor, { value });
    const cellJson = JSON.stringify(descriptionCell);

    expect(descriptionCell?.children?.length).toBeGreaterThan(3);
    expect(cellJson).toContain('"italic":true');
    expect(cellJson).toContain('"bold":true');
    expect(cellJson).toContain('"type":"a"');
    expect(cellJson).toContain('"url":"https://mapp.sberbank.ru/app/mapp/318735047"');
    expect(serialized).toContain('<br/>');
    expect(serialized).toContain(
      '[https://habr.com/ru/companies/X5Tech/articles/723742/](https://habr.com/ru/companies/X5Tech/articles/723742/)'
    );
    expect(serialized).toContain(
      '[https://www.visual-paradigm.com/guide/agile-software-development/what-is-user-story/](https://www.visual-paradigm.com/guide/agile-software-development/what-is-user-story/)'
    );
  });

  it('preserves DS template bold labels, following line break, and code placeholders', () => {
    const editor = createPlateEditor({
      plugins: MarkdownKit,
      value: [
        {
          children: [{ text: '' }],
          type: 'p',
        },
      ],
    });

    const source = [
      '**Шаблон документации DS-агента**',
      '',
      '**Часть 1. Бизнес-часть (для команды DS)**',
      '',
      '**1.1. Цель**',
      'Что писать: 2-3 предложения о том, зачем создаётся агент.',
      '',
      'Пример структуры:',
      '```',
      'Проблема: <описание текущей проблемы>',
      'Решение: <как агент решает проблему>',
      '```',
    ].join('\n');
    const value = deserializeMd(editor, normalizeOpenDocumentMarkdown(source));
    const serialized = serializeMd(editor, { value });
    const valueJson = JSON.stringify(value);
    const findTextLeaf = (nodes: unknown[], text: string): Record<string, unknown> | null => {
      for (const node of nodes) {
        if (!node || typeof node !== 'object') {
          continue;
        }

        const candidate = node as { children?: unknown[]; text?: unknown };
        if (candidate.text === text) {
          return candidate as Record<string, unknown>;
        }

        if (Array.isArray(candidate.children)) {
          const nested = findTextLeaf(candidate.children, text);
          if (nested) {
            return nested;
          }
        }
      }

      return null;
    };

    expect(valueJson).toContain('"bold":true');
    expect(valueJson).toContain('"text":"\\n"');
    expect(findTextLeaf(value, '1.1. Цель')).toMatchObject({ bold: true });
    expect(serialized).toContain('**Шаблон документации DS-агента**');
    expect(serialized).toContain('**Часть 1. Бизнес-часть (для команды DS)**');
    expect(serialized).toContain('**1.1. Цель**\\\nЧто писать:');
    expect(serialized).toContain('Проблема: <описание текущей проблемы>');
    expect(serialized).not.toContain('&lt;описание текущей проблемы&gt;');
  });
});
