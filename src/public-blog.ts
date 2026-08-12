import { getPool } from "@/src/db";

export const PUBLIC_POST_SQL = "p.status = 'published' AND p.deleted_at IS NULL";
export const PUBLIC_POSTS_PER_PAGE = 12;

export type PublicPostCard = {
  slug: string; title: string; shortDescription: string; featuredImagePath: string | null;
  categoryName: string | null; categorySlug: string | null; publishedAt: Date; authorName: string;
};

export type PublicArticle = PublicPostCard & { content: Record<string, unknown>; seoTitle: string | null; seoDescription: string | null };

const cardColumns = `p.slug, p.title, p.short_description AS "shortDescription", p.featured_image_path AS "featuredImagePath",
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

export async function getPublicArticle(slug: string) {
  const pool = getPool();
  const result = await pool.query<PublicArticle>(`SELECT ${cardColumns}, p.content, p.seo_title AS "seoTitle", p.seo_description AS "seoDescription" FROM posts p ${cardJoins} WHERE p.slug = $1 AND ${PUBLIC_POST_SQL} LIMIT 1`, [slug]);
  return result.rows[0] ?? null;
}

export async function getPublicCategories() {
  const pool = getPool();
  const result = await pool.query<{ name: string; slug: string; parentId: string | null }>(`SELECT DISTINCT c.name, c.slug, c.parent_id AS "parentId" FROM categories c INNER JOIN posts p ON p.category_id = c.id WHERE ${PUBLIC_POST_SQL} ORDER BY c.name`);
  return result.rows;
}
