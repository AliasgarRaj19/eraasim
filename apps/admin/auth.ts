import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/src/db";
import { activityLogs, staffAccounts } from "@/src/db/schema";
import { verifyPassword } from "@/src/auth/password";

const credentialsSchema = z.object({ email: z.string().trim().email(), password: z.string().min(12).max(256) });

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60, updateAge: 60 * 60 },
  providers: [Credentials({
    credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
    async authorize(raw) {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;
      const email = parsed.data.email.toLowerCase();
      const [account] = await db.select().from(staffAccounts).where(sql`lower(${staffAccounts.email}) = ${email}`).limit(1);
      if (!account || account.status !== "active" || !account.passwordHash || !(await verifyPassword(parsed.data.password, account.passwordHash))) return null;
      return { id: account.id, email: account.email, name: account.name, isMasterAdmin: account.isMasterAdmin };
    },
  })],
  callbacks: {
    jwt({ token, user }) { if (user) token.isMasterAdmin = user.isMasterAdmin; return token; },
    session({ session, token }) {
      if (session.user && token.sub) { session.user.id = token.sub; session.user.isMasterAdmin = Boolean(token.isMasterAdmin); }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.id) return;
      await db.transaction(async (tx) => {
        await tx.update(staffAccounts).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(staffAccounts.id, user.id!));
        await tx.insert(activityLogs).values({ staffAccountId: user.id, action: "auth.login", description: "Administrative account logged in." });
      });
    },
    async signOut(message) {
      const staffAccountId = "token" in message ? message.token?.sub : message.session?.userId;
      if (staffAccountId) await db.insert(activityLogs).values({ staffAccountId, action: "auth.logout", description: "Administrative account logged out." });
    },
  },
});
