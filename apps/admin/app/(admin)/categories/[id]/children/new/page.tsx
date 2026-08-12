import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createChildCategory } from "@/app/(admin)/categories/actions";
import { CategoryForm } from "@/components/category-form";
import { requirePermission } from "@/src/auth/authorization";
import { db } from "@/src/db";
import { categories } from "@/src/db/schema";

export default async function NewChildCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("categories.create");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [parent] = await db.select({ id: categories.id, name: categories.name }).from(categories).where(and(eq(categories.id, id), isNull(categories.parentId))).limit(1);
  if (!parent) notFound();
  return <CategoryForm parent={parent} action={createChildCategory.bind(null, parent.id)} />;
}
