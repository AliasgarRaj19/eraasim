import { z } from "zod";

export const sectionIds = ["hero", "latestStories", "categoryDiscovery"] as const;
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
  profileImagePath: uploadPath.default(""),
  showProfileImage: z.boolean().default(false),
  eyebrow: z.string().trim().min(1).max(100),
  eyebrowSize: size(heroSizeBounds.eyebrow),
  heading: z.string().trim().min(1).max(200),
  headingSize: size(heroSizeBounds.heading),
  description: z.string().trim().min(1).max(1000),
  descriptionSize: size(heroSizeBounds.description),
  ctaLabel: z.string().trim().max(100),
  ctaDestination: z.enum(["/", "/blog"]).default("/blog"),
});

export const homeConfigSchema = z.object({
  seoTitle: z.string().trim().max(200).optional(), seoDescription: z.string().trim().max(500).optional(),
  hero: heroSchema,
  latestStories: z.object({ visible: z.boolean(), heading: z.string().trim().min(1).max(200), description: z.string().trim().min(1).max(1000), postCount: z.number().int().min(1).max(12) }),
  categoryDiscovery: z.object({ visible: z.boolean(), heading: z.string().trim().min(1).max(200), description: z.string().trim().min(1).max(1000) }),
  sectionOrder: z.array(z.enum(sectionIds)).length(3).refine((items) => new Set(items).size === 3, "Each Home section must appear exactly once."),
});
export type HomeConfig = z.infer<typeof homeConfigSchema>;
export const defaultHomeConfig: HomeConfig = { seoTitle: "", seoDescription: "", hero: { visible: true, backgroundImagePath: "", showBackgroundImage: false, profileImagePath: "", showProfileImage: false, eyebrow: "Culture · Food · Places", eyebrowSize: 11, heading: "Stories rooted in people and place.", headingSize: 96, description: "Eraasim is a journal for thoughtful encounters, lived experiences and the details that make a place memorable.", descriptionSize: 22, ctaLabel: "Explore the journal", ctaDestination: "/blog" }, latestStories: { visible: true, heading: "Latest stories", description: "Freshly published journeys, observations and reflections.", postCount: 6 }, categoryDiscovery: { visible: true, heading: "Explore by category", description: "Follow a broad theme or step into one of its more specific paths." }, sectionOrder: [...sectionIds] };
export function parseHomeConfig(value: unknown) { return homeConfigSchema.safeParse(value); }
export function parseHomeForm(formData: FormData) { let order: unknown; try { order = JSON.parse(String(formData.get("sectionOrder") ?? "")); } catch { order = null; } return homeConfigSchema.safeParse({ seoTitle: String(formData.get("seoTitle") ?? ""), seoDescription: String(formData.get("seoDescription") ?? ""), hero: { visible: formData.get("heroVisible") === "on", backgroundImagePath: String(formData.get("heroBackgroundImagePath") ?? ""), showBackgroundImage: formData.get("heroShowBackgroundImage") === "on", profileImagePath: String(formData.get("heroProfileImagePath") ?? ""), showProfileImage: formData.get("heroShowProfileImage") === "on", eyebrow: String(formData.get("heroEyebrow") ?? ""), eyebrowSize: Number(formData.get("heroEyebrowSize")), heading: String(formData.get("heroHeading") ?? ""), headingSize: Number(formData.get("heroHeadingSize")), description: String(formData.get("heroDescription") ?? ""), descriptionSize: Number(formData.get("heroDescriptionSize")), ctaLabel: String(formData.get("heroCtaLabel") ?? ""), ctaDestination: String(formData.get("heroCtaDestination") ?? "") }, latestStories: { visible: formData.get("latestVisible") === "on", heading: String(formData.get("latestHeading") ?? ""), description: String(formData.get("latestDescription") ?? ""), postCount: Number(formData.get("latestPostCount")) }, categoryDiscovery: { visible: formData.get("categoryVisible") === "on", heading: String(formData.get("categoryHeading") ?? ""), description: String(formData.get("categoryDescription") ?? "") }, sectionOrder: order }); }
export function promoteDraft<T>(draft: T, previousPublished: T | null, valid: boolean) { return valid ? draft : previousPublished; }
