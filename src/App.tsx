import { useCallback, useEffect, useRef, useState } from "react";
import { GripVertical, ImageIcon, MoonIcon, SunIcon, TvIcon } from "lucide-react";
import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";
import { LogoSection } from "./components/LogoSection";
import { MediaPreviewCanvas } from "./components/MediaPreviewCanvas";
import type { LogoRect } from "./hooks/useMediaPreviewState";
import { MediaPreviewSidebar } from "./components/MediaPreviewSidebar";
import { PresetSection } from "./components/PresetSection";
import { ThumbnailCanvas } from "./components/ThumbnailCanvas";
import { TextElementSection } from "./components/TextElementSection";
import { useMediaPreviewState } from "./hooks/useMediaPreviewState";
import { useThumbnailState } from "./hooks/useThumbnailState";
import {
  buildHash,
  decodePreset,
  encodePreset,
  parseHash,
} from "./lib/urlPreset";

type AppMode = "thumbnail" | "media-preview";

export function App() {
  const { state: thumbState, presets, actions: thumbActions } = useThumbnailState();
  const { state: mpState, actions: mpActions } = useMediaPreviewState();
  const [logoRect, setLogoRect] = useState<LogoRect | null>(null);

  // Init mode + preset from URL hash, fallback to localStorage
  const [mode, setMode] = useState<AppMode>(() => {
    const { mode: hashMode, preset: presetStr } = parseHash(window.location.hash);
    if (hashMode) {
      // Apply preset from URL if present
      if (presetStr) {
        const data = decodePreset(presetStr);
        if (data) {
          if (hashMode === "media-preview") {
            mpActions.patch(data as Partial<typeof mpState>);
          } else {
            const preset = presets.find((p) => p.name === (data as { name?: string }).name);
            if (preset) thumbActions.applyPreset(preset);
          }
        }
      }
      return hashMode;
    }
    return (localStorage.getItem("app-mode") as AppMode) || "thumbnail";
  });

  // Sync mode + state → hash + localStorage (debounced)
  useEffect(() => {
    localStorage.setItem("app-mode", mode);
  }, [mode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const state =
        mode === "media-preview"
          ? (mpState as unknown as Record<string, unknown>)
          : (thumbActions.buildPresetValues() as unknown as Record<string, unknown>);
      const encoded = encodePreset(state);
      history.replaceState(null, "", buildHash(mode, encoded));
    }, 300);
    return () => clearTimeout(timer);
  }, [thumbState, mpState, mode, thumbActions]);

  const previewRef = useRef<HTMLDivElement>(null);
  const [svgCode, setSvgCode] = useState("");
  const [svgExpanded, setSvgExpanded] = useState(false);
  const [asideWidth, setAsideWidth] = useState(600);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      dragStartX.current = e.clientX;
      dragStartWidth.current = asideWidth;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [asideWidth],
  );

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current) return;
      const delta = e.clientX - dragStartX.current;
      setAsideWidth(Math.min(800, Math.max(400, dragStartWidth.current + delta)));
    }
    function onMouseUp() {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const [dark, setDark] = useState(
    () =>
      localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches),
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  // Serialize SVG code for the code viewer (strip data URLs for readability)
  const activeState = mode === "thumbnail" ? thumbState : mpState;
  useEffect(() => {
    const svg = previewRef.current?.querySelector("svg");
    if (svg) {
      const raw = new XMLSerializer().serializeToString(svg);
      setSvgCode(raw.replace(/data:[^"'\s]+/g, "data:…"));
    }
  }, [activeState, mode]);

  const [pngData, setPngData] = useState<{
    url: string;
    fileName: string;
    stateKey: string;
  } | null>(null);

  // Invalidate PNG when state changes (derived — no effect needed)
  const stateKey = JSON.stringify(activeState) + mode;
  const currentPng =
    pngData?.stateKey === stateKey ? pngData : null;

  function generatePng() {
    const svgEl = previewRef.current?.querySelector("svg");
    if (!svgEl) return;

    const isThumbnail = mode === "thumbnail";
    const width = isThumbnail ? 1280 : 512;
    const height = isThumbnail ? 720 : 269;

    const serialized = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([serialized], {
      type: "image/svg+xml;charset=utf-8",
    });
    const blobUrl = URL.createObjectURL(blob);

    let fileName: string;
    if (isThumbnail) {
      const title = thumbState.title.text.replace(/\s+/g, "_");
      const subtitle = thumbState.subtitle.text.replace(/\s+/g, "_");
      const dateFormatted = thumbState.date.dateStr
        ? new Date(thumbState.date.dateStr)
            .toLocaleDateString("fr-FR")
            .replace(/\//g, "_")
        : "";
      fileName = `thumbnail_${title}_${subtitle}_${dateFormatted}.png`;
    } else {
      const title = mpState.title.replace(/\s+/g, "_");
      const subtitle = mpState.subtitle.replace(/\s+/g, "_");
      fileName = `media-preview_${title}_${subtitle}.png`;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(blobUrl);
      setPngData({ url: canvas.toDataURL("image/png"), fileName, stateKey });
    };
    img.src = blobUrl;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-full px-6">
          <h1 className="text-lg font-semibold">
            {mode === "thumbnail"
              ? "Générateur SVG Thumbnail"
              : "Générateur Media Preview"}
          </h1>

          <div className="flex items-center gap-2">
            {/* Mode toggle */}
            <div className="flex items-center border rounded-md overflow-hidden">
              <Button
                variant={mode === "thumbnail" ? "default" : "ghost"}
                size="sm"
                className="rounded-none h-8"
                onClick={() => setMode("thumbnail")}
                title="Thumbnail 1280×720"
              >
                <TvIcon className="size-4 mr-1.5" />
                Thumbnail
              </Button>
              <Button
                variant={mode === "media-preview" ? "default" : "ghost"}
                size="sm"
                className="rounded-none h-8"
                onClick={() => setMode("media-preview")}
                title="Media Preview 512×269"
              >
                <ImageIcon className="size-4 mr-1.5" />
                Media Preview
              </Button>
            </div>

            {/* Dark mode */}
            <Button
              variant="ghost"
              size="icon"
              aria-label={dark ? "Mode clair" : "Mode sombre"}
              onClick={() => setDark((d) => !d)}
            >
              {dark ? (
                <SunIcon className="size-5" aria-hidden="true" />
              ) : (
                <MoonIcon className="size-5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex gap-6 p-6 flex-1 items-start">
        <aside
          style={{ width: asideWidth }}
          className="shrink-0 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-80px)] sticky top-[80px]"
        >
          {mode === "thumbnail" ? (
            <>
              <PresetSection
                presets={presets}
                onApply={thumbActions.applyPreset}
                onReset={thumbActions.resetPreset}
                buildPresetValues={thumbActions.buildPresetValues}
              />

              <hr className="border-border" />

              <TextElementSection
                label="Titre"
                prefix="title"
                value={thumbState.title}
                onChange={thumbActions.setTitle}
              />

              <hr className="border-border" />

              <TextElementSection
                label="Sous-titre"
                prefix="subtitle"
                value={thumbState.subtitle}
                onChange={thumbActions.setSubtitle}
              />

              <hr className="border-border" />

              <TextElementSection
                label="Date"
                prefix="date"
                type="date"
                value={thumbState.date}
                onChange={thumbActions.setDate}
              />

              <hr className="border-border" />

              <LogoSection
                state={thumbState}
                logoRect={logoRect}
                onLogoSettingsChange={thumbActions.setLogoSettings}
                onAddExtras={thumbActions.addExtras}
                onUpdateExtra={thumbActions.updateExtra}
                onRemoveExtra={thumbActions.removeExtra}
                onMoveExtra={thumbActions.moveExtra}
              />
            </>
          ) : (
            <MediaPreviewSidebar
              state={mpState}
              logoRect={logoRect}
              onPatch={mpActions.patch}
              onReset={mpActions.reset}
              onAddExtras={mpActions.addExtras}
              onUpdateExtra={mpActions.updateExtra}
              onRemoveExtra={mpActions.removeExtra}
              onMoveExtra={mpActions.moveExtra}
            />
          )}
        </aside>

        {/* Handle de redimensionnement */}
        <div
          role="separator"
          aria-orientation="vertical"
          onMouseDown={handleResizeStart}
          className="self-stretch w-4 shrink-0 cursor-col-resize"
        >
          <div className="sticky top-[calc(50vh-0.75rem)] flex justify-center">
            <GripVertical className="w-3 h-6 text-muted-foreground/40 hover:text-primary/70 transition-colors" aria-hidden="true" />
          </div>
        </div>

        <main className="flex-1 flex flex-col items-center gap-4">
          <div
            className="border rounded-lg overflow-hidden w-full"
            ref={previewRef}
          >
            {mode === "thumbnail" ? (
              <ThumbnailCanvas state={thumbState} onLogoMeasured={setLogoRect} />
            ) : (
              <MediaPreviewCanvas state={mpState} onLogoMeasured={setLogoRect} />
            )}
          </div>
          <div className="flex flex-col items-center gap-2">
            <Button size="lg" onClick={generatePng}>
              Générer le PNG
              <span className="ml-1.5 text-xs opacity-70">
                ({mode === "thumbnail" ? "1280×720" : "512×269"})
              </span>
            </Button>
            {currentPng && (
              <div className="flex flex-col items-center gap-2 rounded-lg border p-3">
                <img
                  src={currentPng.url}
                  alt="Aperçu PNG"
                  className="max-w-64 rounded border"
                  width={mode === "thumbnail" ? 1280 : 512}
                  height={mode === "thumbnail" ? 720 : 269}
                />
                <a
                  href={currentPng.url}
                  download={currentPng.fileName}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Télécharger {currentPng.fileName}
                </a>
              </div>
            )}
          </div>
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold">Code SVG</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6 px-2"
                onClick={() => setSvgExpanded((v) => !v)}
              >
                {svgExpanded ? "Voir moins" : "Voir plus"}
              </Button>
            </div>
            <Textarea
              readOnly
              aria-label="Code SVG"
              className={`font-mono text-xs resize-none overflow-y-auto transition-[max-height] duration-200 ${svgExpanded ? "max-h-96" : "max-h-24"}`}
              value={svgCode}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
