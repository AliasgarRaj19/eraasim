import { z } from "zod";
import { getYouTubeVideoId } from "@/src/blog/youtube";

const plain = (maximum: number, required = false) => z.string().trim().max(maximum).refine((value) => !/<\/?[a-z][\s\S]*>/i.test(value), "HTML is not allowed.").refine((value) => !required || value.length > 0, "This field is required.");
const uploadPath = z.string().regex(/^\/api\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpe?g|png|webp|gif)$/i).or(z.literal(""));
const contentSection = z.object({ visible: z.boolean(), title: plain(200, true), description: plain(5000) });
const customSection = contentSection.extend({ id: z.string().uuid() });
export const aboutConfigSchema = z.object({
  seo: z.object({ title: plain(200), description: plain(500) }),
  intro: z.object({ heading: plain(200, true), description: plain(5000), mediaType: z.enum(["none", "image", "youtube"]), imagePath: uploadPath, imageAlt: plain(300), youtubeUrl: z.string().trim().max(2048) }).superRefine((value, context) => { if (value.mediaType === "youtube" && !getYouTubeVideoId(value.youtubeUrl)) context.addIssue({ code: "custom", path: ["youtubeUrl"], message: "Enter a valid YouTube URL." }); }),
  mission: contentSection, vision: contentSection, offer: contentSection,
  customSections: z.array(customSection).max(20).refine((sections) => new Set(sections.map(({ id }) => id)).size === sections.length, "Custom section IDs must be unique."),
  cta: z.object({ visible: z.boolean(), label: plain(100) }),
});
export type AboutConfig = z.infer<typeof aboutConfigSchema>;
export const defaultAboutConfig: AboutConfig = { seo: { title: "", description: "" }, intro: { heading: "About", description: "", mediaType: "none", imagePath: "", imageAlt: "", youtubeUrl: "" }, mission: { visible: false, title: "Our Mission", description: "" }, vision: { visible: false, title: "Our Vision", description: "" }, offer: { visible: false, title: "What We Offer", description: "" }, customSections: [], cta: { visible: false, label: "Contact Us" } };
export const parseAboutConfig = (value: unknown) => aboutConfigSchema.safeParse(value);
export function parseAboutForm(formData: FormData) { let customSections: unknown; try { customSections = JSON.parse(String(formData.get("customSections") ?? "[]")); } catch { customSections = null; } const section = (key: string) => ({ visible: formData.get(`${key}Visible`) === "on", title: String(formData.get(`${key}Title`) ?? ""), description: String(formData.get(`${key}Description`) ?? "") }); return aboutConfigSchema.safeParse({ seo: { title: String(formData.get("seoTitle") ?? ""), description: String(formData.get("seoDescription") ?? "") }, intro: { heading: String(formData.get("introHeading") ?? ""), description: String(formData.get("introDescription") ?? ""), mediaType: String(formData.get("introMediaType") ?? "none"), imagePath: String(formData.get("introImagePath") ?? ""), imageAlt: String(formData.get("introImageAlt") ?? ""), youtubeUrl: String(formData.get("introYoutubeUrl") ?? "") }, mission: section("mission"), vision: section("vision"), offer: section("offer"), customSections, cta: { visible: formData.get("ctaVisible") === "on", label: String(formData.get("ctaLabel") ?? "") } }); }
