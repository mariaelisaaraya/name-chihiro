// src/components/git-visualizer/BranchBadge.jsx
import React from "react";

export default function BranchBadge({ name, color, isActive, onClick }) {
  return (
    <div
      className={`branch-badge ${isActive ? "branch-badge--active branch-badge--new" : ""}`}
      style={{
        background: `${color}20`,
        color,
        borderColor: isActive ? color : "transparent",
      }}
      onClick={onClick}
      title={isActive ? "Rama actual" : `Click para cambiar a ${name}`}
    >
      <div className="branch-badge__icon" style={{ background: color }} />
      <span>{name}</span>
    </div>
  );
}
