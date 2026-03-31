import type { ExtraLogoValues } from "@/data/presets";
import type { LogoRect } from "@/hooks/useMediaPreviewState";
import type { ExtraLogo, ThumbnailState } from "@/hooks/useThumbnailState";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ExtraLogoCard } from "@/components/ExtraLogoCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlignEndHorizontal, Upload } from "lucide-react";
import { useRef } from "react";

interface Props {
  state: ThumbnailState;
  logoRect: LogoRect | null;
  onLogoSettingsChange: (
    patch: Partial<Pick<ThumbnailState, "showMainLogo" | "extraMode" | "logosY" | "logosGap">>,
  ) => void;
  onAddExtras: (items: ExtraLogoValues[]) => void;
  onUpdateExtra: (id: string, patch: Partial<Omit<ExtraLogo, "id">>) => void;
  onRemoveExtra: (id: string) => void;
  onMoveExtra: (id: string, direction: "up" | "down") => void;
}

export function LogoSection({
  state,
  logoRect,
  onLogoSettingsChange,
  onAddExtras,
  onUpdateExtra,
  onRemoveExtra,
  onMoveExtra,
}: Props) {
  const { showMainLogo, extraMode, logosY, logosGap, extras } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])].filter(
      (f) =>
        f.type === "image/svg+xml" ||
        f.type.startsWith("image/") ||
        f.name.toLowerCase().endsWith(".svg"),
    );
    if (!files.length) return;

    const items = await Promise.all(
      files.map(async (file) => {
        const isSvg =
          file.type === "image/svg+xml" ||
          file.name.toLowerCase().endsWith(".svg");
        const svgText = isSvg
          ? await file.text()
          : await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
        return {
          name: file.name,
          svgText,
          w: 120,
          h: 120,
          xPct: 50,
          yPct: 22,
        };
      }),
    );
    onAddExtras(items);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="font-medium">Logos</div>

      {/* Ligne 1 : main_logo + mode */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-main-logo"
            checked={showMainLogo}
            onCheckedChange={(checked) =>
              onLogoSettingsChange({ showMainLogo: !!checked })
            }
          />
          <Label htmlFor="show-main-logo">Afficher le main_logo</Label>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="extra-mode">Mode</Label>
          <Select
            value={extraMode}
            onValueChange={(v) =>
              onLogoSettingsChange({ extraMode: v as "row" | "absolute" })
            }
          >
            <SelectTrigger id="extra-mode" className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="row">À côté du main logo (centré)</SelectItem>
              <SelectItem value="absolute">Position absolue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Y% rangée + Écart : uniquement en mode row */}
        {extraMode === "row" && (
          <>
            <div className="flex flex-col gap-1">
              <Label htmlFor="logos-y" title="Position verticale du groupe en %">
                Y% rangée
              </Label>
              <Input
                id="logos-y"
                className="w-20"
                type="number"
                value={logosY}
                step={0.1}
                onChange={(e) => onLogoSettingsChange({ logosY: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="logos-gap" title="Espace entre logos en px">
                Écart (px)
              </Label>
              <Input
                id="logos-gap"
                className="w-20"
                type="number"
                value={logosGap}
                step={1}
                onChange={(e) => onLogoSettingsChange({ logosGap: Number(e.target.value) })}
              />
            </div>
          </>
        )}
      </div>

      {/* Import SVG / images */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg,image/*"
          multiple
          className="hidden"
          onChange={handleFilePick}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
          Importer SVG / images
        </Button>
      </div>

      {extraMode === "absolute" && logoRect && extras.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const gap = logosGap;
            let cursorX = logoRect.x + logoRect.width + gap;
            const centerY = logoRect.y + logoRect.height / 2;
            extras.forEach((extra) => {
              const xPct = ((cursorX + extra.w / 2) / 1280) * 100;
              const yPct = (centerY / 720) * 100;
              onUpdateExtra(extra.id, { xPct, yPct });
              cursorX += extra.w + gap;
            });
          }}
        >
          <AlignEndHorizontal className="w-4 h-4 mr-1.5" aria-hidden="true" />
          Aligner à droite du logo
        </Button>
      )}

      {/* Liste des logos importés */}
      {extras.length > 0 && (
        <div className="flex flex-col gap-2">
          {extras.map((extra, idx) => (
            <ExtraLogoCard
              key={extra.id}
              extra={extra}
              extraMode={extraMode}
              isFirst={idx === 0}
              isLast={idx === extras.length - 1}
              onUpdate={(patch) => onUpdateExtra(extra.id, patch)}
              onRemove={() => onRemoveExtra(extra.id)}
              onMoveUp={() => onMoveExtra(extra.id, "up")}
              onMoveDown={() => onMoveExtra(extra.id, "down")}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        • En <b>rangée</b>, la largeur/hauteur définissent la "case" de chaque logo (le groupe
        complet est centré).
        <br />• En <b>absolu</b>, chaque logo utilise <b>x%</b> / <b>y%</b> (centré sur ce
        point). Les SVG sont mis à l'échelle (ratio conservé) pour tenir dans la case.
        <br />• Formats acceptés : SVG, PNG, JPG.
      </p>
    </div>
  );
}

