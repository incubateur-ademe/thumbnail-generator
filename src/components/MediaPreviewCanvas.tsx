import { useEffect, useRef, useState } from "react";
import type { Align, LogoRect, MediaPreviewState } from "@/hooks/useMediaPreviewState";
import { useSvgCache } from "@/hooks/useSvgCache";
import { buildScaledGroup, MARIANNE_FONT_FACE_CSS } from "@/lib/svgUtils";

export type { LogoRect } from "@/hooks/useMediaPreviewState";

const SVG_W = 512;
const SVG_H = 269;
const MARGIN = 64;

const ALIGN_X: Record<Align, number> = {
  left: MARGIN,
  center: SVG_W / 2,
  right: SVG_W - MARGIN,
};
const TEXT_ANCHOR: Record<Align, "start" | "middle" | "end"> = {
  left: "start",
  center: "middle",
  right: "end",
};

// Scale factor to fit 1280×720 decorative paths into 512×269
const PATTERN_SX = SVG_W / 1280;
const PATTERN_SY = SVG_H / 720;

interface Props {
  state: MediaPreviewState;
  onLogoMeasured?: (rect: LogoRect | null) => void;
}

export function MediaPreviewCanvas({ state, onLogoMeasured }: Props) {
  const logoRef = useRef<SVGGElement>(null);
  const extrasRef = useRef<SVGGElement>(null);
  const lastLogoRectRef = useRef<string>("");

  // Logo SVG content fetched once from the template
  const [logoContent, setLogoContent] = useState("");

  // Cache for extra SVGs loaded from preset URLs (shared hook)
  const svgCache = useSvgCache(state.extras);

  // Fetch logo from template SVG (one-time)
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}media-cover-notion.svg`)
      .then((r) => r.text())
      .then((text) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "image/svg+xml");
        const logo = doc.querySelector("#logo");
        if (logo) setLogoContent(logo.innerHTML);
      });
  }, []);

  // Unified logo + extras positioning (same pattern as ThumbnailCanvas)
  useEffect(() => {
    const logoEl = logoRef.current;
    const host = extrasRef.current;
    if (!logoEl || !host) return;

    // --- Inject logo content ---
    logoEl.innerHTML = logoContent;
    logoEl.setAttribute("display", state.showLogo ? "inline" : "none");
    logoEl.removeAttribute("transform");

    // Toggle sub-parts visibility
    const playEl = logoEl.querySelector("#logo-play");
    const taglineEl = logoEl.querySelector("#logo-tagline");
    if (playEl)
      playEl.setAttribute(
        "display",
        state.showLogoPlay ? "inline" : "none",
      );
    if (taglineEl)
      taglineEl.setAttribute(
        "display",
        state.showLogoTagline ? "inline" : "none",
      );

    // --- Clear extras host ---
    while (host.firstChild) host.removeChild(host.firstChild);
    host.removeAttribute("transform");

    // --- Absolute mode: position logo & extras independently ---
    if (state.extraMode === "absolute") {
      // Align logo independently
      let measuredRect: LogoRect | null = null;
      if (state.showLogo) {
        try {
          const bbox = logoEl.getBBox();
          let targetX: number;
          if (state.logoAlign === "left") targetX = MARGIN;
          else if (state.logoAlign === "right")
            targetX = SVG_W - MARGIN - bbox.width;
          else targetX = (SVG_W - bbox.width) / 2;
          const dx = targetX - bbox.x;
          if (Math.abs(dx) > 0.5) {
            logoEl.setAttribute("transform", `translate(${dx}, 0)`);
          }
          measuredRect = {
            x: targetX,
            y: bbox.y,
            width: bbox.width,
            height: bbox.height,
          };
        } catch {
          /* getBBox may fail */
        }
      }
      // Only notify parent if the rect actually changed (prevents infinite re-render loop)
      const key = measuredRect
        ? `${measuredRect.x},${measuredRect.y},${measuredRect.width},${measuredRect.height}`
        : "";
      if (key !== lastLogoRectRef.current) {
        lastLogoRectRef.current = key;
        onLogoMeasured?.(measuredRect);
      }

      state.extras.forEach((item) => {
        const svgContent =
          (item.srcUrl ? svgCache[item.srcUrl] : undefined) ?? item.svgText;
        if (!svgContent) return;
        const g = buildScaledGroup(host, svgContent, item.w, item.h);
        const cx = (item.xPct / 100) * SVG_W;
        const cy = (item.yPct / 100) * SVG_H;
        const x = cx - g.realW / 2;
        const y = cy - g.realH / 2;
        g.el.setAttribute(
          "transform",
          `translate(${x + g.tx0}, ${y + g.ty0}) scale(${g.s})`,
        );
      });
      return;
    }

    // --- Row mode: main_logo + extras side by side, respecting logoAlign ---
    let mainWidth = 0;
    let mainBox: DOMRect | null = null;
    if (state.showLogo) {
      try {
        mainBox = logoEl.getBBox();
        mainWidth = mainBox.width;
      } catch {
        /* getBBox may fail */
      }
    }

    const totalExtrasW = state.extras.reduce((acc, it) => acc + it.w, 0);
    const blocks =
      (state.showLogo ? 1 : 0) + state.extras.length;
    const totalGap = Math.max(0, blocks - 1) * state.logosGap;
    const totalW = mainWidth + totalExtrasW + totalGap;

    // Align determines the starting X of the whole row group
    const rowY = 56;
    let cursorX: number;
    if (state.logoAlign === "left") {
      cursorX = MARGIN;
    } else if (state.logoAlign === "right") {
      cursorX = SVG_W - MARGIN - totalW;
    } else {
      cursorX = (SVG_W - totalW) / 2;
    }

    if (state.showLogo && mainBox) {
      const dx = cursorX - mainBox.x;
      const dy = rowY - (mainBox.y + mainBox.height / 2);
      logoEl.setAttribute("transform", `translate(${dx}, ${dy})`);
      cursorX += mainBox.width + state.logosGap;
    }

    state.extras.forEach((item) => {
      const svgContent =
        (item.srcUrl ? svgCache[item.srcUrl] : undefined) ?? item.svgText;
      if (!svgContent) return;
      const g = buildScaledGroup(host, svgContent, item.w, item.h);
      const x = cursorX;
      const y = rowY - item.h / 2;
      const padX = (item.w - g.realW) / 2;
      const padY = (item.h - g.realH) / 2;
      g.el.setAttribute(
        "transform",
        `translate(${x + padX + g.tx0}, ${y + padY + g.ty0}) scale(${g.s})`,
      );
      cursorX += item.w + state.logosGap;
    });
  }, [state, logoContent, svgCache, onLogoMeasured]);

  const {
    showIcon,
    iconType,
    iconEmoji,
    iconImageData,
    iconSize,
    iconAlign,
    title,
    titleColor,
    titleAlign,
    showSubtitle,
    subtitle,
    subtitleColor,
    subtitleAlign,
    showBgPrimary,
    bgPrimaryColor,
    showBgSecondary,
    bgSecondaryColor,
  } = state;

  const iconX = ALIGN_X[iconAlign];

  return (
    <svg
      width={SVG_W}
      height={SVG_H}
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      overflow="hidden"
      style={{ width: "100%", height: "auto" }}
    >
      <defs>
        <style>{MARIANNE_FONT_FACE_CSS}</style>

        {/* fond_thumbnail.png texture pattern */}
        <pattern
          id="media-fond-pattern"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use
            xlinkHref="#media-fond-image"
            transform="matrix(0.001745 0 0 0.001745 -0.3725 0)"
          />
        </pattern>
        <image
          id="media-fond-image"
          width="1000"
          height="573"
          preserveAspectRatio="none"
          xlinkHref="/thumbnail-generator/fond_thumbnail.png"
        />

        {/* Logo gradients */}
        <linearGradient
          id="grad-logo-1"
          x1="174.561"
          y1="56.6239"
          x2="203.318"
          y2="56.6239"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF3333" />
          <stop offset="0.854167" stopColor="#4D0600" />
        </linearGradient>
        <linearGradient
          id="grad-logo-2"
          x1="174.503"
          y1="56.6239"
          x2="194.504"
          y2="56.6239"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.239583" stopColor="#3139FB" />
          <stop offset="0.995002" stopColor="#7DB1EC" />
          <stop offset="1" stopColor="#4950FB" />
        </linearGradient>

        <clipPath id="media-clip">
          <rect width={SVG_W} height={SVG_H} />
        </clipPath>
      </defs>

      <g clipPath="url(#media-clip)">
        {/* Background primary */}
        <rect
          width={SVG_W}
          height={SVG_H}
          fill={bgPrimaryColor}
          display={showBgPrimary ? "inline" : "none"}
        />

        {/* Background secondary (top band) */}
        <rect
          width={SVG_W}
          height={112}
          fill={bgSecondaryColor}
          display={showBgSecondary ? "inline" : "none"}
        />

        {/* Texture overlay (always visible) */}
        <rect
          width={SVG_W}
          height={SVG_H}
          fill="url(#media-fond-pattern)"
          fillOpacity={0.8}
        />

        {/* Decorative swirl patterns — scaled from 1280×720 coordinates */}
        <g transform={`scale(${PATTERN_SX} ${PATTERN_SY})`}>
          <path
            d="M999.279 -112C963.871 -77.5737 929.961 -36.4775 918.842 11.9226C911.646 43.2501 906.769 78.5 911 103.5C915.231 128.5 935.354 160.155 967.5 176.406C999.279 192.47 1042.88 185.29 1073.95 171C1111.69 153.647 1147.43 126.532 1177 94C1197 72 1207.8 44.9905 1210.5 19.5C1214 -13.5 1206.12 -28.8878 1191 -37C1147.68 -60.2412 1098.12 28.3381 1084.56 59.6541C1073.36 85.5084 1067.8 107.458 1068 135C1068.18 159.346 1079.61 180.493 1099.31 196.126C1117.46 210.534 1142.66 219.355 1166.5 220.5C1202.64 222.235 1230.6 206.228 1257.64 185.257C1317.17 139.105 1358.7 75.4508 1370.12 1.83848C1372.24 -11.8605 1379.47 -44.9771 1367 -56.2012C1353.48 -68.3747 1323.56 -62.7474 1309.27 -55.753C1248.27 -25.8926 1229.1 34.5193 1224.5 94C1222.74 116.706 1224.5 165.541 1246.5 193.534C1279 234.886 1299.03 225.82 1325.5 226C1378.99 226.364 1409.03 167.895 1431.77 122.96C1438.45 109.756 1475.32 29.3662 1444.1 27.2729C1425.52 26.0269 1411.8 38.2952 1401.69 52.2591C1381 80.8321 1376.61 117.331 1375.19 151.307C1372.93 205.316 1404.56 251.077 1462.77 252.933C1480.47 253.497 1494.95 250.63 1508.63 239.375C1513.69 235.213 1516.52 230.38 1522 226.826"
            stroke="#D3D1D2"
            strokeOpacity="0.3"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M-172.869 412C-203.003 438.598 -231.863 470.349 -241.326 507.743C-247.45 531.947 -250.337 560.819 -245.739 585.48C-241.69 607.197 -221.799 619.962 -199.055 625.387C-171.47 631.968 -144.197 633.571 -117.751 622.531C-85.6357 609.123 -53.162 587.909 -30.66 563.492C-16.5492 548.18 -7.084 533.013 -2.61055 513.629C-0.132279 502.891 3.19814 491.59 -9.67195 485.322C-46.5442 467.366 -88.7519 520.426 -100.293 544.62C-109.822 564.596 -109.485 586.362 -109.316 607.641C-109.167 626.451 -104.502 637.981 -87.7398 650.059C-72.2908 661.19 -52.6192 670.989 -32.3273 671.874C-1.5723 673.214 23.9982 657.864 47.0155 641.662C97.6725 606.005 138.422 519.404 142.737 499.952C147.052 480.5 150.178 464.221 140.089 455.11C130 446 103.113 450.053 90.9532 455.457C39.0417 478.527 23 544.62 20 563.492C17 582.364 12.4304 613 31.3235 634.823C45.7271 651.46 72.469 664.361 95 664.5C140.519 664.781 180.057 619.561 195.207 593.531C210.357 567.5 221.589 525 205.701 519.603C189.813 514.205 175.553 530.314 169.61 538.907C163.666 547.5 147 582.537 147 613C147 643.463 172.048 692.515 221.589 693.948C236.652 694.384 247.485 692.22 260.623 683.474C265.482 680.239 276.5 665 272 673.778"
            stroke="#D3D1D2"
            strokeOpacity="0.3"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>

        {/* Logo ADEME (content injected via useEffect) */}
        <g id="media-logo" ref={logoRef} />

        {/* Extra logos */}
        <g id="media-extras" ref={extrasRef} />

        {/* Icon — aligned like text: left=start at 64, center=middle at 256, right=end at 448 */}
        {showIcon && iconType === "emoji" && (
          <text
            x={iconX}
            y={112}
            fill="#000000"
            textAnchor={TEXT_ANCHOR[iconAlign]}
            dominantBaseline="central"
            fontSize={iconSize}
          >
            {iconEmoji}
          </text>
        )}
        {showIcon && iconType === "image" && iconImageData && (
          <image
            xlinkHref={iconImageData}
            href={iconImageData}
            x={
              iconAlign === "left"
                ? iconX
                : iconAlign === "right"
                  ? iconX - iconSize
                  : iconX - iconSize / 2
            }
            y={112 - iconSize / 2}
            width={iconSize}
            height={iconSize}
            preserveAspectRatio="xMidYMid meet"
          />
        )}

        {/* Title */}
        <text
          x={ALIGN_X[titleAlign]}
          y={168}
          textAnchor={TEXT_ANCHOR[titleAlign]}
          fill={titleColor}
          fontFamily="Marianne, Inter, system-ui, sans-serif"
          fontSize={36}
          fontWeight={700}
        >
          {title}
        </text>

        {/* Subtitle */}
        <text
          x={ALIGN_X[subtitleAlign]}
          y={210}
          textAnchor={TEXT_ANCHOR[subtitleAlign]}
          fill={subtitleColor}
          fontFamily="Marianne, Inter, system-ui, sans-serif"
          fontSize={21}
          fontWeight={400}
          display={showSubtitle ? "inline" : "none"}
        >
          {subtitle}
        </text>
      </g>
    </svg>
  );
}
