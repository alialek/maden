import { describe, expect, it } from 'vitest';

import { CODE_DRAWING_TYPE_ARRAY } from '@platejs/code-drawing';

import {
  CODE_DRAWING_PRESETS,
  canReplaceCodeDrawingCodeWithPreset,
} from '../../src/webview/lib/code-drawing-presets';

describe('code drawing presets', () => {
  it('supplements current drawing types without replacing them', () => {
    expect(CODE_DRAWING_TYPE_ARRAY.map((item) => item.value)).toEqual([
      'PlantUml',
      'Graphviz',
      'Flowchart',
      'Mermaid',
    ]);

    expect(CODE_DRAWING_PRESETS.some((item) => item.id === 'mermaid-flowchart')).toBe(true);
    expect(CODE_DRAWING_PRESETS.some((item) => item.id === 'graphviz-directed')).toBe(true);
    expect(CODE_DRAWING_PRESETS.some((item) => item.id === 'flowchart-basic')).toBe(true);
    expect(CODE_DRAWING_PRESETS.some((item) => item.drawingType === 'PlantUml')).toBe(false);
  });

  it('only replaces empty code or known preset code', () => {
    const preset = CODE_DRAWING_PRESETS[0];

    expect(canReplaceCodeDrawingCodeWithPreset('')).toBe(true);
    expect(canReplaceCodeDrawingCodeWithPreset(`\n${preset.code}\n`)).toBe(true);
    expect(canReplaceCodeDrawingCodeWithPreset('custom diagram code')).toBe(false);
  });
});
