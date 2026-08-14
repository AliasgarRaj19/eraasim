"use client";
import { useState } from "react";

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return <span className="contact-label-text">{children} <span aria-hidden="true">*</span><span className="visually-hidden"> required</span></span>;
}

export function ContactForm() {
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); const form = event.currentTarget;
    try { const response = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) }); const result = await response.json() as { ok: boolean; message: string }; setStatus(result); if (result.ok) form.reset(); }
    catch { setStatus({ ok: false, message: "Your message could not be submitted. Please try again." }); }
    finally { setPending(false); }
  }
  return <form className="contact-form" onSubmit={submit} noValidate>
    <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <label><RequiredLabel>Name</RequiredLabel><input name="name" required maxLength={120} autoComplete="name" /></label>
    <label><RequiredLabel>Email</RequiredLabel><input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
    <label><span className="contact-label-text">Phone Number</span><input name="phone" type="tel" maxLength={40} autoComplete="tel" /></label>
    <label><RequiredLabel>Subject</RequiredLabel><input name="subject" required maxLength={200} /></label>
    <label><RequiredLabel>Message</RequiredLabel><textarea name="message" required maxLength={5000} rows={8} /></label>
    <button className="primary-link" disabled={pending} type="submit">{pending ? "Sending…" : "Send message"}</button>
    {status ? <p className={status.ok ? "contact-success" : "contact-error"} role="status" aria-live="polite">{status.message}</p> : null}
  </form>;
}
