import Link from "next/link";

export function PublicHeader() {
  return <header className="site-header"><Link className="site-brand" href="/">Eraasim</Link><nav aria-label="Primary"><Link href="/blog">Blog</Link></nav></header>;
}

export function PublicFooter() {
  return <footer className="site-footer"><div><strong>Eraasim</strong><p>Stories of culture, food and places.</p></div><nav aria-label="Footer"><Link href="/blog">Blog</Link></nav><p className="designer-credit">Designed by Aliasgar Raj</p></footer>;
}
