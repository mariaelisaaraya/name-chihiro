// src/i18n/i18n.js
// Internationalization setup using react-i18next (industry standard 2025).
//
// Architecture decisions:
//   - 3 namespaces (common, terminal, zk) → smaller initial bundles, better maintainability
//   - Resources bundled inline (no HTTP backend) → works offline, on all platforms, no CORS
//   - Browser language detection via i18next-browser-languagedetector
//   - Persists user choice to localStorage under "gitbdb-lang"
//   - Fallback language: "es" (Spanish) — LatAm-focused tool
//   - Supported: "es" | "en"
//
// Usage in components:
//   import { useTranslation } from "react-i18next";
//   const { t } = useTranslation();           // "common" namespace
//   const { t } = useTranslation("terminal"); // terminal namespace
//   const { t } = useTranslation("zk");       // ZK panel namespace
//
// Language switching:
//   const { i18n } = useTranslation();
//   i18n.changeLanguage("en");               // switches + persists to localStorage

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// ── Namespace: common ──────────────────────────────────────────────────────────
import esCommon from "../../public/locales/es/common.json";
import enCommon from "../../public/locales/en/common.json";

// ── Namespace: terminal ────────────────────────────────────────────────────────
import esTerminal from "../../public/locales/es/terminal.json";
import enTerminal from "../../public/locales/en/terminal.json";

// ── Namespace: zk ──────────────────────────────────────────────────────────────
import esZk from "../../public/locales/es/zk.json";
import enZk from "../../public/locales/en/zk.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Bundled resources (no HTTP fetch required — works offline, on all platforms)
    resources: {
      es: { common: esCommon, terminal: esTerminal, zk: esZk },
      en: { common: enCommon, terminal: enTerminal, zk: enZk },
    },

    supportedLngs: ["es", "en"],
    fallbackLng: "es",

    defaultNS: "common",
    ns: ["common", "terminal", "zk"],

    // Language detection: check localStorage first (user preference), then browser language
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "gitbdb-lang",
      caches: ["localStorage"],
    },

    interpolation: {
      // React already handles XSS escaping — no need to double-escape
      escapeValue: false,
    },
  });

export default i18n;
