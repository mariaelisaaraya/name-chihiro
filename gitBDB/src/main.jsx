import { Buffer } from "buffer";

if (!window.Buffer) {
  window.Buffer = Buffer;
}

// i18n must be initialized before any component renders
// react-i18next detects browser language automatically and persists to localStorage
import "./i18n/i18n.js";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./ui/theme/ThemeProvider";
import "./index.css";
import HomePage from "./pages/HomePage.jsx";
import ActivityPage from "./pages/ActivityPage.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/act/:activityId" element={<ActivityPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
