import { CategoryForm } from "@/components/category-form";
import { createParentCategory } from "@/app/(admin)/categories/actions";
import { requireRouteAccess } from "@/src/auth/authorization";

export default async function NewCategoryPage() {
  await requireRouteAccess("/categories/new");
  return <CategoryForm action={createParentCategory} />;
}
