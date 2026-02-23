// src/components/git-visualizer/RemoteStatus.jsx
import React from "react";

export default function RemoteStatus({ remoteInfo, localCommitsCount, remoteCommitsCount }) {
  if (!remoteInfo) return null;

  let status = "synced";
  let statusText = "En sincronización";
  
  if (localCommitsCount > remoteCommitsCount) {
    status = "ahead";
    statusText = `Local adelante (${localCommitsCount - remoteCommitsCount} commits)`;
  } else if (localCommitsCount < remoteCommitsCount) {
    status = "behind";
    statusText = `Remoto adelante (${remoteCommitsCount - localCommitsCount} commits)`;
  }

  return (
    <div className={`remote-status remote-status--${status}`}>
      <div className="remote-status__title">
        📦 {remoteInfo.name}
      </div>
      <div className="remote-status__info">
        <div>URL: {remoteInfo.url}</div>
        <div>Rama principal: {remoteInfo.defaultBranch}</div>
        {remoteInfo.lastPushedBranch && (
          <div>Última rama pusheada: {remoteInfo.lastPushedBranch}</div>
        )}
        <div style={{ marginTop: 4, fontWeight: 500, color: "var(--vsc-text)" }}>
          {statusText}
        </div>
      </div>
    </div>
  );
}
