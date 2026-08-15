import { requireRouteAccess } from "@/src/auth/authorization";

export default async function DashboardPage() {
  const { session, authorization } = await requireRouteAccess("/dashboard");

  return (
    <section className="page-panel dashboard-panel" aria-labelledby="dashboard-title">
      <p className="page-eyebrow">Authenticated</p>
      <h1 id="dashboard-title">Eraasim Admin</h1>
      <p>Welcome back, {session.user.name ?? "Administrator"}.</p>
      <dl className="identity-list">
        <div><dt>Name</dt><dd>{session.user.name ?? "Not provided"}</dd></div>
        <div><dt>Email</dt><dd>{session.user.email}</dd></div>
        <div><dt>Access</dt><dd>{authorization.isMasterAdmin ? "Master Admin" : "Staff account · Dashboard access"}</dd></div>
      </dl>
      {!authorization.isMasterAdmin&&!authorization.permissionKeys.size?<p className="dashboard-access-note">Your staff account is active. Access to additional areas will appear when permissions are assigned by an administrator.</p>:null}
    </section>
  );
}
