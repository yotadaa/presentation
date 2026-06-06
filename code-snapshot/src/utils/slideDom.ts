import type { ReferenceEntry, SelectionTarget, Slide } from "../types";

const EXTERNAL_URL_PATTERN = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

function appBaseUrl() {
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? base : `${base}/`;
}

function publicAssetPath(value: string) {
  const base = appBaseUrl();
  const normalized = value.trim().replace(/\\/g, "/");
  if (base !== "/" && normalized.startsWith(base)) return normalized;
  return normalized
    .replace(/^(\.\.\/)+/, "")
    .replace(/^(\.\/)+/, "")
    .replace(/^\/+/, "");
}

export function publicUrl(value = "") {
  if (!value) return "";
  if (EXTERNAL_URL_PATTERN.test(value)) return value;
  const base = appBaseUrl();
  const path = publicAssetPath(value);
  return base !== "/" && path.startsWith(base) ? path : `${base}${path}`;
}

function storedAssetPath(value = "") {
  if (!value || EXTERNAL_URL_PATTERN.test(value)) return value;
  const base = appBaseUrl();
  const normalized = value.trim().replace(/\\/g, "/");
  const withoutBase = base !== "/" && normalized.startsWith(base)
    ? normalized.slice(base.length)
    : normalized;
  return withoutBase
    .replace(/^(\.\.\/)+/, "")
    .replace(/^(\.\/)+/, "")
    .replace(/^\/+/, "");
}

export function normalizeAssetUrl(value = "") {
  if (!value) return "";
  return publicUrl(value);
}

export function slideHtmlFor(slide: Slide, edits: Record<number, string>) {
  return withPublicAssetUrls(withActiveChapterChip(edits[slide.index] || slide.html, slide.chapter));
}

function withActiveChapterChip(html: string, chapter: string) {
  const doc = parseHtml(html);
  const nav = doc.querySelector(".chapter") as HTMLElement | null;
  if (!nav) return html;
  const normalizedChapter = chapter.trim().toLowerCase();
  const chips = Array.from(nav.querySelectorAll<HTMLElement>(".chip"));
  let activeIndex = -1;

  chips.forEach((chip, index) => {
    chip.classList.remove("active");
    chip.removeAttribute("aria-current");
    if (chip.textContent?.trim().toLowerCase() === normalizedChapter) {
      chip.classList.add("active");
      chip.setAttribute("aria-current", "step");
      activeIndex = index;
    }
  });

  if (activeIndex >= 0) {
    nav.style.setProperty("--active-chip-index", String(activeIndex));
  }

  return doc.querySelector("#root")?.innerHTML || html;
}

function parseHtml(html: string) {
  const parser = new DOMParser();
  return parser.parseFromString(`<div id="root">${html}</div>`, "text/html");
}

function withPublicAssetUrls(html: string) {
  const doc = parseHtml(html);
  doc.querySelectorAll<HTMLElement>("[src], [href]").forEach((node) => {
    const src = node.getAttribute("src");
    if (src) node.setAttribute("src", publicUrl(src));
    const href = node.getAttribute("href");
    if (href) node.setAttribute("href", publicUrl(href));
  });
  return doc.querySelector("#root")?.innerHTML || html;
}

export function replaceElementText(html: string, editId: string, replacement: string) {
  const doc = parseHtml(html);
  const target = doc.querySelector(`[data-edit-id="${CSS.escape(editId)}"]`);
  if (!target) return html;
  const citations = Array.from(target.querySelectorAll(".cite")).map((node) => node.cloneNode(true));
  target.textContent = replacement.trim();
  if (citations.length) {
    target.appendChild(doc.createTextNode(" Rujukan utama: "));
    citations.slice(0, 2).forEach((cite, index) => {
      if (index > 0) target.appendChild(doc.createTextNode(index === citations.length - 1 ? " dan " : ", "));
      target.appendChild(cite);
    });
    target.appendChild(doc.createTextNode("."));
  }
  return doc.querySelector("#root")?.innerHTML || html;
}

export function replaceImageSource(html: string, editId: string, src: string) {
  const doc = parseHtml(html);
  const target = doc.querySelector(`[data-edit-id="${CSS.escape(editId)}"]`) as HTMLImageElement | null;
  if (!target || target.tagName.toLowerCase() !== "img") return html;
  target.setAttribute("src", storedAssetPath(src));
  return doc.querySelector("#root")?.innerHTML || html;
}

export function targetFromElement(element: HTMLElement, slideIndex: number): SelectionTarget | null {
  const node = element.closest("[data-edit-id]") as HTMLElement | null;
  if (!node) return null;
  const editId = node.dataset.editId || "";
  const tag = node.tagName.toLowerCase();
  const isImage = tag === "img";
  return {
    slideIndex,
    editId,
    tag,
    text: (node.innerText || node.getAttribute("alt") || node.getAttribute("src") || "").trim(),
    kind: isImage ? "image" : tag === "p" || tag.startsWith("h") ? "text" : "element",
    imageSrc: isImage ? node.getAttribute("src") || "" : undefined,
  };
}

export function referenceKey(ref: string) {
  return ref.replace(/[()]/g, "").replace(/\s+/g, " ").trim().replace(/&amp;/g, "&");
}

export function referenceForSlide(entry: ReferenceEntry, slideIndex: number): ReferenceEntry & { page?: number; image?: string; hits?: string[] } {
  const slideEntry = entry.bySlide?.[String(slideIndex)];
  return {
    ...entry,
    ...slideEntry,
    citation: entry.citation,
    title: entry.title,
    file: entry.file,
    articleUrl: entry.articleUrl,
  };
}
