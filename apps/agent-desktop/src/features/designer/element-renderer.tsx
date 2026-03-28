import type { CardElement } from "@/lib/models/card-element";

interface ElementRendererProps {
  element: CardElement;
  isSelected: boolean;
}

export function ElementRenderer({ element, isSelected }: ElementRendererProps) {
  switch (element.type) {
    case "text":
      return <TextElement element={element} isSelected={isSelected} />;
    case "image":
      return <ImageElement element={element} />;
    case "qrCode":
      return <QrCodeElement element={element} />;
    case "barcode":
      return <BarcodeElement element={element} />;
    case "rectangle":
      return <RectangleElement element={element} />;
    case "circle":
      return <CircleElement element={element} />;
    case "line":
      return <LineElement element={element} />;
    default:
      return null;
  }
}

function TextElement({
  element,
  isSelected,
}: {
  element: CardElement;
  isSelected: boolean;
}) {
  if (element.isDynamicField) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          fontSize: element.fontSize,
          fontWeight: element.isBold ? "bold" : "normal",
          fontStyle: element.isItalic ? "italic" : "normal",
          color: element.textColor,
          textAlign: element.textAlignment,
          fontFamily: element.fontName,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        <span
          style={{
            background: isSelected
              ? "rgba(59, 130, 246, 0.15)"
              : "rgba(124, 58, 237, 0.1)",
            borderRadius: 3,
            padding: "0 4px",
            border: "1px dashed rgba(124, 58, 237, 0.5)",
            fontSize: element.fontSize,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            width: "100%",
          }}
        >
          {`{${element.fieldKey || "field"}}`}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        fontSize: element.fontSize,
        fontWeight: element.isBold ? "bold" : "normal",
        fontStyle: element.isItalic ? "italic" : "normal",
        color: element.textColor,
        textAlign: element.textAlignment,
        fontFamily: element.fontName,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        lineHeight: 1.3,
        userSelect: "none",
      }}
    >
      {element.textContent || "Text"}
    </div>
  );
}

function ImageElement({ element }: { element: CardElement }) {
  if (element.imageData) {
    return (
      <img
        src={element.imageData}
        alt=""
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: element.cornerRadius,
          pointerEvents: "none",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#f1f5f9",
        border: "2px dashed #94a3b8",
        borderRadius: element.cornerRadius,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#64748b",
        fontSize: 12,
        userSelect: "none",
        gap: 4,
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
      <span>Image</span>
    </div>
  );
}

function QrCodeElement({ element }: { element: CardElement }) {
  const size = Math.min(element.width, element.height);
  const cellCount = 7;
  const cellSize = (size * 0.7) / cellCount;

  // Simple deterministic QR-like pattern
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
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        userSelect: "none",
      }}
    >
      <svg
        width={cellCount * cellSize}
        height={cellCount * cellSize}
        viewBox={`0 0 ${cellCount * cellSize} ${cellCount * cellSize}`}
      >
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
    </div>
  );
}

function BarcodeElement({ element }: { element: CardElement }) {
  // Generate a repeating barcode-like pattern
  const bars: Array<{ x: number; w: number }> = [];
  let x = 0;
  const widths = [2, 1, 3, 1, 2, 1, 1, 3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1];
  for (const w of widths) {
    bars.push({ x, w });
    x += w + 1;
  }
  const totalWidth = x;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        padding: "4px 8px",
        userSelect: "none",
      }}
    >
      <svg
        width="100%"
        height={element.height * 0.6}
        viewBox={`0 0 ${totalWidth} 40`}
        preserveAspectRatio="none"
      >
        {bars.map((bar, i) => (
          <rect
            key={i}
            x={bar.x}
            y={0}
            width={bar.w}
            height={40}
            fill="#000"
          />
        ))}
      </svg>
      <span style={{ fontSize: 10, color: "#666", marginTop: 2 }}>
        {element.codeContent || "123456789"}
      </span>
    </div>
  );
}

function RectangleElement({ element }: { element: CardElement }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: element.fillColor,
        border: `${element.strokeWidth}px solid ${element.strokeColor}`,
        borderRadius: element.cornerRadius,
        boxSizing: "border-box",
      }}
    />
  );
}

function CircleElement({ element }: { element: CardElement }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: element.fillColor,
        border: `${element.strokeWidth}px solid ${element.strokeColor}`,
        borderRadius: "50%",
        boxSizing: "border-box",
      }}
    />
  );
}

function LineElement({ element }: { element: CardElement }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          height: element.strokeWidth,
          backgroundColor: element.strokeColor,
        }}
      />
    </div>
  );
}
