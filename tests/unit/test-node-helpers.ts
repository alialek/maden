export const findTextLeaf = (
  nodes: unknown[],
  text: string
): Record<string, unknown> | null => {
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
