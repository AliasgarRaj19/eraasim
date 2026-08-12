import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { z } from "zod";
import { CategoryForm } from "@/components/category-form";
import { createChildCategory } from "@/app/(admin)/categories/actions";
import { requirePermission } from "@/src/auth/authorization";
import { db } from "@/src/db";
import { categories } from "@/src/db/schema";

export default async function NewChildCategoryPage({ params }: { params: Promise<{ parentId: string }> }) {
  await requirePermission("categories.create");
  const { parentId } = await params;
  if (!z.uuid().safeParse(parentId).success) notFound();
  const [parent] = await db.select({ id: categories.id, name: categories.name }).from(categories).where(and(eq(categories.id, parentId), isNull(categories.parentId))).limit(1);
  if (!parent) notFound();
  return <CategoryForm parent={parent} action={createChildCategory.bind(null, parent.id)} />;
}
