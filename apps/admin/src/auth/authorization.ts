import { and, eq } from "drizzle-orm";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { permissions, rolePermissions, staffAccounts, staffRoles } from "@/src/db/schema";
import { findNavigationItem } from "@/src/navigation/admin-navigation";

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

export type AdminAuthorization = {
  isMasterAdmin: boolean;
  permissionKeys: ReadonlySet<string>;
};

const getAdminAuthorization = cache(async (staffAccountId: string): Promise<AdminAuthorization | null> => {
  const [account] = await db.select({
    isMasterAdmin: staffAccounts.isMasterAdmin,
    status: staffAccounts.status,
  }).from(staffAccounts).where(eq(staffAccounts.id, staffAccountId)).limit(1);

  if (!account || account.status !== "active") return null;
  if (account.isMasterAdmin) return { isMasterAdmin: true, permissionKeys: new Set<string>() };

  const grants = await db.select({ key: permissions.key })
    .from(staffRoles)
    .innerJoin(rolePermissions, eq(staffRoles.roleId, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(staffRoles.staffAccountId, staffAccountId));

  return { isMasterAdmin: false, permissionKeys: new Set(grants.map(({ key }) => key)) };
});

export async function requireAdministrativeAccount() {
  const session = await auth();
  if (!session?.user || !canAccessBasicDashboard(session.user.id)) redirect("/login");

  const authorization = await getAdminAuthorization(session.user.id);
  if (!authorization) redirect("/login");

  return { session, authorization };
}

export async function requireRouteAccess(href: string) {
  const item = findNavigationItem(href);
  if (!item?.href) throw new Error(`No admin navigation entry is configured for ${href}.`);

  const context = await requireAdministrativeAccount();
  const { authorization } = context;
  if (item.permission && !authorization.isMasterAdmin && !authorization.permissionKeys.has(item.permission)) {
    redirect("/dashboard?access=denied");
  }

  return context;
}

export function canUsePermission(authorization: AdminAuthorization, permissionKey: string) {
  return authorization.isMasterAdmin || authorization.permissionKeys.has(permissionKey);
}

export async function requirePermission(permissionKey: string) {
  const context = await requireAdministrativeAccount();
  if (!canUsePermission(context.authorization, permissionKey)) redirect("/dashboard?access=denied");
  return context;
}

export async function requireAnyPermission(permissionKeys: readonly string[]) {
  const context = await requireAdministrativeAccount();
  if (!permissionKeys.some((permissionKey) => canUsePermission(context.authorization, permissionKey))) {
    redirect("/dashboard?access=denied");
  }
  return context;
}
