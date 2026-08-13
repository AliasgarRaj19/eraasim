import { z } from "zod";

const upload = z.string().regex(/^\/api\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpe?g|png|webp|gif)$/i).or(z.literal(""));
const destination = z.string().max(2048).refine((value) => {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; }
}, "Choose a safe internal, HTTP, or HTTPS destination.");
const item = z.object({ id: z.string().uuid(), label: z.string().trim().min(1).max(80), destination, parentId: z.string().uuid().nullable(), visible: z.boolean(), order: z.number().int().min(0).max(99) });
export const headerConfigSchema = z.object({
  branding: z.object({ line1: z.string().trim().min(1).max(80), line2: z.string().trim().min(1).max(120), logoPath: upload }),
  defaults: z.object({ homeVisible: z.boolean(), blogVisible: z.boolean(), contactVisible: z.boolean(), order: z.array(z.enum(["home", "blog", "contact"])).length(3).refine((v) => new Set(v).size === 3) }),
  manualItems: z.array(item).max(30),
  announcement: z.object({ visible: z.boolean(), message: z.string().trim().max(240) }),
}).superRefine((value, context) => {
  const ids = new Set(value.manualItems.map((entry) => entry.id));
  if (ids.size !== value.manualItems.length) context.addIssue({ code: "custom", message: "Menu item IDs must be unique.", path: ["manualItems"] });
  for (const entry of value.manualItems) {
    if (entry.parentId && !ids.has(entry.parentId)) context.addIssue({ code: "custom", message: "Parent menu item does not exist.", path: ["manualItems"] });
    const parent = value.manualItems.find((candidate) => candidate.id === entry.parentId);
    if (parent?.parentId) context.addIssue({ code: "custom", message: "Manual menus support only a top level and one child level.", path: ["manualItems"] });
    if (entry.parentId === entry.id) context.addIssue({ code: "custom", message: "A menu item cannot parent itself.", path: ["manualItems"] });
  }
  if (value.announcement.visible && !value.announcement.message) context.addIssue({ code: "custom", message: "Enter an announcement message.", path: ["announcement", "message"] });
});
export type HeaderConfig = z.infer<typeof headerConfigSchema>;
export const defaultHeaderConfig: HeaderConfig = { branding: { line1: "Eraasim", line2: "Stories & journeys", logoPath: "" }, defaults: { homeVisible: true, blogVisible: true, contactVisible: true, order: ["home", "blog", "contact"] }, manualItems: [], announcement: { visible: false, message: "" } };
export function parseHeaderConfig(value: unknown) { return headerConfigSchema.safeParse(value); }
export function parseHeaderForm(formData: FormData) { let manualItems: unknown = []; let order: unknown = []; try { manualItems = JSON.parse(String(formData.get("manualItems") ?? "[]")); order = JSON.parse(String(formData.get("defaultOrder") ?? "[]")); } catch { /* validation reports malformed data */ } return headerConfigSchema.safeParse({ branding: { line1: String(formData.get("line1") ?? ""), line2: String(formData.get("line2") ?? ""), logoPath: String(formData.get("logoPath") ?? "") }, defaults: { homeVisible: formData.get("homeVisible") === "on", blogVisible: formData.get("blogVisible") === "on", contactVisible: formData.get("contactVisible") === "on", order }, manualItems, announcement: { visible: formData.get("announcementVisible") === "on", message: String(formData.get("announcementMessage") ?? "") } }); }
