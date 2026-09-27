import "server-only";

import { redirect } from "next/navigation";
import type { AdminRole } from "../domain/types.ts";
import type { AuthenticatedActor } from "./authorization.ts";
import { getAdminPortalRedirect } from "./admin-portal-access.ts";
import { getServerAuthenticatedActor } from "./server-actor.ts";

export const requireServerAdminActor = async (
  allowedRoles: readonly AdminRole[] = [],
): Promise<AuthenticatedActor> => {
  const actor = await getServerAuthenticatedActor();
  const redirectPath = getAdminPortalRedirect(actor, allowedRoles);

  if (redirectPath) redirect(redirectPath);
  return actor as AuthenticatedActor;
};
