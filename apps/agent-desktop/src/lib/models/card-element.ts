// ---------------------------------------------------------------------------
// Card Element & Template models – ported from SwiftUI CardElement.swift
// ---------------------------------------------------------------------------

export type ElementType =
  | "text"
  | "image"
  | "qrCode"
  | "barcode"
  | "rectangle"
  | "circle"
  | "line";

export type TextAlignment = "left" | "center" | "right";

export interface CardElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isLocked: boolean;
  isVisible: boolean;
  zIndex: number;
  // Text
  textContent: string;
  fontName: string;
  fontSize: number;
  textColor: string;
  textAlignment: TextAlignment;
  isBold: boolean;
  isItalic: boolean;
  // Dynamic field
  isDynamicField: boolean;
  fieldKey: string;
  // Image
  imageData: string | null; // base64
  // Shape
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  cornerRadius: number;
  // QR / Barcode
  codeContent: string;
}

export interface CardTemplate {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  backgroundColor: string;
  frontBackgroundImage: string | null;
  backBackgroundImage: string | null;
  backgroundOpacity: number;
  frontElements: CardElement[];
  backElements: CardElement[];
  printDuplex: boolean;
  magneticTracks: [string, string, string];
}

export const CARD_CONSTANTS = {
  width: 1016,
  height: 648,
  dpi: 300,
  widthMM: 85.6,
  heightMM: 53.98,
  aspectRatio: 1016 / 648,
  defaultScale: 0.6,
} as const;

export type ResizeHandle = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

export interface SmartGuide {
  type: "horizontal" | "vertical";
  position: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _idCounter = 0;

function generateId(): string {
  _idCounter += 1;
  return `${Date.now().toString(36)}-${_idCounter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a CardElement with sensible defaults for the given type.
 * Mirrors the Swift `CardElement.init(type:)` default values.
 */
export function createDefaultElement(type: ElementType): CardElement {
  const base: CardElement = {
    id: generateId(),
    type,
    x: 100,
    y: 100,
    width: 200,
    height: 50,
    rotation: 0,
    isLocked: false,
    isVisible: true,
    zIndex: 0,
    // Text defaults
    textContent: "",
    fontName: "Helvetica",
    fontSize: 16,
    textColor: "#000000",
    textAlignment: "left",
    isBold: false,
    isItalic: false,
    // Dynamic field
    isDynamicField: false,
    fieldKey: "",
    // Image
    imageData: null,
    // Shape
    fillColor: "#FFFFFF",
    strokeColor: "#000000",
    strokeWidth: 1,
    cornerRadius: 0,
    // QR / Barcode
    codeContent: "",
  };

  switch (type) {
    case "text":
      base.width = 200;
      base.height = 40;
      base.textContent = "Text";
      base.fontSize = 16;
      break;
    case "image":
      base.width = 150;
      base.height = 150;
      break;
    case "qrCode":
      base.width = 120;
      base.height = 120;
      base.codeContent = "https://example.com";
      break;
    case "barcode":
      base.width = 200;
      base.height = 60;
      base.codeContent = "123456789";
      break;
    case "rectangle":
      base.width = 200;
      base.height = 120;
      base.fillColor = "#E0E0E0";
      base.strokeColor = "#000000";
      base.strokeWidth = 1;
      break;
    case "circle":
      base.width = 120;
      base.height = 120;
      base.fillColor = "#E0E0E0";
      base.strokeColor = "#000000";
      base.strokeWidth = 1;
      break;
    case "line":
      base.width = 200;
      base.height = 2;
      base.strokeColor = "#000000";
      base.strokeWidth = 2;
      base.fillColor = "transparent";
      break;
  }

  return base;
}

/**
 * Create a blank CardTemplate, optionally with a given name.
 */
export function createEmptyTemplate(name?: string): CardTemplate {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name: name ?? "Nouveau modèle",
    createdAt: now,
    updatedAt: now,
    backgroundColor: "#FFFFFF",
    frontBackgroundImage: null,
    backBackgroundImage: null,
    backgroundOpacity: 1,
    frontElements: [],
    backElements: [],
    printDuplex: false,
    magneticTracks: ["", "", ""],
  };
}
