import Link from "next/link";
import { HeaderNavigation } from "@/components/header-navigation";
import { getPublicHeader } from "@/src/header";

export async function PublicHeader() {
  const header = await getPublicHeader(); return <HeaderNavigation {...header}/>;
}

export function PublicFooter() {
  return <footer className="site-footer"><div className="footer-intro"><strong>Eraasim</strong><p>Stories of culture, food and placesâ€”gathered with curiosity and care.</p></div><div className="footer-column"><strong>Explore</strong><nav aria-label="Footer"><Link href="/">Home</Link><Link href="/blog">Blog</Link><Link href="/#categories">Categories</Link></nav></div><div className="footer-column future-footer-slot" aria-hidden="true" /><p className="designer-credit">Designed by Aliasgar Raj</p></footer>;
}
