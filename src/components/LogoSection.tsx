import type { ExtraLogoValues } from "@/data/presets";
import type { ExtraLogo, ThumbnailState } from "@/hooks/useThumbnailState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDown, ArrowUp, Trash2, Upload } from "lucide-react";
import { useRef } from "react";

interface Props {
  state: ThumbnailState;
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
      (f) => f.type === "image/svg+xml" || f.name.toLowerCase().endsWith(".svg"),
    );
    if (!files.length) return;

    const items = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        svgText: await file.text(),
        w: 120,
        h: 120,
        xPct: 50,
        yPct: 22,
      })),
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

      {/* Import SVG */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg"
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
          <Upload className="w-4 h-4 mr-2" />
          Importer des SVG
        </Button>
      </div>

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
      </p>
    </div>
  );
}

interface ExtraLogoCardProps {
  extra: ExtraLogo;
  extraMode: "row" | "absolute";
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (patch: Partial<Omit<ExtraLogo, "id">>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function ExtraLogoCard({
  extra,
  extraMode,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: ExtraLogoCardProps) {
  const id = extra.id;
  return (
    <Card>
      <CardContent className="pt-2 pb-2 flex flex-wrap gap-x-3 gap-y-2 items-end">
        {/* Nom du fichier */}
        <span
          className="text-sm font-medium self-end w-full truncate"
          title={extra.name}
        >
          {extra.name}
        </span>

        {/* Dimensions */}
        <div className="flex gap-2 items-end">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${id}-w`} className="text-xs">Larg.</Label>
            <Input
              id={`${id}-w`}
              className="w-16 h-7 text-xs"
              type="number"
              value={extra.w}
              step={1}
              onChange={(e) => onUpdate({ w: Math.max(1, Number(e.target.value) || 1) })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${id}-h`} className="text-xs">Haut.</Label>
            <Input
              id={`${id}-h`}
              className="w-16 h-7 text-xs"
              type="number"
              value={extra.h}
              step={1}
              onChange={(e) => onUpdate({ h: Math.max(1, Number(e.target.value) || 1) })}
            />
          </div>
        </div>

        {/* Position absolue */}
        {extraMode === "absolute" && (
          <div className="flex gap-2 items-end">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${id}-x`} className="text-xs">X%</Label>
              <Input
                id={`${id}-x`}
                className="w-16 h-7 text-xs"
                type="number"
                value={extra.xPct}
                step={0.1}
                onChange={(e) => onUpdate({ xPct: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${id}-y`} className="text-xs">Y%</Label>
              <Input
                id={`${id}-y`}
                className="w-16 h-7 text-xs"
                type="number"
                value={extra.yPct}
                step={0.1}
                onChange={(e) => onUpdate({ yPct: Number(e.target.value) })}
              />
            </div>
          </div>
        )}

        {/* Contrôles ordre + suppression */}
        <div className="flex gap-1 items-center ml-auto">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            disabled={isFirst}
            onClick={onMoveUp}
            title="Monter"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            disabled={isLast}
            onClick={onMoveDown}
            title="Descendre"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onRemove}
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
