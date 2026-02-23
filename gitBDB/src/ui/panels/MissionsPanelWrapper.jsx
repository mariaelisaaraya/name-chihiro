// src/ui/panels/MissionsPanelWrapper.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import { validators } from "../../activities/validators";
import MissionsPanel from "../../MissionsPanel";

/**
 * Adapter that takes missions declared in the activity (with validatorKey)
 * and runs the corresponding validator.
 */
export default function MissionsPanelWrapper({ activity, theme }) {
  const { t } = useTranslation();
  const missions = activity?.missions || [];

  const runValidator = async (validatorKey) => {
    const fn = validators[validatorKey];
    if (!fn) {
      return {
        ok: false,
        errors: [t("noValidator")],
      };
    }
    try {
      return await fn();
    } catch (e) {
      return {
        ok: false,
        errors: [e?.message || String(e) || t("noValidator")],
      };
    }
  };

  return <MissionsPanel missions={missions} theme={theme} runValidator={runValidator} />;
}
