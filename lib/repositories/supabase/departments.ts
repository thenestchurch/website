import type { SupabaseClient } from "@supabase/supabase-js";
import type { DepartmentRepository } from "../contracts.ts";
import { RepositoryError } from "../errors.ts";
import type { Database } from "../../supabase/database.types.ts";
import { mapDepartmentRow } from "./mappers.ts";

export const createSupabaseDepartmentRepository = (
  client: SupabaseClient<Database>,
): DepartmentRepository => ({
  async findActive() {
    const { data, error } = await client
      .from("departments")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      throw new RepositoryError("Departments could not be loaded.", error.code);
    }

    return data.map(mapDepartmentRow);
  },

  async findAll() {
    const { data, error } = await client
      .from("departments")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      throw new RepositoryError("Departments could not be loaded.", error.code);
    }

    return data.map(mapDepartmentRow);
  },

  async findById(id) {
    const { data, error } = await client
      .from("departments")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new RepositoryError("The department could not be loaded.", error.code);
    }

    return data ? mapDepartmentRow(data) : null;
  },
});
