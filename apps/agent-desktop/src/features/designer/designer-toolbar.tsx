import type { ElementType } from "@/lib/models/card-element";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import {
  BarChart2,
  Circle,
  FlipHorizontal,
  Grid3x3,
  Minus,
  QrCode,
  Redo2,
  Square,
  Type,
  Undo2,
  Image,
  PlusCircle,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

interface DesignerToolbarProps {
  onAddElement: (type: ElementType) => void;
  isEditingBack: boolean;
  onToggleSide: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  templateName: string;
}

const ELEMENT_TYPES: {
  type: ElementType;
  label: string;
  icon: React.ReactNode;
}[] = [
  { type: "text", label: "Texte", icon: <Type className="size-4" /> },
  { type: "image", label: "Image", icon: <Image className="size-4" /> },
  { type: "qrCode", label: "QR Code", icon: <QrCode className="size-4" /> },
  {
    type: "barcode",
    label: "Code-barres",
    icon: <BarChart2 className="size-4" />,
  },
  {
    type: "rectangle",
    label: "Rectangle",
    icon: <Square className="size-4" />,
  },
  { type: "circle", label: "Cercle", icon: <Circle className="size-4" /> },
  { type: "line", label: "Ligne", icon: <Minus className="size-4" /> },
];

export function DesignerToolbar({
  onAddElement,
  isEditingBack,
  onToggleSide,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  showGrid,
  onToggleGrid,
  templateName,
}: DesignerToolbarProps) {
  return (
    <TooltipProvider>
      <div className="flex h-12 items-center justify-between border-b bg-background px-3">
        {/* Left: Add element */}
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <PlusCircle className="size-4" />
                    <span className="ml-1.5">Ajouter</span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Ajouter un element
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              {ELEMENT_TYPES.map(({ type, label, icon }) => (
                <DropdownMenuItem
                  key={type}
                  onSelect={() => onAddElement(type)}
                >
                  {icon}
                  <span className="ml-2">{label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Center: Template name + side toggle */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            {templateName}
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onToggleSide}>
                <FlipHorizontal className="size-4" />
                <span className="ml-1.5">
                  {isEditingBack ? "Verso" : "Recto"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Basculer recto/verso
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Right: Grid, zoom, undo/redo */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showGrid ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={onToggleGrid}
              >
                <Grid3x3 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Grille</TooltipContent>
          </Tooltip>

          <div className="mx-1 h-5 w-px bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onZoomOut}
              >
                <ZoomOut className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Zoom -</TooltipContent>
          </Tooltip>

          <Button
            variant="ghost"
            size="sm"
            className="min-w-[3.5rem] text-xs tabular-nums"
            onClick={onResetZoom}
          >
            {Math.round(zoom * 100)}%
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onZoomIn}
              >
                <ZoomIn className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Zoom +</TooltipContent>
          </Tooltip>

          <div className="mx-1 h-5 w-px bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Annuler (Cmd+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onRedo}
                disabled={!canRedo}
              >
                <Redo2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Refaire (Cmd+Shift+Z)
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
