const sensitiveKey = /(password|secret|token|authori[sz]ation|cookie|smtp|api.?key|private.?key|content|comment|message|email|body|reply|recipient|request|payload|rich.?text|html)/i;
const moduleRules: readonly [RegExp, string][] = [
  [/^(post|blog)\./, "Blog"], [/^categor(y|ies)\./, "Categories"], [/^comments?\./, "Comments"],
  [/^subscribers?\./, "Subscribers"], [/^pages?\./, "Pages"], [/^(jobs?|careers?)\./, "Careers / Jobs"],
  [/^header\./, "Header"], [/^footer\./, "Footer"], [/^theme\./, "Theme"], [/^contact\./, "Contact"],
  [/^engagement\./, "Engagement"], [/^(staff|role|permission)\./, "Staff"], [/^(scheduled|system|logs)\./, "System"],
];
export const activityModules = ["Blog","Categories","Comments","Subscribers","Pages","Careers / Jobs","Header","Footer","Theme","Contact","Engagement","Staff","System","Other"] as const;
export function activityModule(action: string) { return moduleRules.find(([pattern]) => pattern.test(action))?.[1] ?? "Other"; }
export function readableAction(action: string) { return action.split(/[._-]+/).filter(Boolean).map((word) => word === "resubscribed" ? "Re-subscribed" : word[0]?.toUpperCase() + word.slice(1)).join(" "); }
export function safeMetadata(value: unknown, depth = 0): unknown {
  if (depth > 3) return "[omitted]";
  if (value === null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return value.slice(0, 300);
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => safeMetadata(item, depth + 1));
  if (typeof value !== "object") return undefined;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !sensitiveKey.test(key)).slice(0, 30).map(([key, item]) => [key, safeMetadata(item, depth + 1)]).filter(([, item]) => item !== undefined));
}
export function metadataSummary(value: unknown) { const safe = safeMetadata(value); if (!safe || typeof safe !== "object" || !Object.keys(safe).length) return "—"; return Object.entries(safe as Record<string, unknown>).slice(0, 3).map(([key, item]) => `${key}: ${typeof item === "object" ? JSON.stringify(item) : String(item)}`).join(" · ").slice(0, 220); }
export function targetSummary(entityType: string | null, entityId: string | null, metadata: unknown) { const safe = safeMetadata(metadata) as Record<string, unknown> | null; const slug = typeof safe?.slug === "string" ? safe.slug : null; const id = slug ?? entityId; return entityType && id ? `${readableAction(entityType)}: ${id.slice(0, 80)}` : id?.slice(0, 80) ?? entityType ?? "—"; }
export const displayDate = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
export function parseKolkataRange(from?: string, to?: string) { const valid = (value?: string) => { if (!value) return true; const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value); if(!match)return false; const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]),date=new Date(Date.UTC(year,month-1,day)); return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day; }; if (!valid(from) || !valid(to) || (from && to && from > to)) return null; const start = from ? new Date(`${from}T00:00:00+05:30`) : undefined; const end = to ? new Date(new Date(`${to}T00:00:00+05:30`).valueOf() + 86_400_000) : undefined; return { start, end }; }
export function csvCell(value: string) { const safe = /^[=+\-@]/.test(value) ? `'${value}` : value; return `"${safe.replaceAll('"', '""')}"`; }
