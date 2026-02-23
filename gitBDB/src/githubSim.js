// src/githubSim.js
import * as git from "isomorphic-git";
import { fs, REPO_DIR } from "./gitFs";

const REMOTE_KEY = "git-trainer-remote";

let memoryRemote = null;

function loadRemote() {
  try {
    const raw = window.localStorage.getItem(REMOTE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return memoryRemote;
  }
}

function saveRemote(remote) {
  try {
    window.localStorage.setItem(REMOTE_KEY, JSON.stringify(remote));
  } catch {
    memoryRemote = remote;
  }
}

export function resetRemote() {
  try {
    window.localStorage.removeItem(REMOTE_KEY);
  } catch {
    memoryRemote = null;
  }
}

export function createRemoteRepo(name) {
  const remote = {
    name,
    defaultBranch: "main",
    url: `https://github-sim.local/${name}.git`,
    lastPushedBranch: null,
    commits: [],

    // 👇 NUEVO: soporte de Pull Requests simulados
    pullRequests: [],
    nextPrId: 1,
  };
  saveRemote(remote);
  return remote;
}

export function getRemoteStatus() {
  const remote = loadRemote();
  if (!remote) {
    return "No hay repositorio remoto simulado.\nUsá: github create <nombre-repo>";
  }

  let out = `GitHub simulado:\n`;
  out += `  Nombre del repo: ${remote.name}\n`;
  out += `  URL simulada:    ${remote.url}\n`;
  out += `  Rama por defecto: ${remote.defaultBranch}\n`;
  if (!remote.commits.length) {
    out += `  (sin commits pushados todavía)\n`;
  } else {
    out += `  Última rama pusheada: ${remote.lastPushedBranch}\n`;
    out += `  Commits remotos:\n`;
    for (const c of remote.commits) {
      out += `    ${c.oid.slice(0, 7)}  ${c.message}\n`;
    }
  }

  if (remote.pullRequests && remote.pullRequests.length) {
    out += `  Pull Requests: ${remote.pullRequests.length} (usá "github pr list")\n`;
  }

  return out;
}

// 🔹 Para el panel React / visualizador
export function getRemoteData() {
  return loadRemote();
}

// 🔹 Nuevo: crear un PR simulado
export function createPullRequest(fromBranch, toBranch, title) {
  let remote = loadRemote();
  if (!remote) {
    throw new Error(
      "No hay remoto simulado. Creá uno primero con: github create <nombre-repo>"
    );
  }

  if (!remote.pullRequests) {
    remote.pullRequests = [];
  }
  if (typeof remote.nextPrId !== "number") {
    remote.nextPrId = 1;
  }

  const pr = {
    id: remote.nextPrId++,
    fromBranch,
    toBranch,
    title: title && title.trim()
      ? title.trim()
      : `PR: ${fromBranch} → ${toBranch}`,
    status: "OPEN", // OPEN | MERGED | (podríamos agregar CLOSED después)
    createdAt: Date.now(),
    mergedAt: null,
  };

  remote.pullRequests.push(pr);
  saveRemote(remote);
  return pr;
}

// 🔹 Nuevo: listar PRs simulados
export function listPullRequests() {
  const remote = loadRemote();
  if (!remote || !remote.pullRequests) return [];
  return remote.pullRequests;
}

// 🔹 Nuevo: marcar un PR como MERGED
export function mergePullRequest(id) {
  const remote = loadRemote();
  if (!remote || !remote.pullRequests) {
    throw new Error("No hay remoto simulado con Pull Requests.");
  }

  const pr = remote.pullRequests.find((p) => p.id === id);
  if (!pr) {
    throw new Error(`No encontré un Pull Request con id ${id}.`);
  }

  if (pr.status === "MERGED") {
    // ya estaba mergeado, no hacemos nada raro
    return pr;
  }

  pr.status = "MERGED";
  pr.mergedAt = Date.now();

  saveRemote(remote);
  return pr;
}

export async function pushToRemote(remoteName, branchName = "main") {
  if (remoteName !== "origin") {
    return `Por ahora solo se soporta: git push origin <rama>`;
  }

  const remote = loadRemote();
  if (!remote) {
    return [
      "No hay repo remoto simulado.",
      "Primero creá uno con:",
      "  github create <nombre-repo>",
    ].join("\n");
  }

  let log;
  try {
    log = await git.log({
      fs,
      dir: REPO_DIR,
      ref: branchName,
    });
  } catch (e) {
    return `No se pudo leer la rama '${branchName}'. ¿Creaste commits?`;
  }

  const commits = log.map((entry) => ({
    oid: entry.oid,
    message: entry.commit.message,
    author: entry.commit.author.name,
    timestamp: entry.commit.author.timestamp,
  }));

  const updated = {
    ...remote,
    lastPushedBranch: branchName,
    commits,
  };

  saveRemote(updated);

  return [
    `Push simulado a ${updated.url}`,
    `Rama: ${branchName}`,
    `Commits enviados: ${commits.length}`,
  ].join("\n");
}

// 🔹 GitHub Pages simulado
export function pagesPublish() {
  const remote = loadRemote();
  if (!remote) {
    return [
      "Error: no hay remoto simulado.",
      "Creá uno con: github create <nombre>",
    ].join("\n");
  }

  const pagesUrl = `https://pages-sim.local/${remote.name}`;
  const updated = {
    ...remote,
    pagesUrl,
    pagesPublishedAt: Date.now(),
    pagesLastUpdate: null,
  };

  saveRemote(updated);

  return [
    "✓ Sitio publicado en GitHub Pages (simulado)",
    `URL: ${pagesUrl}`,
    "",
    "💡 En GitHub real, esto desplegaría tu sitio públicamente.",
    "Podés actualizar con: git pages republish",
  ].join("\n");
}

export function pagesRepublish() {
  const remote = loadRemote();
  if (!remote) {
    return "Error: no hay remoto simulado.";
  }

  if (!remote.pagesUrl) {
    return [
      "Error: no publicaste el sitio todavía.",
      "Usá primero: git pages publish",
    ].join("\n");
  }

  const updated = {
    ...remote,
    pagesLastUpdate: Date.now(),
  };

  saveRemote(updated);

  return [
    "✓ Sitio actualizado en GitHub Pages (simulado)",
    `URL: ${remote.pagesUrl}`,
    "",
    "💡 Los cambios que hiciste en commits nuevos ya están desplegados.",
  ].join("\n");
}
