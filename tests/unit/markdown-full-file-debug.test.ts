/// <reference types="node" />

import { existsSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';

import { describe, expect, it } from 'vitest';
import { KEYS } from 'platejs';

import { reconcileMarkdownPreservingUnchangedFormatting } from '../../src/shared/markdown-format-reconcile';
import {
  canonicalizeMarkdown,
  roundTripMarkdownWithPlate,
  serializePlateValueWithConversionEditor,
} from '../../src/webview/lib/markdown-plate-conversion';
import { findTextLeaf } from './test-node-helpers';

const DEFAULT_DEBUG_FILE = '/Users/alek/Downloads/Шаблоны требований (1).md';
const debugFile = process.env.MADEN_MARKDOWN_DEBUG_FILE ?? DEFAULT_DEBUG_FILE;
const fileExists = existsSync(debugFile);
const itIfDebugFileExists = fileExists ? it : it.skip;
const itIfStrictRoundTrip =
  fileExists && process.env.MADEN_MARKDOWN_STRICT_ROUNDTRIP === '1' ? it : it.skip;

describe('full-file markdown debug conversion', () => {
  itIfDebugFileExists('parses the full debug markdown file through production conversion', () => {
    const source = readFileSync(debugFile, 'utf8');
    const result = roundTripMarkdownWithPlate(source, {
      context: {
        fileName: basename(debugFile),
        filePath: debugFile,
      },
    });
    const valueJson = JSON.stringify(result.value);

    expect(result.value.length).toBeGreaterThan(1);
    expect(result.serializedMarkdown).toContain(
      'Epic Link: <Ссылка на Epic в JIRA>'
    );
    expect(result.serializedMarkdown).not.toContain(
      'Epic Link: &lt;Ссылка на Epic в JIRA>'
    );
    expect(valueJson).toContain('Фронт');
    expect(valueJson).toContain('https://habr.com/ru/companies/X5Tech/articles/723742/');
    expect(findTextLeaf(result.value, '1.1. Цель')).toMatchObject({ bold: true });
    expect(result.serializedMarkdown).toContain(
      '_Пример:_\\\n_Доработать JSON-структуру события'
    );
    expect(result.serializedMarkdown).toContain(
      '_Пример:_\\\n_В рамках задачи реализовать хранение метрики'
    );
    expect(result.serializedMarkdown).toContain('Проблема: <описание текущей проблемы>');
    expect(result.serializedMarkdown).not.toContain('&lt;описание текущей проблемы&gt;');
  });

  itIfDebugFileExists('preserves unrelated formatting when inserting a code drawing block', () => {
    const source = readFileSync(debugFile, 'utf8');
    const result = roundTripMarkdownWithPlate(source, {
      context: {
        fileName: basename(debugFile),
        filePath: debugFile,
      },
    });
    const valueWithDrawing = [...result.value];
    const insertIndex = valueWithDrawing.findIndex((node) => node.type === KEYS.hr) + 1;
    const diagram = [
      'classDiagram',
      '    class Animal {',
      '        +String name',
      '        +int age',
      '        +makeSound()',
      '    }',
      '    class Dog {',
      '        +String breed',
      '        +bark()',
      '    }',
      '    Animal <|-- Dog',
    ].join('\n');

    valueWithDrawing.splice(insertIndex > 0 ? insertIndex : 1, 0, {
      children: [{ text: '' }],
      data: {
        code: diagram,
        drawingMode: 'Both',
        drawingType: 'Mermaid',
      },
      type: KEYS.codeDrawing,
    });

    const saved = reconcileMarkdownPreservingUnchangedFormatting(
      source,
      serializePlateValueWithConversionEditor(valueWithDrawing)
    );
    const savedWithoutInsertedDiagram = saved.replace(
      /\n```mermaid\nclassDiagram[\s\S]*?Animal <\|-- Dog\n```\n\n?/u,
      '\n'
    );

    expect(saved).toContain('```mermaid\nclassDiagram');
    expect(canonicalizeMarkdown(savedWithoutInsertedDiagram)).toBe(
      canonicalizeMarkdown(source)
    );
  });

  itIfStrictRoundTrip('round trips the full debug markdown file with zero canonical differences', () => {
    const source = readFileSync(debugFile, 'utf8');
    const result = roundTripMarkdownWithPlate(source, {
      context: {
        fileName: basename(debugFile),
        filePath: debugFile,
      },
    });

    expect(canonicalizeMarkdown(result.serializedMarkdown)).toBe(
      canonicalizeMarkdown(source)
    );
  });
});
