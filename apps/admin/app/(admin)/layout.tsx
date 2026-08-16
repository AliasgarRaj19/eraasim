import { AdminShell } from "@/app/(admin)/admin-shell";
import { requireAdministrativeAccount } from "@/src/auth/authorization";
import { applyNavigationBadges, filterNavigation } from "@/src/navigation/admin-navigation";
import { getAdminBadgeCounts } from "@/src/notifications/badges";

export default async function AuthenticatedAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { session, authorization } = await requireAdministrativeAccount();
  const badgeCounts = await getAdminBadgeCounts(authorization);
  const navigation = applyNavigationBadges(filterNavigation(authorization.isMasterAdmin, authorization.permissionKeys), badgeCounts);

  return (
    <AdminShell
      navigation={navigation}
      account={{
        name: session.user.name ?? "Administrative account",
        email: session.user.email,
        isMasterAdmin: authorization.isMasterAdmin,
      }}
      unreadOperationalCount={badgeCounts.unreadNotifications}
      showNotifications={authorization.isMasterAdmin || authorization.permissionKeys.has("notifications.view")}
    >
      {children}
    </AdminShell>
  );
}
