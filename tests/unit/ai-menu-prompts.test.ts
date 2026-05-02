import { describe, expect, it } from 'vitest';

import { buildSelectionActionPrompt } from '../../src/webview/components/ui/ai-menu-prompts';

describe('AI menu prompts', () => {
  it('preserves selected context blocks around rewrite target', () => {
    const contextInput = [
      '<context-above>',
      'First paragraph above.',
      '',
      'Second paragraph above.',
      '</context-above>',
      '',
      '<target-text>',
      '**Rewrite only this fragment.**',
      '</target-text>',
      '',
      '<context-below>',
      'First paragraph below.',
      '',
      'Second paragraph below.',
      '</context-below>',
    ].join('\n');

    const prompt = buildSelectionActionPrompt('Improve clarity.', contextInput);

    expect(prompt).toContain(
      'Edit only the fragment inside <target-text>...</target-text>.'
    );
    expect(prompt).toContain('<context-above>\nFirst paragraph above.');
    expect(prompt).toContain(
      '<target-text>\n**Rewrite only this fragment.**\n</target-text>'
    );
    expect(prompt).toContain('Second paragraph below.\n</context-below>');
  });
});
