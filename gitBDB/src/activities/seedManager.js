// src/activities/seedManager.js
// Aplica archivos semilla de forma segura en el FS virtual (LightningFS).
// - Normaliza paths bajo /repo
// - Crea directorios intermedios (mkdirp)
// - Evita escribir dentro de /repo/.git

import { pfs, writeFile, REPO_DIR } from "../gitFs";

function normalizePath(path) {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  // Aseguramos separador '/'
  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${REPO_DIR}${normalized}`;
}

async function mkdirp(targetPath) {
  const parts = targetPath.split("/");
  // skip first empty + "" + "repo" entries
  let current = parts[0] === "" ? "" : parts[0];
  for (let i = 1; i < parts.length - 1; i += 1) {
    current = `${current}/${parts[i]}`;
    try {
      await pfs.mkdir(current);
    } catch (e) {
      // ignore if exists
    }
  }
}

export async function applySeedFiles(seedFiles = []) {
  for (const file of seedFiles) {
    const target = normalizePath(file.path);
    if (!target) continue;
    // Protección: no permitir escribir dentro de .git
    if (target.startsWith(`${REPO_DIR}/.git`)) {
      // omitimos silenciosamente para no romper el repo
      continue;
    }
    await mkdirp(target);
    await writeFile(target, file.content ?? "");
  }
}
