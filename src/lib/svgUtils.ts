export function extractSvgInner(svgText: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    const svg =
      doc.documentElement?.tagName.toLowerCase() === "svg" ? doc.documentElement : null;
    if (!svg) return svgText;
    const tmp = document.createElement("div");
    [...svg.childNodes].forEach((n) => tmp.appendChild(n.cloneNode(true)));
    return tmp.innerHTML;
  } catch {
    return svgText;
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}
