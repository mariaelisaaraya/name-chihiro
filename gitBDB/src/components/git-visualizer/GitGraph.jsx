// src/components/git-visualizer/GitGraph.jsx
import React from "react";
import CommitNode from "./CommitNode";
import BranchBadge from "./BranchBadge";

const BRANCH_COLORS = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#eab308", // yellow
  "#ec4899", // pink
  "#a855f7", // purple
  "#14b8a6", // teal
  "#f97316", // orange
];

export default function GitGraph({ branchGraph, currentBranch, onBranchClick }) {
  if (branchGraph.length === 0) {
    return null;
  }

  return (
    <div className="commit-graph">
      <div style={{ marginBottom: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {branchGraph.map((branch, idx) => (
          <BranchBadge
            key={branch.name}
            name={branch.name}
            color={BRANCH_COLORS[idx % BRANCH_COLORS.length]}
            isActive={branch.name === currentBranch}
            onClick={() => onBranchClick && onBranchClick(branch.name)}
          />
        ))}
      </div>

      {branchGraph.map((branch, idx) => {
        const color = BRANCH_COLORS[idx % BRANCH_COLORS.length];
        const commits = [...branch.commits].reverse(); // más viejo primero
        const isActive = branch.name === currentBranch;

        return (
          <div key={branch.name} className="commit-graph__branch-row">
            <div
              className={`commit-graph__branch-label ${
                isActive
                  ? "commit-graph__branch-label--active"
                  : "commit-graph__branch-label--inactive"
              }`}
            >
              {branch.name}
            </div>
            <div className="commit-graph__commits">
              {commits.length === 0 ? (
                <span style={{ color: "#6b7280", fontSize: "11px" }}>
                  (sin commits)
                </span>
              ) : (
                commits.map((commit, i) => (
                  <CommitNode
                    key={commit.oid + i}
                    commit={commit}
                    color={color}
                    isHead={isActive && i === commits.length - 1}
                    isLast={i === commits.length - 1}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
