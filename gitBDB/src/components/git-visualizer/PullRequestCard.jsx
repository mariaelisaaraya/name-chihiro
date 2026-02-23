// src/components/git-visualizer/PullRequestCard.jsx
import React from "react";

export default function PullRequestCard({ pr }) {
  const statusClass = pr.status === "MERGED" ? "pr-card__status--merged" : "pr-card__status--open";

  return (
    <div className="pr-card">
      <div className="pr-card__header">
        <div className="pr-card__title">
          #{pr.id} — {pr.title || `${pr.fromBranch} → ${pr.toBranch}`}
        </div>
        <div className={`pr-card__status ${statusClass}`}>
          {pr.status}
        </div>
      </div>
      <div className="pr-card__branches">
        {pr.fromBranch} → {pr.toBranch}
      </div>
      {pr.status === "OPEN" && (
        <div className="pr-card__hint">
          💡 Para mergear: <code>github pr merge {pr.id}</code>
        </div>
      )}
      {pr.status === "MERGED" && pr.mergedAt && (
        <div className="pr-card__hint" style={{ color: "#4ade80" }}>
          ✅ Mergeado el {new Date(pr.mergedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}
