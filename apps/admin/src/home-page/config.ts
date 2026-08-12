import { z } from "zod";

export const sectionIds = ["hero", "featuredStory", "latestStories"] as const;
export const heroSizeBounds = {
  eyebrow: { min: 10, max: 40, default: 11 },
  heading: { min: 20, max: 100, default: 96 },
  description: { min: 12, max: 48, default: 22 },
} as const;
export const heroDestinations = [
  { label: "Home", path: "/" },
  { label: "Blog", path: "/blog" },
] as const;

const uploadPath = z.string().regex(/^\/api\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpe?g|png|webp|gif)$/i).or(z.literal(""));
const size = (bounds: { min: number; max: number; default: number }) => z.number().int().min(bounds.min).max(bounds.max).default(bounds.default);
const heroSchema = z.object({
  visible: z.boolean(),
  backgroundImagePath: uploadPath.default(""),
  showBackgroundImage: z.boolean().default(false),
  backgroundImageOpacity: z.number().int().min(0).max(200).default(100),
  profileImagePath: uploadPath.default(""),
  showProfileImage: z.boolean().default(false),
  profileImageOpacity: z.number().int().min(0).max(100).default(100),
  eyebrow: z.string().trim().min(1).max(100),
  showEyebrow: z.boolean().default(true),
  eyebrowSize: size(heroSizeBounds.eyebrow),
  heading: z.string().trim().min(1).max(200),
  showHeading: z.boolean().default(true),
  headingSize: size(heroSizeBounds.heading),
  description: z.string().trim().min(1).max(1000),
  showDescription: z.boolean().default(true),
  descriptionSize: size(heroSizeBounds.description),
  ctaLabel: z.string().trim().max(100),
  showCta: z.boolean().default(true),
  ctaDestination: z.enum(["/", "/blog"]).default("/blog"),
});

export const homeConfigSchema = z.object({
  seoTitle: z.string().trim().max(200).optional(), seoDescription: z.string().trim().max(500).optional(),
  hero: heroSchema,
  featuredStory: z.object({ visible: z.boolean(), sourceMode: z.enum(["latest", "manual"]), selectedPostId: z.string().uuid().nullable() }).superRefine((value, context) => { if (value.sourceMode === "manual" && !value.selectedPostId) context.addIssue({ code: "custom", message: "Select a published Featured Story.", path: ["selectedPostId"] }); }),
  latestStories: z.object({ visible: z.boolean(), heading: z.string().trim().min(1).max(200), description: z.string().trim().min(1).max(1000), selectionMode: z.enum(["automatic", "manual"]), manualPostIds: z.array(z.string().uuid()).max(9), rotationSeconds: z.number().int().min(10).max(60) }).superRefine((value, context) => { if (value.selectionMode === "manual" && value.manualPostIds.length < 1) context.addIssue({ code: "custom", message: "Select at least one published story.", path: ["manualPostIds"] }); if (new Set(value.manualPostIds).size !== value.manualPostIds.length) context.addIssue({ code: "custom", message: "A story can only be selected once.", path: ["manualPostIds"] }); }),
  sectionOrder: z.array(z.enum(sectionIds)).length(3).refine((items) => new Set(items).size === 3, "Each Home section must appear exactly once."),
});
export type HomeConfig = z.infer<typeof homeConfigSchema>;
export const defaultHomeConfig: HomeConfig = { seoTitle: "", seoDescription: "", hero: { visible: true, backgroundImagePath: "", showBackgroundImage: false, backgroundImageOpacity: 100, profileImagePath: "", showProfileImage: false, profileImageOpacity: 100, eyebrow: "Culture · Food · Places", showEyebrow: true, eyebrowSize: 11, heading: "Stories rooted in people and place.", showHeading: true, headingSize: 96, description: "Eraasim is a journal for thoughtful encounters, lived experiences and the details that make a place memorable.", showDescription: true, descriptionSize: 22, ctaLabel: "Explore the journal", showCta: true, ctaDestination: "/blog" }, featuredStory: { visible: true, sourceMode: "latest", selectedPostId: null }, latestStories: { visible: true, heading: "Latest & Trending Stories", description: "Freshly published and most-read stories from the journal.", selectionMode: "automatic", manualPostIds: [], rotationSeconds: 18 }, sectionOrder: [...sectionIds] };
export function normalizeHomeConfig(value: unknown): unknown { if (!value || typeof value !== "object") return value; const old = value as Record<string, unknown>; const latest = old.latestStories as Record<string, unknown> | undefined; const oldOrder = Array.isArray(old.sectionOrder) ? old.sectionOrder : []; return { ...old, featuredStory: old.featuredStory ?? defaultHomeConfig.featuredStory, latestStories: latest ? { visible: latest.visible, heading: latest.heading === "Latest stories" ? defaultHomeConfig.latestStories.heading : latest.heading, description: latest.description, selectionMode: latest.selectionMode ?? "automatic", manualPostIds: latest.manualPostIds ?? [], rotationSeconds: latest.rotationSeconds ?? 18 } : defaultHomeConfig.latestStories, sectionOrder: oldOrder.includes("featuredStory") ? oldOrder.filter((id) => sectionIds.includes(id as typeof sectionIds[number])) : ["hero", "featuredStory", "latestStories"] }; }
export function parseHomeConfig(value: unknown) { return homeConfigSchema.safeParse(normalizeHomeConfig(value)); }
export function parseHomeForm(formData: FormData) { let order: unknown; try { order = JSON.parse(String(formData.get("sectionOrder") ?? "")); } catch { order = null; } const selected = String(formData.get("featuredPostId") ?? ""); const manualPostIds = Array.from({ length: 9 }, (_, index) => String(formData.get(`manualPostId${index + 1}`) ?? "")).filter(Boolean); return homeConfigSchema.safeParse({ seoTitle: String(formData.get("seoTitle") ?? ""), seoDescription: String(formData.get("seoDescription") ?? ""), hero: { visible: formData.get("heroVisible") === "on", backgroundImagePath: String(formData.get("heroBackgroundImagePath") ?? ""), showBackgroundImage: formData.get("heroShowBackgroundImage") === "on", backgroundImageOpacity: Number(formData.get("heroBackgroundImageOpacity")), profileImagePath: String(formData.get("heroProfileImagePath") ?? ""), showProfileImage: formData.get("heroShowProfileImage") === "on", profileImageOpacity: Number(formData.get("heroProfileImageOpacity")), eyebrow: String(formData.get("heroEyebrow") ?? ""), showEyebrow: formData.get("heroShowEyebrow") === "on", eyebrowSize: Number(formData.get("heroEyebrowSize")), heading: String(formData.get("heroHeading") ?? ""), showHeading: formData.get("heroShowHeading") === "on", headingSize: Number(formData.get("heroHeadingSize")), description: String(formData.get("heroDescription") ?? ""), showDescription: formData.get("heroShowDescription") === "on", descriptionSize: Number(formData.get("heroDescriptionSize")), ctaLabel: String(formData.get("heroCtaLabel") ?? ""), showCta: formData.get("heroShowCta") === "on", ctaDestination: String(formData.get("heroCtaDestination") ?? "") }, featuredStory: { visible: formData.get("featuredVisible") === "on", sourceMode: String(formData.get("featuredSourceMode") ?? ""), selectedPostId: selected || null }, latestStories: { visible: formData.get("latestVisible") === "on", heading: String(formData.get("latestHeading") ?? ""), description: String(formData.get("latestDescription") ?? ""), selectionMode: String(formData.get("latestSelectionMode") ?? ""), manualPostIds, rotationSeconds: Number(formData.get("latestRotationSeconds")) }, sectionOrder: order }); }
export function promoteDraft<T>(draft: T, previousPublished: T | null, valid: boolean) { return valid ? draft : previousPublished; }
