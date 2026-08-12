import { z } from "zod";

export const sectionIds = ["hero", "latestStories", "categoryDiscovery"] as const;
const safeCta = z.string().trim().max(500).refine((value) => {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}, "Use a safe internal path or http(s) URL.");
export const homeConfigSchema = z.object({
  seoTitle: z.string().trim().max(200).optional(), seoDescription: z.string().trim().max(500).optional(),
  hero: z.object({ visible: z.boolean(), eyebrow: z.string().trim().min(1).max(100), heading: z.string().trim().min(1).max(200), description: z.string().trim().min(1).max(1000), ctaLabel: z.string().trim().min(1).max(100), ctaDestination: safeCta }),
  latestStories: z.object({ visible: z.boolean(), heading: z.string().trim().min(1).max(200), description: z.string().trim().min(1).max(1000), postCount: z.number().int().min(1).max(12) }),
  categoryDiscovery: z.object({ visible: z.boolean(), heading: z.string().trim().min(1).max(200), description: z.string().trim().min(1).max(1000) }),
  sectionOrder: z.array(z.enum(sectionIds)).length(3).refine((items) => new Set(items).size === 3, "Each Home section must appear exactly once."),
});
export type HomeConfig = z.infer<typeof homeConfigSchema>;
export const defaultHomeConfig: HomeConfig = { seoTitle: "", seoDescription: "", hero: { visible: true, eyebrow: "Culture · Food · Places", heading: "Stories rooted in people and place.", description: "Eraasim is a journal for thoughtful encounters, lived experiences and the details that make a place memorable.", ctaLabel: "Explore the journal", ctaDestination: "/blog" }, latestStories: { visible: true, heading: "Latest stories", description: "Freshly published journeys, observations and reflections.", postCount: 6 }, categoryDiscovery: { visible: true, heading: "Explore by category", description: "Follow a broad theme or step into one of its more specific paths." }, sectionOrder: [...sectionIds] };
export function parseHomeForm(formData: FormData) { let order: unknown; try { order = JSON.parse(String(formData.get("sectionOrder") ?? "")); } catch { order = null; } return homeConfigSchema.safeParse({ seoTitle: String(formData.get("seoTitle") ?? ""), seoDescription: String(formData.get("seoDescription") ?? ""), hero: { visible: formData.get("heroVisible") === "on", eyebrow: String(formData.get("heroEyebrow") ?? ""), heading: String(formData.get("heroHeading") ?? ""), description: String(formData.get("heroDescription") ?? ""), ctaLabel: String(formData.get("heroCtaLabel") ?? ""), ctaDestination: String(formData.get("heroCtaDestination") ?? "") }, latestStories: { visible: formData.get("latestVisible") === "on", heading: String(formData.get("latestHeading") ?? ""), description: String(formData.get("latestDescription") ?? ""), postCount: Number(formData.get("latestPostCount")) }, categoryDiscovery: { visible: formData.get("categoryVisible") === "on", heading: String(formData.get("categoryHeading") ?? ""), description: String(formData.get("categoryDescription") ?? "") }, sectionOrder: order }); }
export function promoteDraft<T>(draft: T, previousPublished: T | null, valid: boolean) { return valid ? draft : previousPublished; }
