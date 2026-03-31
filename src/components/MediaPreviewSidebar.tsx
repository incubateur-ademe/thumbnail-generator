import type { ExtraLogoValues } from "@/data/presets";
import type {
  Align,
  ExtraLogo,
  LogoRect,
  MediaPreviewState,
} from "@/hooks/useMediaPreviewState";
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
import {
  AlignEndHorizontal,
  ArrowLeftRight,
  RotateCcw,
  Upload,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  EmojiPicker as EmojiPickerPrimitive,
} from "frimousse";
import { useRef, useState } from "react";

interface Props {
  state: MediaPreviewState;
  logoRect: LogoRect | null;
  onPatch: (patch: Partial<MediaPreviewState>) => void;
  onReset: () => void;
  onAddExtras: (items: ExtraLogoValues[]) => void;
  onUpdateExtra: (id: string, patch: Partial<Omit<ExtraLogo, "id">>) => void;
  onRemoveExtra: (id: string) => void;
  onMoveExtra: (id: string, direction: "up" | "down") => void;
}

function AlignSelect({
  value,
  onChange,
  id,
}: {
  value: Align;
  onChange: (v: Align) => void;
  id: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Align)}>
      <SelectTrigger id={id} className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="left">Gauche</SelectItem>
        <SelectItem value="center">Centre</SelectItem>
        <SelectItem value="right">Droite</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function MediaPreviewSidebar({
  state,
  logoRect,
  onPatch,
  onReset,
  onAddExtras,
  onUpdateExtra,
  onRemoveExtra,
  onMoveExtra,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconFileRef = useRef<HTMLInputElement>(null);

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
              // Raster image → data URL so it can be rendered as <image> in SVG
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
        return {
          name: file.name,
          svgText,
          w: 60,
          h: 60,
          xPct: 50,
          yPct: 50,
        };
      }),
    );
    onAddExtras(items);
    e.target.value = "";
  }

  function handleIconImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Normalise any image (including SVGs) to a raster data URL at a
    // controlled size so the SVG <image> element never inherits an
    // unbounded intrinsic size from the source file.
    const MAX_ICON_PX = 256;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_ICON_PX / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL("image/png");
      onPatch({ iconImageData: dataUrl, iconType: "image" });
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Reset */}
      <Button variant="outline" size="sm" onClick={onReset}>
        <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
        Réinitialiser
      </Button>

      {/* ── Fond ── */}
      <section className="flex flex-col gap-3">
        <span className="font-medium">Fond</span>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Checkbox
              id="mp-bg-primary"
              checked={state.showBgPrimary}
              onCheckedChange={(c) => onPatch({ showBgPrimary: !!c })}
            />
            <Label htmlFor="mp-bg-primary">Primaire</Label>
            <Input
              aria-label="Couleur primaire"
              className="h-8 w-12 p-1 cursor-pointer"
              type="color"
              value={state.bgPrimaryColor}
              onChange={(e) => onPatch({ bgPrimaryColor: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="mp-bg-secondary"
              checked={state.showBgSecondary}
              onCheckedChange={(c) => onPatch({ showBgSecondary: !!c })}
            />
            <Label htmlFor="mp-bg-secondary">Secondaire</Label>
            <Input
              aria-label="Couleur secondaire"
              className="h-8 w-12 p-1 cursor-pointer"
              type="color"
              value={state.bgSecondaryColor}
              onChange={(e) => onPatch({ bgSecondaryColor: e.target.value })}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onPatch({
                bgPrimaryColor: state.bgSecondaryColor,
                bgSecondaryColor: state.bgPrimaryColor,
              })
            }
            title="Inverser les couleurs primaire / secondaire"
          >
            <ArrowLeftRight className="w-4 h-4 mr-1.5" aria-hidden="true" />
            Inverser
          </Button>
        </div>

      </section>

      <hr className="border-border" />

      {/* ── Logo ADEME ── (merged with extras below) */}

      {/* ── Icône ── */}
      <section className="flex flex-col gap-3">
        <span className="font-medium">Icône</span>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Checkbox
              id="mp-icon-show"
              checked={state.showIcon}
              onCheckedChange={(c) => onPatch({ showIcon: !!c })}
            />
            <Label htmlFor="mp-icon-show">Afficher</Label>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="mp-icon-type">Type</Label>
            <Select
              value={state.iconType}
              onValueChange={(v) =>
                onPatch({ iconType: v as "emoji" | "image" })
              }
            >
              <SelectTrigger id="mp-icon-type" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emoji">Emoji</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="mp-icon-size">Taille</Label>
            <Input
              id="mp-icon-size"
              className="w-20"
              type="number"
              value={state.iconSize}
              step={1}
              min={8}
              onChange={(e) =>
                onPatch({ iconSize: Math.max(8, Number(e.target.value) || 8) })
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="mp-icon-align">Alignement</Label>
            <AlignSelect
              id="mp-icon-align"
              value={state.iconAlign}
              onChange={(v) => onPatch({ iconAlign: v })}
            />
          </div>
        </div>

        {state.iconType === "emoji" && (
          <EmojiPickerField
            value={state.iconEmoji}
            onChange={(emoji) => onPatch({ iconEmoji: emoji })}
          />
        )}

        {state.iconType === "image" && (
          <div>
            <input
              ref={iconFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleIconImagePick}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => iconFileRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
              Charger une image
            </Button>
            {state.iconImageData && (
              <span className="ml-2 text-xs text-muted-foreground">
                Image chargée
              </span>
            )}
          </div>
        )}
      </section>

      <hr className="border-border" />

      {/* ── Titre ── */}
      <section className="flex flex-col gap-3">
        <span className="font-medium">Titre</span>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <Label htmlFor="mp-title">Texte</Label>
            <Input
              id="mp-title"
              value={state.title}
              onChange={(e) => onPatch({ title: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="mp-title-color">Couleur</Label>
            <Input
              id="mp-title-color"
              className="h-10 w-14 p-1 cursor-pointer"
              type="color"
              value={state.titleColor}
              onChange={(e) => onPatch({ titleColor: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="mp-title-align">Alignement</Label>
            <AlignSelect
              id="mp-title-align"
              value={state.titleAlign}
              onChange={(v) => onPatch({ titleAlign: v })}
            />
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* ── Sous-titre ── */}
      <section className="flex flex-col gap-3">
        <span className="font-medium">Sous-titre</span>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex items-center gap-2 self-center">
            <Checkbox
              id="mp-sub-show"
              checked={state.showSubtitle}
              onCheckedChange={(c) => onPatch({ showSubtitle: !!c })}
            />
            <Label htmlFor="mp-sub-show">Afficher</Label>
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <Label htmlFor="mp-subtitle">Texte</Label>
            <Input
              id="mp-subtitle"
              value={state.subtitle}
              onChange={(e) => onPatch({ subtitle: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="mp-sub-color">Couleur</Label>
            <Input
              id="mp-sub-color"
              className="h-10 w-14 p-1 cursor-pointer"
              type="color"
              value={state.subtitleColor}
              onChange={(e) => onPatch({ subtitleColor: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="mp-sub-align">Alignement</Label>
            <AlignSelect
              id="mp-sub-align"
              value={state.subtitleAlign}
              onChange={(v) => onPatch({ subtitleAlign: v })}
            />
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* ── Logos ── */}
      <section className="flex flex-col gap-3">
        <span className="font-medium">Logos</span>

        {/* Main logo — RF/ADEME + play + tagline */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Checkbox
              id="mp-logo-show"
              checked={state.showLogo}
              onCheckedChange={(c) => onPatch({ showLogo: !!c })}
            />
            <Label htmlFor="mp-logo-show">RF / ADEME</Label>
          </div>
          <div className="flex items-center gap-2 border rounded-md px-2 py-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="mp-logo-play"
                checked={state.showLogoPlay}
                onCheckedChange={(c) => {
                  const show = !!c;
                  onPatch(
                    show
                      ? { showLogoPlay: true }
                      : { showLogoPlay: false, showLogoTagline: false },
                  );
                }}
              />
              <Label htmlFor="mp-logo-play">Play</Label>
            </div>
            <div className="flex items-center gap-2 pl-2 border-l">
              <Checkbox
                id="mp-logo-tagline"
                checked={state.showLogoTagline}
                disabled={!state.showLogoPlay}
                onCheckedChange={(c) => onPatch({ showLogoTagline: !!c })}
              />
              <Label
                htmlFor="mp-logo-tagline"
                className={state.showLogoPlay ? "" : "text-muted-foreground"}
              >
                Texte incubateur
              </Label>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="mp-logo-align">Alignement</Label>
            <AlignSelect
              id="mp-logo-align"
              value={state.logoAlign}
              onChange={(v) => onPatch({ logoAlign: v })}
            />
          </div>
        </div>

        {/* Logos supplémentaires */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex flex-col gap-1">
            <Label htmlFor="mp-extra-mode">Mode</Label>
            <Select
              value={state.extraMode}
              onValueChange={(v) =>
                onPatch({ extraMode: v as "row" | "absolute" })
              }
            >
              <SelectTrigger id="mp-extra-mode" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="row">Centré en rangée</SelectItem>
                <SelectItem value="absolute">Position absolue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {state.extraMode === "row" && (
            <div className="flex flex-col gap-1">
              <Label htmlFor="mp-logos-gap">Écart (px)</Label>
              <Input
                id="mp-logos-gap"
                className="w-20"
                type="number"
                value={state.logosGap}
                step={1}
                onChange={(e) =>
                  onPatch({ logosGap: Number(e.target.value) })
                }
              />
            </div>
          )}
        </div>

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
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
            Importer SVG / images
          </Button>
        </div>

        {state.extraMode === "absolute" &&
          logoRect &&
          state.extras.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Position all extras to the right of the main logo, stacked
                const gap = state.logosGap;
                let cursorX = logoRect.x + logoRect.width + gap;
                const centerY = logoRect.y + logoRect.height / 2;
                state.extras.forEach((extra) => {
                  const xPct = ((cursorX + extra.w / 2) / 512) * 100;
                  const yPct = (centerY / 269) * 100;
                  onUpdateExtra(extra.id, { xPct, yPct });
                  cursorX += extra.w + gap;
                });
              }}
            >
              <AlignEndHorizontal className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Aligner à droite du logo
            </Button>
          )}

        {state.extras.length > 0 && (
          <div className="flex flex-col gap-2">
            {state.extras.map((extra, idx) => (
              <ExtraLogoCard
                key={extra.id}
                extra={extra}
                extraMode={state.extraMode}
                isFirst={idx === 0}
                isLast={idx === state.extras.length - 1}
                onUpdate={(p) => onUpdateExtra(extra.id, p)}
                onRemove={() => onRemoveExtra(extra.id)}
                onMoveUp={() => onMoveExtra(extra.id, "up")}
                onMoveDown={() => onMoveExtra(extra.id, "down")}
              />
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          • En <b>rangée</b>, la largeur/hauteur définissent la "case" de chaque
          logo (le groupe complet est centré).
          <br />• En <b>absolu</b>, chaque logo utilise <b>x%</b> / <b>y%</b>{" "}
          (centré sur ce point). Les SVG sont mis à l'échelle (ratio conservé)
          pour tenir dans la case.
          <br />• Formats acceptés : SVG, PNG, JPG.
        </p>
      </section>
    </div>
  );
}

function EmojiPickerField({
  value,
  onChange,
}: {
  value: string;
  onChange: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Label>Emoji</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="text-lg px-3">
            {value || "😀"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-fit p-0" align="start">
          <EmojiPickerPrimitive.Root
            className="isolate flex h-85.5 w-fit flex-col bg-popover"
            onEmojiSelect={({ emoji }) => {
              onChange(emoji);
              setOpen(false);
            }}
          >
            <EmojiPickerPrimitive.Search
              className="mx-2 mt-2 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
              placeholder="Rechercher un emoji…"
              autoFocus
            />
            <EmojiPickerPrimitive.Viewport className="relative flex-1 outline-none">
              <EmojiPickerPrimitive.Loading className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                Chargement…
              </EmojiPickerPrimitive.Loading>
              <EmojiPickerPrimitive.Empty className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                Aucun emoji trouvé
              </EmojiPickerPrimitive.Empty>
              <EmojiPickerPrimitive.List
                className="select-none pb-3"
                components={{
                  CategoryHeader: ({ category, ...props }) => (
                    <div
                      className="bg-popover px-3 pb-1.5 pt-3 text-xs font-medium text-muted-foreground"
                      {...props}
                    >
                      {category.label}
                    </div>
                  ),
                  Row: ({ children, ...props }) => (
                    <div className="scroll-my-1 px-3" {...props}>
                      {children}
                    </div>
                  ),
                  Emoji: ({ emoji, ...props }) => (
                    <button
                      className="flex size-8 items-center justify-center rounded-md text-lg data-active:bg-accent"
                      {...props}
                    >
                      {emoji.emoji}
                    </button>
                  ),
                }}
              />
            </EmojiPickerPrimitive.Viewport>
          </EmojiPickerPrimitive.Root>
        </PopoverContent>
      </Popover>
    </div>
  );
}
