import { getPool } from "@/src/db";

export const PUBLIC_SEARCH_PAGE_SIZE = 15;
export type PublicSearchType = "Blog Post" | "Page" | "Category";
export type PublicSearchResult = { id:string;type:PublicSearchType;title:string;href:string;description:string|null;content:unknown;publishedAt:Date|null;rank:number };

export function normalizePublicSearchQuery(value:string|string[]|undefined){const query=(Array.isArray(value)?value[0]:value??"").trim().replace(/\s+/g," ");if(!query)return{query,error:null};if(query.length<2)return{query,error:"Enter at least 2 characters."};if(query.length>100)return{query,error:"Search terms must be 100 characters or fewer."};return{query,error:null}}
export function parsePublicSearchPage(value:string|string[]|undefined){const page=Number(Array.isArray(value)?value[0]:value);return Number.isSafeInteger(page)&&page>0?page:1}
export function structuredPlainText(value:unknown,limit=12_000){const parts:string[]=[];let length=0;function visit(node:unknown){if(length>=limit||!node||typeof node!=="object")return;const record=node as Record<string,unknown>;if(typeof record.text==="string"){const clean=record.text.replace(/\s+/g," ").trim();if(clean){parts.push(clean);length+=clean.length+1}}if(Array.isArray(record.content))record.content.forEach(visit)}visit(value);return parts.join(" ").replace(/\s+/g," ").trim().slice(0,limit)}
export function publicSearchSnippet(result:Pick<PublicSearchResult,"description"|"content">,query:string,limit=220){const text=(result.description?.trim()||structuredPlainText(result.content)).replace(/\s+/g," ").trim();if(!text)return"";const term=query.toLocaleLowerCase().split(" ").find(value=>value.length>1)??query.toLocaleLowerCase(),match=text.toLocaleLowerCase().indexOf(term),start=match>70?Math.max(0,match-55):0,excerpt=text.slice(start,start+limit).trim();return`${start?"…":""}${excerpt}${start+limit<text.length?"…":""}`}

export const PUBLIC_SEARCH_CANDIDATES_SQL=`
WITH search_input AS (SELECT plainto_tsquery('simple',$1) AS query,lower($1) AS phrase),
source_rows AS (
 SELECT p.id::text AS id,'Blog Post'::text AS type,p.title,'/blog/'||p.slug AS href,p.short_description AS description,p.content,p.published_at,concat_ws(' ',p.title,p.short_description,jsonb_path_query_array(p.content,'$.**.text')::text) AS search_text FROM posts p WHERE p.status='published' AND p.deleted_at IS NULL
 UNION ALL
 SELECT g.id::text,'Page',g.title,'/'||g.slug,g.seo_description,g.content,g.published_at,concat_ws(' ',g.title,g.seo_title,g.seo_description,jsonb_path_query_array(g.content,'$.**.text')::text) FROM generic_pages g WHERE g.status='published' AND g.deleted_at IS NULL
 UNION ALL
 SELECT c.id::text,'Category',c.name,'/categories/'||c.slug,c.description,NULL::jsonb,NULL::timestamptz,concat_ws(' ',c.name,c.description) FROM categories c
),ranked AS (
 SELECT s.id,s.type,s.title,s.href,s.description,s.content,s.published_at,(CASE WHEN lower(s.title)=i.phrase THEN 120 WHEN position(i.phrase in lower(s.title))>0 THEN 90 ELSE 0 END+CASE WHEN to_tsvector('simple',s.title)@@i.query THEN 60 ELSE 0 END+ts_rank_cd(to_tsvector('simple',s.search_text),i.query)*20)::float8 AS rank
 FROM source_rows s CROSS JOIN search_input i WHERE to_tsvector('simple',s.search_text)@@i.query OR position(i.phrase in lower(s.title))>0
)
SELECT id,type,title,href,description,content,published_at AS "publishedAt",rank,count(*) OVER()::int AS "totalCount" FROM ranked`;

export async function searchPublicContent(query:string,requestedPage:number){const pool=getPool(),offset=(requestedPage-1)*PUBLIC_SEARCH_PAGE_SIZE;let result=await pool.query<PublicSearchResult&{totalCount:number}>(`${PUBLIC_SEARCH_CANDIDATES_SQL} ORDER BY rank DESC,published_at DESC NULLS LAST,lower(title),id LIMIT $2 OFFSET $3`,[query,PUBLIC_SEARCH_PAGE_SIZE,offset]);let total=result.rows[0]?.totalCount??0,totalPages=Math.max(1,Math.ceil(total/PUBLIC_SEARCH_PAGE_SIZE)),page=Math.min(requestedPage,totalPages);if(!result.rows.length&&requestedPage>1){const count=await pool.query<{total:number}>(`SELECT count(*)::int AS total FROM (${PUBLIC_SEARCH_CANDIDATES_SQL}) matches`,[query]);total=count.rows[0]?.total??0;totalPages=Math.max(1,Math.ceil(total/PUBLIC_SEARCH_PAGE_SIZE));page=Math.min(requestedPage,totalPages);if(total)result=await pool.query<PublicSearchResult&{totalCount:number}>(`${PUBLIC_SEARCH_CANDIDATES_SQL} ORDER BY rank DESC,published_at DESC NULLS LAST,lower(title),id LIMIT $2 OFFSET $3`,[query,PUBLIC_SEARCH_PAGE_SIZE,(page-1)*PUBLIC_SEARCH_PAGE_SIZE])}return{items:result.rows,page,total,totalPages}}
