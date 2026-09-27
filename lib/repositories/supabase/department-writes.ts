import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../supabase/database.types.ts";
import type { DepartmentWriteRepository } from "../contracts.ts";
import { RepositoryError } from "../errors.ts";
import { mapDepartmentRow } from "./mappers.ts";

export const createSupabaseDepartmentWriteRepository = (
  client: SupabaseClient<Database>,
): DepartmentWriteRepository => ({
  async save(input) {
    const values = {
      description: input.description,
      is_active: input.isActive,
      name: input.name,
      reporting_channel: input.reportingChannel,
      slug: input.slug,
    };
    const query = input.id === undefined
      ? client.from("departments").insert(values)
      : client.from("departments").update(values).eq("id", input.id);
    const { data, error } = await query.select("*").single();
    if (error) throw new RepositoryError("The department could not be saved.", error.code);
    return mapDepartmentRow(data);
  },
});
