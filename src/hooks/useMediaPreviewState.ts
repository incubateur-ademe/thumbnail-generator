import { useCallback, useState } from "react";
import type { ExtraLogoValues } from "@/data/presets";
import { extractSvgInner, uid } from "@/lib/svgUtils";

export type Align = "left" | "center" | "right";

export interface LogoRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtraLogo {
  id: string;
  name: string;
  svgText: string;
  srcUrl?: string;
  w: number;
  h: number;
  xPct: number;
  yPct: number;
}

export interface MediaPreviewState {
  // Logo ADEME group (main_logo)
  showLogo: boolean;
  showLogoPlay: boolean;
  showLogoTagline: boolean;
  logoAlign: Align;

  // Icon (emoji / image)
  showIcon: boolean;
  iconType: "emoji" | "image";
  iconEmoji: string;
  iconImageData: string; // data-URL
  iconSize: number;
  iconAlign: Align;

  // Title
  title: string;
  titleColor: string;
  titleAlign: Align;

  // Subtitle
  showSubtitle: boolean;
  subtitle: string;
  subtitleColor: string;
  subtitleAlign: Align;

  // Backgrounds
  showBgPrimary: boolean;
  bgPrimaryColor: string;
  showBgSecondary: boolean;
  bgSecondaryColor: string;

  // Extra logos
  extras: ExtraLogo[];
  extraMode: "row" | "absolute";
  logosGap: number;
}

const defaultState: MediaPreviewState = {
  showLogo: true,
  showLogoPlay: true,
  showLogoTagline: true,
  logoAlign: "left",

  showIcon: true,
  iconType: "emoji",
  iconEmoji: "🌍",
  iconImageData: "",
  iconSize: 28,
  iconAlign: "left",

  title: "Titre",
  titleColor: "#4950FB",
  titleAlign: "left",

  showSubtitle: true,
  subtitle: "Sous-Titre",
  subtitleColor: "#747AFB",
  subtitleAlign: "left",

  showBgPrimary: true,
  bgPrimaryColor: "#CFD1FF",
  showBgSecondary: true,
  bgSecondaryColor: "#F9F7F8",

  extras: [],
  extraMode: "row",
  logosGap: 8,
};

export function useMediaPreviewState() {
  const [state, setState] = useState<MediaPreviewState>(defaultState);

  const patch = useCallback(
    (p: Partial<MediaPreviewState>) => setState((s) => ({ ...s, ...p })),
    [],
  );

  const reset = useCallback(() => setState(defaultState), []);

  const addExtras = useCallback((items: ExtraLogoValues[]) => {
    setState((s) => ({
      ...s,
      extras: [
        ...s.extras,
        ...items.map((e) => ({
          id: uid(),
          name: e.name,
          svgText: e.src ? "" : e.svgText.startsWith("data:") ? e.svgText : extractSvgInner(e.svgText),
          srcUrl: e.src,
          w: Math.max(1, e.w ?? 60),
          h: Math.max(1, e.h ?? 60),
          xPct: e.xPct ?? 50,
          yPct: e.yPct ?? 50,
        })),
      ],
    }));
  }, []);

  const updateExtra = useCallback((id: string, p: Partial<Omit<ExtraLogo, "id">>) => {
    setState((s) => ({
      ...s,
      extras: s.extras.map((e) => (e.id === id ? { ...e, ...p } : e)),
    }));
  }, []);

  const removeExtra = useCallback((id: string) => {
    setState((s) => ({ ...s, extras: s.extras.filter((e) => e.id !== id) }));
  }, []);

  const moveExtra = useCallback((id: string, direction: "up" | "down") => {
    setState((s) => {
      const idx = s.extras.findIndex((e) => e.id === id);
      if (idx < 0) return s;
      const arr = [...s.extras];
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= arr.length) return s;
      [arr[idx], arr[target]] = [arr[target]!, arr[idx]!];
      return { ...s, extras: arr };
    });
  }, []);

  return {
    state,
    actions: { patch, reset, addExtras, updateExtra, removeExtra, moveExtra },
  };
}
