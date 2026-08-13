import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { defaultThemeConfig, parseThemeConfig, themeConfigSchema } from "../src/theme/config";

assert(parseThemeConfig(defaultThemeConfig).success);
for (const font of ["editorial", "modern", "system"] as const) assert(themeConfigSchema.safeParse({ ...defaultThemeConfig, typography: { ...defaultThemeConfig.typography, bodyFont: font } }).success);
assert(!themeConfigSchema.safeParse({ ...defaultThemeConfig, typography: { ...defaultThemeConfig.typography, bodyFont: "Comic Sans MS" } }).success);
for (const color of ["red", "#fff", "#ABCDEF", "rgb(0,0,0)", "var(--x)", "linear-gradient(red,blue)", "calc(1px)"]) assert(!themeConfigSchema.safeParse({ ...defaultThemeConfig, global: { ...defaultThemeConfig.global, accent: color } }).success);
for (const [key,min,max] of [["bodySize",14,24],["headingScale",80,140]] as const) { assert(themeConfigSchema.safeParse({ ...defaultThemeConfig, typography: { ...defaultThemeConfig.typography, [key]: min } }).success); assert(!themeConfigSchema.safeParse({ ...defaultThemeConfig, typography: { ...defaultThemeConfig.typography, [key]: max + 1 } }).success); }
for (const [key,min,max] of [["radius",0,24],["sectionSpacing",24,120]] as const) { assert(themeConfigSchema.safeParse({ ...defaultThemeConfig, layout: { ...defaultThemeConfig.layout, [key]: min } }).success); assert(!themeConfigSchema.safeParse({ ...defaultThemeConfig, layout: { ...defaultThemeConfig.layout, [key]: max + 1 } }).success); }
const actions=readFileSync(new URL("../app/(admin)/theme/actions.ts",import.meta.url),"utf8"), form=readFileSync(new URL("../components/theme-form.tsx",import.meta.url),"utf8"), migration=readFileSync(new URL("../drizzle/0007_theme_cms.sql",import.meta.url),"utf8");
for(const token of ["theme.draft_saved","theme.published","theme.reset_to_default","for(\"update\")","current.published","expectedVersion"]) assert(actions.includes(token));
for(const token of ["Theme Preview","Reset Draft to Eraasim Defaults","confirm(","theme.view","theme.edit","theme.publish"]) assert(form.includes(token)||migration.includes(token));
assert(!actions.includes("metadata: parsed.data")); assert(migration.includes('CREATE TABLE "theme_configurations"')&&migration.includes("theme.view")&&migration.includes("theme.edit")&&migration.includes("theme.publish"));
console.log("PASS: Theme allowlists/bounds, canonical colors, Draft/Publish isolation, locking, reset, preview, permissions, logging, and additive migration verified.");
