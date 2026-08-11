import { requireRouteAccess } from "@/src/auth/authorization";

export default async function AllPostsPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  await requireRouteAccess("/blog");
  const { created } = await searchParams;

  return (
    <section className="page-panel" aria-labelledby="page-title">
      {created === "1" ? <p className="success-message" role="status">Post created successfully.</p> : null}
      <p className="page-eyebrow">Eraasim Admin</p>
      <h1 id="page-title">All Posts</h1>
      <p>Post management and editing will be implemented in a later milestone.</p>
    </section>
  );
}
