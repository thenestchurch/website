import "server-only";

import { cache } from "react";
import { createSupabaseServerClient } from "../supabase/server.ts";
import { resolveAuthenticatedActor } from "./actor-resolution.ts";
import { createSupabaseActorDataSource } from "./supabase-data-source.ts";

const resolveServerAuthenticatedActor = async () => {
  try {
    const client = await createSupabaseServerClient();
    return await resolveAuthenticatedActor(createSupabaseActorDataSource(client));
  } catch {
    return null;
  }
};

export const getServerAuthenticatedActor = cache(resolveServerAuthenticatedActor);
