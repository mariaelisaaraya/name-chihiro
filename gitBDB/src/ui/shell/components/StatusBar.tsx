import React from "react";
import { useTheme } from "../../theme/ThemeProvider";

export default function StatusBar({ left, right }: { left?: React.ReactNode; right?: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {left}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {right}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          style={{
            background: "transparent",
            border: "none",
            color: "#ffffff",
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: 3,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 4,
            opacity: 0.85,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.85")}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>
    </div>
  );
}
