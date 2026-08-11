import { asc } from "drizzle-orm";
import { NewPostForm } from "@/app/(admin)/blog/new/new-post-form";
import { requireRouteAccess } from "@/src/auth/authorization";
import { db } from "@/src/db";
import { categories } from "@/src/db/schema";

export default async function NewPostPage() {
  await requireRouteAccess("/blog/new");
  const availableCategories = await db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.name));

  return <NewPostForm categories={availableCategories} />;
}
