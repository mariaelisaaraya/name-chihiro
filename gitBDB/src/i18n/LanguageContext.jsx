// src/i18n/LanguageContext.jsx
// Language system — mirrors the ThemeProvider pattern already in the project.
// Supported: "es" (default) | "en"
// Persists selection to localStorage under "gitbdb-lang".
//
// Usage:
//   const { lang, t, toggleLang } = useLanguage();
//   t("missionsPanelTitle")  → "Misiones de práctica" | "Practice missions"
//   t("validM2Missing", "clue:2, clue:3")  → calls the function with argument

import React, { createContext, useCallback, useContext, useState } from "react";
import { translations } from "./translations";

const LanguageContext = createContext({
  lang: "es",
  t: (key, ...args) => key,
  toggleLang: () => {},
  setLang: () => {},
});

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem("gitbdb-lang");
    return saved === "en" ? "en" : "es";
  });

  // t() — translate a key.
  // If the value is a function, call it with the extra args (for interpolation).
  // Falls back to "es" then to the key itself if missing.
  const t = useCallback(
    (key, ...args) => {
      const dict = translations[lang] ?? translations.es;
      const val = dict[key] ?? translations.es[key] ?? key;
      return typeof val === "function" ? val(...args) : val;
    },
    [lang]
  );

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === "es" ? "en" : "es";
      localStorage.setItem("gitbdb-lang", next);
      return next;
    });
  }, []);

  const setLang = useCallback((newLang) => {
    if (newLang === "es" || newLang === "en") {
      localStorage.setItem("gitbdb-lang", newLang);
      setLangState(newLang);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}
