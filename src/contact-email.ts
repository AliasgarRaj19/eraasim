import nodemailer from "nodemailer";
import type { ContactInput } from "@/src/contact-page";

type EmailEnvironment = {
  SMTP_HOST?: string; SMTP_PORT?: string; SMTP_SECURE?: string;
  SMTP_USER?: string; SMTP_APP_PASSWORD?: string; CONTACT_EMAIL_FROM?: string;
};
type MailTransport = { sendMail(options: Record<string, unknown>): Promise<unknown> };
type TransportFactory = (options: Record<string, unknown>) => MailTransport;

function smtpConfiguration(environment: EmailEnvironment) {
  const port = Number(environment.SMTP_PORT);
  if (!environment.SMTP_HOST || !Number.isInteger(port) || port < 1 || port > 65535 ||
      !["true", "false"].includes(environment.SMTP_SECURE ?? "") || !environment.SMTP_USER ||
      !environment.SMTP_APP_PASSWORD || !environment.CONTACT_EMAIL_FROM) return null;
  return { host: environment.SMTP_HOST, port, secure: environment.SMTP_SECURE === "true", user: environment.SMTP_USER, password: environment.SMTP_APP_PASSWORD, from: environment.CONTACT_EMAIL_FROM };
}

export async function notifyContact(
  recipient: string,
  message: ContactInput,
  environment?: EmailEnvironment,
  createTransport: TransportFactory = nodemailer.createTransport,
) {
  const source = environment ?? { SMTP_HOST: process.env.SMTP_HOST, SMTP_PORT: process.env.SMTP_PORT, SMTP_SECURE: process.env.SMTP_SECURE, SMTP_USER: process.env.SMTP_USER, SMTP_APP_PASSWORD: process.env.SMTP_APP_PASSWORD, CONTACT_EMAIL_FROM: process.env.CONTACT_EMAIL_FROM };
  const config = smtpConfiguration(source);
  if (!config) { console.error("Contact SMTP notification is not configured correctly."); return false; }
  const text = ["New Contact Enquiry", "", `Name: ${message.name}`, `Email: ${message.email}`, ...(message.phone ? [`Phone: ${message.phone}`] : []), `Subject: ${message.subject}`, "", "Message:", message.message].join("\n");
  try {
    const transport = createTransport({ host: config.host, port: config.port, secure: config.secure, auth: { user: config.user, pass: config.password }, connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000 });
    await transport.sendMail({ from: config.from, to: recipient, replyTo: message.email, subject: `New Contact Enquiry: ${message.subject}`, text });
    return true;
  } catch {
    console.error("Contact SMTP notification failed.");
    return false;
  }
}
