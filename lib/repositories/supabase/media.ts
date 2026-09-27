import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase/database.types.ts";
import type { MediaRepository } from "../contracts.ts";
import { RepositoryError } from "../errors.ts";
import { mapMediaRow } from "./mappers.ts";

export const MEMBER_MEDIA_BUCKET = "member-profile-pictures";

const safeExtension = (filename: string) => {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension?.match(/^[a-z0-9]{1,8}$/) ? `.${extension}` : "";
};

export const createSupabaseMediaRepository = (
  client: SupabaseClient<Database>,
): MediaRepository => ({
  async create(input) {
    const storagePath = `members/${randomUUID()}${safeExtension(input.filename)}`;
    const bucket = client.storage.from(MEMBER_MEDIA_BUCKET);
    const upload = await bucket.upload(storagePath, input.bytes, {
      contentType: input.mimeType,
      upsert: false,
    });
    if (upload.error) {
      throw new RepositoryError("The profile picture could not be uploaded.", upload.error.name);
    }

    const url = bucket.getPublicUrl(storagePath).data.publicUrl;
    const { data, error } = await client
      .from("media")
      .insert({
        alt: input.alt,
        filename: input.filename,
        filesize: input.bytes.byteLength,
        focal_x: null,
        focal_y: null,
        height: null,
        legacy_path: null,
        mime_type: input.mimeType,
        storage_path: storagePath,
        thumbnail_u_r_l: null,
        url,
        width: null,
      })
      .select("*")
      .single();

    if (error) {
      await bucket.remove([storagePath]);
      throw new RepositoryError("The profile picture record could not be saved.", error.code);
    }
    return mapMediaRow(data);
  },
  async findById(id) {
    const { data, error } = await client.from("media").select("*").eq("id", id).maybeSingle();
    if (error) throw new RepositoryError("The profile picture could not be loaded.", error.code);
    return data ? mapMediaRow(data) : null;
  },
});
