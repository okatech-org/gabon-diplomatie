import type { CardElement, TextAlignment } from "@/lib/models/card-element";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Separator } from "@workspace/ui/components/separator";
import { Switch } from "@workspace/ui/components/switch";
import { Slider } from "@workspace/ui/components/slider";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  ArrowDown,
  ArrowUp,
  Bold,
  Copy,
  Italic,
  Trash2,
  AlignStartVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
} from "lucide-react";
import { useCallback } from "react";

interface PropertiesPanelProps {
  element: CardElement | null;
  onUpdateElement: (id: string, updates: Partial<CardElement>) => void;
  onDeleteElement: () => void;
  onDuplicateElement: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onAlignLeft: () => void;
  onAlignCenterH: () => void;
  onAlignRight: () => void;
  onAlignTop: () => void;
  onAlignMiddle: () => void;
  onAlignBottom: () => void;
}

export function PropertiesPanel({
  element,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onBringToFront,
  onSendToBack,
  onAlignLeft,
  onAlignCenterH,
  onAlignRight,
  onAlignTop,
  onAlignMiddle,
  onAlignBottom,
}: PropertiesPanelProps) {
  if (!element) {
    return (
      <div className="flex h-full w-72 flex-col items-center justify-center border-l bg-background p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Selectionnez un element pour modifier ses proprietes
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-72 flex-col overflow-y-auto border-l bg-background">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Proprietes</h3>
        <p className="text-xs text-muted-foreground capitalize">
          {element.type}
        </p>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Position & Size */}
        <PositionSection element={element} onUpdate={onUpdateElement} />

        <Separator />

        {/* Appearance (type-specific) */}
        <AppearanceSection element={element} onUpdate={onUpdateElement} />

        <Separator />

        {/* Dynamic field */}
        <DynamicFieldSection element={element} onUpdate={onUpdateElement} />

        <Separator />

        {/* Actions */}
        <ActionsSection
          onDelete={onDeleteElement}
          onDuplicate={onDuplicateElement}
          onBringToFront={onBringToFront}
          onSendToBack={onSendToBack}
          onAlignLeft={onAlignLeft}
          onAlignCenterH={onAlignCenterH}
          onAlignRight={onAlignRight}
          onAlignTop={onAlignTop}
          onAlignMiddle={onAlignMiddle}
          onAlignBottom={onAlignBottom}
        />
      </div>
    </div>
  );
}

// ---- Position & Size ----

function PositionSection({
  element,
  onUpdate,
}: {
  element: CardElement;
  onUpdate: (id: string, updates: Partial<CardElement>) => void;
}) {
  const update = useCallback(
    (field: keyof CardElement, value: number) => {
      onUpdate(element.id, { [field]: value });
    },
    [element.id, onUpdate],
  );

  return (
    <div>
      <h4 className="mb-2 text-xs font-medium text-muted-foreground uppercase">
        Position & Taille
      </h4>
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="X" value={element.x} onChange={(v) => update("x", v)} />
        <NumberField label="Y" value={element.y} onChange={(v) => update("y", v)} />
        <NumberField
          label="Largeur"
          value={element.width}
          onChange={(v) => update("width", v)}
          min={1}
        />
        <NumberField
          label="Hauteur"
          value={element.height}
          onChange={(v) => update("height", v)}
          min={1}
        />
      </div>
    </div>
  );
}

// ---- Appearance (type-specific) ----

function AppearanceSection({
  element,
  onUpdate,
}: {
  element: CardElement;
  onUpdate: (id: string, updates: Partial<CardElement>) => void;
}) {
  const update = useCallback(
    (updates: Partial<CardElement>) => {
      onUpdate(element.id, updates);
    },
    [element.id, onUpdate],
  );

  return (
    <div>
      <h4 className="mb-2 text-xs font-medium text-muted-foreground uppercase">
        Apparence
      </h4>

      {element.type === "text" && (
        <TextAppearance element={element} onUpdate={update} />
      )}
      {element.type === "image" && <ImageAppearance />}
      {(element.type === "rectangle" ||
        element.type === "circle" ||
        element.type === "line") && (
        <ShapeAppearance element={element} onUpdate={update} />
      )}
      {(element.type === "qrCode" || element.type === "barcode") && (
        <CodeAppearance element={element} onUpdate={update} />
      )}
    </div>
  );
}

function TextAppearance({
  element,
  onUpdate,
}: {
  element: CardElement;
  onUpdate: (updates: Partial<CardElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label className="mb-1 text-xs">Contenu</Label>
        <Textarea
          value={element.textContent}
          onChange={(e) => onUpdate({ textContent: e.target.value })}
          rows={3}
          className="text-sm"
        />
      </div>

      <div>
        <Label className="mb-1 text-xs">Taille de police</Label>
        <div className="flex items-center gap-2">
          <Slider
            value={[element.fontSize]}
            min={6}
            max={120}
            step={1}
            onValueChange={([v]) => onUpdate({ fontSize: v })}
            className="flex-1"
          />
          <Input
            type="number"
            value={element.fontSize}
            onChange={(e) =>
              onUpdate({ fontSize: Math.max(1, Number(e.target.value)) })
            }
            className="w-16 text-xs"
            min={1}
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant={element.isBold ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => onUpdate({ isBold: !element.isBold })}
        >
          <Bold className="size-3.5" />
        </Button>
        <Button
          variant={element.isItalic ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => onUpdate({ isItalic: !element.isItalic })}
        >
          <Italic className="size-3.5" />
        </Button>

        <div className="mx-1 h-5 w-px bg-border" />

        <Button
          variant={element.textAlignment === "left" ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => onUpdate({ textAlignment: "left" as TextAlignment })}
        >
          <AlignLeft className="size-3.5" />
        </Button>
        <Button
          variant={element.textAlignment === "center" ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => onUpdate({ textAlignment: "center" as TextAlignment })}
        >
          <AlignCenter className="size-3.5" />
        </Button>
        <Button
          variant={element.textAlignment === "right" ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => onUpdate({ textAlignment: "right" as TextAlignment })}
        >
          <AlignRight className="size-3.5" />
        </Button>
      </div>

      <div>
        <Label className="mb-1 text-xs">Couleur du texte</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={element.textColor}
            onChange={(e) => onUpdate({ textColor: e.target.value })}
            className="h-8 w-8 cursor-pointer rounded border border-input"
          />
          <Input
            value={element.textColor}
            onChange={(e) => onUpdate({ textColor: e.target.value })}
            className="flex-1 text-xs"
          />
        </div>
      </div>
    </div>
  );
}

function ImageAppearance() {
  return (
    <div className="flex flex-col gap-3">
      <Button variant="outline" size="sm" className="w-full">
        Choisir image
      </Button>
      <p className="text-xs text-muted-foreground">
        Formats supportes: PNG, JPG, SVG
      </p>
    </div>
  );
}

function ShapeAppearance({
  element,
  onUpdate,
}: {
  element: CardElement;
  onUpdate: (updates: Partial<CardElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {element.type !== "line" && (
        <div>
          <Label className="mb-1 text-xs">Couleur de remplissage</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={element.fillColor}
              onChange={(e) => onUpdate({ fillColor: e.target.value })}
              className="h-8 w-8 cursor-pointer rounded border border-input"
            />
            <Input
              value={element.fillColor}
              onChange={(e) => onUpdate({ fillColor: e.target.value })}
              className="flex-1 text-xs"
            />
          </div>
        </div>
      )}

      <div>
        <Label className="mb-1 text-xs">Couleur du contour</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={element.strokeColor}
            onChange={(e) => onUpdate({ strokeColor: e.target.value })}
            className="h-8 w-8 cursor-pointer rounded border border-input"
          />
          <Input
            value={element.strokeColor}
            onChange={(e) => onUpdate({ strokeColor: e.target.value })}
            className="flex-1 text-xs"
          />
        </div>
      </div>

      <div>
        <Label className="mb-1 text-xs">Epaisseur du contour</Label>
        <div className="flex items-center gap-2">
          <Slider
            value={[element.strokeWidth]}
            min={0}
            max={20}
            step={1}
            onValueChange={([v]) => onUpdate({ strokeWidth: v })}
            className="flex-1"
          />
          <Input
            type="number"
            value={element.strokeWidth}
            onChange={(e) =>
              onUpdate({ strokeWidth: Math.max(0, Number(e.target.value)) })
            }
            className="w-16 text-xs"
            min={0}
          />
        </div>
      </div>

      {element.type === "rectangle" && (
        <div>
          <Label className="mb-1 text-xs">Arrondi des coins</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[element.cornerRadius]}
              min={0}
              max={100}
              step={1}
              onValueChange={([v]) => onUpdate({ cornerRadius: v })}
              className="flex-1"
            />
            <Input
              type="number"
              value={element.cornerRadius}
              onChange={(e) =>
                onUpdate({
                  cornerRadius: Math.max(0, Number(e.target.value)),
                })
              }
              className="w-16 text-xs"
              min={0}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CodeAppearance({
  element,
  onUpdate,
}: {
  element: CardElement;
  onUpdate: (updates: Partial<CardElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label className="mb-1 text-xs">Contenu</Label>
        <Input
          value={element.codeContent}
          onChange={(e) => onUpdate({ codeContent: e.target.value })}
          placeholder={
            element.type === "qrCode"
              ? "https://example.com"
              : "123456789"
          }
          className="text-xs"
        />
      </div>
    </div>
  );
}

// ---- Dynamic Field ----

function DynamicFieldSection({
  element,
  onUpdate,
}: {
  element: CardElement;
  onUpdate: (id: string, updates: Partial<CardElement>) => void;
}) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-medium text-muted-foreground uppercase">
        Champ dynamique
      </h4>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Champ dynamique</Label>
          <Switch
            checked={element.isDynamicField}
            onCheckedChange={(checked) =>
              onUpdate(element.id, { isDynamicField: !!checked })
            }
            size="sm"
          />
        </div>

        {element.isDynamicField && (
          <div>
            <Label className="mb-1 text-xs">Cle du champ</Label>
            <Input
              value={element.fieldKey}
              onChange={(e) =>
                onUpdate(element.id, { fieldKey: e.target.value })
              }
              placeholder="nom, prenom, photo..."
              className="text-xs"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Actions ----

function ActionsSection({
  onDelete,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onAlignLeft,
  onAlignCenterH,
  onAlignRight,
  onAlignTop,
  onAlignMiddle,
  onAlignBottom,
}: {
  onDelete: () => void;
  onDuplicate: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onAlignLeft: () => void;
  onAlignCenterH: () => void;
  onAlignRight: () => void;
  onAlignTop: () => void;
  onAlignMiddle: () => void;
  onAlignBottom: () => void;
}) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-medium text-muted-foreground uppercase">
        Actions
      </h4>

      <div className="flex flex-col gap-2">
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onDuplicate}
          >
            <Copy className="size-3.5" />
            <span className="ml-1">Dupliquer</span>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
            <span className="ml-1">Supprimer</span>
          </Button>
        </div>

        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onBringToFront}
          >
            <ArrowUp className="size-3.5" />
            <span className="ml-1">Devant</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onSendToBack}
          >
            <ArrowDown className="size-3.5" />
            <span className="ml-1">Derriere</span>
          </Button>
        </div>

        <Separator className="my-1" />

        <Label className="text-xs text-muted-foreground">Alignement</Label>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onAlignLeft}
            title="Aligner a gauche"
          >
            <AlignStartVertical className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onAlignCenterH}
            title="Centrer horizontalement"
          >
            <AlignHorizontalDistributeCenter className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onAlignRight}
            title="Aligner a droite"
          >
            <AlignEndVertical className="size-3.5" />
          </Button>

          <div className="mx-0.5 h-6 w-px bg-border" />

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onAlignTop}
            title="Aligner en haut"
          >
            <AlignStartHorizontal className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onAlignMiddle}
            title="Centrer verticalement"
          >
            <AlignVerticalDistributeCenter className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onAlignBottom}
            title="Aligner en bas"
          >
            <AlignEndHorizontal className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- Helpers ----

function NumberField({
  label,
  value,
  onChange,
  min,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
}) {
  return (
    <div>
      <Label className="mb-0.5 text-[10px] text-muted-foreground">
        {label}
      </Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          onChange(min !== undefined ? Math.max(min, v) : v);
        }}
        className="h-7 text-xs"
        min={min}
      />
    </div>
  );
}
