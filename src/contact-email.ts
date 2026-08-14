import type { ContactInput } from "@/src/contact-page";

type EmailEnvironment = { RESEND_API_KEY?: string; CONTACT_EMAIL_FROM?: string };
type Fetcher = typeof fetch;

export async function notifyContact(
  recipient: string,
  message: ContactInput,
  environment?: EmailEnvironment,
  fetcher: Fetcher = fetch,
) {
  const providerEnvironment = environment ?? { RESEND_API_KEY: process.env.RESEND_API_KEY, CONTACT_EMAIL_FROM: process.env.CONTACT_EMAIL_FROM };
  const apiKey = providerEnvironment.RESEND_API_KEY;
  const from = providerEnvironment.CONTACT_EMAIL_FROM;
  if (!apiKey || !from) {
    console.error("Contact notification provider is not configured.");
    return false;
  }
  const text = [
    "New Contact Enquiry", "", `Name: ${message.name}`, `Email: ${message.email}`,
    ...(message.phone ? [`Phone: ${message.phone}`] : []),
    `Subject: ${message.subject}`, "", "Message:", message.message,
  ].join("\n");
  try {
    const response = await fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from, to: [recipient], subject: `New Contact Enquiry: ${message.subject}`, text, reply_to: message.email }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) console.error("Contact notification provider returned a non-success status.");
    return response.ok;
  } catch (error) {
    console.error("Contact notification request failed", error instanceof Error ? error.message : "Unknown provider error");
    return false;
  }
}
