import { eq, sql } from "drizzle-orm";
import { db, pool } from "../src/db";
import { staffAccounts } from "../src/db/schema";
import { hashPassword } from "../src/auth/password";
import { masterAdminPasswordSchema } from "../src/auth/validation";

const email = (process.env.MASTER_ADMIN_EMAIL ?? "unveiledjourney.asim@gmail.com").trim().toLowerCase();
const name = (process.env.MASTER_ADMIN_NAME ?? "Master Admin").trim();
const password = process.env.MASTER_ADMIN_BOOTSTRAP_PASSWORD;

async function main() {
  if (!password) throw new Error("MASTER_ADMIN_BOOTSTRAP_PASSWORD is required.");
  const validatedPassword = masterAdminPasswordSchema.parse(password);
  const [master] = await db.select({ id: staffAccounts.id, email: staffAccounts.email }).from(staffAccounts).where(eq(staffAccounts.isMasterAdmin, true)).limit(1);
  if (master) {
    if (master.email.toLowerCase() === email) { console.log("Master Admin already exists; no changes made."); return; }
    throw new Error("A different protected Master Admin already exists; no changes made.");
  }
  const [sameEmail] = await db.select({ id: staffAccounts.id }).from(staffAccounts).where(sql`lower(${staffAccounts.email}) = ${email}`).limit(1);
  if (sameEmail) throw new Error("The configured email already belongs to a non-master staff account; no changes made.");
  const passwordHash = await hashPassword(validatedPassword);
  await db.insert(staffAccounts).values({ name, email, passwordHash, isMasterAdmin: true, status: "active" });
  console.log("Master Admin created successfully. Remove the bootstrap password from the environment now.");
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Bootstrap failed."); process.exitCode = 1; }).finally(() => pool.end());
