// src/MissionsPanel.jsx
// React best practices applied:
//   · React.memo — prevents re-render when parent re-renders with same props
//   · useCallback — stable handler references passed as props
//   · useLanguage — live ES/EN translations

import React, { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const MissionCard = memo(function MissionCard({ mission, result, isLoading, onValidate, theme }) {
  const { t } = useTranslation();

  const statusColor = result
    ? result.ok ? "#22c55e" : "#ef4444"
    : "#6b7280";
  const statusText = result
    ? result.ok ? t("statusCompleted") : t("statusErrors")
    : t("statusPending");

  const handleValidate = useCallback(() => onValidate(mission), [onValidate, mission]);

  return (
    <div style={{
      background: "#020617",
      borderRadius: 8,
      border: "1px solid #1f2937",
      padding: 10,
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 14, color: "#e5e7eb" }}>
          {mission.title}
        </h3>
        <span style={{
          fontSize: 11,
          padding: "2px 6px",
          borderRadius: 999,
          background: statusColor + "20",
          color: statusColor,
          border: `1px solid ${statusColor}60`,
          whiteSpace: "nowrap",
        }}>
          {statusText}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{mission.description}</p>

      {result && !result.ok && result.errors?.length > 0 && (
        <ul style={{ margin: "4px 0 0 0", paddingLeft: 16, fontSize: 11, color: "#f97316" }}>
          {result.errors.map((err, i) => <li key={i}>{err}</li>)}
        </ul>
      )}

      {result && result.ok && (
        <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "#22c55e" }}>
          {t("missionSuccess")}
        </p>
      )}

      <div style={{ marginTop: 6 }}>
        <button
          onClick={handleValidate}
          disabled={isLoading}
          style={{
            background: "#3b82f6",
            border: "none",
            borderRadius: 4,
            padding: "4px 8px",
            fontSize: 12,
            color: "#f9fafb",
            cursor: "pointer",
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? t("validating") : t("validateBtn")}
        </button>
      </div>
    </div>
  );
});

export const MissionsPanel = memo(function MissionsPanel({ missions = [], theme, runValidator }) {
  const { t } = useTranslation();
  const [results, setResults] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  const handleValidate = useCallback(async (mission) => {
    setLoadingId(mission.id);
    try {
      const result = runValidator
        ? await runValidator(mission.validatorKey)
        : { ok: false, errors: [t("noValidator")] };
      setResults((prev) => ({ ...prev, [mission.id]: result }));
    } catch (e) {
      setResults((prev) => ({
        ...prev,
        [mission.id]: { ok: false, errors: [`Error: ${e.message || String(e)}`] },
      }));
    } finally {
      setLoadingId(null);
    }
  }, [runValidator, t]);

  const visibleMissions = useMemo(() => missions, [missions]);

  return (
    <div style={{
      background: theme === "dark" ? "#0C0C0C" : "#ffffff",
      border: `1px solid ${theme === "dark" ? "#1f2937" : "#cbd5e1"}`,
      color: theme === "dark" ? "#e5e7eb" : "#1f2937",
      marginTop: 16,
      borderRadius: 8,
      padding: 12,
    }}>
      <h2 style={{ margin: "0 0 8px 0", fontSize: 18, color: theme === "dark" ? "#e5e7eb" : "#1f2937" }}>
        {t("missionsPanelTitle")}
      </h2>
      <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#9ca3af" }}>
        {t("missionsPanelDesc")}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
        {visibleMissions.map((m) => (
          <MissionCard
            key={m.id}
            mission={m}
            result={results[m.id]}
            isLoading={loadingId === m.id}
            onValidate={handleValidate}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
});

export default MissionsPanel;
