import { NextResponse } from "next/server";
import { getPool } from "@/src/db";
import { hashToken, newSubscriberIdentity, normalizeSubscriberEmail, subscriberRateLimit, validSubscriberEmail } from "@/src/subscribers";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, message: "Enter a valid email address." }, { status: 400 }); }
  const { email, website, source } = body as { email?: unknown; website?: unknown; source?: unknown };
  if (typeof website === "string" && website) return NextResponse.json({ ok: true, message: "Thank you for subscribing." });
  if (typeof email !== "string" || email.length > 300) return NextResponse.json({ ok: false, message: "Enter a valid email address." }, { status: 400 });
  const normalized = normalizeSubscriberEmail(email);
  if (!validSubscriberEmail(normalized)) return NextResponse.json({ ok: false, message: "Enter a valid email address." }, { status: 400 });
  if (!subscriberRateLimit(request.headers.get("x-forwarded-for") ?? "anonymous")) return NextResponse.json({ ok: false, message: "Please wait before trying again." }, { status: 429 });
  const pool = getPool();
  try {
    const enabled = await pool.query("SELECT 1 FROM subscriber_settings WHERE id='global' AND enabled=true");
    if (!enabled.rows[0]) return NextResponse.json({ ok: false, message: "Subscriptions are currently unavailable." }, { status: 403 });
    const identity = newSubscriberIdentity(), safeSource = source === "footer" ? "footer" : "popup";
    await pool.query("INSERT INTO subscribers(id,email,normalized_email,status,source,unsubscribe_token_hash) VALUES($1,$2,$2,'active',$4,$3) ON CONFLICT(normalized_email) DO UPDATE SET email=EXCLUDED.email,status='active',unsubscribed_at=NULL,updated_at=CURRENT_TIMESTAMP", [identity.id, normalized, hashToken(identity.token), safeSource]);
    return NextResponse.json({ ok: true, message: "Thank you for subscribing." });
  } catch (error) {
    if (["42P01", "42703"].includes((error as { code?: string }).code ?? "")) return NextResponse.json({ ok: false, message: "Subscriptions are currently unavailable." }, { status: 503 });
    return NextResponse.json({ ok: false, message: "Subscription could not be completed." }, { status: 500 });
  }
}
