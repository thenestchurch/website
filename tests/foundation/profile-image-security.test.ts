import assert from "node:assert/strict";
import test from "node:test";
import {
  PROFILE_IMAGE_MAX_BYTES,
  hasMatchingProfileImageSignature,
  validateProfileImageFile,
} from "../../lib/security/profile-image.ts";

const bytes = (...values: number[]) => new Uint8Array(values);
const asciiBytes = (value: string) => new TextEncoder().encode(value);
const file = (data: Uint8Array, type: string) => {
  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(data);
  return new File([buffer], "profile", { type });
};

const validSamples = [
  ["image/jpeg", bytes(0xff, 0xd8, 0xff, 0xe0)],
  ["image/png", bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)],
  ["image/gif", asciiBytes("GIF89a")],
  ["image/webp", asciiBytes("RIFF1234WEBPVP8X")],
  ["image/avif", bytes(
    0x00, 0x00, 0x00, 0x18,
    ...asciiBytes("ftyp"),
    ...asciiBytes("mif1"),
    0x00, 0x00, 0x00, 0x00,
    ...asciiBytes("avif"),
    ...asciiBytes("mif1"),
  )],
] as const;

test("profile-image signatures recognize each allowed claimed MIME type", () => {
  for (const [mimeType, sample] of validSamples) {
    assert.equal(hasMatchingProfileImageSignature(sample, mimeType), true, mimeType);
  }
});

test("profile-image signatures reject spoofed MIME types and malformed containers", () => {
  assert.equal(hasMatchingProfileImageSignature(validSamples[1][1], "image/jpeg"), false);
  assert.equal(hasMatchingProfileImageSignature(validSamples[0][1], "text/plain"), false);
  assert.equal(hasMatchingProfileImageSignature(asciiBytes("RIFF1234WEBPFAKE"), "image/webp"), false);
  assert.equal(hasMatchingProfileImageSignature(bytes(
    0x00, 0x00, 0x00, 0x40,
    ...asciiBytes("ftypavif"),
    0x00, 0x00, 0x00, 0x00,
  ), "image/avif"), false);
});

test("profile-image file validation returns verified bytes and MIME", async () => {
  const jpeg = validSamples[0][1];
  const result = await validateProfileImageFile(file(jpeg, "image/jpeg"));
  assert.equal(result?.mimeType, "image/jpeg");
  assert.deepEqual(result?.bytes, jpeg);
});

test("profile-image file validation rejects empty, oversized, unsupported, and spoofed files", async () => {
  assert.equal(await validateProfileImageFile(file(new Uint8Array(), "image/png")), null);
  assert.equal(
    await validateProfileImageFile(file(new Uint8Array(PROFILE_IMAGE_MAX_BYTES + 1), "image/jpeg")),
    null,
  );
  assert.equal(await validateProfileImageFile(file(validSamples[1][1], "text/plain")), null);
  assert.equal(await validateProfileImageFile(file(validSamples[1][1], "image/jpeg")), null);
});
