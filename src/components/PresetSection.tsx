import { useRef, useState } from "react";
import type { Preset } from "@/data/presets";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  presets: Preset[];
  onApply: (preset: Preset) => void;
  onReset: () => void;
  buildPresetValues: () => object;
}

export function PresetSection({ presets, onApply, onReset, buildPresetValues }: Props) {
  const [selectedName, setSelectedName] = useState(presets[0]?.name ?? "");
  const [generatedPreset, setGeneratedPreset] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);

  function handleApply() {
    const preset = presets.find((p) => p.name === selectedName);
    if (preset) onApply(preset);
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
          <Select value={selectedName} onValueChange={setSelectedName}>
            <SelectTrigger id="preset-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {presets.map((p) => (
                <SelectItem key={p.name} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={handleApply}>
            Appliquer
          </Button>
          <Button type="button" variant="outline" onClick={onReset}>
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
