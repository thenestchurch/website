export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const PROFILE_IMAGE_MIME_TYPES = [
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ProfileImageMimeType = (typeof PROFILE_IMAGE_MIME_TYPES)[number];

const allowedMimeTypes = new Set<string>(PROFILE_IMAGE_MIME_TYPES);
const ascii = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.subarray(start, start + length));
const startsWith = (bytes: Uint8Array, signature: readonly number[]) =>
  bytes.length >= signature.length && signature.every((value, index) => bytes[index] === value);

const isJpeg = (bytes: Uint8Array) => startsWith(bytes, [0xff, 0xd8, 0xff]);
const isPng = (bytes: Uint8Array) =>
  startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const isGif = (bytes: Uint8Array) => {
  const header = ascii(bytes, 0, 6);
  return header === "GIF87a" || header === "GIF89a";
};
const isWebp = (bytes: Uint8Array) =>
  bytes.length >= 16
  && ascii(bytes, 0, 4) === "RIFF"
  && ascii(bytes, 8, 4) === "WEBP"
  && ["VP8 ", "VP8L", "VP8X"].includes(ascii(bytes, 12, 4));

const readUint32BigEndian = (bytes: Uint8Array, offset: number) =>
  ((bytes[offset] ?? 0) * 0x1000000)
  + ((bytes[offset + 1] ?? 0) << 16)
  + ((bytes[offset + 2] ?? 0) << 8)
  + (bytes[offset + 3] ?? 0);

const isAvif = (bytes: Uint8Array) => {
  if (bytes.length < 16 || ascii(bytes, 4, 4) !== "ftyp") return false;

  const boxSize = readUint32BigEndian(bytes, 0);
  if (boxSize < 16 || boxSize > bytes.length) return false;

  if (["avif", "avis"].includes(ascii(bytes, 8, 4))) return true;
  for (let offset = 16; offset + 4 <= boxSize; offset += 4) {
    if (["avif", "avis"].includes(ascii(bytes, offset, 4))) return true;
  }
  return false;
};

const signatureValidators: Record<ProfileImageMimeType, (bytes: Uint8Array) => boolean> = {
  "image/avif": isAvif,
  "image/gif": isGif,
  "image/jpeg": isJpeg,
  "image/png": isPng,
  "image/webp": isWebp,
};

export const hasMatchingProfileImageSignature = (
  bytes: Uint8Array,
  claimedMimeType: string,
): claimedMimeType is ProfileImageMimeType => {
  if (!allowedMimeTypes.has(claimedMimeType)) return false;
  return signatureValidators[claimedMimeType as ProfileImageMimeType](bytes);
};

export const validateProfileImageFile = async (file: File) => {
  if (
    file.size === 0
    || file.size > PROFILE_IMAGE_MAX_BYTES
    || !allowedMimeTypes.has(file.type)
  ) {
    return null;
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (
    bytes.byteLength !== file.size
    || !hasMatchingProfileImageSignature(bytes, file.type)
  ) {
    return null;
  }

  return {
    bytes,
    mimeType: file.type as ProfileImageMimeType,
  };
};
