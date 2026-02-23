import React, { useCallback, useRef } from "react";

type HorizontalResizeHandleProps = {
  onResize: (newHeight: number) => void;
  minHeight?: number;
  maxHeightPercent?: number;
};

export default function HorizontalResizeHandle({
  onResize,
  minHeight = 160,
  maxHeightPercent = 0.7,
}: HorizontalResizeHandleProps) {
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      startYRef.current = e.clientY;

      // Obtener altura actual del bottom panel
      const bottomPanel = document.querySelector(".vscode-bottompanel") as HTMLElement;
      if (bottomPanel) {
        startHeightRef.current = bottomPanel.offsetHeight;
      }

      // Bloquear selección de texto durante el drag
      document.body.style.userSelect = "none";
      document.body.style.cursor = "row-resize";

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDraggingRef.current) return;

        // Calcular nueva altura (arrastrar hacia arriba = más altura)
        const deltaY = startYRef.current - moveEvent.clientY;
        const newHeight = startHeightRef.current + deltaY;

        // Aplicar límites
        const maxHeight = window.innerHeight * maxHeightPercent;
        const clampedHeight = Math.min(maxHeight, Math.max(minHeight, newHeight));

        onResize(clampedHeight);
      };

      const handleMouseUp = () => {
        isDraggingRef.current = false;
        document.body.style.userSelect = "";
        document.body.style.cursor = "";

        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [onResize, minHeight, maxHeightPercent]
  );

  return (
    <div
      className="vscode-horizontal-resize-handle"
      onMouseDown={handleMouseDown}
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize bottom panel"
    />
  );
}
