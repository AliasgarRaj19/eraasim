import { ALLOWED_TEXT_COLORS } from "@/src/blog/editor-controls";

export function normalizePastedHtml(html: string) {
  if (typeof DOMParser === "undefined") return html;
  const document = new DOMParser().parseFromString(html, "text/html");
  const probe = document.createElement("span");
  const approved = new Map<string, string>();
  for (const color of ALLOWED_TEXT_COLORS) {
    probe.style.color = color;
    approved.set(probe.style.color.toLowerCase(), color);
  }
  for (const element of document.body.querySelectorAll<HTMLElement>("[style]")) {
    const color = element.style.color.toLowerCase();
    const canonical = approved.get(color);
    if (color && canonical) element.style.color = canonical;
    else element.style.removeProperty("color");
    if (!element.getAttribute("style")?.trim()) element.removeAttribute("style");
  }
  return document.body.innerHTML;
}
