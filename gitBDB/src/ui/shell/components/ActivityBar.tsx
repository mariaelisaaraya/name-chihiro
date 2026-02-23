import React from "react";

type ViewMode = "explorer" | "instructions" | "visualizer" | "missions";

interface ActivityBarProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export default function ActivityBar({ activeView, onViewChange }: ActivityBarProps) {
  const items: Array<{ id: ViewMode; label: string; emoji: string }> = [
    { id: "explorer", label: "Explorer", emoji: "🗂️" },
    { id: "instructions", label: "Instructions", emoji: "📋" },
    { id: "visualizer", label: "Git Graph", emoji: "🌳" },
    { id: "missions", label: "Missions", emoji: "🎯" },
  ];

  return (
    <>
      {/* Vertical sidebar nav — desktop */}
      <nav
        className="activity-bar-container"
        role="navigation"
        aria-label="Main navigation"
      >
        {items.map((it) => {
          const isActive = activeView === it.id;
          return (
            <button
              key={it.id}
              title={it.label}
              onClick={() => onViewChange(it.id)}
              aria-label={it.label}
              aria-current={isActive ? "page" : undefined}
              className={`activity-bar-icon${isActive ? " is-active" : ""}`}
            >
              <span className="activity-bar-emoji">{it.emoji}</span>
              {isActive && <span className="activity-bar-indicator" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>

      {/* Horizontal bottom nav — mobile only */}
      <nav
        className="mobile-bottom-nav"
        role="navigation"
        aria-label="Main navigation"
      >
        {items.map((it) => {
          const isActive = activeView === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onViewChange(it.id)}
              aria-label={it.label}
              aria-current={isActive ? "page" : undefined}
              className={`mobile-nav-btn${isActive ? " is-active" : ""}`}
            >
              <span style={{ fontSize: 20 }}>{it.emoji}</span>
              <span style={{ fontSize: 9, marginTop: 2, letterSpacing: 0.3 }}>{it.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

export type { ViewMode };
