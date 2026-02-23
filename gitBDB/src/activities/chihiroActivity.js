// src/activities/chihiroActivity.js
// "Chihiro's Lost Name" — ZK Gaming Hackathon activity
// Strings are pulled from translations at access time to react to ES/EN toggle.

import { t } from "../i18n/getLang.js";

// Returns activity with live-translated strings.
export function getChihiroActivity() {
  return {
    id: "chihiro",
    title: t("chihiroTitle"),
    description: t("chihiroDesc"),
    showEditor: false,
    isZKGame: true,
    stellarNetwork: "testnet",
    solutionCommands: [
      "git init",
      "git checkout -b rescue/chihiro",
      'git commit --allow-empty -m "clue:1"',
      'git commit --allow-empty -m "clue:2"',
      'git commit --allow-empty -m "clue:3"',
      t("solutionComment"),
    ],
    allowedCommands: [
      "help", "ls", "cat", "touch", "pwd",
      "git init", "git status", "git add", "git commit", "git log",
      "git branch", "git checkout",
    ],
    missions: [
      { id: "chihiro-m1", title: t("m1Title"), description: t("m1Desc"), validatorKey: "chihiro-m1", hint: t("m1Hint") },
      { id: "chihiro-m2", title: t("m2Title"), description: t("m2Desc"), validatorKey: "chihiro-m2", hint: t("m2Hint") },
      { id: "chihiro-m3", title: t("m3Title"), description: t("m3Desc"), validatorKey: "chihiro-m3", hint: t("m3Hint") },
    ],
    seedFiles: [{ path: "README.md", content: t("seedReadme") }],
  };
}

// Proxy-based export so getters re-read translations on each access.
// This means the mission titles update immediately when lang toggles.
export const CHIHIRO_ACTIVITY = {
  id: "chihiro",
  get title() { return t("chihiroTitle"); },
  get description() { return t("chihiroDesc"); },
  showEditor: false,
  isZKGame: true,
  stellarNetwork: "testnet",
  get solutionCommands() {
    return [
      "git init",
      "git checkout -b rescue/chihiro",
      'git commit --allow-empty -m "clue:1"',
      'git commit --allow-empty -m "clue:2"',
      'git commit --allow-empty -m "clue:3"',
      t("solutionComment"),
    ];
  },
  allowedCommands: [
    "help", "ls", "cat", "touch", "pwd",
    "git init", "git status", "git add", "git commit", "git log",
    "git branch", "git checkout",
  ],
  get missions() {
    return [
      { id: "chihiro-m1", title: t("m1Title"), description: t("m1Desc"), validatorKey: "chihiro-m1", hint: t("m1Hint") },
      { id: "chihiro-m2", title: t("m2Title"), description: t("m2Desc"), validatorKey: "chihiro-m2", hint: t("m2Hint") },
      { id: "chihiro-m3", title: t("m3Title"), description: t("m3Desc"), validatorKey: "chihiro-m3", hint: t("m3Hint") },
    ];
  },
  get seedFiles() { return [{ path: "README.md", content: t("seedReadme") }]; },
};
