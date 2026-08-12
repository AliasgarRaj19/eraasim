export function selectedCategoryId(value: string) {
  return value === "" ? null : value;
}

export function validatedCategoryAssignment(selectedId: string, foundId: string | undefined) {
  const categoryId = selectedCategoryId(selectedId);
  if (categoryId && foundId !== categoryId) throw new Error("CATEGORY_UNAVAILABLE");
  return categoryId;
}
