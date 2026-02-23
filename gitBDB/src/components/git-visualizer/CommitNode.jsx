// src/components/git-visualizer/CommitNode.jsx
import React, { useState } from "react";

export default function CommitNode({ commit, color, isHead, isLast }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="commit-graph__commit-group">
      <div
        className={`commit-node ${isHead ? "commit-node--new" : ""}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div
          className={`commit-node__circle ${isHead ? "commit-node__circle--head" : ""}`}
          style={{ background: color }}
        />
        {showTooltip && (
          <div className="commit-node__tooltip">
            <div style={{ fontFamily: "var(--vsc-mono, monospace)", marginBottom: 2 }}>
              {commit.oid.slice(0, 7)}
            </div>
            <div style={{ marginBottom: 2 }}>{commit.message}</div>
            <div style={{ fontSize: "10px", opacity: 0.7 }}>
              {new Date(commit.timestamp * 1000).toLocaleString()}
            </div>
          </div>
        )}
      </div>
      {!isLast && <div className="commit-node__connector" />}
    </div>
  );
}
