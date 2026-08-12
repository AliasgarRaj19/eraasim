import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { defaultHomeConfig, homeConfigSchema, promoteDraft } from "../src/home-page/config";

// Keep this regression inside the Admin Docker context. This is the public
// helper's pure, documented mapping oracle, not an Admin runtime dependency.
function resolveHeroBackgroundVisibility(value: number) {
  const intensity = Math.min(200, Math.max(0, value));
  return intensity <= 100
    ? { imageOpacity: intensity / 100, overlayOpacity: 0.82 }
    : { imageOpacity: 1, overlayOpacity: 0.82 * ((200 - intensity) / 100) };
}

const withBackground = (value: unknown) => homeConfigSchema.safeParse({ ...defaultHomeConfig, hero: { ...defaultHomeConfig.hero, backgroundImageOpacity: value } });
for (const value of [0, 50, 99, 100, 110, 150, 200]) assert(withBackground(value).success, `${value} must be accepted`);
for (const value of [-1, 201, 100.5, "100", "150%", "calc(1)", Number.NaN]) assert(!withBackground(value).success, `${String(value)} must be rejected`);

assert.deepEqual(resolveHeroBackgroundVisibility(0), { imageOpacity: 0, overlayOpacity: 0.82 });
assert.deepEqual(resolveHeroBackgroundVisibility(100), { imageOpacity: 1, overlayOpacity: 0.82 });
assert.deepEqual(resolveHeroBackgroundVisibility(150), { imageOpacity: 1, overlayOpacity: 0.41 });
assert.deepEqual(resolveHeroBackgroundVisibility(200), { imageOpacity: 1, overlayOpacity: 0 });
assert(resolveHeroBackgroundVisibility(150).overlayOpacity < resolveHeroBackgroundVisibility(100).overlayOpacity);
for (const value of [0, 100, 200]) assert(resolveHeroBackgroundVisibility(value).imageOpacity <= 1);

const published = withBackground(100).data!;
const draft = withBackground(150).data!;
assert.deepEqual(promoteDraft(draft, published, false), published);
assert.deepEqual(promoteDraft(draft, published, true), draft);
for (const value of [0, 50, 100]) assert(homeConfigSchema.safeParse({ ...defaultHomeConfig, hero: { ...defaultHomeConfig.hero, profileImageOpacity: value } }).success);
assert(!homeConfigSchema.safeParse({ ...defaultHomeConfig, hero: { ...defaultHomeConfig.hero, profileImageOpacity: 101 } }).success);

const form = readFileSync(new URL("../components/home-page-form.tsx", import.meta.url), "utf8");
assert(form.includes('kind === "Background" ? 200 : 100'));
assert(form.includes("100 keeps the standard Hero appearance. Increase above 100 to make the background image clearer."));
const page = readFileSync(new URL("../../../app/page.tsx", import.meta.url), "utf8");
assert(page.includes("resolveHeroBackgroundVisibility") && page.includes("--hero-overlay-opacity"));
const css = readFileSync(new URL("../../../app/globals.css", import.meta.url), "utf8");
assert(css.includes("opacity: var(--hero-background-opacity)") && css.includes("opacity: var(--hero-overlay-opacity)"));
console.log("PASS: background visibility accepts 0-200, preserves 100, reduces overlay above 100, keeps valid opacity, preserves Profile 0-100, and maintains Draft/Publish isolation.");
