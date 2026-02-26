export interface TextElementValues {
  show: boolean;
  text: string;
  size: string;
  color: string;
  spacing: string;
  xPct: string;
  yPct: string;
}

export interface ExtraLogoValues {
  name: string;
  svgText: string;
  src?: string;
  w: number;
  h: number;
  xPct: number;
  yPct: number;
}

export interface PresetValues {
  showTitle: boolean;
  title: string;
  titleSize: string;
  titleColor: string;
  titleSpacing: string;
  titleX: string;
  titleY: string;

  showSubtitle: boolean;
  subtitle: string;
  subtitleSize: string;
  subtitleColor: string;
  subtitleSpacing: string;
  subtitleX: string;
  subtitleY: string;

  showDate: boolean;
  date: string;
  dateSize: string;
  dateColor: string;
  dateSpacing: string;
  dateX: string;
  dateY: string;

  showMainLogo: boolean;
  extraMode: "row" | "absolute";
  logosY: string;
  logosGap: string;

  extras: ExtraLogoValues[];
}

export interface Preset {
  name: string;
  values: PresetValues;
}

const today = new Date().toISOString().split("T")[0]!;

export const DEFAULT_PRESET_NAME = "Demo Day";

export const presets: Preset[] = [
  {
    name: "Demo Day",
    values: {
      showTitle: true,
      title: "Demo Day",
      titleSize: "128",
      titleColor: "#1E1E1E",
      titleSpacing: "0",
      titleX: "50",
      titleY: "50",

      showSubtitle: true,
      subtitle: "Épisode n°X",
      subtitleSize: "64",
      subtitleColor: "#4950FB",
      subtitleSpacing: "0",
      subtitleX: "50",
      subtitleY: "67",

      showDate: true,
      date: today,
      dateSize: "40",
      dateColor: "#1E1E1E",
      dateSpacing: "0",
      dateX: "50",
      dateY: "85.5",

      showMainLogo: true,
      extraMode: "row",
      logosY: "22",
      logosGap: "16",

      extras: [],
    },
  },
  {
    name: "Incubateur",
    values: {
      showTitle: true,
      title: "Comité 2025/2026",
      titleSize: "128",
      titleColor: "#1e1e1e",
      titleSpacing: "0",
      titleX: "50",
      titleY: "50",
      showSubtitle: true,
      subtitle: "Incubateur ADEME",
      subtitleSize: "64",
      subtitleColor: "#4950fb",
      subtitleSpacing: "0",
      subtitleX: "50",
      subtitleY: "67",
      showDate: true,
      date: "2026-01-27",
      dateSize: "40",
      dateColor: "#1e1e1e",
      dateSpacing: "0",
      dateX: "50",
      dateY: "85.5",
      showMainLogo: true,
      extraMode: "row",
      logosY: "22",
      logosGap: "16",
      extras: [
        {
          name: "ADEME_LOGO_2024.svg",
          svgText: "",
          src: "/presets/img/incubateur.svg",
          w: 360,
          h: 240,
          xPct: 50,
          yPct: 22,
        },
      ],
    },
  },
  {
    name: "Impact CO2",
    values: {
      showTitle: true,
      title: "<TITRE>",
      titleSize: "128",
      titleColor: "#1e1e1e",
      titleSpacing: "0",
      titleX: "50",
      titleY: "50",
      showSubtitle: true,
      subtitle: "Présentation",
      subtitleSize: "64",
      subtitleColor: "#4950fb",
      subtitleSpacing: "0",
      subtitleX: "50",
      subtitleY: "67",
      showDate: true,
      date: "2026-01-13",
      dateSize: "40",
      dateColor: "#1e1e1e",
      dateSpacing: "0",
      dateX: "50",
      dateY: "85.5",
      showMainLogo: false,
      extraMode: "row",
      logosY: "22",
      logosGap: "16",
      extras: [
        {
          name: "Logo ICO2.svg",
          svgText: "",
          src: "/presets/img/impactco2.svg",
          w: 1200,
          h: 120,
          xPct: 50,
          yPct: 22,
        },
      ],
    },
  },
];
