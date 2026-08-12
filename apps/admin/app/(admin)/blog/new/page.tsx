import { asc } from "drizzle-orm";
import { NewPostForm } from "@/app/(admin)/blog/new/new-post-form";
import { requireRouteAccess } from "@/src/auth/authorization";
import { db } from "@/src/db";
import { categories } from "@/src/db/schema";
import { hierarchicalCategoryOptions } from "@/src/categories/category";

export default async function NewPostPage() {
  await requireRouteAccess("/blog/new");
  const categoryRows = await db.select({ id: categories.id, name: categories.name, parentId: categories.parentId }).from(categories).orderBy(asc(categories.name));
  const availableCategories = hierarchicalCategoryOptions(categoryRows);

  return <NewPostForm categories={availableCategories} />;
}
