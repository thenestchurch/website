import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase/database.types.ts";
import type { MediaRepository } from "../contracts.ts";
import { RepositoryError } from "../errors.ts";
import { MEMBER_MEDIA_BUCKET } from "./media.ts";
import { mapMediaRow } from "./mappers.ts";

const safeExtension = (filename: string) => {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension?.match(/^[a-z0-9]{1,8}$/) ? `.${extension}` : "";
};

export const createSupabasePublicMediaRepository = (
  storageClient: SupabaseClient<Database>,
  publicClient: SupabaseClient<Database>,
  secret: string,
): MediaRepository => ({
  async create(input) {
    const storagePath = `members/${randomUUID()}${safeExtension(input.filename)}`;
    const bucket = storageClient.storage.from(MEMBER_MEDIA_BUCKET);
    const upload = await bucket.upload(storagePath, input.bytes, {
      contentType: input.mimeType,
      upsert: false,
    });
    if (upload.error) {
      throw new RepositoryError("The profile picture could not be uploaded.", upload.error.name);
    }

    const url = bucket.getPublicUrl(storagePath).data.publicUrl;
    const { data, error } = await publicClient.rpc("register_public_media", {
      p_input: {
        alt: input.alt,
        filename: input.filename,
        filesize: input.bytes.byteLength,
        mimeType: input.mimeType,
        storagePath,
        url,
      },
      p_secret: secret,
    });
    if (error) {
      await bucket.remove([storagePath]);
      throw new RepositoryError("The profile picture record could not be saved.", error.code);
    }
    return mapMediaRow(data);
  },
  async findById(id) {
    const { data, error } = await publicClient.rpc("get_public_media", {
      p_id: id,
      p_secret: secret,
    });
    if (error) throw new RepositoryError("The profile picture could not be loaded.", error.code);
    return data ? mapMediaRow(data) : null;
  },
});
