"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/login/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <form action={action}>
      <label>Email<input name="email" type="email" autoComplete="username" required disabled={pending} /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required minLength={12} disabled={pending} /></label>
      {state.error ? <p className="error" role="alert">{state.error}</p> : null}
      <button type="submit" disabled={pending}>{pending ? "Signing in…" : "Login"}</button>
    </form>
  );
}
