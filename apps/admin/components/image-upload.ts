"use client";

type UploadResult = { url?: string; error?: string };
type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function statusMessage(status: number) {
  if (status === 401) return "Your session has expired. Sign in and try again.";
  if (status === 403) return "You do not have permission to upload this image.";
  if (status === 404) return "The image upload service is unavailable.";
  if (status === 413) return "Images must be no larger than 5 MB.";
  return status >= 500 ? "The image upload service encountered an error. Try again." : "Image upload failed.";
}

export async function uploadImageWith(fetcher: Fetcher, file: File) {
  const formData = new FormData();
  formData.set("image", file);
  const response = await fetcher("/api/uploads", { method: "POST", body: formData });
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  let result: UploadResult | null = null;
  if (contentType.includes("application/json")) {
    try { result = JSON.parse(await response.text()) as UploadResult; } catch { result = null; }
  }
  if (!response.ok) throw new Error(result?.error || statusMessage(response.status));
  if (!result?.url || typeof result.url !== "string") throw new Error("The image upload service returned an invalid response.");
  return result.url;
}

export async function uploadImage(file: File) {
  return uploadImageWith(fetch, file);
}
