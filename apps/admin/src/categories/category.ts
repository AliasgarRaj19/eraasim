import { z } from "zod";
import { isValidSlug, slugify } from "@/src/blog/slug";

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Category name is required.").max(200),
  slug: z.string().trim().min(1, "Slug is required.").max(180),
  description: z.string().trim().max(2_000, "Description is too long.").optional(),
  seoTitle: z.string().trim().max(200, "SEO title is too long.").optional(),
  seoDescription: z.string().trim().max(500, "SEO description is too long.").optional(),
  featuredPostId: z.string().uuid("Select a valid featured post.").or(z.literal("")).optional(),
});

export function parseCategoryInput(formData: FormData) {
  const parsed = categoryInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed;
  const slug = slugify(parsed.data.slug);
  if (!isValidSlug(slug)) return { success: false as const, error: { flatten: () => ({ fieldErrors: { slug: ["Use lowercase letters, numbers, and single hyphens only."] } }) } };
  return { success: true as const, data: { ...parsed.data, slug, description: parsed.data.description || null, seoTitle: parsed.data.seoTitle || null, seoDescription: parsed.data.seoDescription || null, featuredPostId: parsed.data.featuredPostId || null } };
}

export function canCreateChild(parent: { id: string; parentId: string | null } | undefined, requestedParentId: string) {
  return Boolean(parent && parent.id === requestedParentId && parent.parentId === null);
}

export type CategoryOption = { id: string; name: string; parentId: string | null };
export function hierarchicalCategoryOptions(categories: CategoryOption[]) {
  const parents = categories.filter((category) => category.parentId === null);
  const children = categories.filter((category) => category.parentId !== null);
  return parents.flatMap((parent) => [
    { ...parent, label: parent.name, level: 0 as const },
    ...children.filter((child) => child.parentId === parent.id).map((child) => ({ ...child, label: `↳ ${child.name}`, level: 1 as const })),
  ]);
}

export function categoryDeleteBlocker(hasChildren: boolean, hasPosts: boolean) {
  if (hasChildren) return "This category contains child categories. Delete or resolve them first.";
  if (hasPosts) return "This category is referenced by posts. Reassign or remove those references first.";
  return null;
}
