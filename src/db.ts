import { Pool } from "pg";

const globalForDb = globalThis as unknown as { eraasimPublicPool?: Pool };

export function getPool() {
  if (globalForDb.eraasimPublicPool) return globalForDb.eraasimPublicPool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for public database operations");
  const pool = new Pool({ connectionString, max: 10 });
  globalForDb.eraasimPublicPool = pool;
  return pool;
}
