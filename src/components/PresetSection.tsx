import { useRef, useState } from "react";
import type { Preset, PresetValues } from "@/data/presets";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TriangleAlert, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function presetScalarsMatch(a: PresetValues, b: PresetValues): boolean {
  return JSON.stringify({ ...a, extras: null }) === JSON.stringify({ ...b, extras: null });
}

interface Props {
  presets: Preset[];
  initialPresetName?: string | null;
  onApply: (values: PresetValues) => void;
  onReset: () => void;
  buildPresetValues: () => PresetValues;
}

const NO_PRESET = "__none__";

export function PresetSection({ presets, initialPresetName, onApply, onReset, buildPresetValues }: Props) {
  const defaultName = initialPresetName ?? NO_PRESET;
  const [selectedName, setSelectedName] = useState(defaultName);
  const [appliedName, setAppliedName] = useState(defaultName);
  const [generatedPreset, setGeneratedPreset] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);

  const hasSelection = selectedName !== NO_PRESET;
  const needsApply = hasSelection && selectedName !== appliedName;
  const appliedPreset = presets.find((p) => p.name === appliedName);
  const isModified = !needsApply && appliedPreset != null && !presetScalarsMatch(appliedPreset.values, buildPresetValues());

  function handleApply() {
    const preset = presets.find((p) => p.name === selectedName);
    if (preset) {
      onApply(preset.values);
      setAppliedName(selectedName);
    }
  }

  function handleReset() {
    onReset();
    const defaultName = presets[0]?.name ?? "";
    setSelectedName(defaultName);
    setAppliedName(defaultName);
  }

  function handleGenerate() {
    setGeneratedPreset(JSON.stringify(buildPresetValues(), null, 2));
  }

  async function handleCopy() {
    const text = textareaRef.current?.value;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      textareaRef.current?.select();
      try {
        document.execCommand("copy");
      } catch {
        // noop
      }
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="font-medium">Presets</div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="preset-select">Preset</Label>
          <div className="flex items-center gap-2">
            <Select value={selectedName} onValueChange={setSelectedName}>
              <SelectTrigger id="preset-select" className={isModified ? "italic" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PRESET} disabled className="italic text-muted-foreground">
                  Pas de preset
                </SelectItem>
                {presets.map((p) => (
                  <SelectItem key={p.name} value={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isModified && (
              <span className="flex items-center gap-1 text-xs text-amber-500 shrink-0">
                <TriangleAlert className="size-3.5" />
                Modifié
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleApply}
            className={needsApply ? "animate-[glow-breathe_3s_ease-in-out_infinite]" : ""}
          >
            Appliquer
          </Button>
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button type="button" variant="outline" onClick={handleGenerate}>
            Générer preset
          </Button>
        </div>
      </div>

      {generatedPreset && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold">Preset généré</h2>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setGeneratedPreset("")}
              title="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="relative">
            <Textarea
              ref={textareaRef}
              readOnly
              className="font-mono text-xs min-h-32 pr-10"
              value={generatedPreset}
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2 h-7 w-7 p-0"
              onClick={handleCopy}
            >
              {copied ? "✅" : "📋"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
