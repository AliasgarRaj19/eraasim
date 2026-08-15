import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { notifyCommentReply } from "../src/comments/reply-email";

async function main() {
  const environment={SMTP_HOST:"smtp.example.test",SMTP_PORT:"465",SMTP_SECURE:"true",SMTP_USER:"mailer@example.test",SMTP_APP_PASSWORD:"secret-not-for-output",CONTACT_EMAIL_FROM:"Eraasim <mailer@example.test>",PUBLIC_SITE_URL:"https://www.example.test/base"};
  const message={recipient:"reader@example.test",commenterName:"Reader",postTitle:"A Safe Post\r\nBcc: bad@example.test",postSlug:"safe-post",originalComment:"x".repeat(600),reply:"Thanks for joining the conversation."};
  let options:Record<string,unknown>|undefined;
  const sent=await notifyCommentReply(message,environment,()=>({async sendMail(value){options=value}}));
  assert(sent&&options);assert.equal(options.to,message.recipient);assert.equal(options.from,environment.CONTACT_EMAIL_FROM);assert.equal(options.subject,"New reply to your comment on A Safe Post Bcc: bad@example.test");
  const text=String(options.text);assert(text.includes(message.reply)&&text.includes("https://www.example.test/blog/safe-post#comments")&&text.includes("Reader")&&!text.includes("x".repeat(501)));assert(!String(options.subject).includes("\n"));
  const failed=await notifyCommentReply(message,environment,()=>({async sendMail(){throw new Error("provider secret")}}));assert.equal(failed,false);
  const action=readFileSync(new URL("../app/(admin)/comments/actions.ts",import.meta.url),"utf8"),detail=readFileSync(new URL("../app/(admin)/comments/[id]/page.tsx",import.meta.url),"utf8"),migration=readFileSync(new URL("../drizzle/0015_legal_scalphunter.sql",import.meta.url),"utf8"),compose=readFileSync(new URL("../../../compose.yaml",import.meta.url),"utf8");
  const insert=action.indexOf("tx.insert(blogComments)"),transactionEnd=action.indexOf("if(!saved)"),notify=action.indexOf("notifyCommentReply(saved)"),state=action.indexOf("notificationSent:true");assert(insert>=0&&insert<transactionEnd&&transactionEnd<notify&&notify<state);
  assert(action.includes("notificationAttemptedAt")&&action.includes("parent.email")&&!action.includes("recipient:parsed"));assert(detail.includes("Notification:")&&detail.includes("Not sent")&&detail.includes("Sent"));
  for(const column of["notification_sent","notification_sent_at","notification_attempted_at"])assert(migration.includes(column));for(const key of["SMTP_HOST","SMTP_APP_PASSWORD","CONTACT_EMAIL_FROM","PUBLIC_SITE_URL"])assert(compose.includes(key));
  console.log("Admin reply storage-first SMTP and notification-state regressions passed.");
}
main().catch((error)=>{console.error(error);process.exitCode=1});
