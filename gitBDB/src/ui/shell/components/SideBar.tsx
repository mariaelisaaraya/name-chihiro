import React, { useEffect, useState } from "react";
import type { ViewMode } from "./ActivityBar";
import ExplorerPanel from "../../panels/ExplorerPanel";
import InstructionsPanel from "../../panels/InstructionsPanel";
import GitVisualizerPanel from "../../panels/GitVisualizerPanel";
import MissionsPanelWrapper from "../../panels/MissionsPanelWrapper";
import ChihiroZKPanel from "../../../components/chihiro/ChihiroZKPanel";
import { isRitualComplete, getRitualCommits } from "../../../activities/chihiroValidators";

interface SideBarProps {
  activeView: ViewMode;
  activity?: any;
  theme?: "dark" | "light";
  resetKey?: string;
  onToggleGitGraph?: () => void;
  isGitGraphMaximized?: boolean;
}

const VIEW_TITLES: Record<ViewMode, string> = {
  explorer: "EXPLORER",
  instructions: "INSTRUCTIONS",
  visualizer: "GIT GRAPH",
  missions: "MISSIONS",
};

export default function SideBar({ activeView, activity, theme = "dark", resetKey, onToggleGitGraph, isGitGraphMaximized }: SideBarProps) {
  const isChihiro = activity?.id === "chihiro";
  const [ritualComplete, setRitualComplete] = useState(false);
  const [ritualCommits, setRitualCommits] = useState<any[]>([]);
  const [ritualBranches, setRitualBranches] = useState<string[]>([]);

  useEffect(() => {
    if (!isChihiro) return;
    const check = async () => {
      const complete = await isRitualComplete();
      const commits = await getRitualCommits();
      setRitualComplete(complete);
      setRitualCommits(commits);
      const branches = [...new Set(commits.map((c: any) => c.branch))];
      setRitualBranches(branches);
    };
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, [isChihiro, resetKey]);

  const renderContent = () => {
    switch (activeView) {
      case "explorer":
        return (
          <>
            {isChihiro && (
              <div style={{ borderBottom: "1px solid rgba(100,180,255,0.15)" }}>
                <ChihiroZKPanel
                  ritualComplete={ritualComplete}
                  localCommits={ritualCommits}
                  localBranches={ritualBranches}
                />
              </div>
            )}
            <ExplorerPanel />
          </>
        );
      case "instructions":
        return <InstructionsPanel activity={activity} />;
      case "visualizer":
        return (
          <GitVisualizerPanel
            theme={theme}
            resetKey={resetKey}
            onToggleMaximize={onToggleGitGraph}
            isMaximized={isGitGraphMaximized}
          />
        );
      case "missions":
        return <MissionsPanelWrapper activity={activity} theme={theme} />;
      default:
        return <div style={{ padding: 16, fontSize: 12, opacity: 0.6 }}>Panel no encontrado</div>;
    }
  };

  const titleOverride = isChihiro ? "🌊 CHIHIRO'S LOST NAME" : VIEW_TITLES[activeView];

  return (
    <div style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: "10px 12px",
          borderBottom: isChihiro ? "1px solid rgba(100,180,255,0.2)" : "1px solid var(--vsc-border)",
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          opacity: 0.9,
          background: isChihiro
            ? "linear-gradient(90deg, rgba(30,10,60,0.5), rgba(10,20,60,0.5))"
            : "rgba(255, 255, 255, 0.02)",
          color: isChihiro ? "#f0c060" : undefined,
        }}
      >
        {titleOverride}
      </div>
      <div
        key={activeView}
        className="sidebar-panel-content"
        style={{ flex: 1, overflow: "auto" }}
      >
        {renderContent()}
      </div>
    </div>
  );
}
