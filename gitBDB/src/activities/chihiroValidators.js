// src/activities/chihiroValidators.js
// Mission validators for "Chihiro's Lost Name"
// Uses isomorphic-git to inspect the in-browser virtual filesystem.

import * as git from "isomorphic-git";
import { fs, REPO_DIR } from "../gitFs";
import { t } from "../i18n/getLang.js";

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function listBranches() {
  try {
    return await git.listBranches({ fs, dir: REPO_DIR });
  } catch {
    return [];
  }
}

async function commitsOnBranch(branch) {
  try {
    const log = await git.log({ fs, dir: REPO_DIR, ref: branch });
    return log.map((c) => c.commit.message.trim());
  } catch {
    return [];
  }
}

/**
 * Returns all commit messages across every rescue/ branch.
 * Deduplicates — same message on two branches counts once.
 */
async function rescueCommitMessages() {
  const branches = await listBranches();
  const rescueBranches = branches.filter((b) => b.startsWith("rescue/"));
  const seen = new Set();
  for (const branch of rescueBranches) {
    for (const msg of await commitsOnBranch(branch)) {
      seen.add(msg);
    }
  }
  return seen;
}

// ─── Mission validators ───────────────────────────────────────────────────────

/** M1 — a rescue/ branch must exist */
export async function validateChihiroM1() {
  const branches = await listBranches();
  const found = branches.find((b) => b.startsWith("rescue/"));
  if (!found) {
    return {
      ok: false,
      errors: [t("validM1NoB")],
    };
  }
  return { ok: true, message: t("validM1Ok", { branch: found }) };
}

/** M2 — commits clue:1, clue:2, clue:3 must exist on any rescue/ branch */
export async function validateChihiroM2() {
  const branches = await listBranches();
  if (!branches.some((b) => b.startsWith("rescue/"))) {
    return { ok: false, errors: [t("validM2NeedM1")] };
  }

  const REQUIRED = ["clue:1", "clue:2", "clue:3"];
  const messages = await rescueCommitMessages();
  const missing = REQUIRED.filter((r) => !messages.has(r));

  if (missing.length > 0) {
    return {
      ok: false,
      errors: [
        t("validM2Missing", { missing: missing.join(", ") }),
        t("validM2Hint"),
      ],
    };
  }
  return { ok: true, message: t("validM2Ok") };
}

/** M3 — ZK proof was submitted (tracked in localStorage after recover_name succeeds) */
export async function validateChihiroM3() {
  const done = localStorage.getItem("chihiro-zk-proof-done") === "true";
  if (!done) {
    return {
      ok: false,
      errors: [t("validM3NotDone")],
    };
  }
  return { ok: true, message: t("validM3Ok") };
}

// ─── ZK panel helpers ─────────────────────────────────────────────────────────

/** True if M1 + M2 are both satisfied (enables the ZK proof button). */
export async function isRitualComplete() {
  const branches = await listBranches();
  if (!branches.some((b) => b.startsWith("rescue/"))) return false;
  const messages = await rescueCommitMessages();
  return ["clue:1", "clue:2", "clue:3"].every((r) => messages.has(r));
}

/**
 * Returns commits from rescue/ branches for display in the ZK panel.
 * Shape: { sha: string, message: string, branch: string }[]
 */
export async function getRitualCommits() {
  const branches = await listBranches();
  const rescueBranches = branches.filter((b) => b.startsWith("rescue/"));
  const result = [];
  for (const branch of rescueBranches) {
    try {
      const log = await git.log({ fs, dir: REPO_DIR, ref: branch });
      for (const c of log) {
        result.push({
          sha: c.oid.slice(0, 7),
          message: c.commit.message.trim(),
          branch,
        });
      }
    } catch { /* branch may be empty */ }
  }
  return result;
}
