"use client";

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.set("image", file);
  const response = await fetch("/api/uploads", { method: "POST", body: formData });
  const result = await response.json() as { url?: string; error?: string };
  if (!response.ok || !result.url) throw new Error(result.error ?? "Image upload failed.");
  return result.url;
}
