import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">Secure administration</p>
        <h1>Eraasim Admin</h1>
        <p className="lede">Sign in with your administrative account.</p>
        <LoginForm />
      </section>
    </main>
  );
}
