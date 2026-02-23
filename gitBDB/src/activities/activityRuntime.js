// src/activities/activityRuntime.js
// Runtime state para saber qué actividad está activa.
// Usado por commandRunner para validar comandos permitidos.

import { getActivityById } from "./registry";
import { t } from "../i18n/getLang.js";

let currentActivityId = null;

export function setCurrentActivityId(id) {
  currentActivityId = id;
}

export function getCurrentActivityId() {
  return currentActivityId;
}

export function getCurrentActivityConfig() {
  if (!currentActivityId) return null;
  return getActivityById(currentActivityId);
}

export function isCommandAllowed(commandKey) {
  const config = getCurrentActivityConfig();
  if (!config) return true; // no activity loaded — allow everything
  if (!config.allowedCommands) return true; // no allowlist — allow everything
  return config.allowedCommands.includes(commandKey);
}

export function getBlockedCommandMessage(commandKey) {
  return t("blockedCommand", { cmd: commandKey });
}
