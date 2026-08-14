import { z } from "zod";

const upload = z.string().regex(/^\/api\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpe?g|png|webp|gif)$/i).or(z.literal(""));
const item = z.object({ pageId: z.string().uuid(), parentPageId: z.string().uuid().nullable(), visible: z.boolean(), order: z.number().int().min(0).max(99) });
export const headerConfigSchema = z.object({
  branding: z.object({ mode: z.enum(["logo", "text"]), line1: z.string().trim().max(80), line2: z.string().trim().max(120), logoPath: upload }),
  defaults: z.object({ homeVisible: z.boolean(), blogVisible: z.boolean(), aboutVisible: z.boolean(), contactVisible: z.boolean(), order: z.array(z.enum(["home", "blog", "about", "contact"])).length(4).refine((v) => new Set(v).size === 4) }),
  manualItems: z.array(item).max(30),
  announcement: z.object({ visible: z.boolean(), message: z.string().trim().max(240) }),
}).superRefine((value, context) => {
  const ids = new Set(value.manualItems.map((entry) => entry.pageId));
  if (ids.size !== value.manualItems.length) context.addIssue({ code: "custom", message: "Menu item IDs must be unique.", path: ["manualItems"] });
  for (const entry of value.manualItems) {
    if (entry.parentPageId && !ids.has(entry.parentPageId)) context.addIssue({ code: "custom", message: "Parent Page menu item does not exist.", path: ["manualItems"] });
    const parent = value.manualItems.find((candidate) => candidate.pageId === entry.parentPageId);
    if (parent?.parentPageId) context.addIssue({ code: "custom", message: "Page menus support only a top level and one child level.", path: ["manualItems"] });
    if (entry.parentPageId === entry.pageId) context.addIssue({ code: "custom", message: "A Page menu item cannot parent itself.", path: ["manualItems"] });
  }
  if (value.announcement.visible && !value.announcement.message) context.addIssue({ code: "custom", message: "Enter an announcement message.", path: ["announcement", "message"] });
});
export type HeaderConfig = z.infer<typeof headerConfigSchema>;
export const defaultHeaderConfig: HeaderConfig = { branding: { mode: "text", line1: "Eraasim", line2: "Stories & journeys", logoPath: "" }, defaults: { homeVisible: true, blogVisible: true, aboutVisible: true, contactVisible: true, order: ["home", "blog", "about", "contact"] }, manualItems: [], announcement: { visible: false, message: "" } };
export function normalizeHeaderConfig(value: unknown) { if (!value || typeof value !== "object") return value; const current=value as Record<string,unknown>,defaults=current.defaults as Record<string,unknown>|undefined;if(!defaults)return value;const oldOrder=Array.isArray(defaults.order)?defaults.order:[];return{...current,defaults:{...defaults,aboutVisible:typeof defaults.aboutVisible==="boolean"?defaults.aboutVisible:true,order:oldOrder.includes("about")?oldOrder:[...oldOrder.filter(key=>key!=="contact"),"about",...oldOrder.filter(key=>key==="contact")]}}; }
export function parseHeaderConfig(value: unknown) { return headerConfigSchema.safeParse(normalizeHeaderConfig(value)); }
export function parseHeaderForm(formData: FormData) { let manualItems: unknown = []; let order: unknown = []; try { manualItems = JSON.parse(String(formData.get("manualItems") ?? "[]")); order = JSON.parse(String(formData.get("defaultOrder") ?? "[]")); } catch { /* validation reports malformed data */ } return headerConfigSchema.safeParse({ branding: { mode: String(formData.get("brandingMode") ?? ""), line1: String(formData.get("line1") ?? ""), line2: String(formData.get("line2") ?? ""), logoPath: String(formData.get("logoPath") ?? "") }, defaults: { homeVisible: formData.get("homeVisible") === "on", blogVisible: formData.get("blogVisible") === "on", aboutVisible: formData.get("aboutVisible") === "on", contactVisible: formData.get("contactVisible") === "on", order }, manualItems, announcement: { visible: formData.get("announcementVisible") === "on", message: String(formData.get("announcementMessage") ?? "") } }); }
