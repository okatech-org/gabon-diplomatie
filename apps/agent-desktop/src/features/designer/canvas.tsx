import { useCallback, useRef, useState } from "react";
import type {
  CardElement,
  ResizeHandle,
  SmartGuide,
} from "@/lib/models/card-element";
import { CARD_CONSTANTS } from "@/lib/models/card-element";
import { ElementRenderer } from "./element-renderer";

interface CanvasProps {
  elements: CardElement[];
  selectedElementId: string | null;
  zoom: number;
  showGrid: boolean;
  activeGuides: SmartGuide[];
  backgroundColor: string;
  backgroundImage: string | null;
  backgroundOpacity: number;
  onSelectElement: (id: string | null) => void;
  onMoveElement: (
    id: string,
    x: number,
    y: number,
    isDragEnd: boolean,
  ) => void;
  onResizeElement: (
    id: string,
    width: number,
    height: number,
    handle: ResizeHandle,
  ) => void;
  onSaveUndoState: () => void;
}

const HANDLE_SIZE = 8;

const RESIZE_HANDLES: {
  handle: ResizeHandle;
  style: React.CSSProperties;
  cursor: string;
}[] = [
  {
    handle: "topLeft",
    style: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 },
    cursor: "nwse-resize",
  },
  {
    handle: "topRight",
    style: { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 },
    cursor: "nesw-resize",
  },
  {
    handle: "bottomLeft",
    style: { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 },
    cursor: "nesw-resize",
  },
  {
    handle: "bottomRight",
    style: { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 },
    cursor: "nwse-resize",
  },
];

export function Canvas({
  elements,
  selectedElementId,
  zoom,
  showGrid,
  activeGuides,
  backgroundColor,
  backgroundImage,
  backgroundOpacity,
  onSelectElement,
  onMoveElement,
  onResizeElement,
  onSaveUndoState,
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    type: "move" | "resize";
    elementId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    handle?: ResizeHandle;
    hasMoved: boolean;
  } | null>(null);

  const [, forceUpdate] = useState(0);

  const getCanvasPoint = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left) / zoom,
        y: (clientY - rect.top) / zoom,
      };
    },
    [zoom],
  );

  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Click on the canvas background deselects
      if (e.target === canvasRef.current) {
        onSelectElement(null);
      }
    },
    [onSelectElement],
  );

  const handleElementPointerDown = useCallback(
    (e: React.PointerEvent, element: CardElement) => {
      e.stopPropagation();
      e.preventDefault();

      if (element.isLocked) {
        onSelectElement(element.id);
        return;
      }

      onSelectElement(element.id);
      onSaveUndoState();

      const point = getCanvasPoint(e.clientX, e.clientY);
      dragState.current = {
        type: "move",
        elementId: element.id,
        startX: point.x,
        startY: point.y,
        origX: element.x,
        origY: element.y,
        origW: element.width,
        origH: element.height,
        hasMoved: false,
      };

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [getCanvasPoint, onSelectElement, onSaveUndoState],
  );

  const handleElementPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const state = dragState.current;
      if (!state) return;

      const point = getCanvasPoint(e.clientX, e.clientY);
      state.hasMoved = true;

      if (state.type === "move") {
        const dx = point.x - state.startX;
        const dy = point.y - state.startY;
        const newX = Math.round(state.origX + dx);
        const newY = Math.round(state.origY + dy);
        onMoveElement(state.elementId, newX, newY, false);
      } else if (state.type === "resize" && state.handle) {
        const dx = point.x - state.startX;
        const dy = point.y - state.startY;
        let newW = state.origW;
        let newH = state.origH;

        if (state.handle === "topLeft") {
          newW = Math.max(10, state.origW - dx);
          newH = Math.max(10, state.origH - dy);
        } else if (state.handle === "topRight") {
          newW = Math.max(10, state.origW + dx);
          newH = Math.max(10, state.origH - dy);
        } else if (state.handle === "bottomLeft") {
          newW = Math.max(10, state.origW - dx);
          newH = Math.max(10, state.origH + dy);
        } else if (state.handle === "bottomRight") {
          newW = Math.max(10, state.origW + dx);
          newH = Math.max(10, state.origH + dy);
        }

        onResizeElement(
          state.elementId,
          Math.round(newW),
          Math.round(newH),
          state.handle,
        );
      }

      forceUpdate((c) => c + 1);
    },
    [getCanvasPoint, onMoveElement, onResizeElement],
  );

  const handleElementPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const state = dragState.current;
      if (!state) return;

      if (state.type === "move" && state.hasMoved) {
        const point = getCanvasPoint(e.clientX, e.clientY);
        const dx = point.x - state.startX;
        const dy = point.y - state.startY;
        const newX = Math.round(state.origX + dx);
        const newY = Math.round(state.origY + dy);
        onMoveElement(state.elementId, newX, newY, true);
      }

      dragState.current = null;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    },
    [getCanvasPoint, onMoveElement],
  );

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent, element: CardElement, handle: ResizeHandle) => {
      e.stopPropagation();
      e.preventDefault();

      onSaveUndoState();

      const point = getCanvasPoint(e.clientX, e.clientY);
      dragState.current = {
        type: "resize",
        elementId: element.id,
        startX: point.x,
        startY: point.y,
        origX: element.x,
        origY: element.y,
        origW: element.width,
        origH: element.height,
        handle,
        hasMoved: false,
      };

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [getCanvasPoint, onSaveUndoState],
  );

  const sortedElements = [...elements]
    .filter((el) => el.isVisible)
    .sort((a, b) => a.zIndex - b.zIndex);

  const gridStyle: React.CSSProperties = showGrid
    ? {
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 9px, rgba(0,0,0,0.06) 9px, rgba(0,0,0,0.06) 10px),
          repeating-linear-gradient(90deg, transparent, transparent 9px, rgba(0,0,0,0.06) 9px, rgba(0,0,0,0.06) 10px)
        `,
        backgroundSize: "10px 10px",
      }
    : {};

  return (
    <div className="flex flex-1 items-center justify-center overflow-auto bg-muted/30 p-8">
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
        }}
      >
        <div
          ref={canvasRef}
          className="relative shadow-lg"
          style={{
            width: CARD_CONSTANTS.width,
            height: CARD_CONSTANTS.height,
            backgroundColor,
            ...gridStyle,
            overflow: "hidden",
          }}
          onPointerDown={handleCanvasPointerDown}
        >
          {/* Background image */}
          {backgroundImage && (
            <img
              src={backgroundImage}
              alt=""
              draggable={false}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: backgroundOpacity,
                pointerEvents: "none",
              }}
            />
          )}

          {/* Smart guides */}
          {activeGuides.map((guide, i) =>
            guide.type === "horizontal" ? (
              <div
                key={`guide-${i}`}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: guide.position,
                  height: 1,
                  backgroundColor: "magenta",
                  pointerEvents: "none",
                  zIndex: 9999,
                }}
              />
            ) : (
              <div
                key={`guide-${i}`}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: guide.position,
                  width: 1,
                  backgroundColor: "magenta",
                  pointerEvents: "none",
                  zIndex: 9999,
                }}
              />
            ),
          )}

          {/* Elements */}
          {sortedElements.map((element) => {
            const isSelected = element.id === selectedElementId;
            return (
              <div
                key={element.id}
                style={{
                  position: "absolute",
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                  zIndex: element.zIndex,
                  transform: element.rotation
                    ? `rotate(${element.rotation}deg)`
                    : undefined,
                  cursor: element.isLocked ? "default" : "move",
                  outline: isSelected
                    ? "2px solid #3b82f6"
                    : "1px solid transparent",
                  outlineOffset: -1,
                }}
                onPointerDown={(e) => handleElementPointerDown(e, element)}
                onPointerMove={handleElementPointerMove}
                onPointerUp={handleElementPointerUp}
              >
                <ElementRenderer element={element} isSelected={isSelected} />

                {/* Resize handles */}
                {isSelected &&
                  !element.isLocked &&
                  RESIZE_HANDLES.map(({ handle, style, cursor }) => (
                    <div
                      key={handle}
                      style={{
                        position: "absolute",
                        width: HANDLE_SIZE,
                        height: HANDLE_SIZE,
                        borderRadius: "50%",
                        backgroundColor: "#3b82f6",
                        border: "2px solid #fff",
                        cursor,
                        zIndex: 10,
                        boxShadow: "0 0 2px rgba(0,0,0,0.3)",
                        ...style,
                      }}
                      onPointerDown={(e) =>
                        handleResizePointerDown(e, element, handle)
                      }
                      onPointerMove={handleElementPointerMove}
                      onPointerUp={handleElementPointerUp}
                    />
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
