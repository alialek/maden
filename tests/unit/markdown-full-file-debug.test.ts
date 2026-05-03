/// <reference types="node" />

import { existsSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  canonicalizeMarkdown,
  roundTripMarkdownWithPlate,
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
