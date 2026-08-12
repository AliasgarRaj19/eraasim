import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/src/auth/authorization";
import { MAX_IMAGE_BYTES, saveImage } from "@/src/uploads/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAnyPermission(["blog.posts.create", "blog.posts.edit", "pages.home.edit"]);

  try {
    const formData = await request.formData();
    const file = formData.get("image");
    if (!(file instanceof File)) return NextResponse.json({ error: "Select an image to upload." }, { status: 400 });
    if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Images must be no larger than 5 MB." }, { status: 413 });

    return NextResponse.json(await saveImage(file), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
