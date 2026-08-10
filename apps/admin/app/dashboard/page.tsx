import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="shell">
      <section className="card dashboard">
        <p className="eyebrow">Authenticated</p>
        <h1>Eraasim Admin</h1>
        <p className="lede">You are logged in. This dashboard is the administrative foundation.</p>
        <div className="account">
          <p><strong>Email:</strong> {session.user.email}</p>
          <p className="status">{session.user.isMasterAdmin ? "Master Admin" : "Staff account · Dashboard access only"}</p>
        </div>
        <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
          <button type="submit">Logout</button>
        </form>
      </section>
    </main>
  );
}
