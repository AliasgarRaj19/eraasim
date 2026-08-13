import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { FooterContent } from "../components/footer-content";
import { defaultFooterConfig, parsePublicFooter } from "../src/footer";

assert.deepEqual(parsePublicFooter(null), defaultFooterConfig);

const categories = [
  { id: "p1", name: "Parent Renamed", slug: "parent-new", parentId: null },
  { id: "c1", name: "Child", slug: "child", parentId: "p1" },
  { id: "p2", name: "Solo", slug: "solo", parentId: null },
];
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

assert(html.includes("/categories/parent-new") && html.includes("/categories/child") && html.includes("Solo"));
assert(html.includes("https://example.com/eraasim") && html.includes("noopener noreferrer"));

const orderedMarkers = [
  'class="footer-directory"',
  'class="site-footer-main"',
  'class="footer-intro"',
  'aria-label="Footer Page Navigation"',
  ">Follow<",
  'class="footer-final-divider"',
  'class="designer-credit"',
];
const orderedPositions = orderedMarkers.map((marker) => html.indexOf(marker));
assert(orderedPositions.every((position) => position >= 0));
assert(orderedPositions.every((position, index) => index === 0 || orderedPositions[index - 1] < position));
assert.equal(html.indexOf("designer-credit"), html.lastIndexOf("designer-credit"));
assert.match(html.trim(), /<div class="footer-final-divider" aria-hidden="true"><\/div><p class="designer-credit">Designed by Aliasgar Raj<\/p><\/footer>$/);

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

console.log("PASS: real Footer DOM is Directory -> main content -> Page navigation -> Follow -> divider -> final attribution.");
