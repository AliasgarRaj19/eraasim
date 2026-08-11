import { AdminShell } from "@/app/(admin)/admin-shell";
import { requireAdministrativeAccount } from "@/src/auth/authorization";
import { filterNavigation } from "@/src/navigation/admin-navigation";

export default async function AuthenticatedAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { session, authorization } = await requireAdministrativeAccount();
  const navigation = filterNavigation(authorization.isMasterAdmin, authorization.permissionKeys);

  return (
    <AdminShell
      navigation={navigation}
      account={{
        name: session.user.name ?? "Administrative account",
        email: session.user.email,
        isMasterAdmin: authorization.isMasterAdmin,
      }}
    >
      {children}
    </AdminShell>
  );
}
