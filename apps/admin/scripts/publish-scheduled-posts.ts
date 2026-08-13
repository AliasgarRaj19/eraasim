import { Pool } from "pg";
import { publishDuePosts, SCHEDULED_PUBLISH_BATCH_SIZE, SCHEDULED_PUBLISH_MAX_BATCHES } from "../src/blog/scheduled-publishing";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

async function main() {
  const pool = new Pool({ connectionString, max: 1 });
  let published = 0;
  try {
  for (let batch = 0; batch < SCHEDULED_PUBLISH_MAX_BATCHES; batch += 1) {
    const count = await publishDuePosts(pool, SCHEDULED_PUBLISH_BATCH_SIZE);
    published += count;
    if (count < SCHEDULED_PUBLISH_BATCH_SIZE) {
      console.log(`Scheduled publishing complete: ${published} post(s) published.`);
      process.exitCode = 0;
      break;
    }
    if (batch === SCHEDULED_PUBLISH_MAX_BATCHES - 1) {
      throw new Error(`Scheduled publishing stopped at the safety limit after ${published} posts; due work remains.`);
    }
  }
  } catch (error) {
    console.error("Scheduled publishing failed.", error instanceof Error ? error.message : "Unknown error");
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
