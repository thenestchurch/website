import "server-only";

import { redirect } from "next/navigation";
import type { EntityId } from "../domain/types.ts";
import type { AuthenticatedActor } from "./authorization.ts";
import { getDepartmentHeadPortalRedirect } from "./department-head-portal-access.ts";
import { getServerAuthenticatedActor } from "./server-actor.ts";

export type DepartmentLeadActor = AuthenticatedActor & {
  departmentId: EntityId;
};

export const requireServerDepartmentLeadActor = async (): Promise<DepartmentLeadActor> => {
  const actor = await getServerAuthenticatedActor();
  const redirectPath = getDepartmentHeadPortalRedirect(actor);

  if (redirectPath) redirect(redirectPath);

  return actor as DepartmentLeadActor;
};
