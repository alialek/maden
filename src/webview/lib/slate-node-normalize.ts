export const coerceSlateTextLeaf = (value: unknown): { text: string } => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const candidate = value as { text?: unknown };
    if (typeof candidate.text === 'string') {
      return {
        ...(candidate as Record<string, unknown>),
        text: candidate.text,
      };
    }
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return { text: String(value) };
  }

  return { text: '' };
};
