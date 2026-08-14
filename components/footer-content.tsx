import Link from "next/link";
import { fixedFooterPages, type FooterCategory, type FooterConfig, type FooterPage } from "@/src/footer";

function SocialIcon({ platform }: { platform: string }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><text x="12" y="16" textAnchor="middle">{platform[0].toUpperCase()}</text></svg>;
}

export function FooterContent({ config, categories, pages }: { config: FooterConfig; categories: FooterCategory[]; pages: FooterPage[] }) {
  const parents = categories.filter((category) => !category.parentId);
  const eligible = new Map(pages.map((page) => [page.id, page]));
  const groups = config.menuGroups.filter((group) => group.visible).sort((a, b) => a.order - b.order);
  const socials = config.socialLinks.filter((link) => link.visible && link.url);
  return <footer className="public-footer">
    {config.categoryDirectory.visible ? <section className="footer-directory" aria-labelledby="footer-directory-heading"><h2 id="footer-directory-heading">{config.categoryDirectory.heading}</h2><div className="footer-category-grid">{parents.map((parent) => <div className="footer-category-group" key={parent.id}><Link href={`/categories/${parent.slug}`}>{parent.name}</Link><nav aria-label={`${parent.name} categories`}>{categories.filter((child) => child.parentId === parent.id).map((child) => <Link key={child.id} href={`/categories/${child.slug}`}>{child.name}</Link>)}</nav></div>)}</div></section> : null}
    <div className="site-footer-main">
      {groups.map((group) => <div className="footer-column" key={group.id}><strong>{group.heading}</strong><nav aria-label={`${group.heading} Footer Navigation`}>{group.items.filter((item) => item.visible && (item.type === "fixed" || eligible.has(item.pageId))).sort((a, b) => a.order - b.order).map((item) => { const page = item.type === "fixed" ? fixedFooterPages[item.page] : eligible.get(item.pageId)!; return <Link key={item.id} href={page.path}>{page.title}</Link>; })}</nav></div>)}
      <div className="footer-column"><strong>Follow</strong><nav className="social-links" aria-label="Social links">{socials.map((link) => <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={link.platform}><SocialIcon platform={link.platform}/><span>{link.platform}</span></a>)}</nav></div>
    </div>
    <div className="footer-brand-lines">{config.content.heading ? <strong>{config.content.heading}</strong> : null}{config.content.description ? <p>{config.content.description}</p> : null}</div>
    <div className="footer-final-divider" aria-hidden="true" />
    <p className="designer-credit">Designed by Aliasgar Raj</p>
  </footer>;
}
