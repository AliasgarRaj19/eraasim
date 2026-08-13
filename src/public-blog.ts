import { getPool } from "@/src/db";

export const PUBLIC_POST_SQL = "p.status = 'published' AND p.deleted_at IS NULL";
export const PUBLIC_POSTS_PER_PAGE = 12;

export type PublicPostCard = {
  id: string; slug: string; title: string; shortDescription: string; featuredImagePath: string | null;
  categoryName: string | null; categorySlug: string | null; publishedAt: Date; authorName: string; content?: Record<string, unknown>;
};

export type PublicArticle = PublicPostCard & { content: Record<string, unknown>; seoTitle: string | null; seoDescription: string | null };

const cardColumns = `p.id, p.slug, p.title, p.short_description AS "shortDescription", p.featured_image_path AS "featuredImagePath",
  c.name AS "categoryName", c.slug AS "categorySlug", p.published_at AS "publishedAt", s.name AS "authorName"`;
const cardJoins = "LEFT JOIN categories c ON c.id = p.category_id INNER JOIN staff_accounts s ON s.id = p.created_by_id";

export function parsePublicPage(value: string | undefined) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export async function getPublicPosts(requestedPage: number, categorySlug?: string) {
  const pool = getPool();
  const categoryClause = categorySlug ? " AND c.slug = $1" : "";
  const params = categorySlug ? [categorySlug] : [];
  const countResult = await pool.query<{ total: number }>(`SELECT count(*)::int AS total FROM posts p ${cardJoins} WHERE ${PUBLIC_POST_SQL}${categoryClause}`, params);
  const total = countResult.rows[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PUBLIC_POSTS_PER_PAGE));
  const page = Math.min(Math.max(requestedPage, 1), totalPages);
  const rows = await pool.query<PublicPostCard>(`SELECT ${cardColumns} FROM posts p ${cardJoins} WHERE ${PUBLIC_POST_SQL}${categoryClause} ORDER BY p.published_at DESC, p.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, PUBLIC_POSTS_PER_PAGE, (page - 1) * PUBLIC_POSTS_PER_PAGE]);
  return { items: rows.rows, page, total, totalPages };
}

export async function getLatestPosts(limit = 6) {
  const pool = getPool();
  const result = await pool.query<PublicPostCard>(`SELECT ${cardColumns} FROM posts p ${cardJoins} WHERE ${PUBLIC_POST_SQL} ORDER BY p.published_at DESC, p.id DESC LIMIT $1`, [limit]);
  return result.rows;
}

export type FeaturedPublicStory = PublicArticle;
export async function getFeaturedStory(mode: "latest" | "manual", selectedPostId: string | null) {
  const pool = getPool(); const manual = mode === "manual" && selectedPostId;
  const result = await pool.query<FeaturedPublicStory>(`SELECT ${cardColumns}, p.content, p.seo_title AS "seoTitle", p.seo_description AS "seoDescription" FROM posts p ${cardJoins} WHERE ${PUBLIC_POST_SQL}${manual ? " AND p.id = $1" : ""} ORDER BY p.published_at DESC, p.id DESC LIMIT 1`, manual ? [selectedPostId] : []);
  return result.rows[0] ?? null;
}

export async function getHomeStoryPool(mode: "automatic" | "manual", manualPostIds: string[]) {
  const pool = getPool();
  if (mode === "manual") {
    if (!manualPostIds.length) return [];
    const result = await pool.query<PublicPostCard>(`SELECT ${cardColumns}, p.content FROM posts p ${cardJoins} WHERE ${PUBLIC_POST_SQL} AND p.id = ANY($1::uuid[]) ORDER BY array_position($1::uuid[], p.id) LIMIT 9`, [manualPostIds]);
    return result.rows;
  }
  const result = await pool.query<PublicPostCard>(`WITH latest AS (SELECT p.id, row_number() OVER (ORDER BY p.published_at DESC, p.id DESC) AS position FROM posts p WHERE ${PUBLIC_POST_SQL} ORDER BY p.published_at DESC, p.id DESC LIMIT 5), trending AS (SELECT p.id, p.published_at, COALESCE(sum(v.view_count), 0)::bigint AS views FROM posts p LEFT JOIN post_daily_views v ON v.post_id = p.id AND v.view_date >= (CURRENT_DATE - 29) WHERE ${PUBLIC_POST_SQL} AND p.id NOT IN (SELECT id FROM latest) GROUP BY p.id, p.published_at HAVING COALESCE(sum(v.view_count), 0) > 0 ORDER BY views DESC, p.published_at DESC, p.id DESC LIMIT 4), chosen AS (SELECT id, position::bigint AS position FROM latest UNION ALL SELECT id, 5 + row_number() OVER (ORDER BY views DESC, published_at DESC, id DESC) FROM trending), fill AS (SELECT p.id, 100 + row_number() OVER (ORDER BY p.published_at DESC, p.id DESC) AS position FROM posts p WHERE ${PUBLIC_POST_SQL} AND p.id NOT IN (SELECT id FROM chosen) ORDER BY p.published_at DESC, p.id DESC LIMIT 9) SELECT ${cardColumns}, p.content FROM (SELECT * FROM chosen UNION ALL SELECT * FROM fill) pool_ids INNER JOIN posts p ON p.id = pool_ids.id ${cardJoins} WHERE ${PUBLIC_POST_SQL} ORDER BY pool_ids.position LIMIT 9`);
  return result.rows;
}

export async function incrementPublicArticleView(postId: string) {
  const pool = getPool();
  await pool.query(`INSERT INTO post_daily_views (post_id, view_date, view_count) SELECT p.id, (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date, 1 FROM posts p WHERE p.id = $1 AND ${PUBLIC_POST_SQL} ON CONFLICT (post_id, view_date) DO UPDATE SET view_count = post_daily_views.view_count + 1`, [postId]);
}

export async function getPublicArticle(slug: string) {
  const pool = getPool();
  const result = await pool.query<PublicArticle>(`SELECT ${cardColumns}, p.content, p.seo_title AS "seoTitle", p.seo_description AS "seoDescription" FROM posts p ${cardJoins} WHERE p.slug = $1 AND ${PUBLIC_POST_SQL} LIMIT 1`, [slug]);
  return result.rows[0] ?? null;
}

export async function getPublicCategories() {
  const pool = getPool();
  const result = await pool.query<{ id: string; name: string; slug: string; description: string | null; parentId: string | null; parentName: string | null }>(`SELECT c.id, c.name, c.slug, c.description, c.parent_id AS "parentId", parent.name AS "parentName" FROM categories c LEFT JOIN categories parent ON parent.id = c.parent_id ORDER BY parent.name NULLS FIRST, c.name`);
  return result.rows;
}
