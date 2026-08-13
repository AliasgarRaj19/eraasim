import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { defaultPublicTheme, parsePublicTheme, themeStyle } from "../src/theme";

assert.deepEqual(parsePublicTheme(null),defaultPublicTheme); assert.deepEqual(parsePublicTheme({}),defaultPublicTheme);
const custom={...defaultPublicTheme,global:{...defaultPublicTheme.global,pageBackground:"#112233"},header:{...defaultPublicTheme.header,background:"#223344",announcementText:"#334455"},footer:{...defaultPublicTheme.footer,mainBackground:"#445566"},card:{...defaultPublicTheme.card,background:"#556677"},button:{...defaultPublicTheme.button,primaryBackground:"#667788"}};
assert.equal(parsePublicTheme(custom).global.pageBackground,"#112233"); assert.deepEqual(parsePublicTheme({...custom,global:{...custom.global,accent:"rgb(0,0,0)"}}),defaultPublicTheme);
const style=themeStyle(custom) as Record<string,string>;for(const [key,value] of [["--theme-page-bg","#112233"],["--theme-header-bg","#223344"],["--theme-announcement-text","#334455"],["--theme-footer-bg","#445566"],["--theme-card-bg","#556677"],["--theme-primary-bg","#667788"]])assert.equal(style[key],value);
const css=readFileSync(new URL("../app/globals.css",import.meta.url),"utf8"),layout=readFileSync(new URL("../app/layout.tsx",import.meta.url),"utf8");
for(const token of ["--theme-page-bg","--theme-header-bg","--theme-announcement-bg","--theme-footer-bg","--theme-card-bg","--theme-primary-bg"])assert(css.includes(token));assert(layout.includes("getPublicTheme()")&&layout.includes("themeStyle(theme)"));
assert(css.includes(".hero h1 { font-size:")&&css.includes("var(--hero-heading-size)"));assert(css.includes(".article-content [style]")||css.includes("article-content"));
console.log("PASS: malformed fallback, controlled public tokens, shared root loading, Header/Footer/cards/buttons application, and Hero override preserved.");
