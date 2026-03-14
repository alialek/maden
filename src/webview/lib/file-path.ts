export const normalizeDroppedPath = (value: string) => {
  if (!value) return value;

  if (!value.startsWith('file://')) {
    return value;
  }

  try {
    let path = decodeURIComponent(new URL(value).pathname);
    // Normalize Windows file URI path: /C:/foo -> C:/foo
    if (/^\/[A-Za-z]:\//.test(path)) {
      path = path.slice(1);
    }
    return path;
  } catch {
    return value;
  }
};

const isAbsolutePath = (value: string) =>
  value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value) || value.startsWith('\\\\');

const splitPath = (value: string) =>
  value
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean);

const dirname = (value: string) => {
  const normalized = value.replace(/\\/g, '/');
  const idx = normalized.lastIndexOf('/');
  return idx === -1 ? '' : normalized.slice(0, idx);
};

const normalizeFsPath = (value: string) => value.replace(/\\/g, '/');

const isPathInsideRoot = (path: string, root: string) => {
  const normalizedPath = normalizeFsPath(path).toLowerCase();
  const normalizedRoot = normalizeFsPath(root).replace(/\/+$/, '').toLowerCase();
  return normalizedPath === normalizedRoot || normalizedPath.startsWith(`${normalizedRoot}/`);
};

export const toRelativeFromDocument = (value: string) => {
  if (typeof window === 'undefined') {
    return value;
  }

  const documentPath = window.__MADEN_DOCUMENT_PATH__;
  if (!documentPath || !isAbsolutePath(value) || !isAbsolutePath(documentPath)) {
    return value;
  }

  const fromParts = splitPath(dirname(documentPath));
  const toParts = splitPath(value);

  const fromDrive = /^[A-Za-z]:/.test(fromParts[0] ?? '') ? fromParts[0].toLowerCase() : '';
  const toDrive = /^[A-Za-z]:/.test(toParts[0] ?? '') ? toParts[0].toLowerCase() : '';
  if (fromDrive && toDrive && fromDrive !== toDrive) {
    return value;
  }

  const offset = fromDrive && toDrive ? 1 : 0;

  let common = 0;
  while (
    common + offset < fromParts.length &&
    common + offset < toParts.length &&
    fromParts[common + offset].toLowerCase() === toParts[common + offset].toLowerCase()
  ) {
    common += 1;
  }

  const up = new Array(fromParts.length - (common + offset)).fill('..');
  const down = toParts.slice(common + offset);
  const relative = [...up, ...down].join('/');

  return relative || '.';
};

export const toNormalizedRelativePath = (value: string) =>
  toRelativeFromDocument(normalizeDroppedPath(value));

export type MediaInsertInput = {
  file?: File;
  preferredPath?: string;
};

export const resolveMediaInsertUrl = ({ file, preferredPath }: MediaInsertInput) => {
  const pathCandidate =
    preferredPath ??
    ((file as File & { path?: string } | undefined)?.path ?? '') ??
    '';
  const absoluteCandidate = normalizeDroppedPath(pathCandidate);

  if (absoluteCandidate && isAbsolutePath(absoluteCandidate)) {
    const roots =
      typeof window === 'undefined' ? [] : (window.__MADEN_WORKSPACE_ROOTS__ ?? []);
    const inWorkspace = roots.some((root) => isPathInsideRoot(absoluteCandidate, root));
    if (inWorkspace) {
      return toRelativeFromDocument(absoluteCandidate);
    }
    return normalizeFsPath(absoluteCandidate);
  }

  // For local file picks/drops, never trust bare/relative names (e.g. "image.png"):
  // they resolve against <base> and cause incorrect project-relative 404s.
  if (file) {
    return URL.createObjectURL(file);
  }

  const normalizedPath = toNormalizedRelativePath(pathCandidate);
  if (normalizedPath) {
    return normalizedPath;
  }

  return '';
};
