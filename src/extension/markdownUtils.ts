import path from 'node:path';

export const DEFAULT_DEBOUNCE_MS = 300;

export function getFileNameWithoutExtension(filePath: string): string {
  const parsed = path.parse(filePath);
  return parsed.name || 'Untitled';
}

export function enforceTitleHeading(markdown: string, filePath: string): string {
  const title = getFileNameWithoutExtension(filePath);
  const heading = `# ${title}`;

  const normalized = markdown.replace(/\r\n/g, '\n');

  if (normalized.length === 0) {
    return `${heading}\n`;
  }

  const lines = normalized.split('\n');
  const firstLine = lines[0] ?? '';

  if (firstLine === heading) {
    return normalized;
  }

  if (/^#{1,6}\s+/.test(firstLine)) {
    lines[0] = heading;
    return lines.join('\n');
  }

  return [heading, ...lines].join('\n');
}
