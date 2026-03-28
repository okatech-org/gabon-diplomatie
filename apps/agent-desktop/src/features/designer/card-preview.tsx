/**
 * CardPreview — Renders a miniature read-only preview of a card design.
 * Used in the gallery page to show a visual thumbnail of each design.
 */

import { useMemo } from "react";
import { CARD_CONSTANTS } from "@/lib/models/card-element";
import type { CardElement } from "@/lib/models/card-element";

interface PreviewElement {
  id: string;
  type: CardElement["type"];
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isVisible: boolean;
  zIndex: number;
  // Text
  textContent: string;
  fontName: string;
  fontSize: number;
  textColor: string;
  textAlignment: "left" | "center" | "right";
  isBold: boolean;
  isItalic: boolean;
  // Dynamic field
  isDynamicField: boolean;
  fieldKey: string;
  // Image
  imageData: string | null;
  // Shape
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  cornerRadius: number;
  // QR / Barcode
  codeContent: string;
}

interface CardPreviewProps {
  backgroundColor: string;
  backgroundOpacity?: number;
  elements: PreviewElement[];
  /** Height of the preview container in px (width auto-calculated from CR80 ratio) */
  height?: number;
  /** If true, fills the container width and computes height from aspect ratio */
  fillWidth?: boolean;
  className?: string;
}

export function CardPreview({
  backgroundColor,
  backgroundOpacity = 1,
  elements,
  height = 160,
  fillWidth = false,
  className,
}: CardPreviewProps) {
  const scale = height / CARD_CONSTANTS.height;

  const sortedElements = useMemo(
    () =>
      [...elements]
        .filter((el) => el.isVisible !== false)
        .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)),
    [elements],
  );

  // For fillWidth mode: use aspect-ratio CSS so it fills the parent width
  // and computes its height automatically. The scale is then based on the
  // actual rendered width, but we approximate with the height prop for element
  // positioning — elements use percentage-based positioning via the inner
  // scaled container approach.
  if (fillWidth) {
    return (
      <div
        className={className}
        style={{
          width: "100%",
          aspectRatio: `${CARD_CONSTANTS.width} / ${CARD_CONSTANTS.height}`,
          position: "relative",
          overflow: "hidden",
          borderRadius: 8,
          backgroundColor,
          border: "1px solid rgba(0,0,0,0.1)",
          containerType: "size",
        }}
      >
        {/* Inner container scales elements from card coords to percentages */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: backgroundOpacity,
          }}
        >
          {sortedElements.map((el) => (
            <PreviewElementPercent key={el.id} element={el} />
          ))}
        </div>
      </div>
    );
  }

  const width = Math.round(height * CARD_CONSTANTS.aspectRatio);

  return (
    <div
      className={className}
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        borderRadius: 6,
        backgroundColor,
        opacity: backgroundOpacity,
        border: "1px solid rgba(0,0,0,0.1)",
        flexShrink: 0,
      }}
    >
      {sortedElements.map((el) => (
        <PreviewElementRenderer key={el.id} element={el} scale={scale} />
      ))}
    </div>
  );
}

function PreviewElementRenderer({
  element: el,
  scale,
}: {
  element: PreviewElement;
  scale: number;
}) {
  const style: React.CSSProperties = {
    position: "absolute",
    left: el.x * scale,
    top: el.y * scale,
    width: el.width * scale,
    height: el.height * scale,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    overflow: "hidden",
    pointerEvents: "none",
  };

  switch (el.type) {
    case "text":
      return (
        <div
          style={{
            ...style,
            fontSize: Math.max(1, el.fontSize * scale),
            fontWeight: el.isBold ? "bold" : "normal",
            fontStyle: el.isItalic ? "italic" : "normal",
            color: el.textColor,
            textAlign: el.textAlignment,
            fontFamily: el.fontName,
            display: "flex",
            alignItems: "center",
            lineHeight: 1.2,
            whiteSpace: "nowrap",
          }}
        >
          {el.isDynamicField ? (
            <span
              style={{
                background: "rgba(124, 58, 237, 0.12)",
                borderRadius: 1,
                padding: "0 1px",
                fontSize: Math.max(1, el.fontSize * scale),
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {`{${el.fieldKey || "field"}}`}
            </span>
          ) : (
            <span
              style={{
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {el.textContent || "Text"}
            </span>
          )}
        </div>
      );

    case "image":
      if (el.imageData && el.imageData !== "__has_image__") {
        return (
          <img
            src={el.imageData}
            alt=""
            style={{
              ...style,
              objectFit: "cover",
              borderRadius: el.cornerRadius * scale,
            }}
          />
        );
      }
      return (
        <div
          style={{
            ...style,
            background: "#e2e8f0",
            borderRadius: el.cornerRadius * scale,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width={Math.max(6, el.width * scale * 0.4)}
            height={Math.max(6, el.height * scale * 0.4)}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
        </div>
      );

    case "qrCode":
      return (
        <div
          style={{
            ...style,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MiniQR size={Math.min(el.width, el.height) * scale * 0.8} />
        </div>
      );

    case "barcode":
      return (
        <div
          style={{
            ...style,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: `${2 * scale}px`,
          }}
        >
          <MiniBarcode width={el.width * scale * 0.85} height={el.height * scale * 0.5} />
        </div>
      );

    case "rectangle":
      return (
        <div
          style={{
            ...style,
            backgroundColor: el.fillColor,
            border:
              el.strokeWidth > 0
                ? `${Math.max(0.5, el.strokeWidth * scale)}px solid ${el.strokeColor}`
                : undefined,
            borderRadius: el.cornerRadius * scale,
            boxSizing: "border-box",
          }}
        />
      );

    case "circle":
      return (
        <div
          style={{
            ...style,
            backgroundColor: el.fillColor,
            border:
              el.strokeWidth > 0
                ? `${Math.max(0.5, el.strokeWidth * scale)}px solid ${el.strokeColor}`
                : undefined,
            borderRadius: "50%",
            boxSizing: "border-box",
          }}
        />
      );

    case "line":
      return (
        <div
          style={{
            ...style,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              height: Math.max(0.5, el.strokeWidth * scale),
              backgroundColor: el.strokeColor,
            }}
          />
        </div>
      );

    default:
      return null;
  }
}

/**
 * Percentage-based element renderer for fillWidth mode.
 * Positions elements as % of the card dimensions so the preview
 * scales naturally with its container width.
 */
function PreviewElementPercent({ element: el }: { element: PreviewElement }) {
  const CW = CARD_CONSTANTS.width;
  const CH = CARD_CONSTANTS.height;

  const pctLeft = (el.x / CW) * 100;
  const pctTop = (el.y / CH) * 100;
  const pctW = (el.width / CW) * 100;
  const pctH = (el.height / CH) * 100;
  // Font size as % of card height — rendered via em in a container with
  // font-size set on a parent that uses the card's height-based scale
  const fontSizePct = (el.fontSize / CH) * 100;

  const base: React.CSSProperties = {
    position: "absolute",
    left: `${pctLeft}%`,
    top: `${pctTop}%`,
    width: `${pctW}%`,
    height: `${pctH}%`,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    overflow: "hidden",
    pointerEvents: "none",
  };

  switch (el.type) {
    case "text":
      return (
        <div
          style={{
            ...base,
            fontSize: `${fontSizePct}cqh`,
            fontWeight: el.isBold ? "bold" : "normal",
            fontStyle: el.isItalic ? "italic" : "normal",
            color: el.textColor,
            textAlign: el.textAlignment,
            fontFamily: el.fontName,
            display: "flex",
            alignItems: "center",
            lineHeight: 1.2,
            whiteSpace: "nowrap",
          }}
        >
          {el.isDynamicField ? (
            <span
              style={{
                background: "rgba(124, 58, 237, 0.12)",
                borderRadius: 1,
                padding: "0 1px",
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {`{${el.fieldKey || "field"}}`}
            </span>
          ) : (
            <span style={{ width: "100%", overflow: "hidden", textOverflow: "ellipsis" }}>
              {el.textContent || "Text"}
            </span>
          )}
        </div>
      );

    case "image":
      if (el.imageData && el.imageData !== "__has_image__") {
        return (
          <img
            src={el.imageData}
            alt=""
            style={{
              ...base,
              objectFit: "cover",
              borderRadius: `${(el.cornerRadius / CW) * 100}%`,
            }}
          />
        );
      }
      return (
        <div
          style={{
            ...base,
            background: "#e2e8f0",
            borderRadius: `${(el.cornerRadius / CW) * 100}%`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="40%"
            height="40%"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
        </div>
      );

    case "qrCode":
      return (
        <div
          style={{
            ...base,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MiniQR size={32} />
        </div>
      );

    case "barcode":
      return (
        <div
          style={{
            ...base,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MiniBarcode width={60} height={20} />
        </div>
      );

    case "rectangle":
      return (
        <div
          style={{
            ...base,
            backgroundColor: el.fillColor,
            border:
              el.strokeWidth > 0
                ? `1px solid ${el.strokeColor}`
                : undefined,
            borderRadius: `${(el.cornerRadius / CW) * 100}%`,
            boxSizing: "border-box",
          }}
        />
      );

    case "circle":
      return (
        <div
          style={{
            ...base,
            backgroundColor: el.fillColor,
            border:
              el.strokeWidth > 0
                ? `1px solid ${el.strokeColor}`
                : undefined,
            borderRadius: "50%",
            boxSizing: "border-box",
          }}
        />
      );

    case "line":
      return (
        <div style={{ ...base, display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: "100%",
              height: Math.max(1, (el.strokeWidth / CH) * 100) + "%",
              minHeight: 1,
              backgroundColor: el.strokeColor,
            }}
          />
        </div>
      );

    default:
      return null;
  }
}

function MiniQR({ size }: { size: number }) {
  const cells = 7;
  const cellSize = size / cells;
  const pattern = [
    [1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0],
    [1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0],
    [1, 1, 1, 1, 1, 0, 1],
    [0, 0, 0, 0, 0, 0, 0],
    [1, 0, 1, 0, 1, 0, 1],
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {pattern.map((row, ry) =>
        row.map((cell, cx) =>
          cell ? (
            <rect
              key={`${ry}-${cx}`}
              x={cx * cellSize}
              y={ry * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#000"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

function MiniBarcode({ width, height }: { width: number; height: number }) {
  const widths = [2, 1, 3, 1, 2, 1, 1, 3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1];
  let totalW = 0;
  for (const w of widths) totalW += w + 1;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${totalW} 20`} preserveAspectRatio="none">
      {(() => {
        let x = 0;
        return widths.map((w, i) => {
          const rect = <rect key={i} x={x} y={0} width={w} height={20} fill="#000" />;
          x += w + 1;
          return rect;
        });
      })()}
    </svg>
  );
}
