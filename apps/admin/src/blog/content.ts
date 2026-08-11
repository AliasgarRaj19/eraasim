import { canonicalYouTubeUrl } from "@/src/blog/youtube";
import { ALLOWED_TEXT_COLORS, imageWidthFromAttributes, isValidImageWidth, LEGACY_IMAGE_WIDTHS } from "@/src/blog/editor-controls";

type JsonObject = Record<string, unknown>;

const containerNodes = new Set(["doc", "paragraph", "blockquote", "bulletList", "orderedList", "listItem"]);
const leafNodes = new Set(["hardBreak", "horizontalRule"]);
const textMarks = new Set(["bold", "italic", "underline"]);
const uploadPathPattern = /^\/api\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpe?g|png|webp|gif)$/i;

function safeLink(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalizeMarks(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  return value.map((mark) => {
    if (!mark || typeof mark !== "object") throw new Error("Content contains an invalid text mark.");
    const candidate = mark as JsonObject;
    if (typeof candidate.type !== "string") throw new Error("Content contains an invalid text mark.");
    if (textMarks.has(candidate.type)) return { type: candidate.type };
    if (candidate.type === "textStyle") {
      const color = (candidate.attrs as JsonObject | undefined)?.color;
      if (typeof color !== "string" || !ALLOWED_TEXT_COLORS.has(color.toLowerCase())) {
        throw new Error("Content contains an unsupported text color.");
      }
      return { type: "textStyle", attrs: { color: color.toLowerCase() } };
    }
    if (candidate.type === "link") {
      const href = safeLink((candidate.attrs as JsonObject | undefined)?.href);
      if (!href) throw new Error("Content contains an unsafe link.");
      return { type: "link", attrs: { href, target: "_blank", rel: "noopener noreferrer nofollow" } };
    }
    throw new Error(`Content mark ${candidate.type} is not allowed.`);
  });
}

function normalizeNode(value: unknown): JsonObject {
  if (!value || typeof value !== "object") throw new Error("Content contains an invalid node.");
  const node = value as JsonObject;
  if (typeof node.type !== "string") throw new Error("Content contains an invalid node type.");

  if (node.type === "text") {
    if (typeof node.text !== "string") throw new Error("Content contains invalid text.");
    const marks = normalizeMarks(node.marks);
    return { type: "text", text: node.text.slice(0, 100_000), ...(marks?.length ? { marks } : {}) };
  }

  if (node.type === "heading") {
    const level = (node.attrs as JsonObject | undefined)?.level;
    if (![2, 3, 4].includes(Number(level))) throw new Error("Only heading levels 2 through 4 are allowed.");
    return { type: "heading", attrs: { level }, content: normalizeChildren(node.content) };
  }

  if (containerNodes.has(node.type)) {
    return { type: node.type, ...(Array.isArray(node.content) ? { content: normalizeChildren(node.content) } : {}) };
  }

  if (leafNodes.has(node.type)) return { type: node.type };

  if (node.type === "image") {
    const attrs = node.attrs as JsonObject | undefined;
    if (!attrs || typeof attrs.src !== "string" || !uploadPathPattern.test(attrs.src)) {
      throw new Error("Content images must be uploaded through Eraasim.");
    }
    const hasCanonicalWidth = attrs.width !== undefined && attrs.width !== null;
    if (hasCanonicalWidth && !isValidImageWidth(attrs.width)) throw new Error("Content contains an unsupported image width.");
    const legacyDisplaySize = attrs.displaySize;
    const hasMeaningfulLegacySize = legacyDisplaySize !== undefined && legacyDisplaySize !== null && legacyDisplaySize !== "";
    if (!hasCanonicalWidth && hasMeaningfulLegacySize && (typeof legacyDisplaySize !== "string" || !(legacyDisplaySize in LEGACY_IMAGE_WIDTHS))) {
      throw new Error("Content contains an unsupported legacy image display size.");
    }
    return {
      type: "image",
      attrs: {
        src: attrs.src,
        alt: typeof attrs.alt === "string" ? attrs.alt.slice(0, 300) : null,
        title: typeof attrs.title === "string" ? attrs.title.slice(0, 300) : null,
        width: imageWidthFromAttributes(attrs.width, hasMeaningfulLegacySize ? legacyDisplaySize : undefined),
      },
    };
  }

  if (node.type === "youtube") {
    const src = canonicalYouTubeUrl(String((node.attrs as JsonObject | undefined)?.src ?? ""));
    if (!src) throw new Error("Content contains an invalid YouTube URL.");
    return { type: "youtube", attrs: { src, width: 640, height: 360 } };
  }

  throw new Error(`Content node ${node.type} is not allowed.`);
}

function normalizeChildren(value: unknown) {
  if (!Array.isArray(value)) throw new Error("Content has an invalid structure.");
  return value.map(normalizeNode);
}

export function parseAndNormalizeContent(value: string) {
  if (value.length > 1_000_000) throw new Error("Content is too large.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("Content is not valid editor data.");
  }
  const content = normalizeNode(parsed);
  if (content.type !== "doc") throw new Error("Content must be an editor document.");
  return content;
}

export function contentHasBody(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const node = value as Record<string, unknown>;
  if (node.type === "image" || node.type === "youtube") return true;
  if (typeof node.text === "string" && node.text.trim()) return true;
  return Array.isArray(node.content) && node.content.some(contentHasBody);
}
