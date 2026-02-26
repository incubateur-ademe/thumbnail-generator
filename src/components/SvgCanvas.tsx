import { useEffect, useRef, useState } from "react";
import type { ThumbnailState } from "@/hooks/useThumbnailState";
import { formatDateFR } from "@/lib/dateUtils";
import { extractSvgInner } from "@/lib/svgUtils";

const SVG_W = 1280;
const SVG_H = 720;

interface Props {
  state: ThumbnailState;
}

export function SvgCanvas({ state }: Props) {
  const { title, subtitle, date, showMainLogo, extraMode, logosY, logosGap, extras } = state;

  const mainLogoRef = useRef<SVGGElement>(null);
  const extrasHostRef = useRef<SVGGElement>(null);

  // Cache des SVGs chargés depuis les URLs publiques (presets avec src)
  const [svgCache, setSvgCache] = useState<Record<string, string>>({});

  useEffect(() => {
    const toFetch = extras.filter((e) => e.srcUrl && !(e.srcUrl in svgCache));
    if (!toFetch.length) return;
    let cancelled = false;
    Promise.all(
      toFetch.map(async (e) => {
        const res = await fetch(e.srcUrl!);
        const text = await res.text();
        return [e.srcUrl!, extractSvgInner(text)] as const;
      }),
    )
      .then((entries) => {
        if (!cancelled) setSvgCache((prev: Record<string, string>) => ({ ...prev, ...Object.fromEntries(entries) }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [extras, svgCache]);

  const formattedDate = formatDateFR(date.dateStr);

  // Logo positioning — requires DOM access (getBBox), runs after each render
  useEffect(() => {
    const mainLogoEl = mainLogoRef.current;
    const hostEl = extrasHostRef.current;
    if (!mainLogoEl || !hostEl) return;
    // Assignation intermédiaire : TS ne propage pas le narrowing dans les closures
    const safeHost = hostEl;

    mainLogoEl.setAttribute("display", showMainLogo ? "inline" : "none");

    // Clear extras host
    while (safeHost.firstChild) safeHost.removeChild(safeHost.firstChild);
    safeHost.removeAttribute("transform");

    const svgNS = "http://www.w3.org/2000/svg";

    function buildScaledGroup(
      svgText: string,
      slotW: number,
      slotH: number,
    ): { g: SVGGElement; s: number; tx0: number; ty0: number; realW: number; realH: number } {
      const g = document.createElementNS(svgNS, "g") as SVGGElement;
      g.innerHTML = svgText;
      g.setAttribute("opacity", "0");
      safeHost.appendChild(g);

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
      return { g, s, tx0, ty0, realW, realH };
    }

    if (extraMode === "absolute") {
      extras.forEach((item) => {
        const svgContent = (item.srcUrl ? svgCache[item.srcUrl] : undefined) ?? item.svgText;
        const { g, s, tx0, ty0, realW, realH } = buildScaledGroup(svgContent, item.w, item.h);
        const cx = (item.xPct / 100) * SVG_W;
        const cy = (item.yPct / 100) * SVG_H;
        const x = cx - realW / 2;
        const y = cy - realH / 2;
        g.setAttribute("transform", `translate(${x + tx0}, ${y + ty0}) scale(${s})`);
      });
      mainLogoEl.removeAttribute("transform");
    } else {
      const rowYpx = (logosY / 100) * SVG_H;

      let mainWidth = 0;
      let mainBox: DOMRect | null = null;
      if (showMainLogo) {
        mainLogoEl.setAttribute("display", "inline");
        mainBox = mainLogoEl.getBBox();
        mainWidth = mainBox.width || 0;
      }

      const totalExtrasW = extras.reduce((acc, it) => acc + it.w, 0);
      const blocks = (showMainLogo ? 1 : 0) + extras.length;
      const totalGap = Math.max(0, blocks - 1) * logosGap;
      const totalW = mainWidth + totalExtrasW + totalGap;
      let cursorX = 640 - totalW / 2;

      if (showMainLogo && mainBox) {
        const dx = cursorX - mainBox.x;
        const dy = rowYpx - (mainBox.y + mainBox.height / 2);
        mainLogoEl.setAttribute("transform", `translate(${dx}, ${dy})`);
        cursorX += mainBox.width + logosGap;
      } else {
        mainLogoEl.removeAttribute("transform");
      }

      extras.forEach((item) => {
        const svgContent = (item.srcUrl ? svgCache[item.srcUrl] : undefined) ?? item.svgText;
        const { g, s, tx0, ty0, realW, realH } = buildScaledGroup(svgContent, item.w, item.h);
        const x = cursorX;
        const y = rowYpx - item.h / 2;
        const padX = (item.w - realW) / 2;
        const padY = (item.h - realH) / 2;
        g.setAttribute("transform", `translate(${x + padX + tx0}, ${y + padY + ty0}) scale(${s})`);
        cursorX += item.w + logosGap;
      });
    }
  });

  return (
    <svg
      width={SVG_W}
      height={SVG_H}
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      style={{ width: "100%", height: "auto" }}
    >
      <defs>
        <style>{`
          @font-face {
            font-family: 'Marianne';
            src: url('/thumbail-generator/fonts/Marianne-Light.woff2') format('woff2'),
                 url('/thumbail-generator/fonts/Marianne-Light.woff') format('woff');
            font-weight: 300;
          }
          @font-face {
            font-family: 'Marianne';
            src: url('/thumbail-generator/fonts/Marianne-Regular.woff2') format('woff2'),
                 url('/thumbail-generator/fonts/Marianne-Regular.woff') format('woff');
            font-weight: 400;
          }
          @font-face {
            font-family: 'Marianne';
            src: url('/thumbail-generator/fonts/Marianne-Medium.woff2') format('woff2'),
                 url('/thumbail-generator/fonts/Marianne-Medium.woff') format('woff');
            font-weight: 500;
          }
          @font-face {
            font-family: 'Marianne';
            src: url('/thumbail-generator/fonts/Marianne-Bold.woff2') format('woff2'),
                 url('/thumbail-generator/fonts/Marianne-Bold.woff') format('woff');
            font-weight: 700;
          }
          @font-face {
            font-family: 'Marianne';
            src: url('/thumbail-generator/fonts/Marianne-ExtraBold.woff2') format('woff2'),
                 url('/thumbail-generator/fonts/Marianne-ExtraBold.woff') format('woff');
            font-weight: 800;
          }
        `}</style>
      </defs>
      <g clipPath="url(#clip0_197_2)">
        <rect width="1280" height="720" fill="#F9F7F8" />
        <rect width="1280" height="720" fill="url(#pattern0_197_2)" fillOpacity="0.8" />

        {/* Main ADEME logo */}
        <g filter="url(#filter_main_logo)" id="main_logo" ref={mainLogoRef}>
          <mask
            id="path-1-outside-1_197_2"
            maskUnits="userSpaceOnUse"
            x="535"
            y="64"
            width="212"
            height="188"
            fill="black"
          >
            <rect fill="white" x="535" y="64" width="212" height="188" />
            <path d="M615.901 130.138C614.544 130.889 612.922 130.795 611.646 129.891L577.244 105.531C576.998 105.356 576.819 105.322 576.684 105.319C576.519 105.315 576.315 105.361 576.11 105.482C575.905 105.603 575.761 105.763 575.678 105.909C575.61 106.028 575.541 106.202 575.541 106.515L575.541 209.245C575.541 209.558 575.61 209.732 575.678 209.851C575.761 209.997 575.905 210.157 576.11 210.278C576.315 210.399 576.519 210.445 576.684 210.441C576.819 210.438 576.998 210.404 577.244 210.229L611.845 185.728C613.158 184.798 614.832 184.727 616.208 185.542C619.054 187.228 619.211 191.621 616.495 193.544L581.894 218.046C575.482 222.587 567 217.575 567 209.245L567 106.515C567 98.1849 575.482 93.1733 581.894 97.7142L616.296 122.074C619.057 124.03 618.838 128.515 615.901 130.138Z" />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M632.761 210.229L705.299 158.864C705.957 158.398 705.957 157.362 705.299 156.896L632.761 105.531C632.515 105.356 632.336 105.322 632.201 105.319C632.036 105.315 631.832 105.361 631.627 105.482C631.421 105.603 631.278 105.763 631.195 105.909C631.127 106.028 631.058 106.202 631.058 106.515L631.058 209.245C631.058 209.558 631.127 209.732 631.195 209.851C631.278 209.997 631.421 210.157 631.627 210.278C631.832 210.399 632.036 210.445 632.201 210.441C632.336 210.438 632.515 210.404 632.761 210.229ZM709.949 166.681C715.795 162.541 715.795 153.219 709.949 149.079L637.411 97.7142C630.999 93.1733 622.517 98.1849 622.517 106.515L622.517 209.245C622.517 217.575 630.999 222.587 637.411 218.046L709.949 166.681Z"
            />
          </mask>
          <path
            d="M615.901 130.138C614.544 130.889 612.922 130.795 611.646 129.891L577.244 105.531C576.998 105.356 576.819 105.322 576.684 105.319C576.519 105.315 576.315 105.361 576.11 105.482C575.905 105.603 575.761 105.763 575.678 105.909C575.61 106.028 575.541 106.202 575.541 106.515L575.541 209.245C575.541 209.558 575.61 209.732 575.678 209.851C575.761 209.997 575.905 210.157 576.11 210.278C576.315 210.399 576.519 210.445 576.684 210.441C576.819 210.438 576.998 210.404 577.244 210.229L611.845 185.728C613.158 184.798 614.832 184.727 616.208 185.542C619.054 187.228 619.211 191.621 616.495 193.544L581.894 218.046C575.482 222.587 567 217.575 567 209.245L567 106.515C567 98.1849 575.482 93.1733 581.894 97.7142L616.296 122.074C619.057 124.03 618.838 128.515 615.901 130.138Z"
            fill="url(#paint0_linear_197_2)"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M632.761 210.229L705.299 158.864C705.957 158.398 705.957 157.362 705.299 156.896L632.761 105.531C632.515 105.356 632.336 105.322 632.201 105.319C632.036 105.315 631.832 105.361 631.627 105.482C631.421 105.603 631.278 105.763 631.195 105.909C631.127 106.028 631.058 106.202 631.058 106.515L631.058 209.245C631.058 209.558 631.127 209.732 631.195 209.851C631.278 209.997 631.421 210.157 631.627 210.278C631.832 210.399 632.036 210.445 632.201 210.441C632.336 210.438 632.515 210.404 632.761 210.229ZM709.949 166.681C715.795 162.541 715.795 153.219 709.949 149.079L637.411 97.7142C630.999 93.1733 622.517 98.1849 622.517 106.515L622.517 209.245C622.517 217.575 630.999 222.587 637.411 218.046L709.949 166.681Z"
            fill="url(#paint1_linear_197_2)"
          />
          {/* White stroke outline — preserved as-is from original */}
          <path
            d="M577.244 105.531L595.737 79.4152L595.737 79.4152L577.244 105.531ZM576.684 105.319L575.956 137.31L575.957 137.31L576.684 105.319ZM576.11 105.482L592.388 133.032L592.389 133.032L576.11 105.482ZM575.678 105.909L547.879 90.0587L547.879 90.0588L575.678 105.909ZM575.541 106.515L607.541 106.515V106.515H575.541ZM575.541 209.245H543.541H575.541ZM575.678 209.851L603.477 194.001L603.476 194L575.678 209.851ZM576.11 210.278L559.831 237.828L559.832 237.828L576.11 210.278ZM576.684 210.441L577.411 242.433L577.411 242.433L576.684 210.441ZM577.244 210.229L558.752 184.114L558.751 184.114L577.244 210.229ZM581.894 218.046L600.387 244.161H600.387L581.894 218.046ZM567 209.245H535H567ZM567 106.515L535 106.515L567 106.515ZM581.894 97.7142L600.387 71.5988V71.5988L581.894 97.7142ZM616.296 122.074L634.788 95.959L616.296 122.074ZM615.901 130.138L631.387 158.142L615.901 130.138ZM616.208 185.542L599.895 213.072L616.208 185.542ZM616.495 193.544L598.002 167.429H598.002L616.495 193.544ZM611.845 185.728L630.338 211.843L630.338 211.843L611.845 185.728ZM611.646 129.891L630.138 103.775L611.646 129.891ZM705.299 158.864L723.791 184.98L723.792 184.98L705.299 158.864ZM632.761 210.229L614.268 184.114L614.268 184.114L632.761 210.229ZM705.299 156.896L723.792 130.78L723.791 130.78L705.299 156.896ZM632.761 105.531L651.254 79.4152V79.4152L632.761 105.531ZM632.201 105.319L631.473 137.31L631.474 137.31L632.201 105.319ZM631.627 105.482L647.905 133.032L647.905 133.032L631.627 105.482ZM631.195 105.909L658.993 121.76L658.993 121.76L631.195 105.909ZM631.058 106.515L663.058 106.515V106.515H631.058ZM631.058 209.245H599.058H631.058ZM631.195 209.851L658.993 194.001L658.993 194L631.195 209.851ZM631.627 210.278L647.906 182.728L647.905 182.728L631.627 210.278ZM632.201 210.441L632.927 242.433L632.928 242.433L632.201 210.441ZM709.949 149.079L728.441 122.964L728.441 122.964L709.949 149.079ZM709.949 166.681L728.441 192.796L728.441 192.796L709.949 166.681ZM637.411 97.7142L618.918 123.83L618.918 123.83L637.411 97.7142ZM622.517 106.515L590.517 106.515L622.517 106.515ZM622.517 209.245H654.517H622.517ZM637.411 218.046L618.918 191.93L618.918 191.93L637.411 218.046Z"
            fill="white"
            mask="url(#path-1-outside-1_197_2)"
          />
        </g>

        {/* Extras logos host (populated via useEffect) */}
        <g id="logo_extras" ref={extrasHostRef} />

        {/* Decorative line */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M811.799 530.337C781.297 528.289 704.639 523.191 635.725 523.347C570.502 523.495 496.493 527.723 469.286 530.33C467.637 530.488 466.172 529.279 466.014 527.63C465.856 525.981 467.065 524.515 468.714 524.357C496.124 521.731 570.321 517.495 635.712 517.347C704.86 517.191 781.711 522.303 812.201 524.35C813.854 524.461 815.104 525.892 814.993 527.545C814.882 529.198 813.452 530.448 811.799 530.337Z"
          fill="#4950FB"
        />

        {/* Decorative swirls */}
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

        {/* Dynamic text elements */}
        <text
          id="thumbnail_title"
          x={`${title.xPct}%`}
          y={`${title.yPct}%`}
          dominantBaseline="middle"
          textAnchor="middle"
          fill={title.color}
          xmlSpace="preserve"
          style={{ whiteSpace: "pre" }}
          fontFamily="Marianne"
          fontSize={title.size}
          fontWeight="800"
          letterSpacing={`${title.spacing}em`}
          display={title.show ? "inline" : "none"}
        >
          {title.text}
        </text>

        <text
          id="thumbnail_subtitle"
          x={`${subtitle.xPct}%`}
          y={`${subtitle.yPct}%`}
          dominantBaseline="middle"
          textAnchor="middle"
          fill={subtitle.color}
          xmlSpace="preserve"
          style={{ whiteSpace: "pre" }}
          fontFamily="Arial"
          fontSize={subtitle.size}
          letterSpacing={`${subtitle.spacing}em`}
          display={subtitle.show ? "inline" : "none"}
        >
          {subtitle.text}
        </text>

        <text
          id="thumbnail_date"
          x={`${date.xPct}%`}
          y={`${date.yPct}%`}
          dominantBaseline="middle"
          textAnchor="middle"
          fill={date.color}
          xmlSpace="preserve"
          style={{ whiteSpace: "pre" }}
          fontFamily="Arial"
          fontSize={date.size}
          letterSpacing={`${date.spacing}em`}
          display={date.show ? "inline" : "none"}
        >
          {formattedDate}
        </text>
      </g>

      <defs>
        <pattern
          id="pattern0_197_2"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use
            xlinkHref="#image0_197_2"
            transform="matrix(0.001 0 0 0.00177778 0 -0.00933333)"
          />
        </pattern>
        <filter
          id="filter_main_logo"
          x="529"
          y="60.002"
          width="223.333"
          height="199.756"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="3" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0.0666667 0 0 0 0 0.2 0 0 0 0.05 0"
          />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_197_2" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0.0666667 0 0 0 0 0.2 0 0 0 0.02 0"
          />
          <feBlend
            mode="multiply"
            in2="effect1_dropShadow_197_2"
            result="effect2_dropShadow_197_2"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0.0666667 0 0 0 0 0.2 0 0 0 0.03 0"
          />
          <feBlend
            mode="normal"
            in2="effect2_dropShadow_197_2"
            result="effect3_dropShadow_197_2"
          />
          <feBlend mode="normal" in="SourceGraphic" in2="effect3_dropShadow_197_2" result="shape" />
        </filter>
        <linearGradient
          id="paint0_linear_197_2"
          x1="567.441"
          y1="157.88"
          x2="787.843"
          y2="157.88"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF3333" />
          <stop offset="0.854167" stopColor="#4D0600" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_197_2"
          x1="567"
          y1="157.88"
          x2="720.296"
          y2="157.88"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.239583" stopColor="#3139FB" />
          <stop offset="0.995002" stopColor="#7DB1EC" />
          <stop offset="1" stopColor="#4950FB" />
        </linearGradient>
        <clipPath id="clip0_197_2">
          <rect width="1280" height="720" fill="white" />
        </clipPath>
        <image
          id="image0_197_2"
          width="1000"
          height="573"
          preserveAspectRatio="none"
          xlinkHref="/thumbail-generator/fond_thumbnail.png"
        />
      </defs>
    </svg>
  );
}
