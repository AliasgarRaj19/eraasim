import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const globalForDb = globalThis as unknown as { eraasimPool?: Pool };
export const pool = globalForDb.eraasimPool ?? new Pool({ connectionString, max: 10 });
if (process.env.NODE_ENV !== "production") globalForDb.eraasimPool = pool;

export const db = drizzle(pool, { schema });
