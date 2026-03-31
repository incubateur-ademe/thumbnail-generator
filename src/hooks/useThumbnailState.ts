import { useCallback, useState } from "react";
import type { ExtraLogoValues, Preset, PresetValues } from "@/data/presets";
import { DEFAULT_PRESET_NAME, presets } from "@/data/presets";
import { todayISO } from "@/lib/dateUtils";
import { extractSvgInner, uid } from "@/lib/svgUtils";

export interface TextElementState {
  show: boolean;
  text: string;
  size: number;
  color: string;
  spacing: number;
  xPct: number;
  yPct: number;
}

export interface DateElementState extends TextElementState {
  dateStr: string;
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

export interface ThumbnailState {
  title: TextElementState;
  subtitle: TextElementState;
  date: DateElementState;
  showMainLogo: boolean;
  extraMode: "row" | "absolute";
  logosY: number;
  logosGap: number;
  extras: ExtraLogo[];
}

function presetValuesToState(values: PresetValues): ThumbnailState {
  return {
    title: {
      show: values.showTitle,
      text: values.title,
      size: Number(values.titleSize),
      color: values.titleColor,
      spacing: Number(values.titleSpacing),
      xPct: Number(values.titleX),
      yPct: Number(values.titleY),
    },
    subtitle: {
      show: values.showSubtitle,
      text: values.subtitle,
      size: Number(values.subtitleSize),
      color: values.subtitleColor,
      spacing: Number(values.subtitleSpacing),
      xPct: Number(values.subtitleX),
      yPct: Number(values.subtitleY),
    },
    date: {
      show: values.showDate,
      dateStr: values.date,
      text: "",
      size: Number(values.dateSize),
      color: values.dateColor,
      spacing: Number(values.dateSpacing),
      xPct: Number(values.dateX),
      yPct: Number(values.dateY),
    },
    showMainLogo: values.showMainLogo,
    extraMode: values.extraMode,
    logosY: Number(values.logosY),
    logosGap: Number(values.logosGap),
    extras: values.extras.map((e) => ({
      id: uid(),
      name: e.name,
      svgText: e.src ? "" : extractSvgInner(e.svgText),
      srcUrl: e.src,
      w: Math.max(1, e.w ?? 120),
      h: Math.max(1, e.h ?? 120),
      xPct: e.xPct ?? 50,
      yPct: e.yPct ?? 22,
    })),
  };
}

function stateToPresetValues(state: ThumbnailState): PresetValues {
  return {
    showTitle: state.title.show,
    title: state.title.text,
    titleSize: String(state.title.size),
    titleColor: state.title.color,
    titleSpacing: String(state.title.spacing),
    titleX: String(state.title.xPct),
    titleY: String(state.title.yPct),

    showSubtitle: state.subtitle.show,
    subtitle: state.subtitle.text,
    subtitleSize: String(state.subtitle.size),
    subtitleColor: state.subtitle.color,
    subtitleSpacing: String(state.subtitle.spacing),
    subtitleX: String(state.subtitle.xPct),
    subtitleY: String(state.subtitle.yPct),

    showDate: state.date.show,
    date: state.date.dateStr,
    dateSize: String(state.date.size),
    dateColor: state.date.color,
    dateSpacing: String(state.date.spacing),
    dateX: String(state.date.xPct),
    dateY: String(state.date.yPct),

    showMainLogo: state.showMainLogo,
    extraMode: state.extraMode,
    logosY: String(state.logosY),
    logosGap: String(state.logosGap),

    extras: state.extras.map((e) => ({
      name: e.name,
      svgText: e.srcUrl ? "" : e.svgText,
      src: e.srcUrl,
      w: e.w,
      h: e.h,
      xPct: e.xPct,
      yPct: e.yPct,
    })),
  };
}

const defaultPreset = presets.find((p) => p.name === DEFAULT_PRESET_NAME) ?? presets[0]!;
const initialState = presetValuesToState({
  ...defaultPreset!.values,
  date: todayISO(),
});

export function useThumbnailState() {
  const [state, setState] = useState<ThumbnailState>(initialState);

  const applyPreset = useCallback((preset: Preset) => {
    setState(presetValuesToState(preset.values));
  }, []);

  const resetPreset = useCallback(() => {
    setState(presetValuesToState({ ...defaultPreset!.values, date: todayISO() }));
  }, []);

  const setTitle = useCallback((patch: Partial<TextElementState>) => {
    setState((s) => ({ ...s, title: { ...s.title, ...patch } }));
  }, []);

  const setSubtitle = useCallback((patch: Partial<TextElementState>) => {
    setState((s) => ({ ...s, subtitle: { ...s.subtitle, ...patch } }));
  }, []);

  const setDate = useCallback((patch: Partial<DateElementState>) => {
    setState((s) => ({ ...s, date: { ...s.date, ...patch } }));
  }, []);

  const setLogoSettings = useCallback(
    (patch: Partial<Pick<ThumbnailState, "showMainLogo" | "extraMode" | "logosY" | "logosGap">>) => {
      setState((s) => ({ ...s, ...patch }));
    },
    [],
  );

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
          w: Math.max(1, e.w ?? 120),
          h: Math.max(1, e.h ?? 120),
          xPct: e.xPct ?? 50,
          yPct: e.yPct ?? 22,
        })),
      ],
    }));
  }, []);

  const updateExtra = useCallback((id: string, patch: Partial<Omit<ExtraLogo, "id">>) => {
    setState((s) => ({
      ...s,
      extras: s.extras.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }, []);

  const removeExtra = useCallback((id: string) => {
    setState((s) => ({ ...s, extras: s.extras.filter((e) => e.id !== id) }));
  }, []);

  const moveExtra = useCallback((id: string, direction: "up" | "down") => {
    setState((s) => {
      const idx = s.extras.findIndex((e) => e.id === id);
      if (idx < 0) return s;
      const newExtras = [...s.extras];
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= newExtras.length) return s;
      [newExtras[idx], newExtras[targetIdx]] = [newExtras[targetIdx]!, newExtras[idx]!];
      return { ...s, extras: newExtras };
    });
  }, []);

  const buildPresetValues = useCallback(
    () => stateToPresetValues(state),
    [state],
  );

  return {
    state,
    presets,
    actions: {
      applyPreset,
      resetPreset,
      setTitle,
      setSubtitle,
      setDate,
      setLogoSettings,
      addExtras,
      updateExtra,
      removeExtra,
      moveExtra,
      buildPresetValues,
    },
  };
}
