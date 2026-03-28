// ---------------------------------------------------------------------------
// Designer hook – useReducer-based state management
// Ported from DesignerViewModel.swift
// ---------------------------------------------------------------------------

import { useCallback, useMemo, useReducer } from "react";
import type {
  CardElement,
  CardTemplate,
  ElementType,
  ResizeHandle,
  SmartGuide,
} from "../../lib/models/card-element";
import {
  CARD_CONSTANTS,
  createDefaultElement,
  createEmptyTemplate,
} from "../../lib/models/card-element";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface DesignerState {
  template: CardTemplate;
  selectedElementId: string | null;
  isEditingBack: boolean;
  zoom: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  activeGuides: SmartGuide[];
  undoStack: CardElement[][];
  redoStack: CardElement[][];
  clipboard: CardElement | null;
}

const MAX_UNDO = 50;
const SNAP_THRESHOLD = 5;
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 2.0;
const ZOOM_STEP = 0.1;

function createInitialState(template?: CardTemplate): DesignerState {
  return {
    template: template ?? createEmptyTemplate(),
    selectedElementId: null,
    isEditingBack: false,
    zoom: CARD_CONSTANTS.defaultScale,
    showGrid: true,
    snapToGrid: true,
    gridSize: 10,
    activeGuides: [],
    undoStack: [],
    redoStack: [],
    clipboard: null,
  };
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type DesignerAction =
  | { type: "SET_TEMPLATE"; template: CardTemplate }
  | { type: "ADD_ELEMENT"; elementType: ElementType }
  | { type: "DELETE_ELEMENT" }
  | { type: "SELECT_ELEMENT"; id: string | null }
  | { type: "MOVE_ELEMENT"; id: string; x: number; y: number; isDragEnd: boolean }
  | { type: "RESIZE_ELEMENT"; id: string; width: number; height: number; handle: ResizeHandle }
  | { type: "UPDATE_ELEMENT"; id: string; changes: Partial<CardElement> }
  | { type: "DUPLICATE_ELEMENT" }
  | { type: "TOGGLE_SIDE" }
  | { type: "SET_ZOOM"; zoom: number }
  | { type: "ZOOM_IN" }
  | { type: "ZOOM_OUT" }
  | { type: "RESET_ZOOM" }
  | { type: "TOGGLE_GRID" }
  | { type: "TOGGLE_SNAP" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SAVE_UNDO_STATE" }
  | { type: "BRING_TO_FRONT" }
  | { type: "SEND_TO_BACK" }
  | { type: "COPY" }
  | { type: "PASTE" }
  | { type: "ALIGN_LEFT" }
  | { type: "ALIGN_CENTER_H" }
  | { type: "ALIGN_RIGHT" }
  | { type: "ALIGN_TOP" }
  | { type: "ALIGN_MIDDLE" }
  | { type: "ALIGN_BOTTOM" }
  | { type: "CLEAR_GUIDES" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function currentElements(state: DesignerState): CardElement[] {
  return state.isEditingBack
    ? state.template.backElements
    : state.template.frontElements;
}

function withElements(state: DesignerState, elements: CardElement[]): CardTemplate {
  const now = new Date().toISOString();
  if (state.isEditingBack) {
    return { ...state.template, backElements: elements, updatedAt: now };
  }
  return { ...state.template, frontElements: elements, updatedAt: now };
}

function pushUndo(state: DesignerState): DesignerState {
  const elems = currentElements(state);
  const stack = [...state.undoStack, elems.map((e) => ({ ...e }))];
  if (stack.length > MAX_UNDO) stack.shift();
  return { ...state, undoStack: stack, redoStack: [] };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Calculate smart guides for the given element against all other elements.
 * Returns guide lines where edges or centres align within SNAP_THRESHOLD,
 * and the snapped x/y for the moving element.
 */
function calculateSmartGuides(
  movingElement: CardElement,
  allElements: CardElement[],
  snapEnabled: boolean,
): { guides: SmartGuide[]; snappedX: number; snappedY: number } {
  const guides: SmartGuide[] = [];
  let snappedX = movingElement.x;
  let snappedY = movingElement.y;

  if (!snapEnabled) return { guides, snappedX, snappedY };

  const movingCenterX = movingElement.x + movingElement.width / 2;
  const movingCenterY = movingElement.y + movingElement.height / 2;
  const movingRight = movingElement.x + movingElement.width;
  const movingBottom = movingElement.y + movingElement.height;

  // Card centre guides
  const cardCenterX = CARD_CONSTANTS.width / 2;
  const cardCenterY = CARD_CONSTANTS.height / 2;

  // Check centre alignment with card
  if (Math.abs(movingCenterX - cardCenterX) < SNAP_THRESHOLD) {
    guides.push({ type: "vertical", position: cardCenterX });
    snappedX = cardCenterX - movingElement.width / 2;
  }
  if (Math.abs(movingCenterY - cardCenterY) < SNAP_THRESHOLD) {
    guides.push({ type: "horizontal", position: cardCenterY });
    snappedY = cardCenterY - movingElement.height / 2;
  }

  // Check edges with card boundaries
  if (Math.abs(movingElement.x) < SNAP_THRESHOLD) {
    guides.push({ type: "vertical", position: 0 });
    snappedX = 0;
  }
  if (Math.abs(movingRight - CARD_CONSTANTS.width) < SNAP_THRESHOLD) {
    guides.push({ type: "vertical", position: CARD_CONSTANTS.width });
    snappedX = CARD_CONSTANTS.width - movingElement.width;
  }
  if (Math.abs(movingElement.y) < SNAP_THRESHOLD) {
    guides.push({ type: "horizontal", position: 0 });
    snappedY = 0;
  }
  if (Math.abs(movingBottom - CARD_CONSTANTS.height) < SNAP_THRESHOLD) {
    guides.push({ type: "horizontal", position: CARD_CONSTANTS.height });
    snappedY = CARD_CONSTANTS.height - movingElement.height;
  }

  for (const other of allElements) {
    if (other.id === movingElement.id) continue;

    const otherCenterX = other.x + other.width / 2;
    const otherCenterY = other.y + other.height / 2;
    const otherRight = other.x + other.width;
    const otherBottom = other.y + other.height;

    // --- Vertical guides (x-axis alignment) ---

    // Left edge to left edge
    if (Math.abs(movingElement.x - other.x) < SNAP_THRESHOLD) {
      guides.push({ type: "vertical", position: other.x });
      snappedX = other.x;
    }
    // Right edge to right edge
    if (Math.abs(movingRight - otherRight) < SNAP_THRESHOLD) {
      guides.push({ type: "vertical", position: otherRight });
      snappedX = otherRight - movingElement.width;
    }
    // Left edge to right edge
    if (Math.abs(movingElement.x - otherRight) < SNAP_THRESHOLD) {
      guides.push({ type: "vertical", position: otherRight });
      snappedX = otherRight;
    }
    // Right edge to left edge
    if (Math.abs(movingRight - other.x) < SNAP_THRESHOLD) {
      guides.push({ type: "vertical", position: other.x });
      snappedX = other.x - movingElement.width;
    }
    // Centre to centre (vertical)
    if (Math.abs(movingCenterX - otherCenterX) < SNAP_THRESHOLD) {
      guides.push({ type: "vertical", position: otherCenterX });
      snappedX = otherCenterX - movingElement.width / 2;
    }

    // --- Horizontal guides (y-axis alignment) ---

    // Top to top
    if (Math.abs(movingElement.y - other.y) < SNAP_THRESHOLD) {
      guides.push({ type: "horizontal", position: other.y });
      snappedY = other.y;
    }
    // Bottom to bottom
    if (Math.abs(movingBottom - otherBottom) < SNAP_THRESHOLD) {
      guides.push({ type: "horizontal", position: otherBottom });
      snappedY = otherBottom - movingElement.height;
    }
    // Top to bottom
    if (Math.abs(movingElement.y - otherBottom) < SNAP_THRESHOLD) {
      guides.push({ type: "horizontal", position: otherBottom });
      snappedY = otherBottom;
    }
    // Bottom to top
    if (Math.abs(movingBottom - other.y) < SNAP_THRESHOLD) {
      guides.push({ type: "horizontal", position: other.y });
      snappedY = other.y - movingElement.height;
    }
    // Centre to centre (horizontal)
    if (Math.abs(movingCenterY - otherCenterY) < SNAP_THRESHOLD) {
      guides.push({ type: "horizontal", position: otherCenterY });
      snappedY = otherCenterY - movingElement.height / 2;
    }
  }

  // De-duplicate guides
  const seen = new Set<string>();
  const unique: SmartGuide[] = [];
  for (const g of guides) {
    const key = `${g.type}-${g.position}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(g);
    }
  }

  return { guides: unique, snappedX, snappedY };
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function designerReducer(state: DesignerState, action: DesignerAction): DesignerState {
  switch (action.type) {
    // ----- Template -----
    case "SET_TEMPLATE":
      return {
        ...createInitialState(action.template),
        zoom: state.zoom,
        showGrid: state.showGrid,
        snapToGrid: state.snapToGrid,
        gridSize: state.gridSize,
      };

    // ----- Elements CRUD -----
    case "ADD_ELEMENT": {
      const s = pushUndo(state);
      const elems = currentElements(s);
      const newEl = createDefaultElement(action.elementType);
      const maxZ = elems.reduce((m, e) => Math.max(m, e.zIndex), 0);
      newEl.zIndex = maxZ + 1;
      // Centre the new element on the card
      newEl.x = (CARD_CONSTANTS.width - newEl.width) / 2;
      newEl.y = (CARD_CONSTANTS.height - newEl.height) / 2;
      const updated = [...elems, newEl];
      return {
        ...s,
        template: withElements(s, updated),
        selectedElementId: newEl.id,
      };
    }

    case "DELETE_ELEMENT": {
      if (!state.selectedElementId) return state;
      const s = pushUndo(state);
      const elems = currentElements(s).filter((e) => e.id !== state.selectedElementId);
      return {
        ...s,
        template: withElements(s, elems),
        selectedElementId: null,
      };
    }

    case "SELECT_ELEMENT":
      return { ...state, selectedElementId: action.id };

    case "MOVE_ELEMENT": {
      const elems = currentElements(state);
      const idx = elems.findIndex((e) => e.id === action.id);
      if (idx === -1) return state;

      const moving = { ...elems[idx], x: action.x, y: action.y };

      if (action.isDragEnd) {
        // On drag end, finalise position and clear guides, push undo
        const s = pushUndo(state);
        const finalElems = currentElements(s).map((e) =>
          e.id === action.id ? { ...e, x: action.x, y: action.y } : e,
        );
        return {
          ...s,
          template: withElements(s, finalElems),
          activeGuides: [],
        };
      }

      // During drag – compute smart guides
      const { guides, snappedX, snappedY } = calculateSmartGuides(
        moving,
        elems,
        state.snapToGrid,
      );
      const updatedElems = elems.map((e) =>
        e.id === action.id ? { ...e, x: snappedX, y: snappedY } : e,
      );
      return {
        ...state,
        template: withElements(state, updatedElems),
        activeGuides: guides,
      };
    }

    case "RESIZE_ELEMENT": {
      const s = pushUndo(state);
      const elems = currentElements(s);
      const idx = elems.findIndex((e) => e.id === action.id);
      if (idx === -1) return s;

      const el = elems[idx];
      let newX = el.x;
      let newY = el.y;
      const newW = Math.max(10, action.width);
      const newH = Math.max(10, action.height);

      switch (action.handle) {
        case "topLeft":
          newX = el.x + el.width - newW;
          newY = el.y + el.height - newH;
          break;
        case "topRight":
          newY = el.y + el.height - newH;
          break;
        case "bottomLeft":
          newX = el.x + el.width - newW;
          break;
        case "bottomRight":
          // x,y stays the same
          break;
      }

      const updated = elems.map((e) =>
        e.id === action.id
          ? { ...e, x: newX, y: newY, width: newW, height: newH }
          : e,
      );
      return { ...s, template: withElements(s, updated) };
    }

    case "UPDATE_ELEMENT": {
      const s = pushUndo(state);
      const elems = currentElements(s).map((e) =>
        e.id === action.id ? { ...e, ...action.changes } : e,
      );
      return { ...s, template: withElements(s, elems) };
    }

    case "DUPLICATE_ELEMENT": {
      if (!state.selectedElementId) return state;
      const s = pushUndo(state);
      const elems = currentElements(s);
      const source = elems.find((e) => e.id === state.selectedElementId);
      if (!source) return s;

      const maxZ = elems.reduce((m, e) => Math.max(m, e.zIndex), 0);
      const dup: CardElement = {
        ...source,
        id: generateId(),
        x: source.x + 20,
        y: source.y + 20,
        zIndex: maxZ + 1,
      };
      return {
        ...s,
        template: withElements(s, [...elems, dup]),
        selectedElementId: dup.id,
      };
    }

    // ----- Side toggle -----
    case "TOGGLE_SIDE":
      return {
        ...state,
        isEditingBack: !state.isEditingBack,
        selectedElementId: null,
        activeGuides: [],
      };

    // ----- Zoom -----
    case "SET_ZOOM":
      return { ...state, zoom: clamp(action.zoom, ZOOM_MIN, ZOOM_MAX) };

    case "ZOOM_IN":
      return { ...state, zoom: clamp(state.zoom + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX) };

    case "ZOOM_OUT":
      return { ...state, zoom: clamp(state.zoom - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX) };

    case "RESET_ZOOM":
      return { ...state, zoom: CARD_CONSTANTS.defaultScale };

    // ----- Grid -----
    case "TOGGLE_GRID":
      return { ...state, showGrid: !state.showGrid };

    case "TOGGLE_SNAP":
      return { ...state, snapToGrid: !state.snapToGrid };

    // ----- Undo / Redo -----
    case "UNDO": {
      if (state.undoStack.length === 0) return state;
      const stack = [...state.undoStack];
      const previous = stack.pop()!;
      const redoStack = [...state.redoStack, currentElements(state).map((e) => ({ ...e }))];
      return {
        ...state,
        undoStack: stack,
        redoStack,
        template: withElements(state, previous),
        selectedElementId: null,
      };
    }

    case "REDO": {
      if (state.redoStack.length === 0) return state;
      const stack = [...state.redoStack];
      const next = stack.pop()!;
      const undoStack = [...state.undoStack, currentElements(state).map((e) => ({ ...e }))];
      return {
        ...state,
        redoStack: stack,
        undoStack,
        template: withElements(state, next),
        selectedElementId: null,
      };
    }

    case "SAVE_UNDO_STATE":
      return pushUndo(state);

    // ----- Z-order -----
    case "BRING_TO_FRONT": {
      if (!state.selectedElementId) return state;
      const s = pushUndo(state);
      const elems = currentElements(s);
      const maxZ = elems.reduce((m, e) => Math.max(m, e.zIndex), 0);
      const updated = elems.map((e) =>
        e.id === state.selectedElementId ? { ...e, zIndex: maxZ + 1 } : e,
      );
      return { ...s, template: withElements(s, updated) };
    }

    case "SEND_TO_BACK": {
      if (!state.selectedElementId) return state;
      const s = pushUndo(state);
      const elems = currentElements(s);
      const minZ = elems.reduce((m, e) => Math.min(m, e.zIndex), Infinity);
      const updated = elems.map((e) =>
        e.id === state.selectedElementId ? { ...e, zIndex: minZ - 1 } : e,
      );
      return { ...s, template: withElements(s, updated) };
    }

    // ----- Clipboard -----
    case "COPY": {
      if (!state.selectedElementId) return state;
      const el = currentElements(state).find((e) => e.id === state.selectedElementId);
      if (!el) return state;
      return { ...state, clipboard: { ...el } };
    }

    case "PASTE": {
      if (!state.clipboard) return state;
      const s = pushUndo(state);
      const elems = currentElements(s);
      const maxZ = elems.reduce((m, e) => Math.max(m, e.zIndex), 0);
      const pasted: CardElement = {
        ...state.clipboard,
        id: generateId(),
        x: state.clipboard.x + 20,
        y: state.clipboard.y + 20,
        zIndex: maxZ + 1,
      };
      return {
        ...s,
        template: withElements(s, [...elems, pasted]),
        selectedElementId: pasted.id,
      };
    }

    // ----- Alignment -----
    case "ALIGN_LEFT": {
      if (!state.selectedElementId) return state;
      const s = pushUndo(state);
      const elems = currentElements(s).map((e) =>
        e.id === state.selectedElementId ? { ...e, x: 0 } : e,
      );
      return { ...s, template: withElements(s, elems) };
    }

    case "ALIGN_CENTER_H": {
      if (!state.selectedElementId) return state;
      const s = pushUndo(state);
      const elems = currentElements(s);
      const el = elems.find((e) => e.id === state.selectedElementId);
      if (!el) return s;
      const updated = elems.map((e) =>
        e.id === state.selectedElementId
          ? { ...e, x: (CARD_CONSTANTS.width - e.width) / 2 }
          : e,
      );
      return { ...s, template: withElements(s, updated) };
    }

    case "ALIGN_RIGHT": {
      if (!state.selectedElementId) return state;
      const s = pushUndo(state);
      const elems = currentElements(s).map((e) =>
        e.id === state.selectedElementId
          ? { ...e, x: CARD_CONSTANTS.width - e.width }
          : e,
      );
      return { ...s, template: withElements(s, elems) };
    }

    case "ALIGN_TOP": {
      if (!state.selectedElementId) return state;
      const s = pushUndo(state);
      const elems = currentElements(s).map((e) =>
        e.id === state.selectedElementId ? { ...e, y: 0 } : e,
      );
      return { ...s, template: withElements(s, elems) };
    }

    case "ALIGN_MIDDLE": {
      if (!state.selectedElementId) return state;
      const s = pushUndo(state);
      const elems = currentElements(s);
      const updated = elems.map((e) =>
        e.id === state.selectedElementId
          ? { ...e, y: (CARD_CONSTANTS.height - e.height) / 2 }
          : e,
      );
      return { ...s, template: withElements(s, updated) };
    }

    case "ALIGN_BOTTOM": {
      if (!state.selectedElementId) return state;
      const s = pushUndo(state);
      const elems = currentElements(s).map((e) =>
        e.id === state.selectedElementId
          ? { ...e, y: CARD_CONSTANTS.height - e.height }
          : e,
      );
      return { ...s, template: withElements(s, elems) };
    }

    // ----- Guides -----
    case "CLEAR_GUIDES":
      return { ...state, activeGuides: [] };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDesigner(initialTemplate?: CardTemplate) {
  const [state, dispatch] = useReducer(
    designerReducer,
    initialTemplate,
    (tpl) => createInitialState(tpl),
  );

  // Convenience action wrappers
  const actions = useMemo(
    () => ({
      setTemplate: (template: CardTemplate) =>
        dispatch({ type: "SET_TEMPLATE", template }),

      addElement: (elementType: ElementType) =>
        dispatch({ type: "ADD_ELEMENT", elementType }),

      deleteElement: () => dispatch({ type: "DELETE_ELEMENT" }),

      selectElement: (id: string | null) =>
        dispatch({ type: "SELECT_ELEMENT", id }),

      moveElement: (id: string, x: number, y: number, isDragEnd: boolean) =>
        dispatch({ type: "MOVE_ELEMENT", id, x, y, isDragEnd }),

      resizeElement: (id: string, width: number, height: number, handle: ResizeHandle) =>
        dispatch({ type: "RESIZE_ELEMENT", id, width, height, handle }),

      updateElement: (id: string, changes: Partial<CardElement>) =>
        dispatch({ type: "UPDATE_ELEMENT", id, changes }),

      duplicateElement: () => dispatch({ type: "DUPLICATE_ELEMENT" }),

      toggleSide: () => dispatch({ type: "TOGGLE_SIDE" }),

      setZoom: (zoom: number) => dispatch({ type: "SET_ZOOM", zoom }),
      zoomIn: () => dispatch({ type: "ZOOM_IN" }),
      zoomOut: () => dispatch({ type: "ZOOM_OUT" }),
      resetZoom: () => dispatch({ type: "RESET_ZOOM" }),

      toggleGrid: () => dispatch({ type: "TOGGLE_GRID" }),
      toggleSnap: () => dispatch({ type: "TOGGLE_SNAP" }),

      undo: () => dispatch({ type: "UNDO" }),
      redo: () => dispatch({ type: "REDO" }),
      saveUndoState: () => dispatch({ type: "SAVE_UNDO_STATE" }),

      bringToFront: () => dispatch({ type: "BRING_TO_FRONT" }),
      sendToBack: () => dispatch({ type: "SEND_TO_BACK" }),

      copy: () => dispatch({ type: "COPY" }),
      paste: () => dispatch({ type: "PASTE" }),

      alignLeft: () => dispatch({ type: "ALIGN_LEFT" }),
      alignCenterH: () => dispatch({ type: "ALIGN_CENTER_H" }),
      alignRight: () => dispatch({ type: "ALIGN_RIGHT" }),
      alignTop: () => dispatch({ type: "ALIGN_TOP" }),
      alignMiddle: () => dispatch({ type: "ALIGN_MIDDLE" }),
      alignBottom: () => dispatch({ type: "ALIGN_BOTTOM" }),

      clearGuides: () => dispatch({ type: "CLEAR_GUIDES" }),
    }),
    [],
  );

  /** The elements for the currently active side (front or back). */
  const activeElements = useCallback((): CardElement[] => {
    return state.isEditingBack
      ? state.template.backElements
      : state.template.frontElements;
  }, [state.isEditingBack, state.template.backElements, state.template.frontElements]);

  /** The currently selected element, if any. */
  const selectedElement = useMemo((): CardElement | null => {
    if (!state.selectedElementId) return null;
    const elems = state.isEditingBack
      ? state.template.backElements
      : state.template.frontElements;
    return elems.find((e) => e.id === state.selectedElementId) ?? null;
  }, [
    state.selectedElementId,
    state.isEditingBack,
    state.template.backElements,
    state.template.frontElements,
  ]);

  return {
    state,
    dispatch,
    actions,
    activeElements,
    selectedElement,
  };
}

export type UseDesignerReturn = ReturnType<typeof useDesigner>;
