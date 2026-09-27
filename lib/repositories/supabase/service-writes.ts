import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase/database.types.ts";
import type { ServiceWriteRepository } from "../contracts.ts";
import { RepositoryError } from "../errors.ts";
import { mapServiceRow } from "./mappers.ts";

export const createSupabaseServiceWriteRepository = (
  client: SupabaseClient<Database>,
): ServiceWriteRepository => ({
  async create(input) {
    const { data, error } = await client
      .from("services")
      .insert({
        date: input.date,
        end_time: input.endTime,
        is_active: input.isActive,
        name: input.name,
        notes: input.notes,
        service_type: input.serviceType,
        start_time: input.startTime,
      })
      .select("*")
      .single();

    if (error) {
      throw new RepositoryError("The service could not be created.", error.code);
    }

    return mapServiceRow(data);
  },
  async update(id, input) {
    const { data, error } = await client
      .from("services")
      .update({
        date: input.date,
        end_time: input.endTime,
        is_active: input.isActive,
        name: input.name,
        notes: input.notes,
        service_type: input.serviceType,
        start_time: input.startTime,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new RepositoryError("The service could not be updated.", error.code);
    return mapServiceRow(data);
  },
});
