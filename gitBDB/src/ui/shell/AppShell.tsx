import React, { useEffect, useMemo, useState } from "react";
import "./AppShell.css";
import ActivityBar, { type ViewMode } from "./components/ActivityBar";
import SideBar from "./components/SideBar";
import ResizeHandle from "./components/ResizeHandle";
import HorizontalResizeHandle from "./components/HorizontalResizeHandle";
import GitVisualizerPanel from "../panels/GitVisualizerPanel";

export type AppShellProps = {
  theme?: "dark" | "light";
  activity?: any;
  editorArea?: React.ReactNode;
  bottomPanel?: React.ReactNode;
  statusLeft?: React.ReactNode;
  statusRight?: React.ReactNode;
  resetKey?: string;
};

export default function AppShell({
  theme = "dark",
  activity,
  editorArea,
  bottomPanel,
  statusLeft,
  statusRight,
  resetKey,
}: AppShellProps) {
  const [activeView, setActiveView] = useState<ViewMode>("explorer");
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window === "undefined") return 280;
    const stored = window.localStorage.getItem("vsc-sidebar-width");
    const num = stored ? parseInt(stored, 10) : 280;
    if (Number.isNaN(num)) return 280;
    return Math.min(520, Math.max(220, num));
  });
  const [bottomPanelHeight, setBottomPanelHeight] = useState<number>(() => {
    if (typeof window === "undefined") return 260;
    const stored = window.localStorage.getItem("vsc-bottompanel-height");
    const num = stored ? parseInt(stored, 10) : 260;
    if (Number.isNaN(num)) return 260;
    const maxHeight = window.innerHeight * 0.7;
    return Math.min(maxHeight, Math.max(160, num));
  });
  const [maximizedPanel, setMaximizedPanel] = useState<null | "git-graph">(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("vsc-sidebar-width", String(sidebarWidth));
    }
  }, [sidebarWidth]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("vsc-bottompanel-height", String(bottomPanelHeight));
    }
  }, [bottomPanelHeight]);

  const gridStyle = useMemo(
    () => ({
      gridTemplateColumns: maximizedPanel
        ? "48px 0px 0px 1fr"
        : `48px ${sidebarWidth}px 4px 1fr`,
      gridTemplateRows: `1fr auto ${bottomPanelHeight}px 24px`,
    }),
    [sidebarWidth, maximizedPanel, bottomPanelHeight]
  );

  const handleToggleGitGraph = () => {
    setMaximizedPanel((prev) => (prev === "git-graph" ? null : "git-graph"));
  };

  return (
    <div className="vscode-app" data-theme={theme}>
      <div className="vscode-grid" style={gridStyle}>
        <aside className="vscode-activitybar">
          <ActivityBar activeView={activeView} onViewChange={setActiveView} />
        </aside>

        <aside className="vscode-sidebar" style={{ width: maximizedPanel ? 0 : sidebarWidth }}>
          {!maximizedPanel && (
            <SideBar
              activeView={activeView}
              activity={activity}
              theme={theme}
              resetKey={resetKey}
              onToggleGitGraph={handleToggleGitGraph}
              isGitGraphMaximized={maximizedPanel === "git-graph"}
            />
          )}
        </aside>

        {!maximizedPanel && (
          <ResizeHandle
            onResize={(w: number) => setSidebarWidth(Math.min(520, Math.max(220, w)))}
            disabled={!!maximizedPanel}
          />
        )}

        <section className="vscode-editor">
          {maximizedPanel === "git-graph" ? (
            <GitVisualizerPanel
              theme={theme}
              resetKey={`full-${resetKey}`}
              onToggleMaximize={handleToggleGitGraph}
              isMaximized
            />
          ) : (
            editorArea ?? <div className="vscode-placeholder">Editor Area</div>
          )}
        </section>

        <HorizontalResizeHandle
          onResize={(h: number) => setBottomPanelHeight(Math.min(window.innerHeight * 0.7, Math.max(160, h)))}
          minHeight={160}
          maxHeightPercent={0.7}
        />

        <section className="vscode-bottompanel">
          {bottomPanel ?? <div className="vscode-placeholder">Bottom Panel</div>}
        </section>

        <footer className="vscode-statusbar">
          <div className="status-left">{statusLeft}</div>
          <div className="status-right">{statusRight}</div>
        </footer>
      </div>
    </div>
  );
}

export type { ViewMode };
