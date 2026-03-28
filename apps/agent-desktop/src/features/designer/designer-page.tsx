import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CardElement,
  CardTemplate,
  ElementType,
  ResizeHandle,
  SmartGuide,
} from "@/lib/models/card-element";
import {
  CARD_CONSTANTS,
  createDefaultElement,
} from "@/lib/models/card-element";
import { Canvas } from "./canvas";
import { DesignerToolbar } from "./designer-toolbar";
import { PropertiesPanel } from "./properties-panel";

interface DesignerPageProps {
  template: CardTemplate;
  onTemplateChange?: (template: CardTemplate) => void;
}

interface DesignerState {
  template: CardTemplate;
  selectedElementId: string | null;
  isEditingBack: boolean;
  zoom: number;
  showGrid: boolean;
  clipboard: CardElement | null;
}

const MAX_UNDO = 50;

export function DesignerPage({ template: initialTemplate, onTemplateChange }: DesignerPageProps) {
  const [state, setState] = useState<DesignerState>({
    template: initialTemplate,
    selectedElementId: null,
    isEditingBack: false,
    zoom: CARD_CONSTANTS.defaultScale,
    showGrid: true,
    clipboard: null,
  });

  const undoStack = useRef<CardTemplate[]>([]);
  const redoStack = useRef<CardTemplate[]>([]);
  const [, setUndoRedoVersion] = useState(0);

  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;

  const currentElements = state.isEditingBack
    ? state.template.backElements
    : state.template.frontElements;

  const selectedElement = useMemo(
    () => currentElements.find((el) => el.id === state.selectedElementId) ?? null,
    [currentElements, state.selectedElementId],
  );

  const backgroundImage = state.isEditingBack
    ? state.template.backBackgroundImage
    : state.template.frontBackgroundImage;

  // Notify parent of template changes (for auto-save)
  const onTemplateChangeRef = useRef(onTemplateChange);
  onTemplateChangeRef.current = onTemplateChange;

  const prevTemplateJsonRef = useRef<string>("");
  useEffect(() => {
    const json = JSON.stringify(state.template);
    if (json !== prevTemplateJsonRef.current) {
      prevTemplateJsonRef.current = json;
      onTemplateChangeRef.current?.(state.template);
    }
  }, [state.template]);

  // Active smart guides (computed from element positions during drag)
  const [activeGuides, setActiveGuides] = useState<SmartGuide[]>([]);

  // ---- Template mutation helpers ----

  const updateElements = useCallback(
    (updater: (elements: CardElement[]) => CardElement[]) => {
      setState((prev) => {
        const key = prev.isEditingBack ? "backElements" : "frontElements";
        return {
          ...prev,
          template: {
            ...prev.template,
            [key]: updater(prev.template[key]),
            updatedAt: new Date().toISOString(),
          },
        };
      });
    },
    [],
  );

  const saveUndoState = useCallback(() => {
    setState((prev) => {
      undoStack.current = [
        ...undoStack.current.slice(-(MAX_UNDO - 1)),
        prev.template,
      ];
      redoStack.current = [];
      setUndoRedoVersion((v) => v + 1);
      return prev;
    });
  }, []);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    setState((s) => {
      redoStack.current.push(s.template);
      setUndoRedoVersion((v) => v + 1);
      return { ...s, template: prev };
    });
  }, []);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    setState((s) => {
      undoStack.current.push(s.template);
      setUndoRedoVersion((v) => v + 1);
      return { ...s, template: next };
    });
  }, []);

  // ---- Element actions ----

  const addElement = useCallback(
    (type: ElementType) => {
      saveUndoState();
      const el = createDefaultElement(type);
      el.zIndex =
        currentElements.length > 0
          ? Math.max(...currentElements.map((e) => e.zIndex)) + 1
          : 0;
      updateElements((elements) => [...elements, el]);
      setState((s) => ({ ...s, selectedElementId: el.id }));
    },
    [saveUndoState, currentElements, updateElements],
  );

  const selectElement = useCallback((id: string | null) => {
    setState((s) => ({ ...s, selectedElementId: id }));
  }, []);

  const moveElement = useCallback(
    (id: string, x: number, y: number, isDragEnd: boolean) => {
      updateElements((elements) =>
        elements.map((el) => (el.id === id ? { ...el, x, y } : el)),
      );
      if (isDragEnd) {
        setActiveGuides([]);
      } else {
        // Compute smart guides
        const el = currentElements.find((e) => e.id === id);
        if (el) {
          const guides: SmartGuide[] = [];
          const centerX = x + el.width / 2;
          const centerY = y + el.height / 2;
          const canvasCenterX = CARD_CONSTANTS.width / 2;
          const canvasCenterY = CARD_CONSTANTS.height / 2;

          if (Math.abs(centerX - canvasCenterX) < 5) {
            guides.push({ type: "vertical", position: canvasCenterX });
          }
          if (Math.abs(centerY - canvasCenterY) < 5) {
            guides.push({ type: "horizontal", position: canvasCenterY });
          }

          // Guides for edges
          for (const other of currentElements) {
            if (other.id === id) continue;
            if (Math.abs(x - other.x) < 3) {
              guides.push({ type: "vertical", position: other.x });
            }
            if (Math.abs(x + el.width - (other.x + other.width)) < 3) {
              guides.push({
                type: "vertical",
                position: other.x + other.width,
              });
            }
            if (Math.abs(y - other.y) < 3) {
              guides.push({ type: "horizontal", position: other.y });
            }
            if (Math.abs(y + el.height - (other.y + other.height)) < 3) {
              guides.push({
                type: "horizontal",
                position: other.y + other.height,
              });
            }
          }

          setActiveGuides(guides);
        }
      }
    },
    [updateElements, currentElements],
  );

  const resizeElement = useCallback(
    (id: string, width: number, height: number, _handle: ResizeHandle) => {
      updateElements((elements) =>
        elements.map((el) =>
          el.id === id ? { ...el, width, height } : el,
        ),
      );
    },
    [updateElements],
  );

  const updateElement = useCallback(
    (id: string, updates: Partial<CardElement>) => {
      saveUndoState();
      updateElements((elements) =>
        elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
      );
    },
    [saveUndoState, updateElements],
  );

  const deleteElement = useCallback(() => {
    if (!state.selectedElementId) return;
    saveUndoState();
    const id = state.selectedElementId;
    updateElements((elements) => elements.filter((el) => el.id !== id));
    setState((s) => ({ ...s, selectedElementId: null }));
  }, [state.selectedElementId, saveUndoState, updateElements]);

  const duplicateElement = useCallback(() => {
    if (!selectedElement) return;
    saveUndoState();
    const newEl: CardElement = {
      ...selectedElement,
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      x: selectedElement.x + 20,
      y: selectedElement.y + 20,
      zIndex:
        currentElements.length > 0
          ? Math.max(...currentElements.map((e) => e.zIndex)) + 1
          : 0,
    };
    updateElements((elements) => [...elements, newEl]);
    setState((s) => ({ ...s, selectedElementId: newEl.id }));
  }, [selectedElement, saveUndoState, currentElements, updateElements]);

  const bringToFront = useCallback(() => {
    if (!state.selectedElementId) return;
    saveUndoState();
    const maxZ = Math.max(...currentElements.map((e) => e.zIndex), 0);
    updateElements((elements) =>
      elements.map((el) =>
        el.id === state.selectedElementId
          ? { ...el, zIndex: maxZ + 1 }
          : el,
      ),
    );
  }, [state.selectedElementId, saveUndoState, currentElements, updateElements]);

  const sendToBack = useCallback(() => {
    if (!state.selectedElementId) return;
    saveUndoState();
    const minZ = Math.min(...currentElements.map((e) => e.zIndex), 0);
    updateElements((elements) =>
      elements.map((el) =>
        el.id === state.selectedElementId
          ? { ...el, zIndex: minZ - 1 }
          : el,
      ),
    );
  }, [state.selectedElementId, saveUndoState, currentElements, updateElements]);

  // Alignment helpers
  const alignLeft = useCallback(() => {
    if (!state.selectedElementId) return;
    saveUndoState();
    updateElements((elements) =>
      elements.map((el) =>
        el.id === state.selectedElementId ? { ...el, x: 0 } : el,
      ),
    );
  }, [state.selectedElementId, saveUndoState, updateElements]);

  const alignCenterH = useCallback(() => {
    if (!selectedElement) return;
    saveUndoState();
    const x = Math.round((CARD_CONSTANTS.width - selectedElement.width) / 2);
    updateElements((elements) =>
      elements.map((el) =>
        el.id === state.selectedElementId ? { ...el, x } : el,
      ),
    );
  }, [selectedElement, state.selectedElementId, saveUndoState, updateElements]);

  const alignRight = useCallback(() => {
    if (!selectedElement) return;
    saveUndoState();
    const x = CARD_CONSTANTS.width - selectedElement.width;
    updateElements((elements) =>
      elements.map((el) =>
        el.id === state.selectedElementId ? { ...el, x } : el,
      ),
    );
  }, [selectedElement, state.selectedElementId, saveUndoState, updateElements]);

  const alignTop = useCallback(() => {
    if (!state.selectedElementId) return;
    saveUndoState();
    updateElements((elements) =>
      elements.map((el) =>
        el.id === state.selectedElementId ? { ...el, y: 0 } : el,
      ),
    );
  }, [state.selectedElementId, saveUndoState, updateElements]);

  const alignMiddle = useCallback(() => {
    if (!selectedElement) return;
    saveUndoState();
    const y = Math.round((CARD_CONSTANTS.height - selectedElement.height) / 2);
    updateElements((elements) =>
      elements.map((el) =>
        el.id === state.selectedElementId ? { ...el, y } : el,
      ),
    );
  }, [selectedElement, state.selectedElementId, saveUndoState, updateElements]);

  const alignBottom = useCallback(() => {
    if (!selectedElement) return;
    saveUndoState();
    const y = CARD_CONSTANTS.height - selectedElement.height;
    updateElements((elements) =>
      elements.map((el) =>
        el.id === state.selectedElementId ? { ...el, y } : el,
      ),
    );
  }, [selectedElement, state.selectedElementId, saveUndoState, updateElements]);

  // ---- Zoom ----

  const zoomIn = useCallback(() => {
    setState((s) => ({ ...s, zoom: Math.min(3, s.zoom + 0.1) }));
  }, []);

  const zoomOut = useCallback(() => {
    setState((s) => ({ ...s, zoom: Math.max(0.1, s.zoom - 0.1) }));
  }, []);

  const resetZoom = useCallback(() => {
    setState((s) => ({ ...s, zoom: CARD_CONSTANTS.defaultScale }));
  }, []);

  const toggleGrid = useCallback(() => {
    setState((s) => ({ ...s, showGrid: !s.showGrid }));
  }, []);

  const toggleSide = useCallback(() => {
    setState((s) => ({
      ...s,
      isEditingBack: !s.isEditingBack,
      selectedElementId: null,
    }));
  }, []);

  // ---- Copy/Paste ----

  const copyElement = useCallback(() => {
    if (!selectedElement) return;
    setState((s) => ({ ...s, clipboard: { ...selectedElement } }));
  }, [selectedElement]);

  const pasteElement = useCallback(() => {
    if (!state.clipboard) return;
    saveUndoState();
    const newEl: CardElement = {
      ...state.clipboard,
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      x: state.clipboard.x + 20,
      y: state.clipboard.y + 20,
      zIndex:
        currentElements.length > 0
          ? Math.max(...currentElements.map((e) => e.zIndex)) + 1
          : 0,
    };
    updateElements((elements) => [...elements, newEl]);
    setState((s) => ({ ...s, selectedElementId: newEl.id }));
  }, [state.clipboard, saveUndoState, currentElements, updateElements]);

  // ---- Keyboard shortcuts ----

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInput) return;

      const isMeta = e.metaKey || e.ctrlKey;

      // Delete / Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteElement();
        return;
      }

      // Cmd+Z / Cmd+Shift+Z
      if (isMeta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (isMeta && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }

      // Cmd+C
      if (isMeta && e.key === "c") {
        e.preventDefault();
        copyElement();
        return;
      }

      // Cmd+V
      if (isMeta && e.key === "v") {
        e.preventDefault();
        pasteElement();
        return;
      }

      // Cmd+D
      if (isMeta && e.key === "d") {
        e.preventDefault();
        duplicateElement();
        return;
      }

      // Arrow keys
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) &&
        state.selectedElementId
      ) {
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        const el = currentElements.find(
          (el) => el.id === state.selectedElementId,
        );
        if (!el || el.isLocked) return;

        saveUndoState();
        let { x, y } = el;
        if (e.key === "ArrowUp") y -= delta;
        if (e.key === "ArrowDown") y += delta;
        if (e.key === "ArrowLeft") x -= delta;
        if (e.key === "ArrowRight") x += delta;

        updateElements((elements) =>
          elements.map((elem) =>
            elem.id === state.selectedElementId
              ? { ...elem, x, y }
              : elem,
          ),
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    state.selectedElementId,
    currentElements,
    deleteElement,
    undo,
    redo,
    copyElement,
    pasteElement,
    duplicateElement,
    saveUndoState,
    updateElements,
  ]);

  return (
    <div className="flex h-full flex-col">
      <DesignerToolbar
        onAddElement={addElement}
        isEditingBack={state.isEditingBack}
        onToggleSide={toggleSide}
        zoom={state.zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        showGrid={state.showGrid}
        onToggleGrid={toggleGrid}
        templateName={state.template.name}
      />

      <div className="flex flex-1 overflow-hidden">
        <Canvas
          elements={currentElements}
          selectedElementId={state.selectedElementId}
          zoom={state.zoom}
          showGrid={state.showGrid}
          activeGuides={activeGuides}
          backgroundColor={state.template.backgroundColor}
          backgroundImage={backgroundImage}
          backgroundOpacity={state.template.backgroundOpacity}
          onSelectElement={selectElement}
          onMoveElement={moveElement}
          onResizeElement={resizeElement}
          onSaveUndoState={saveUndoState}
        />

        <PropertiesPanel
          element={selectedElement}
          onUpdateElement={updateElement}
          onDeleteElement={deleteElement}
          onDuplicateElement={duplicateElement}
          onBringToFront={bringToFront}
          onSendToBack={sendToBack}
          onAlignLeft={alignLeft}
          onAlignCenterH={alignCenterH}
          onAlignRight={alignRight}
          onAlignTop={alignTop}
          onAlignMiddle={alignMiddle}
          onAlignBottom={alignBottom}
        />
      </div>
    </div>
  );
}
