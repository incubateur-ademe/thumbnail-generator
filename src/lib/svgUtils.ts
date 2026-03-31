export const SVG_NS = "http://www.w3.org/2000/svg";
export const XLINK_NS = "http://www.w3.org/1999/xlink";

export const MARIANNE_FONT_FACE_CSS = `
  @font-face {
    font-family: 'Marianne';
    src: url('/thumbnail-generator/fonts/Marianne-Light.woff2') format('woff2'),
         url('/thumbnail-generator/fonts/Marianne-Light.woff') format('woff');
    font-weight: 300;
  }
  @font-face {
    font-family: 'Marianne';
    src: url('/thumbnail-generator/fonts/Marianne-Regular.woff2') format('woff2'),
         url('/thumbnail-generator/fonts/Marianne-Regular.woff') format('woff');
    font-weight: 400;
  }
  @font-face {
    font-family: 'Marianne';
    src: url('/thumbnail-generator/fonts/Marianne-Medium.woff2') format('woff2'),
         url('/thumbnail-generator/fonts/Marianne-Medium.woff') format('woff');
    font-weight: 500;
  }
  @font-face {
    font-family: 'Marianne';
    src: url('/thumbnail-generator/fonts/Marianne-Bold.woff2') format('woff2'),
         url('/thumbnail-generator/fonts/Marianne-Bold.woff') format('woff');
    font-weight: 700;
  }
  @font-face {
    font-family: 'Marianne';
    src: url('/thumbnail-generator/fonts/Marianne-ExtraBold.woff2') format('woff2'),
         url('/thumbnail-generator/fonts/Marianne-ExtraBold.woff') format('woff');
    font-weight: 800;
  }
`;

// Builds a scaled SVG group fitting within a slot.
// Supports both inline SVG content and raster data URLs (from user uploads).
// SVG content comes from local files only (public/ assets or user-uploaded .svg).
export function buildScaledGroup(
  host: SVGGElement,
  svgText: string,
  slotW: number,
  slotH: number,
): {
  el: SVGGElement;
  s: number;
  tx0: number;
  ty0: number;
  realW: number;
  realH: number;
} {
  const g = document.createElementNS(SVG_NS, "g") as SVGGElement;

  if (svgText.startsWith("data:")) {
    const img = document.createElementNS(SVG_NS, "image");
    img.setAttributeNS(XLINK_NS, "xlink:href", svgText);
    img.setAttribute("href", svgText);
    img.setAttribute("width", String(slotW));
    img.setAttribute("height", String(slotH));
    img.setAttribute("preserveAspectRatio", "xMidYMid meet");
    g.appendChild(img);
    host.appendChild(g);
    return { el: g, s: 1, tx0: 0, ty0: 0, realW: slotW, realH: slotH };
  }

  // Trusted SVG content from local files — same pattern used throughout
  // ThumbnailCanvas and MediaPreviewCanvas for extras rendering.
  g.innerHTML = svgText;
  g.setAttribute("opacity", "0");
  host.appendChild(g);

  let bbox: DOMRect;
  try {
    bbox = g.getBBox();
  } catch {
    bbox = new DOMRect(0, 0, slotW, slotH);
  }

  const sx = bbox.width ? slotW / bbox.width : 1;
  const sy = bbox.height ? slotH / bbox.height : 1;
  const s = Math.min(sx, sy);
  const realW = bbox.width * s;
  const realH = bbox.height * s;
  const tx0 = -bbox.x * s;
  const ty0 = -bbox.y * s;

  g.setAttribute("opacity", "1");
  return { el: g, s, tx0, ty0, realW, realH };
}

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
