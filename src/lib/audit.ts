import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

type WriteAuditLogArgs = {
  entityType: "REFERRAL" | "REFERRER" | "REFERRAL_LINK" | "PAYOUT_BATCH";
  entityId: string;
  action: string;
  actorType: "ADMIN" | "SYSTEM" | "SELF_SERVICE";
  actorAdminId?: string | null;
  beforeValue?: Prisma.InputJsonValue | null;
  afterValue?: Prisma.InputJsonValue | null;
  tx?: Prisma.TransactionClient;
};

export async function writeAuditLog({
  entityType,
  entityId,
  action,
  actorType,
  actorAdminId,
  beforeValue,
  afterValue,
  tx,
}: WriteAuditLogArgs) {
  const client = tx ?? prisma;
  await client.auditLog.create({
    data: {
      entityType,
      entityId,
      action,
      actorType,
      actorAdminId: actorAdminId ?? null,
      beforeValue: beforeValue ?? undefined,
      afterValue: afterValue ?? undefined,
    },
  });
}
