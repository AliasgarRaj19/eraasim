import { z } from "zod";

export const fontOptions = ["editorial", "modern", "system"] as const;
export const widthOptions = ["narrow", "standard", "wide"] as const;
export const shadowOptions = ["none", "subtle", "medium"] as const;
const hex = z.string().regex(/^#[0-9a-f]{6}$/, "Use a canonical six-digit lowercase hex color.");
const colors = <T extends readonly string[]>(keys: T) => z.object(Object.fromEntries(keys.map((key) => [key, hex])) as { [K in T[number]]: typeof hex });

export const themeConfigSchema = z.object({
  typography: z.object({ bodyFont: z.enum(fontOptions), headingFont: z.enum(fontOptions), navigationFont: z.enum(fontOptions), bodySize: z.number().int().min(14).max(24), headingScale: z.number().int().min(80).max(140) }),
  global: colors(["pageBackground", "surfaceBackground", "primaryText", "mutedText", "accent", "link", "linkHover", "border"] as const),
  header: colors(["background", "text", "link", "hover", "dropdownBackground", "dropdownText", "dropdownHover", "announcementBackground", "announcementText"] as const),
  footer: colors(["directoryBackground", "parentHeading", "childLink", "mainBackground", "heading", "bodyText", "link", "linkHover", "divider", "attributionBackground", "attributionText"] as const),
  card: colors(["background", "text", "mutedText", "border", "hoverBorder"] as const),
  button: colors(["primaryBackground", "primaryText", "primaryHover", "secondaryBackground", "secondaryText", "secondaryBorder"] as const),
  layout: z.object({ contentWidth: z.enum(widthOptions), radius: z.number().int().min(0).max(24), shadow: z.enum(shadowOptions), sectionSpacing: z.number().int().min(24).max(120) }),
});
export type ThemeConfig = z.infer<typeof themeConfigSchema>;
export const defaultThemeConfig: ThemeConfig = {
  typography: { bodyFont: "modern", headingFont: "editorial", navigationFont: "modern", bodySize: 16, headingScale: 100 },
  global: { pageBackground: "#f7f3eb", surfaceBackground: "#fffdf8", primaryText: "#25231f", mutedText: "#746d62", accent: "#345c46", link: "#285f78", linkHover: "#203d2d", border: "#ddd5c8" },
  header: { background: "#fffdf8", text: "#25231f", link: "#4f4a42", hover: "#345c46", dropdownBackground: "#fffdf8", dropdownText: "#4f4a42", dropdownHover: "#345c46", announcementBackground: "#203d2d", announcementText: "#ffffff" },
  footer: { directoryBackground: "#fffdf8", parentHeading: "#25231f", childLink: "#746d62", mainBackground: "#1e2922", heading: "#f2f1ec", bodyText: "#b8c1ba", link: "#f2f1ec", linkHover: "#ffffff", divider: "#465049", attributionBackground: "#1e2922", attributionText: "#b8c1ba" },
  card: { background: "#fffdf8", text: "#25231f", mutedText: "#746d62", border: "#ddd5c8", hoverBorder: "#345c46" },
  button: { primaryBackground: "#345c46", primaryText: "#ffffff", primaryHover: "#203d2d", secondaryBackground: "#fffdf8", secondaryText: "#25231f", secondaryBorder: "#ddd5c8" },
  layout: { contentWidth: "standard", radius: 12, shadow: "subtle", sectionSpacing: 80 },
};
export function parseThemeConfig(value: unknown) { return themeConfigSchema.safeParse(value); }
export function parseThemeForm(formData: FormData) { try { return themeConfigSchema.safeParse(JSON.parse(String(formData.get("theme") ?? ""))); } catch { return themeConfigSchema.safeParse(null); } }
