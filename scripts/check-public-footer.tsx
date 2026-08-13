import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { FooterContent } from "../components/footer-content";
import { defaultFooterConfig, parsePublicFooter, type FooterCategory } from "../src/footer";

assert.deepEqual(parsePublicFooter(null), defaultFooterConfig);

const categories: FooterCategory[] = Array.from({ length: 10 }, (_, index) => ({
  id: `p${index + 1}`,
  name: `Parent ${index + 1}`,
  slug: `parent-${index + 1}`,
  parentId: null,
}));
categories.splice(1, 0, { id: "c1", name: "Child 1.1", slug: "child-1-1", parentId: "p1" });
const visible = {
  ...defaultFooterConfig,
  categoryDirectory: { visible: true, heading: "Explore Categories" },
  socialLinks: defaultFooterConfig.socialLinks.map((link, index) =>
    index ? link : { ...link, visible: true, url: "https://example.com/eraasim" },
  ),
};
const html = renderToStaticMarkup(
  <FooterContent config={visible} categories={categories} pages={[]} />,
);

assert.equal((html.match(/class="footer-category-group"/g) ?? []).length, 10);
assert(html.includes("/categories/parent-1") && html.includes("/categories/child-1-1") && html.includes("Parent 10"));
assert.match(html, /Parent 1<\/a><nav aria-label="Parent 1 categories"><a href="\/categories\/child-1-1">Child 1\.1<\/a><\/nav>/);
assert(html.includes("https://example.com/eraasim") && html.includes("noopener noreferrer"));

const orderedMarkers = [
  'class="footer-directory"',
  'class="site-footer-main"',
  'aria-label="Footer Page Navigation"',
  ">Follow<",
  'class="footer-brand-lines"',
  'class="footer-final-divider"',
  'class="designer-credit"',
];
const orderedPositions = orderedMarkers.map((marker) => html.indexOf(marker));
assert(orderedPositions.every((position) => position >= 0));
assert(orderedPositions.every((position, index) => index === 0 || orderedPositions[index - 1] < position));
assert.equal(html.indexOf("designer-credit"), html.lastIndexOf("designer-credit"));
assert.match(html.trim(), /<div class="footer-final-divider" aria-hidden="true"><\/div><p class="designer-credit">Designed by Aliasgar Raj<\/p><\/footer>$/);

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
assert.match(css, /\.footer-category-grid\s*\{[^}]*grid-template-columns:\s*repeat\(5,minmax\(0,1fr\)\)/);
assert.match(css, /@media \(max-width: 1100px\)\s*\{[^}]*\.footer-category-grid\s*\{[^}]*repeat\(3,minmax\(0,1fr\)\)/);
assert.match(css, /@media \(max-width: 900px\)[^{]*\{[\s\S]*?\.footer-category-grid\s*\{[^}]*repeat\(2,minmax\(0,1fr\)\)/);
assert.match(css, /@media \(max-width: 640px\)[^{]*\{[\s\S]*?\.footer-category-grid\s*\{[^}]*grid-template-columns:\s*1fr/);
assert.match(css, /\.footer-category-group\s*\{[^}]*min-width:\s*0/);
assert.doesNotMatch(css, /\.footer-(?:category-group|brand-lines)[^{]*\{[^}]*\border\s*:/);

const hidden = renderToStaticMarkup(
  <FooterContent
    config={{
      ...visible,
      categoryDirectory: { ...visible.categoryDirectory, visible: false },
      socialLinks: visible.socialLinks.map((link) => ({ ...link, visible: false })),
    }}
    categories={categories}
    pages={[]}
  />,
);
assert(!hidden.includes("footer-directory") && !hidden.includes("example.com/eraasim"));
assert.match(hidden.trim(), /<div class="footer-final-divider" aria-hidden="true"><\/div><p class="designer-credit">Designed by Aliasgar Raj<\/p><\/footer>$/);

console.log("PASS: real Footer DOM is Directory -> Explore/Follow -> brand lines -> divider -> final attribution; ten grouped parents use responsive 5/3/2/1 columns.");
