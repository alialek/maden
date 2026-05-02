export const SELECTION_ONLY_EDIT_INSTRUCTION = [
  'Edit only the fragment inside <target-text>...</target-text>.',
  'Use <context-above>...</context-above> and <context-below>...</context-below> only for coherence.',
  'Do not rewrite text outside the target fragment.',
  'Return only replacement text for the target fragment.',
  'Preserve the markdown structure of the target fragment.',
  'Keep the same block type, same block count, and same overall format as the target fragment.',
  'If the target fragment is a heading, return only a heading.',
  'Do not pull sentences, details, or arguments from the context into the replacement unless they already exist in the target fragment.',
  'No explanations, headings, quotes, or code fences.',
  'Keep the replacement concise and naturally integrated.',
].join(' ');

export const buildSelectionActionPrompt = (
  actionInstruction: string,
  contextInput: string
): string => {
  const context = contextInput.trim();
  return context
    ? `${actionInstruction}\n\n${SELECTION_ONLY_EDIT_INSTRUCTION}\n\n${context}`
    : `${actionInstruction}\n\n${SELECTION_ONLY_EDIT_INSTRUCTION}`;
};

export const STRUCTURED_SELECTION_ACTION_INSTRUCTION = [
  'Return a structured response using this exact wrapper:',
  '<maden-response action="inline|comment|add">',
  'YOUR CONTENT',
  '</maden-response>',
  'Choose action="inline" when the target fragment should be rewritten directly.',
  'Choose action="comment" when feedback should be added as a comment without changing the target fragment.',
  'Choose action="add" when new text should be inserted after the target fragment.',
  'For action="inline", return only replacement text for the target fragment and preserve its markdown structure.',
  'For action="comment", return only the comment text.',
  'For action="add", return only the text to insert after the target fragment.',
  'Do not return explanations outside the wrapper.',
].join(' ');

export const buildStructuredSelectionActionPrompt = (
  actionInstruction: string,
  contextInput: string
) => {
  const context = contextInput.trim();
  return context
    ? `${actionInstruction}\n\n${STRUCTURED_SELECTION_ACTION_INSTRUCTION}\n\n${context}`
    : `${actionInstruction}\n\n${STRUCTURED_SELECTION_ACTION_INSTRUCTION}`;
};
