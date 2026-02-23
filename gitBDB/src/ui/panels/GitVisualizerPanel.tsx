import React from "react";
import GitVisualizerEnhanced from "../../components/git-visualizer/GitVisualizerEnhanced";

interface GitVisualizerPanelProps {
  theme?: "dark" | "light";
  resetKey?: string;
  onToggleMaximize?: () => void;
  isMaximized?: boolean;
}

export default function GitVisualizerPanel({ theme = "dark", resetKey, onToggleMaximize, isMaximized }: GitVisualizerPanelProps) {
  return (
    <div style={{ padding: 12, height: "100%", overflow: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 12, letterSpacing: 0.8, opacity: 0.85, fontWeight: 700 }}>GIT GRAPH</span>
        {onToggleMaximize && (
          <button
            onClick={onToggleMaximize}
            title={isMaximized ? "Restaurar" : "Expandir"}
            style={{
              border: "1px solid var(--vsc-border)",
              background: "var(--vsc-hover-bg)",
              color: "var(--vsc-text)",
              borderRadius: 4,
              padding: "4px 8px",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {isMaximized ? "⤢" : "⤢"}
          </button>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <GitVisualizerEnhanced key={resetKey} theme={theme} />
      </div>
    </div>
  );
}
