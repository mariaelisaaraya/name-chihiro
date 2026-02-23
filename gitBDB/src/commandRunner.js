// src/commandRunner.js
import { t } from "./i18n/getLang.js";
import { REPO_DIR, listDir, readFile, writeFile, fileExists, fs, createFileWithTemplate } from "./gitFs";
import {
  gitInit,
  gitStatus,
  gitAdd,
  gitCommit,
  gitLog,
  gitListBranches,
  gitCreateBranch,
  gitCheckout,
  gitCheckoutCommit,
  gitMerge,
  gitRemoteAdd,
  gitRemoteRemove,
  gitRemoteList,
  gitPull,
  gitClone,
} from "./gitService";
import {
  createRemoteRepo,
  getRemoteStatus,
  pushToRemote,
  createPullRequest,
  listPullRequests,
  mergePullRequest,
  pagesPublish,
  pagesRepublish,
} from "./githubSim";
import { isCommandAllowed, getBlockedCommandMessage } from "./activities/activityRuntime";

const KNOWN_GIT_FULL = [
  "git init",
  "git status",
  "git add",
  "git commit",
  "git log",
  "git branch",
  "git checkout",
  "git merge",
  "git push",
  "git pull",
  "git remote",
  "git clone",
  "git pages",
];

function suggestFullGitCommand(raw) {
  let best = null;
  let bestDistance = Infinity;

  for (const cmd of KNOWN_GIT_FULL) {
    const d = levenshtein(raw, cmd.replace(" ", ""));
    // comparamos sin espacio: "gitinit" vs "git init"
    if (d < bestDistance) {
      bestDistance = d;
      best = cmd;
    }
  }

  if (bestDistance > 3) return null;
  return best;
}

// --- Sugerencias para comandos "github" ---

const KNOWN_GITHUB_SUBCOMMANDS = ["create", "status", "pr"];

function suggestGithubSubcommand(word) {
  let best = null;
  let bestDistance = Infinity;

  for (const candidate of KNOWN_GITHUB_SUBCOMMANDS) {
    const d = levenshtein(word, candidate);
    if (d < bestDistance) {
      bestDistance = d;
      best = candidate;
    }
  }

  if (bestDistance > 3) return null;
  return best;
}

const KNOWN_GITHUB_FULL = ["github create", "github status", "github pr"];

function suggestFullGithubCommand(raw) {
  let best = null;
  let bestDistance = Infinity;

  for (const cmd of KNOWN_GITHUB_FULL) {
    const d = levenshtein(raw, cmd.replace(" ", "")); // "githubcreate" vs "github create"
    if (d < bestDistance) {
      bestDistance = d;
      best = cmd;
    }
  }

  if (bestDistance > 3) return null;
  return best;
}




// Lista de subcomandos git que soporta el simulador
const KNOWN_GIT_SUBCOMMANDS = [
  "init",
  "status",
  "add",
  "commit",
  "log",
  "branch",
  "checkout",
  "merge",
  "push",
  "pull",
  "remote",
  "clone",
  "pages",
  "conflicts",
];

// Distancia de Levenshtein (para ver qué tan parecido es un comando mal escrito)
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // borrar
        dp[i][j - 1] + 1,      // insertar
        dp[i - 1][j - 1] + cost // reemplazar
      );
    }
  }

  return dp[m][n];
}

function suggestGitSubcommand(word) {
  let best = null;
  let bestDistance = Infinity;

  for (const candidate of KNOWN_GIT_SUBCOMMANDS) {
    const d = levenshtein(word, candidate);
    if (d < bestDistance) {
      bestDistance = d;
      best = candidate;
    }
  }

  // Si está demasiado lejos, no sugerimos nada
  if (bestDistance > 3) return null;
  return best;
}

// --- Hints educativos por comando git ---

const shownHints = new Set();

function withHint(key, baseMessage, hintLines) {
  // baseMessage puede venir undefined/null, lo normalizamos
  const base = baseMessage ?? "";

  // Si ya mostramos el tip para este comando, devolvemos solo el mensaje base
  if (shownHints.has(key)) return base;

  shownHints.add(key);

  const lines = Array.isArray(hintLines)
    ? hintLines
    : (hintLines ? [String(hintLines)] : []);

  const hintBody = lines.join("\n");
  if (!hintBody) return base;

  // Insertamos marcadores especiales para que la Terminal pueda separarlo
  if (!base) {
    return `[[HINT_START]]\n${hintBody}\n[[HINT_END]]`;
  }

  return `${base}\n[[HINT_START]]\n${hintBody}\n[[HINT_END]]`;
}

// Normaliza input a command key para verificar permisos
function getCommandKey(input) {
  const trimmed = input.trim();
  const parts = trimmed.split(/\s+/);
  
  // Shell commands
  if (["help", "ls", "cat", "touch", "pwd"].includes(parts[0])) {
    return parts[0];
  }
  
  // Git commands: "git <subcommand>"
  if (parts[0] === "git" && parts[1]) {
    return `git ${parts[1]}`;
  }
  
  // GitHub commands: "github <subcommand>"
  if (parts[0] === "github" && parts[1]) {
    // Para "github pr" mantenemos solo "github pr"
    return parts[1] === "pr" ? "github pr" : `github ${parts[1]}`;
  }
  
  return null; // comando desconocido, no gateamos
}





async function ensureRepoReady() {
  try {
    await fs.promises.readFile(`${REPO_DIR}/.git/HEAD`, { encoding: "utf8" });
    return true;
  } catch (e) {
    return false;
  }
}

function repoMissingMessage() {
  return [
    "❗ HEAD reference not found.",
    t("termNoRepoYet"),
    "",
    "💡 Tip:",
    "    git init",
  ].join("\n");
}

function parseGitCommand(cmd) {
  const parts = cmd.trim().split(/\s+/);
  const sub = parts[1];

  if (!sub) return { type: "error", message: t("termGitUsage") };

  switch (sub) {
    case "init":
      return { type: "git-init" };

    case "status":
      return { type: "git-status" };

    case "add":
      if (!parts[2]) {
        return { type: "error", message: t("termAddUsage") };
      }
      if (parts[2] === ".") {
        return { type: "git-add-dot" };
      }
      return { type: "git-add", file: parts[2] };

    case "commit": {
      const msgIndex = parts.indexOf("-m");
      if (msgIndex === -1 || !parts[msgIndex + 1]) {
        return {
          type: "error",
          message: 'Uso: git commit -m "mensaje"',
        };
      }
      const raw = parts.slice(msgIndex + 1).join(" ");
      const match = raw.match(/^"(.*)"$/);
      const message = match ? match[1] : raw;
      return { type: "git-commit", message };
    }

    case "log": {
      // git log [rama]
      const ref = parts[2] || "main";
      return { type: "git-log", ref };
    }

    case "branch": {
      // git branch   → lista ramas
      // git branch nombre  → crea rama
      const name = parts[2];
      if (!name) return { type: "git-branch-list" };
      return { type: "git-branch-create", name };
    }

    case "checkout": {
      const flag  = parts[2];
      const name  = parts[3] ?? parts[2];
      if (!name) {
        return { type: "error", message: t("termCheckoutUsage") };
      }

      // git checkout -b <name>  →  create + switch
      if (flag === "-b" && parts[3]) {
        return { type: "git-checkout-b", name: parts[3] };
      }

      // Is it a commit hash? (7–40 hex chars, NOT a slash-branch)
      const isHash = /^[0-9a-f]{7,40}$/i.test(name) && !name.includes("/");
      return {
        type: isHash ? "git-checkout-commit" : "git-checkout",
        name,
      };
    }
    case "merge": {
      const name = parts[2];
      if (!name) {
        return {
          type: "error",
          message: 'Uso: git merge <nombre-rama>',
        };
      }
      return { type: "git-merge", branch: name };
    }

    case "conflicts": {
      // git conflicts  → lista archivos con marcas de conflicto
      return { type: "git-conflicts" };
    }


    case "push": {
      const remote = parts[2] || "origin";
      const branch = parts[3] || "main";
      return { type: "git-push", remote, branch };
    }

    case "pull": {
      const remote = parts[2] || "origin";
      const branch = parts[3] || "main";
      return { type: "git-pull", remote, branch };
    }

    case "clone": {
      const url = parts[2];
      if (!url) {
        return {
          type: "error",
          message: t("termCloneUsage"),
        };
      }
      return { type: "git-clone", url };
    }

    case "remote": {
      const action = parts[2];
      
      if (!action || action === "-v") {
        return { type: "git-remote-list" };
      }

      if (action === "add") {
        const name = parts[3];
        const url = parts[4];
        if (!name || !url) {
          return {
            type: "error",
            message: t("termRemoteAddUsage"),
          };
        }
        return { type: "git-remote-add", name, url };
      }

      if (action === "remove" || action === "rm") {
        const name = parts[3];
        if (!name) {
          return {
            type: "error",
            message: t("termRemoteRemoveUsage"),
          };
        }
        return { type: "git-remote-remove", name };
      }

      return {
        type: "error",
        message: t("termRemoteUsage"),
      };
    }

    case "pages": {
      const action = parts[2];
      
      if (action === "publish") {
        return { type: "git-pages-publish" };
      }

      if (action === "republish") {
        return { type: "git-pages-republish" };
      }

      return {
        type: "error",
        message: t("termPagesUsage"),
      };
    }

    default: {
      const suggestion = suggestGitSubcommand(sub);
      if (suggestion) {
        return {
          type: "error",
          message: [
            t("termUnknownGit", { sub }),
            "",
            `💡 Did you mean:`,
            `    git ${suggestion}`,
          ].join("\n"),
        };
      }

      return {
        type: "error",
        message: t("termUnknownGit", { sub }),
      };
    }
  }
}

function parseGithubCommand(cmd) {
  const parts = cmd.trim().split(/\s+/);
  const sub = parts[1];

  if (!sub) {
    return {
      type: "error",
      message:
        'Uso: github <comando>\nEj: github create mi-repo, github status',
    };
  }

  switch (sub) {
    case "create": {
      const name = parts[2];
      if (!name) {
        return {
          type: "error",
          message: t("termGithubCreateUsage"),
        };
      }
      return { type: "gh-create", name };
    }

    case "status":
      return { type: "gh-status" };

    case "pr": {
      const action = parts[2];

      if (!action) {
        return {
          type: "error",
          message:
            'Uso: github pr <comando>\nEj: github pr create <from> <to>, github pr list, github pr merge <id>',
        };
      }

      // github pr create <from> [to] [-t "Título opcional"]
      if (action === "create") {
        const from = parts[3];
        const to = parts[4] || "main";

        if (!from) {
          return {
            type: "error",
            message: t("termPRCreateUsage"),
          };
        }

        const titleIndex = parts.indexOf("-t");
        let title = "";
        if (titleIndex !== -1 && parts[titleIndex + 1]) {
          title = parts.slice(titleIndex + 1).join(" ");
        }

        return {
          type: "gh-pr-create",
          from,
          to,
          title,
        };
      }

      // github pr list
      if (action === "list") {
        return { type: "gh-pr-list" };
      }

      // github pr merge <id>
      if (action === "merge") {
        const idStr = parts[3];
        if (!idStr) {
          return {
            type: "error",
            message: t("termPRMergeUsage"),
          };
        }
        const id = parseInt(idStr, 10);
        if (Number.isNaN(id)) {
          return {
            type: "error",
            message: t("termPRIdMustBeNumber"),
          };
        }
        return { type: "gh-pr-merge", id };
      }

      return {
        type: "error",
        message:
          'Subcomando no soportado para "github pr". Usá: create, list, merge.',
      };
    }

    default: {
      const suggestion = suggestGithubSubcommand(sub);
      if (suggestion) {
        return {
          type: "error",
          message: [
            `Unknown simulated GitHub command: "github ${sub}".`,
            "",
            "💡 Did you mean:",
            `    github ${suggestion} ...`,
          ].join("\n"),
        };
      }

      return {
        type: "error",
        message: `Comando GitHub simulado no soportado: github ${sub}`,
      };
    }
  }
}


async function listConflictFiles() {
  const entries = await listDir(REPO_DIR);
  const visibles = entries.filter((name) => name !== ".git");

  const conflicts = [];

  for (const file of visibles) {
    const path = `${REPO_DIR}/${file}`;
    const content = await readFile(path);
    if (
      content.includes("<<<<<<<") &&
      content.includes("=======") &&
      content.includes(">>>>>>>")
    ) {
      conflicts.push(file);
    }
  }

  return conflicts;
}


export async function runCommand(input) {
  const trimmed = input.trim();
  if (!trimmed) return "";

  // Command gating: verificar si el comando está permitido en la actividad actual
  const commandKey = getCommandKey(trimmed);
  if (commandKey && !isCommandAllowed(commandKey)) {
    return getBlockedCommandMessage(commandKey);
  }

  // Caso especial: cosas tipo "gitinit", "gitstatus", "gitcommit"
  if (trimmed.startsWith("git") && !trimmed.startsWith("git ")) {
    const suggestion = suggestFullGitCommand(trimmed);
    if (suggestion) {
      return [
        `Comando no reconocido: "${trimmed}"`,
        "",
        "💡 Quizás quisiste escribir:",
        `    ${suggestion}`,
      ].join("\n");
    }
  }

  // github sin espacio → githubcreate, githubstatus, etc.
  if (trimmed.startsWith("github") && !trimmed.startsWith("github ")) {
    const suggestion = suggestFullGithubCommand(trimmed);
    if (suggestion) {
      return [
        `Comando no reconocido: "${trimmed}"`,
        "",
        "💡 Quizás quisiste escribir:",
        `    ${suggestion} ...`,
      ].join("\n");
    }
  }



  if (trimmed === "help") {
    return [
      t("helpTitle"),
      t("helpHelp"),
      t("helpLs"),
      t("helpCat"),
      t("helpTouch"),
      t("helpPwd"),
      "",
      t("helpGitLocal"),
      t("helpInit"),
      t("helpStatus"),
      t("helpAdd"),
      t("helpCommit"),
      t("helpLog"),
      t("helpBranch"),
      t("helpBranchNew"),
      t("helpCheckout"),
      t("helpMerge"),
      t("helpConflicts"),
      "",
      t("helpGitRemote"),
      t("helpRemote"),
      t("helpRemoteAdd"),
      t("helpRemoteRemove"),
      t("helpPush"),
      t("helpPull"),
      t("helpClone"),
      "",
      t("helpPages"),
      t("helpPagesPublish"),
      t("helpPagesRepublish"),
      "",
      t("helpGitHub"),
      t("helpGhCreate"),
      t("helpGhStatus"),
      t("helpGhPrCreate"),
      t("helpGhPrList"),
      t("helpGhPrMerge"),
    ].join("\n");
  }


  // Shell
  if (trimmed === "pwd") {
    return REPO_DIR;
  }

  if (trimmed === "ls") {
    const entries = await listDir(REPO_DIR);
    return entries.join("  ");
  }

  if (trimmed.startsWith("cat ")) {
    const file = trimmed.replace("cat ", "").trim();
    const path = `${REPO_DIR}/${file}`;
    const exists = await fileExists(path);
    if (!exists) return t("termCatNotFound", { file });
    return await readFile(path);
  }

  if (trimmed.startsWith("touch ")) {
    const file = trimmed.replace("touch ", "").trim();

    await createFileWithTemplate(file);

    return file.toLowerCase().endsWith(".html")
      ? `Archivo HTML creado con plantilla básica: ${file}`
      : `Archivo creado: ${file}`;
  }


// GitHub simulado
if (trimmed.startsWith("github ")) {
  const parsed = parseGithubCommand(trimmed);
  if (parsed.type === "error") return parsed.message;

  switch (parsed.type) {
    case "gh-create": {
      const remote = createRemoteRepo(parsed.name);
      return [
        `Simulated remote repo created: ${remote.name}`,
        `Simulated URL: ${remote.url}`,
        "",
        "You can now simulate a push with:",
        "  git push origin main",
      ].join("\n");
    }

    case "gh-status":
      return getRemoteStatus();

    case "gh-pr-create": {
      try {
        const pr = createPullRequest(parsed.from, parsed.to, parsed.title);
        return [
          `Simulated Pull Request created (#${pr.id}):`,
          `  From: ${pr.fromBranch}`,
          `  To:   ${pr.toBranch}`,
          `  Title: ${pr.title}`,
          "",
          "In real Git, someone would review the code before approving the merge.",
        ].join("\n");
      } catch (e) {
        return e.message || String(e);
      }
    }

    case "gh-pr-list": {
      const prs = listPullRequests();
      if (!prs.length) {
        return t("termNoPRs");
      }

      const lines = [t("termPRList")];
      prs.forEach((pr) => {
        lines.push(
          `#${pr.id} [${pr.status}] ${pr.fromBranch} → ${pr.toBranch} — ${pr.title}`
        );
      });
      return lines.join("\n");
    }

    case "gh-pr-merge": {
      try {
        const pr = mergePullRequest(parsed.id);
        return [
          `PR #${pr.id} marked as MERGED.`,
          `Source branch: ${pr.fromBranch}`,
          `Target branch: ${pr.toBranch}`,
          "",
          "In real Git, this creates a merge commit (or fast-forward) on the target branch.",
        ].join("\n");
      } catch (e) {
        return e.message || String(e);
      }
    }

    default:
      return t("termGitHubError");
  }
}



// Git
if (trimmed.startsWith("git ")) {
  const parsed = parseGitCommand(trimmed);
  if (parsed.type === "error") return parsed.message;
  if (parsed.type !== "git-init") {
    const ok = await ensureRepoReady();
    if (!ok) return repoMissingMessage();
  }

  switch (parsed.type) {
    case "git-init": {
      const msg = await gitInit();
      return withHint("git-init", msg, t("hintInit"));
    }

    case "git-status": {
      const msg = await gitStatus();
      return withHint("git-status", msg, t("hintStatus"));
    }

    case "git-add": {
      const msg = await gitAdd(parsed.file);
      return withHint("git-add", msg, t("hintAdd"));
    }

    case "git-add-dot": {
      const entries = await listDir(REPO_DIR);
      const visibles = entries.filter((name) => name !== ".git");

      const msg = [
        t("termAddDotLine1"),
        "",
        t("termAddDotLine2"),
        t("termAddDotLine3"),
      ];

      if (visibles.length) {
        msg.push("", t("termAddDotFiles"));
        visibles.forEach((f) => msg.push(`  - ${f}`));
      }

      return withHint("git-add", msg.join("\n"), t("hintAddDot"));
    }

    case "git-commit": {
      const msg = await gitCommit(parsed.message);
      return withHint("git-commit", msg, t("hintCommit"));
    }

    case "git-log": {
      const msg = await gitLog(parsed.ref);
      return withHint("git-log", msg, t("hintLog"));
    }

    case "git-branch-list": {
      const msg = await gitListBranches();
      return withHint("git-branch", msg, t("hintBranchList"));
    }

    case "git-branch-create": {
      const msg = await gitCreateBranch(parsed.name);
      return withHint("git-branch", msg, t("hintBranchCreate"));
    }

    case "git-checkout": {
      const msg = await gitCheckout(parsed.name);
      return withHint("git-checkout", msg, t("hintCheckout"));
    }

    case "git-checkout-b": {
      const createMsg = await gitCreateBranch(parsed.name);
      const checkoutMsg = await gitCheckout(parsed.name);
      return withHint("git-checkout", `${createMsg}\n${checkoutMsg}`, t("hintCheckout"));
    }

    case "git-checkout-commit": {
      const msg = await gitCheckoutCommit(parsed.name);
      return withHint("git-checkout", msg, t("hintCheckoutCommit"));
    }

    case "git-merge": {
      const msg = await gitMerge(parsed.branch);
      return withHint("git-merge", msg, t("hintMerge"));
    }

    case "git-conflicts": {
      const files = await listConflictFiles();
      if (!files.length) {
        return withHint(
          "git-conflicts",
          t("conflictNoFiles"),
          t("hintConflictsNone")
        );
      }

      const base = [
        t("conflictFound"),
        ...files.map((f) => `  - ${f}`),
        "",
        t("conflictSteps"),
        t("conflictStep1"),
        t("conflictStep2"),
        t("conflictStep3"),
        t("conflictStep4"),
        t("conflictStep5"),
      ].join("\n");

      return withHint("git-conflicts", base, t("hintConflicts"));
    }


    case "git-push": {
      const msg = await pushToRemote(parsed.remote, parsed.branch);
      return withHint("git-push", msg, t("hintPush"));
    }

    case "git-pull": {
      const msg = await gitPull(parsed.remote, parsed.branch);
      return withHint("git-pull", msg, t("hintPull"));
    }

    case "git-clone": {
      const msg = await gitClone(parsed.url);
      return withHint("git-clone", msg, t("hintClone"));
    }

    case "git-remote-add": {
      const msg = await gitRemoteAdd(parsed.name, parsed.url);
      return withHint("git-remote", msg, t("hintRemoteAdd"));
    }

    case "git-remote-remove": {
      const msg = await gitRemoteRemove(parsed.name);
      return withHint("git-remote", msg, t("hintRemoteRemove"));
    }

    case "git-remote-list": {
      const msg = await gitRemoteList();
      return withHint("git-remote", msg, t("hintRemoteList"));
    }

    case "git-pages-publish": {
      const msg = pagesPublish();
      return withHint("git-pages", msg, t("hintPages"));
    }

    case "git-pages-republish": {
      const msg = pagesRepublish();
      return withHint("git-pages", msg, t("hintPagesRepublish"));
    }


    default:
      return t("termInternalError");
  }
}

// Fallback global: anything that isn't git/github/shell
return t("termUnknown", { input });
}
