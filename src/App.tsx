import { useEffect, useRef, useState } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";
import { LogoSection } from "./components/LogoSection";
import { PresetSection } from "./components/PresetSection";
import { SvgCanvas } from "./components/SvgCanvas";
import { TextElementSection } from "./components/TextElementSection";
import { useThumbnailState } from "./hooks/useThumbnailState";

export function App() {
  const { state, presets, actions } = useThumbnailState();
  const previewRef = useRef<HTMLDivElement>(null);
  const [svgCode, setSvgCode] = useState("");
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

  useEffect(() => {
    const svg = previewRef.current?.querySelector("svg");
     
    if (svg) setSvgCode(new XMLSerializer().serializeToString(svg));
  }, [state]);

  function handleDownload() {
    const svgEl = previewRef.current?.querySelector("svg");
    if (!svgEl) return;
    const serialized = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const title = state.title.text.replace(/\s+/g, "_");
    const subtitle = state.subtitle.text.replace(/\s+/g, "_");
    const dateFormatted = state.date.dateStr
      ? new Date(state.date.dateStr).toLocaleDateString("fr-FR").replace(/\//g, "_")
      : "";
    const fileName = `thumbnail_${title}_${subtitle}_${dateFormatted}.png`;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const pngURL = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngURL;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = url;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-full px-6">
          <h1 className="text-lg font-semibold">Générateur SVG Thumbnail</h1>
          <Button variant="ghost" size="icon" onClick={() => setDark((d) => !d)}>
            {dark ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
          </Button>
        </div>
      </header>

      <div className="flex gap-6 p-6 flex-1 items-start">
        <aside className="w-[400px] shrink-0 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-80px)] sticky top-[80px]">
          <PresetSection
            presets={presets}
            onApply={actions.applyPreset}
            onReset={actions.resetPreset}
            buildPresetValues={actions.buildPresetValues}
          />

          <hr className="border-border" />

          <TextElementSection
            label="Titre"
            prefix="title"
            value={state.title}
            onChange={actions.setTitle}
          />

          <hr className="border-border" />

          <TextElementSection
            label="Sous-titre"
            prefix="subtitle"
            value={state.subtitle}
            onChange={actions.setSubtitle}
          />

          <hr className="border-border" />

          <TextElementSection
            label="Date"
            prefix="date"
            type="date"
            value={state.date}
            onChange={actions.setDate}
          />

          <hr className="border-border" />

          <LogoSection
            state={state}
            onLogoSettingsChange={actions.setLogoSettings}
            onAddExtras={actions.addExtras}
            onUpdateExtra={actions.updateExtra}
            onRemoveExtra={actions.removeExtra}
            onMoveExtra={actions.moveExtra}
          />
        </aside>

        <main className="flex-1 flex flex-col items-center gap-4">
          <div className="border rounded-lg overflow-hidden w-full" ref={previewRef}>
            <SvgCanvas state={state} />
          </div>
          <Button size="lg" onClick={handleDownload}>
            Télécharger en PNG
          </Button>
          <div className="w-full">
            <h2 className="text-base font-semibold mb-2">Code SVG</h2>
            <Textarea
              readOnly
              className="font-mono text-xs min-h-32"
              value={svgCode}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
