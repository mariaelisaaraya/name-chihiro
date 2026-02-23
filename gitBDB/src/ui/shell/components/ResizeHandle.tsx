import React, { useEffect, useRef } from "react";

type Props = {
  onResize: (width: number) => void;
  disabled?: boolean;
};

export default function ResizeHandle({ onResize, disabled }: Props) {
  const dragging = useRef(false);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragging.current || disabled) return;
      e.preventDefault();
      const next = e.clientX - 48; // account for activity bar width
      onResize(next);
    };

    const handleUp = () => {
      dragging.current = false;
      document.body.style.cursor = "auto";
      document.body.style.userSelect = "auto";
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [disabled, onResize]);

  return (
    <div
      className="vscode-resize-handle"
      onMouseDown={(e) => {
        if (disabled) return;
        dragging.current = true;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        e.preventDefault();
      }}
    />
  );
}
