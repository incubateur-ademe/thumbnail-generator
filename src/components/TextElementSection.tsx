import type React from "react";
import type { DateElementState, TextElementState } from "@/hooks/useThumbnailState";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TextPrefix = "title" | "subtitle" | "date";

interface BaseProps {
  label: string;
  prefix: TextPrefix;
}

interface TextProps extends BaseProps {
  type?: "text";
  value: TextElementState;
  onChange: (patch: Partial<TextElementState>) => void;
}

interface DateProps extends BaseProps {
  type: "date";
  value: DateElementState;
  onChange: (patch: Partial<DateElementState>) => void;
}

type Props = TextProps | DateProps;

function isDateProps(props: Props): props is DateProps {
  return props.type === "date";
}

function handleNumberKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  e.currentTarget.step = e.shiftKey ? "1" : "0.1";
}

export function TextElementSection(props: Props) {
  const { label, prefix, value, onChange } = props;

  function centerX() {
    onChange({ xPct: 50 } as Partial<TextElementState & DateElementState>);
  }

  function centerY() {
    onChange({ yPct: 50 } as Partial<TextElementState & DateElementState>);
  }

  const showId = `${prefix}-show`;

  const textInput = isDateProps(props) ? (
    <div className="flex flex-col gap-1">
      <Label htmlFor={`${prefix}-date`}>Date</Label>
      <Input
        id={`${prefix}-date`}
        type="date"
        value={(value as DateElementState).dateStr}
        onChange={(e) => (onChange as DateProps["onChange"])({ dateStr: e.target.value })}
      />
    </div>
  ) : (
    <div className="flex flex-col gap-1">
      <Label htmlFor={`${prefix}-text`}>Texte</Label>
      <Input
        id={`${prefix}-text`}
        type="text"
        value={value.text}
        onChange={(e) => (onChange as TextProps["onChange"])({ text: e.target.value })}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <Checkbox
            id={showId}
            checked={value.show}
            onCheckedChange={(checked) =>
              onChange({ show: !!checked } as Partial<TextElementState>)
            }
          />
          <Label htmlFor={showId}>Afficher</Label>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        {textInput}
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${prefix}-size`}>Taille</Label>
          <Input
            id={`${prefix}-size`}
            className="w-20"
            type="number"
            value={value.size}
            onKeyDown={handleNumberKeyDown}
            onChange={(e) =>
              onChange({ size: Number(e.target.value) } as Partial<TextElementState>)
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${prefix}-color`}>Couleur</Label>
          <Input
            id={`${prefix}-color`}
            className="h-10 w-14 p-1 cursor-pointer"
            type="color"
            value={value.color}
            onChange={(e) =>
              onChange({ color: e.target.value } as Partial<TextElementState>)
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${prefix}-spacing`}>Espacement</Label>
          <Input
            id={`${prefix}-spacing`}
            className="w-20"
            type="number"
            value={value.spacing}
            step={0.1}
            onKeyDown={handleNumberKeyDown}
            onChange={(e) =>
              onChange({ spacing: Number(e.target.value) } as Partial<TextElementState>)
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${prefix}-x`}>X%</Label>
          <Input
            id={`${prefix}-x`}
            className="w-20"
            type="number"
            value={value.xPct}
            step={0.1}
            onKeyDown={handleNumberKeyDown}
            onChange={(e) =>
              onChange({ xPct: Number(e.target.value) } as Partial<TextElementState>)
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${prefix}-y`}>Y%</Label>
          <Input
            id={`${prefix}-y`}
            className="w-20"
            type="number"
            value={value.yPct}
            step={0.1}
            onKeyDown={handleNumberKeyDown}
            onChange={(e) =>
              onChange({ yPct: Number(e.target.value) } as Partial<TextElementState>)
            }
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={centerX}>
          Centrer X
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={centerY}>
          Centrer Y
        </Button>
      </div>
    </div>
  );
}
