// src/App.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Terminal } from "./Terminal";
import { initFileSystem } from "./gitFs";
import { useTheme } from "./ui/theme/ThemeProvider";
import { useTranslation } from "react-i18next";
import { EditorProvider } from "./ui/editor/EditorContext";
import AppShell from "./ui/shell/AppShell";
import EditorArea from "./ui/panels/EditorArea";
import BottomPanel from "./ui/panels/BottomPanel";
import StatusBar from "./ui/shell/components/StatusBar";
import SpiritWorldBackground from "./components/chihiro/SpiritWorldBackground";

function App({ activity, allActivities = [], navigateToActivity, resetting = false }) {
  const [resetId, setResetId] = useState(0);
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const toggleLang = () => i18n.changeLanguage(i18n.language?.startsWith("en") ? "es" : "en");

  const currentActivity = useMemo(() => activity, [activity]);
  const isChihiro = currentActivity?.id === "chihiro";

  useEffect(() => {
    initFileSystem();
  }, []);

  useEffect(() => {
    setResetId((id) => id + 1);
  }, [currentActivity?.id]);

  const resetKey = `${resetId}-${currentActivity?.id || "unknown"}`;

  const handleLangToggle = useCallback(() => toggleLang(), [i18n]);

  return (
    <EditorProvider>
      <SpiritWorldBackground active={isChihiro} />
      <AppShell
        theme={theme === "dark" ? "dark" : "light"}
        activity={currentActivity}
        resetKey={resetKey}
        editorArea={<EditorArea />}
        bottomPanel={
          <BottomPanel>
            <div style={{ padding: 8 }}>
              <Terminal key={`terminal-${resetKey}`} theme={theme} />
            </div>
          </BottomPanel>
        }
        statusLeft={
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
            <Link
              to="/"
              title="Volver al inicio / Back to home"
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                color: "rgba(255,255,255,0.7)",
                textDecoration: "none",
                padding: "1px 7px",
                borderRadius: 3,
                fontSize: 11,
                border: "1px solid rgba(255,255,255,0.12)",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
            >
              ← Home
            </Link>
            <span style={{ opacity: 0.4 }}>|</span>
            <span>
              {isChihiro ? "🌊 Chihiro's Lost Name" : (currentActivity?.id || t("noActivity"))}{" "}
              {resetting && `• ${t("resetting")}`}
            </span>
          </span>
        }
        statusRight={
          <StatusBar right={
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={handleLangToggle}
                title="Toggle language / Cambiar idioma"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 4,
                  color: "#c8e0ff",
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 7px",
                  letterSpacing: 0.5,
                  fontFamily: "inherit",
                }}
              >
                {t("langToggle")}
              </button>
              <span style={{ fontSize: 11, opacity: 0.8 }}>
                {isChihiro ? "⭐ Stellar Hacks: ZK Gaming · gitBDB" : "gitBDB Simulator"}
              </span>
            </span>
          } />
        }
      />
    </EditorProvider>
  );
}

export default App;
