/** Check the file header before upload and again against the stored R2 bytes. */
export function hasResourceFileSignature(bytes: Uint8Array, extension: string): boolean {
  const startsWith = (signature: number[]) => signature.every((value, index) => bytes[index] === value);
  switch (extension.toLowerCase()) {
    case "pdf": return startsWith([0x25, 0x50, 0x44, 0x46, 0x2d]);
    case "jpg":
    case "jpeg": return startsWith([0xff, 0xd8, 0xff]);
    case "png": return startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "webp": return startsWith([0x52, 0x49, 0x46, 0x46]) && bytes.length >= 12 &&
      [0x57, 0x45, 0x42, 0x50].every((value, index) => bytes[index + 8] === value);
    default: return false;
  }
}
