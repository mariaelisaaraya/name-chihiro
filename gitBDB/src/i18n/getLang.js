// src/i18n/getLang.js
// Utility for non-React modules (commandRunner.js, chihiroValidators.js)
// that can't use React hooks but still need translated strings.
//
// Uses the i18next instance directly — same source of truth as useTranslation().
// Works in any JS module (not just React components).
//
// Usage:
//   import { t, tNs } from "../i18n/getLang.js";
//   t("validM1NoB")               // common namespace (default)
//   tNs("terminal", "helpTitle")  // explicit namespace
//
// Key prefix routing (backward-compat with old translation keys):
//   Keys starting with "term", "help", "hint", "conflict", "prList" → terminal namespace
//   Keys starting with "zk", "admin", "player", "log", "role", "wallet" → zk namespace
//   Everything else → common namespace

import i18n from "./i18n.js";

/** Current active language code: "es" | "en" */
export function getLang() {
  return i18n.language?.startsWith("en") ? "en" : "es";
}

/** Detect which namespace a key belongs to based on its prefix */
function detectNs(key) {
  if (
    key.startsWith("term") ||
    key.startsWith("help") ||
    key.startsWith("hint") ||
    key.startsWith("conflict") ||
    key.startsWith("prList")
  ) return "terminal";

  if (
    key.startsWith("zk") ||
    key.startsWith("admin") ||
    key.startsWith("player") ||
    key.startsWith("logW") ||
    key.startsWith("logN") ||
    key.startsWith("logI") ||
    key.startsWith("logG") ||
    key.startsWith("logL") ||
    key.startsWith("logR") ||
    key.startsWith("logP") ||
    key.startsWith("logS") ||
    key.startsWith("logE") ||
    key.startsWith("role") ||
    key.startsWith("wallet") ||
    key.startsWith("ghErr") ||
    key.startsWith("ghOk") ||
    key.startsWith("ritual") ||
    key.startsWith("seeOn")
  ) return "zk";

  return "common";
}

/** Strip the "term" prefix from a key for the terminal namespace */
function normalizeKey(key, ns) {
  if (ns === "terminal" && key.startsWith("term")) {
    // termWelcome → welcome, termHelp → help, termCatNotFound → catNotFound, etc.
    const stripped = key.slice(4);
    return stripped.charAt(0).toLowerCase() + stripped.slice(1);
  }
  return key;
}

/**
 * Translate a key. Namespace is auto-detected from the key prefix.
 * Supports i18next interpolation objects: t("validM2Missing", { missing: "clue:2" })
 * Also supports legacy positional args for backward compat:
 *   t("validM1Ok", branch) → t("validM1Ok", { branch })
 */
export function t(key, interpolationOrLegacyArg) {
  const ns = detectNs(key);
  const normalizedKey = normalizeKey(key, ns);
  const nsKey = ns === "common" ? normalizedKey : `${ns}:${normalizedKey}`;

  // Support legacy positional arg style: t("key", "someValue")
  // Wraps it in an object using the last word of the key as the param name
  let interpolation = interpolationOrLegacyArg;
  if (typeof interpolationOrLegacyArg === "string") {
    // Best-effort: extract param name from key suffix
    const match = key.match(/([A-Z][a-z]+)$/);
    const param = match ? match[1].charAt(0).toLowerCase() + match[1].slice(1) : "value";
    interpolation = { [param]: interpolationOrLegacyArg };
  }

  return i18n.t(nsKey, interpolation);
}

/**
 * Translate a key from a specific namespace.
 * tNs("terminal", "helpTitle")
 */
export function tNs(ns, key, interpolation) {
  return i18n.t(`${ns}:${key}`, interpolation);
}
