import { serializeHtml } from 'platejs/static';
import { createSlateEditor } from 'platejs';
import type { SlatePlugin, Value } from 'platejs';

import { BaseEditorKit } from '@/components/editor/editor-base-kit';
import { DocxKit } from '@/components/editor/plugins/docx-kit';
import { EditorStatic } from '@/components/ui/editor-static';
import { blobToBase64, sanitizePdfText } from '@/lib/export-utils';

import { postToHost } from '@/vscode';

export type ExportRequest = {
  blob: Blob;
  mimeType: string;
  suggestedFileName: string;
};

const siteUrl = 'https://platejs.org';
const sanitizeBaseName = (value: string) =>
  (value || 'document').trim().replace(/[\\/:*?"<>|]/g, '_') || 'document';
const imageNodeTypes = new Set(['img', 'image']);

const resolveAssetCandidates = (url: string) => {
  const candidates = new Set<string>();
  const trimmed = url.trim();
  if (!trimmed) return [];

  candidates.add(trimmed);

  try {
    candidates.add(new URL(trimmed, document.baseURI).toString());
  } catch {
    // noop
  }

  return Array.from(candidates);
};

const fetchAssetBytes = async (url: string): Promise<Uint8Array | null> => {
  const candidates = resolveAssetCandidates(url);

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate);
      if (!response.ok) continue;
      return new Uint8Array(await response.arrayBuffer());
    } catch {
      // try next candidate
    }
  }

  return null;
};

const bytesToDataUrl = (bytes: Uint8Array, mimeType: string) => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
};

const inferMimeType = (url: string, bytes: Uint8Array) => {
  const lowered = url.toLowerCase();
  if (lowered.endsWith('.png')) return 'image/png';
  if (/\.(jpe?g)($|\?)/.test(lowered)) return 'image/jpeg';
  if (lowered.endsWith('.gif')) return 'image/gif';
  if (lowered.endsWith('.webp')) return 'image/webp';
  if (lowered.endsWith('.svg')) return 'image/svg+xml';

  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif';

  return 'image/png';
};

const materializeDocxImages = async (value: Value): Promise<Value> => {
  const visit = async (node: any): Promise<any> => {
    if (!node || typeof node !== 'object') return node;

    const next: any = Array.isArray(node) ? [] : { ...node };
    const type = String(node.type ?? '');
    const url = typeof node.url === 'string' ? node.url.trim() : '';

    if (imageNodeTypes.has(type) && url && !url.startsWith('data:')) {
      const bytes = await fetchAssetBytes(url);
      if (bytes) {
        const mimeType = inferMimeType(url, bytes);
        next.url = bytesToDataUrl(bytes, mimeType);
      }
    }

    if (Array.isArray(node.children)) {
      next.children = await Promise.all(node.children.map((child: any) => visit(child)));
    }

    return next;
  };

  return (await Promise.all((value as any[]).map((node) => visit(node)))) as Value;
};

export const saveExportFile = async ({ blob, mimeType, suggestedFileName }: ExportRequest) => {
  postToHost({
    type: 'saveExportFile',
    base64: await blobToBase64(blob),
    mimeType,
    suggestedFileName,
  });
};

export const createHtmlExport = async (
  value: Value,
  baseName: string
): Promise<ExportRequest> => {
  const editorStatic = createSlateEditor({
    plugins: BaseEditorKit,
    value,
  });

  const editorHtml = await serializeHtml(editorStatic, {
    editorComponent: EditorStatic,
    props: { style: { padding: '0 calc(50% - 350px)', paddingBottom: '' } },
  });

  const tailwindCss = `<link rel="stylesheet" href="${siteUrl}/tailwind.css">`;
  const katexCss = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.18/dist/katex.css" integrity="sha384-9PvLvaiSKCPkFKB1ZsEoTjgnJn+O3KvEwtsz37/XrkYft3DTk2gHdYvd9oWgW3tV" crossorigin="anonymous">';

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=JetBrains+Mono:wght@400..700&display=swap"
      rel="stylesheet"
    />
    ${tailwindCss}
    ${katexCss}
  </head>
  <body>
    ${editorHtml}
  </body>
</html>`;

  return {
    blob: new Blob([html], { type: 'text/html;charset=utf-8' }),
    mimeType: 'text/html',
    suggestedFileName: `${sanitizeBaseName(baseName)}.html`,
  };
};

export const createDocxExport = async (
  value: Value,
  baseName: string
): Promise<ExportRequest> => {
  const { exportToDocx } = await import('@platejs/docx-io');
  const normalizedValue = await materializeDocxImages(value);
  const blob = await exportToDocx(normalizedValue, {
    editorPlugins: [...BaseEditorKit, ...DocxKit] as SlatePlugin[],
  });

  return {
    blob,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    suggestedFileName: `${sanitizeBaseName(baseName)}.docx`,
  };
};

export const createPdfExport = async (
  value: Value,
  baseName: string
): Promise<ExportRequest> => {
  const PDFLib = await import('pdf-lib');
  const pdfDoc = await PDFLib.PDFDocument.create();
  const regular = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
  const italic = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaOblique);
  const mono = await pdfDoc.embedFont(PDFLib.StandardFonts.Courier);
  const margin = 50;
  const pageSize: [number, number] = [595.28, 841.89];
  const drawImageBlock = async (block: any, yRef: { value: number }, pageRef: { page: any }) => {
    const rawUrl = String(block?.url ?? '').trim();
    if (!rawUrl) return false;

    const bytes = await fetchAssetBytes(rawUrl);
    if (!bytes) return false;

    let embedded: { width: number; height: number; scale: (factor: number) => { width: number; height: number } };

    try {
      embedded = await pdfDoc.embedPng(bytes);
    } catch {
      try {
        embedded = await pdfDoc.embedJpg(bytes);
      } catch {
        return false;
      }
    }

    const maxWidth = pageSize[0] - margin * 2;
    const maxHeight = 320;
    const widthScale = maxWidth / embedded.width;
    const heightScale = maxHeight / embedded.height;
    const scale = Math.min(1, widthScale, heightScale);
    const scaled = embedded.scale(scale);

    if (yRef.value - scaled.height < margin) {
      pageRef.page = pdfDoc.addPage(pageSize);
      yRef.value = pageSize[1] - margin;
    }

    pageRef.page.drawImage(embedded as never, {
      x: margin,
      y: yRef.value - scaled.height,
      width: scaled.width,
      height: scaled.height,
    });
    yRef.value -= scaled.height + 10;
    return true;
  };

  const extractText = (node: any): string => {
    if (!node) return '';
    if (typeof node.text === 'string') return sanitizePdfText(node.text);
    if (Array.isArray(node.children)) {
      return node.children.map((child: any) => extractText(child)).join('');
    }
    return '';
  };

  const getBlockStyle = (block: any) => {
    const type = String(block?.type ?? 'p');
    const indent = Number(block?.indent ?? 0) * 18;
    const listPrefix = block?.listStyleType ? '- ' : '';

    if (type === 'h1') {
      return { font: bold, fontSize: 24, lineHeight: 30, spacingAfter: 12, indent, listPrefix: '' };
    }
    if (type === 'h2') {
      return { font: bold, fontSize: 20, lineHeight: 26, spacingAfter: 10, indent, listPrefix: '' };
    }
    if (type === 'h3') {
      return { font: bold, fontSize: 16, lineHeight: 22, spacingAfter: 8, indent, listPrefix: '' };
    }
    if (type === 'blockquote') {
      return {
        font: italic,
        fontSize: 11,
        lineHeight: 16,
        spacingAfter: 8,
        indent: indent + 14,
        listPrefix: '',
      };
    }
    if (type === 'code_block' || type === 'codeBlock') {
      return {
        font: mono,
        fontSize: 10,
        lineHeight: 14,
        spacingAfter: 8,
        indent: indent + 8,
        listPrefix: '',
      };
    }

    return {
      font: regular,
      fontSize: 11,
      lineHeight: 16,
      spacingAfter: 6,
      indent,
      listPrefix,
    };
  };

  const wrapLine = (text: string, font: any, fontSize: number, maxWidth: number) => {
    const content = sanitizePdfText(text);

    if (!content) return [''];

    const words = content.split(' ');
    const wrapped: string[] = [];
    let current = '';

    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        current = candidate;
      } else {
        if (current) wrapped.push(current);
        current = word;
      }
    });

    if (current) wrapped.push(current);
    return wrapped;
  };

  const pageRef = { page: pdfDoc.addPage(pageSize) };
  const yRef = { value: pageSize[1] - margin };

  for (const block of value as any[]) {
    if (imageNodeTypes.has(String(block?.type ?? ''))) {
      const inserted = await drawImageBlock(block, yRef, pageRef);
      if (!inserted) {
        // fallback to text representation if image bytes are unavailable
        const fallbackText = `[Image: ${String(block?.url ?? '').trim()}]`;
        if (yRef.value < margin + 16) {
          pageRef.page = pdfDoc.addPage(pageSize);
          yRef.value = pageSize[1] - margin;
        }
        pageRef.page.drawText(fallbackText, {
          font: regular,
          size: 10,
          x: margin,
          y: yRef.value,
        });
        yRef.value -= 18;
      }
      continue;
    }

    const style = getBlockStyle(block);
    const availableWidth = pageSize[0] - margin * 2 - style.indent;
    const rawText = `${style.listPrefix}${extractText(block)}`.trimEnd();
    const paragraphLines = (rawText || ' ')
      .split('\n')
      .flatMap((line) => wrapLine(line, style.font, style.fontSize, availableWidth));

    for (const segment of paragraphLines) {
      if (yRef.value < margin) {
        pageRef.page = pdfDoc.addPage(pageSize);
        yRef.value = pageSize[1] - margin;
      }

      pageRef.page.drawText(segment || ' ', {
        font: style.font,
        size: style.fontSize,
        x: margin + style.indent,
        y: yRef.value,
      });
      yRef.value -= style.lineHeight;
    }

    yRef.value -= style.spacingAfter;
  }

  const bytes = await pdfDoc.save();

  return {
    blob: new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' }),
    mimeType: 'application/pdf',
    suggestedFileName: `${sanitizeBaseName(baseName)}.pdf`,
  };
};
