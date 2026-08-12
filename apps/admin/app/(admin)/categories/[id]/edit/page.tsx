import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { z } from "zod";
import { CategoryForm } from "@/components/category-form";
import { updateCategory } from "@/app/(admin)/categories/actions";
import { requirePermission } from "@/src/auth/authorization";
import { db } from "@/src/db";
import { categories } from "@/src/db/schema";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("categories.edit");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [category] = await db.select({ id: categories.id, name: categories.name, slug: categories.slug, description: categories.description, parentId: categories.parentId }).from(categories).where(eq(categories.id, id)).limit(1);
  if (!category) notFound();
  return <CategoryForm category={{ ...category, description: category.description ?? "" }} action={updateCategory.bind(null, category.id)} />;
}
