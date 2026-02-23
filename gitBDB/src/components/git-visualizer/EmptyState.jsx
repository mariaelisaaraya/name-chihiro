// src/components/git-visualizer/EmptyState.jsx
import React from "react";

export default function EmptyState({ icon, title, message, command }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <h4 className="empty-state__title">{title}</h4>
      <p className="empty-state__message">{message}</p>
      {command && (
        <div className="empty-state__code">{command}</div>
      )}
    </div>
  );
}
