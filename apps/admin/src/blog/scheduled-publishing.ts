export const SCHEDULED_PUBLISH_BATCH_SIZE = 100;
export const SCHEDULED_PUBLISH_MAX_BATCHES = 100;

export const publishDuePostsSql = `
WITH due AS (
  SELECT id, scheduled_for
  FROM posts
  WHERE status = 'scheduled'
    AND deleted_at IS NULL
    AND scheduled_for IS NOT NULL
    AND scheduled_for <= CURRENT_TIMESTAMP
  ORDER BY scheduled_for, id
  LIMIT $1
  FOR UPDATE SKIP LOCKED
), promoted AS (
  UPDATE posts AS post
  SET status = 'published',
      published_at = due.scheduled_for,
      updated_at = CURRENT_TIMESTAMP
  FROM due
  WHERE post.id = due.id
    AND post.status = 'scheduled'
    AND post.deleted_at IS NULL
    AND post.scheduled_for = due.scheduled_for
  RETURNING post.id, post.slug, post.scheduled_for, post.published_at
), logged AS (
  INSERT INTO activity_logs (staff_account_id, action, entity_type, entity_id, description, metadata)
  SELECT NULL,
         'blog.post.scheduled_published',
         'post',
         promoted.id::text,
         'Scheduled blog post published automatically.',
         jsonb_build_object(
           'slug', promoted.slug,
           'scheduledFor', promoted.scheduled_for,
           'publishedAt', promoted.published_at,
           'actor', 'system'
         )
  FROM promoted
  RETURNING entity_id
)
SELECT count(*)::int AS count FROM logged;
`;

type QueryResult = { rows: Array<{ count: number }> };
export type ScheduledPublishingClient = { query(sql: string, values: unknown[]): Promise<QueryResult> };

export async function publishDuePosts(client: ScheduledPublishingClient, batchSize = SCHEDULED_PUBLISH_BATCH_SIZE) {
  const result = await client.query(publishDuePostsSql, [batchSize]);
  return result.rows[0]?.count ?? 0;
}
