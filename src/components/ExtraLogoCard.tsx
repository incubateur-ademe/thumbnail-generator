import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

export interface ExtraLogoBase {
  id: string;
  name: string;
  w: number;
  h: number;
  xPct: number;
  yPct: number;
}

interface Props<T extends ExtraLogoBase> {
  extra: T;
  extraMode: "row" | "absolute";
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (patch: Partial<Omit<T, "id">>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function ExtraLogoCard<T extends ExtraLogoBase>({
  extra,
  extraMode,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: Props<T>) {
  const id = extra.id;
  return (
    <Card>
      <CardContent className="pt-2 pb-2 flex flex-wrap gap-x-3 gap-y-2 items-end">
        <span
          className="text-sm font-medium self-end w-full truncate"
          title={extra.name}
        >
          {extra.name}
        </span>

        <div className="flex gap-2 items-end">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${id}-w`} className="text-xs">
              Larg.
            </Label>
            <Input
              id={`${id}-w`}
              className="w-16 h-7 text-xs"
              type="number"
              value={extra.w}
              step={1}
              onChange={(e) =>
                onUpdate({
                  w: Math.max(1, Number(e.target.value) || 1),
                } as Partial<Omit<T, "id">>)
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${id}-h`} className="text-xs">
              Haut.
            </Label>
            <Input
              id={`${id}-h`}
              className="w-16 h-7 text-xs"
              type="number"
              value={extra.h}
              step={1}
              onChange={(e) =>
                onUpdate({
                  h: Math.max(1, Number(e.target.value) || 1),
                } as Partial<Omit<T, "id">>)
              }
            />
          </div>
        </div>

        {extraMode === "absolute" && (
          <div className="flex gap-2 items-end">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${id}-x`} className="text-xs">
                X%
              </Label>
              <Input
                id={`${id}-x`}
                className="w-16 h-7 text-xs"
                type="number"
                value={extra.xPct}
                step={0.1}
                onChange={(e) =>
                  onUpdate({
                    xPct: Number(e.target.value),
                  } as Partial<Omit<T, "id">>)
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${id}-y`} className="text-xs">
                Y%
              </Label>
              <Input
                id={`${id}-y`}
                className="w-16 h-7 text-xs"
                type="number"
                value={extra.yPct}
                step={0.1}
                onChange={(e) =>
                  onUpdate({
                    yPct: Number(e.target.value),
                  } as Partial<Omit<T, "id">>)
                }
              />
            </div>
          </div>
        )}

        <div className="flex gap-1 items-center ml-auto">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            disabled={isFirst}
            onClick={onMoveUp}
            aria-label="Monter"
          >
            <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            disabled={isLast}
            onClick={onMoveDown}
            aria-label="Descendre"
          >
            <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onRemove}
            aria-label="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
