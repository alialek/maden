export const sanitizePdfText = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '');

export const blobToBase64 = async (blob: Blob) => {
  const buffer = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
};
