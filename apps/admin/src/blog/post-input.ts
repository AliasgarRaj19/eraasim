import { z } from "zod";

export const postInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200, "Title must be 200 characters or fewer."),
  slug: z.string().trim().min(1, "Link / Slug is required.").max(180),
  shortDescription: z.string().trim().min(1, "Short Description / Summary is required.").max(500, "Summary must be 500 characters or fewer."),
  featuredImagePath: z.string().trim().max(500).optional(),
  categoryId: z.preprocess((value) => value ?? "", z.union([z.literal(""), z.uuid("Select a valid category.")])),
  content: z.string().min(1, "Long Description / Content is required."),
  seoTitle: z.string().trim().max(2_000, "SEO Title is too long.").optional(),
  seoDescription: z.string().trim().max(4_000, "SEO Description is too long.").optional(),
  intent: z.enum(["preserve", "draft", "published", "scheduled", "unpublished"]),
  scheduledLocal: z.string().optional(),
});

export function parsePostFormData(formData: FormData) {
  return postInputSchema.safeParse(Object.fromEntries(formData));
}
