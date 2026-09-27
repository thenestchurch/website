import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServiceRepository } from "../contracts.ts";
import { RepositoryError } from "../errors.ts";
import type { Database } from "../../supabase/database.types.ts";
import { mapServiceRow } from "./mappers.ts";

export const createSupabaseServiceRepository = (
  client: SupabaseClient<Database>,
): ServiceRepository => ({
  async findActive() {
    const { data, error } = await client
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("date", { ascending: false });

    if (error) {
      throw new RepositoryError("Services could not be loaded.", error.code);
    }

    return data.map(mapServiceRow);
  },

  async findAll() {
    const { data, error } = await client
      .from("services")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      throw new RepositoryError("Services could not be loaded.", error.code);
    }

    return data.map(mapServiceRow);
  },

  async findById(id) {
    const { data, error } = await client
      .from("services")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new RepositoryError("The service could not be loaded.", error.code);
    }

    return data ? mapServiceRow(data) : null;
  },
});
