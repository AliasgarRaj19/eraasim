import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { publicMediaUrl } from "@/src/media";

type JsonNode = { type?: string; text?: string; attrs?: Record<string, unknown>; marks?: JsonNode[]; content?: JsonNode[] };
const colors = new Set(["#1f211d", "#686b63", "#a42c2c", "#b75d16", "#365b43", "#285f9e", "#70428f"]);

function safeLink(value: unknown) {
  if (typeof value !== "string") return null;
  try { const url = new URL(value); return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.toString() : null; } catch { return null; }
}
function youtubeId(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] ?? null;
    if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else { const [kind, candidate] = url.pathname.split("/").filter(Boolean); if (["embed", "shorts", "live"].includes(kind)) id = candidate ?? null; }
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}
function marked(text: ReactNode, marks: JsonNode[] = [], key: string): ReactNode {
  return marks.reduce<ReactNode>((value, mark, index) => {
    if (mark.type === "bold") return <strong key={`${key}-${index}`}>{value}</strong>;
    if (mark.type === "italic") return <em key={`${key}-${index}`}>{value}</em>;
    if (mark.type === "underline") return <u key={`${key}-${index}`}>{value}</u>;
    if (mark.type === "textStyle" && typeof mark.attrs?.color === "string" && colors.has(mark.attrs.color.toLowerCase())) return <span key={`${key}-${index}`} style={{ color: mark.attrs.color.toLowerCase() }}>{value}</span>;
    if (mark.type === "link") { const href = safeLink(mark.attrs?.href); return href ? <a key={`${key}-${index}`} href={href} target="_blank" rel="noopener noreferrer nofollow">{value}</a> : value; }
    return value;
  }, text);
}
function renderNodes(nodes: JsonNode[] | undefined, path: string): ReactNode[] { return (nodes ?? []).map((node, index) => renderNode(node, `${path}-${index}`)); }
function renderNode(node: JsonNode, key: string): ReactNode {
  const children = renderNodes(node.content, key);
  if (node.type === "text") return <span key={key}>{marked(node.text ?? "", node.marks, key)}</span>;
  if (node.type === "doc") return <div key={key}>{children}</div>;
  if (node.type === "paragraph") return <p key={key}>{children}</p>;
  if (node.type === "heading") { const level = Number(node.attrs?.level); if (level === 2) return <h2 key={key}>{children}</h2>; if (level === 3) return <h3 key={key}>{children}</h3>; return <h4 key={key}>{children}</h4>; }
  if (node.type === "bulletList") return <ul key={key}>{children}</ul>;
  if (node.type === "orderedList") return <ol key={key}>{children}</ol>;
  if (node.type === "listItem") return <li key={key}>{children}</li>;
  if (node.type === "blockquote") return <blockquote key={key}>{children}</blockquote>;
  if (node.type === "hardBreak") return <br key={key} />;
  if (node.type === "horizontalRule") return <hr key={key} />;
  if (node.type === "image") { const src = publicMediaUrl(typeof node.attrs?.src === "string" ? node.attrs.src : null); const width = typeof node.attrs?.width === "number" && Number.isFinite(node.attrs.width) && node.attrs.width >= 10 && node.attrs.width <= 100 ? node.attrs.width : 100; return src ? <figure className="article-image" key={key} style={{ "--image-width": `${width}%` } as CSSProperties}><Image src={src} alt={typeof node.attrs?.alt === "string" ? node.attrs.alt : ""} width={1200} height={675} unoptimized /></figure> : null; }
  if (node.type === "youtube") { const id = youtubeId(node.attrs?.src); return id ? <div className="video-embed" key={key}><iframe src={`https://www.youtube-nocookie.com/embed/${id}`} title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div> : null; }
  return null;
}
export function TiptapContent({ content }: { content: Record<string, unknown> }) { return <div className="article-content">{renderNode(content as JsonNode, "content")}</div>; }
export const tiptapRenderSecurity = { safeLink, youtubeId };
