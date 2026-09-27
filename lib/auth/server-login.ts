import "server-only";

import { createSupabaseServerClient } from "../supabase/server.ts";
import { resolveAuthenticatedActor } from "./actor-resolution.ts";
import type { LoginCredentials } from "./login-flow.ts";
import { createSupabaseActorDataSource } from "./supabase-data-source.ts";

const authenticateSupabase = async (credentials: LoginCredentials) => {
  const client = await createSupabaseServerClient();
  const { error } = await client.auth.signInWithPassword(credentials);
  if (error) return null;

  const actor = await resolveAuthenticatedActor(createSupabaseActorDataSource(client));
  if (!actor) await client.auth.signOut();
  return actor;
};

export const authenticateServerCredentials = (credentials: LoginCredentials) => authenticateSupabase(credentials);

export const logoutServerActor = async () => {
  await (await createSupabaseServerClient()).auth.signOut();
};
