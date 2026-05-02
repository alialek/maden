import type { ExcalidrawDataState } from '@platejs/excalidraw';

export const EXCALIDRAW_MDX_TAG = 'excalidraw';
export const EXCALIDRAW_MDX_DATA_ATTR = 'data';

type EncodedExcalidrawData = {
  elements: ExcalidrawDataState['elements'];
  files?: unknown;
  state: ExcalidrawDataState['appState'];
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const bytesToBinary = (bytes: Uint8Array): string => {
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return binary;
};

const binaryToBytes = (binary: string): Uint8Array => {
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const toBase64 = (value: string): string => {
  const bytes = textEncoder.encode(value);

  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(bytesToBinary(bytes));
  }

  const buffer = (
    globalThis as typeof globalThis & {
      Buffer?: { from: (value: Uint8Array) => { toString: (encoding: 'base64') => string } };
    }
  ).Buffer;

  if (!buffer) {
    throw new Error('Base64 encoder is not available');
  }

  return buffer.from(bytes).toString('base64');
};

const fromBase64 = (value: string): string => {
  if (typeof globalThis.atob === 'function') {
    return textDecoder.decode(binaryToBytes(globalThis.atob(value)));
  }

  const buffer = (
    globalThis as typeof globalThis & {
      Buffer?: {
        from: (
          value: string,
          encoding: 'base64'
        ) => Uint8Array;
      };
    }
  ).Buffer;

  if (!buffer) {
    throw new Error('Base64 decoder is not available');
  }

  return textDecoder.decode(buffer.from(value, 'base64'));
};

export const encodeExcalidrawMdxData = (
  data: EncodedExcalidrawData | null | undefined
): string => {
  const json = JSON.stringify({
    elements: data?.elements ?? [],
    files: data?.files ?? undefined,
    state: data?.state ?? null,
  });

  return toBase64(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

export const decodeExcalidrawMdxData = (
  encoded: unknown
): EncodedExcalidrawData | null => {
  if (typeof encoded !== 'string' || encoded.trim() === '') {
    return null;
  }

  try {
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '='
    );
    const parsed = JSON.parse(fromBase64(padded)) as EncodedExcalidrawData;

    return {
      elements: Array.isArray(parsed.elements) ? parsed.elements : [],
      files:
        parsed.files && typeof parsed.files === 'object' && !Array.isArray(parsed.files)
          ? parsed.files
          : undefined,
      state:
        parsed.state && typeof parsed.state === 'object' && !Array.isArray(parsed.state)
          ? parsed.state
          : null,
    };
  } catch (error) {
    console.error('Failed to parse Excalidraw MDX data:', error);
    return null;
  }
};
