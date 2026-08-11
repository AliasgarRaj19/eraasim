import { requireRouteAccess } from "@/src/auth/authorization";

export async function PlaceholderPage({ href, title }: { href: string; title: string }) {
  await requireRouteAccess(href);

  return (
    <section className="page-panel" aria-labelledby="page-title">
      <p className="page-eyebrow">Eraasim Admin</p>
      <h1 id="page-title">{title}</h1>
      <p>This module will be implemented in a later milestone.</p>
    </section>
  );
}
