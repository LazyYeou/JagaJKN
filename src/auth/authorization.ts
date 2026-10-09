import { UserRole } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export type SessionActor = {
  id: string;
  displayName: string;
  role: UserRole;
  companyId: string | null;
  companyName: string | null;
  workerId: string | null;
  workerCode: string | null;
};

export class AuthorizationError extends Error {
  readonly status: 401 | 403;

  constructor(status: 401 | 403, message: string) {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
  }
}

export function requireRole(actor: SessionActor | null, ...allowed: UserRole[]): SessionActor {
  if (!actor) throw new AuthorizationError(401, "Authentication required.");
  if (!allowed.includes(actor.role)) throw new AuthorizationError(403, "Access denied.");
  return actor;
}

export function workerLookupWhere(
  actor: SessionActor,
  requestedWorkerId: string,
): Prisma.WorkerWhereInput | null {
  if (actor.role === UserRole.HR) {
    if (!actor.companyId) throw new AuthorizationError(403, "Company scope is missing.");
    return { id: requestedWorkerId, companyId: actor.companyId };
  }

  if (actor.role === UserRole.WORKER) {
    if (!actor.workerId) throw new AuthorizationError(403, "Worker scope is missing.");
    if (requestedWorkerId !== actor.workerId) return null;
    return { id: actor.workerId };
  }

  throw new AuthorizationError(403, "Access denied.");
}

export function companyWorkerListWhere(actor: SessionActor | null): Prisma.WorkerWhereInput {
  const scopedActor = requireRole(actor, UserRole.HR);
  if (!scopedActor.companyId) throw new AuthorizationError(403, "Company scope is missing.");
  return { companyId: scopedActor.companyId };
}
