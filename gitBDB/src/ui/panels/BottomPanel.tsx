import React, { useState } from "react";

type TabKey = "terminal" | "output" | "problems";

export default function BottomPanel({ children }: { children?: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabKey>("terminal");

  const renderContent = () => {
    if (activeTab === "terminal") return children ?? <div className="panel-empty">Bottom panel content</div>;
    if (activeTab === "output") return <div className="panel-empty">Output channel vacío</div>;
    return <div className="panel-empty">Sin problemas detectados</div>;
  };

  return (
    <div className="panel-surface">
      <div className="panel-tabbar" role="tablist" aria-label="Bottom panel tabs">
        {[
          { key: "terminal" as TabKey, label: "Terminal" },
          { key: "output" as TabKey, label: "Output" },
          { key: "problems" as TabKey, label: "Problems" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`panel-tab ${activeTab === tab.key ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
            role="tab"
            aria-selected={activeTab === tab.key}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="panel-content">{renderContent()}</div>
    </div>
  );
}
