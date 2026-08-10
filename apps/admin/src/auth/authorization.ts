import { and, eq } from "drizzle-orm";
import { db } from "@/src/db";
import { permissions, rolePermissions, staffAccounts, staffRoles } from "@/src/db/schema";

export async function hasPermission(staffAccountId: string, permissionKey: string) {
  const [account] = await db.select({ isMasterAdmin: staffAccounts.isMasterAdmin, status: staffAccounts.status })
    .from(staffAccounts).where(eq(staffAccounts.id, staffAccountId)).limit(1);
  if (!account || account.status !== "active") return false;
  if (account.isMasterAdmin) return true;

  const [grant] = await db.select({ key: permissions.key })
    .from(staffRoles)
    .innerJoin(rolePermissions, eq(staffRoles.roleId, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(and(eq(staffRoles.staffAccountId, staffAccountId), eq(permissions.key, permissionKey)))
    .limit(1);
  return Boolean(grant);
}

// Every active authenticated account may reach the basic dashboard, even with no role.
export function canAccessBasicDashboard(sessionUserId: string | undefined) {
  return Boolean(sessionUserId);
}
