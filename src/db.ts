import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const globalForDb = globalThis as unknown as { eraasimPublicPool?: Pool };
export const pool = globalForDb.eraasimPublicPool ?? new Pool({ connectionString, max: 10 });
if (process.env.NODE_ENV !== "production") globalForDb.eraasimPublicPool = pool;
