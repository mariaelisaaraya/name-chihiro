// src/gitService.js
import * as git from "isomorphic-git";
import { fs, REPO_DIR } from "./gitFs";

// (ya NO usamos git.plugins.set)

export async function gitInit() {
  await git.init({ fs, dir: REPO_DIR, defaultBranch: "main", });
  return "Repositorio Git inicializado en /repo";
}

export async function gitStatus() {
  const matrix = await git.statusMatrix({ fs, dir: REPO_DIR });

  if (!matrix.length) {
    return "En la rama main\nNada para commitear, working tree limpio.";
  }

  let output = "Cambios en el repositorio:\n";
  for (const [filepath, head, workdir, stage] of matrix) {
    let status = "";
    if (head === 0 && workdir === 1 && stage === 0) status = "untracked";
    else if (workdir !== stage) status = "modificado";
    else if (stage === 1 && head === 0) status = "nuevo (index)";
    else status = "cambiado";

    output += `  ${status}  ${filepath}\n`;
  }
  return output;
}

export async function gitAdd(filePath) {
  await git.add({ fs, dir: REPO_DIR, filepath: filePath });
  return `Archivo añadido al index: ${filePath}`;
}

export async function gitCommit(message) {
  const sha = await git.commit({
    fs,
    dir: REPO_DIR,
    message,
    author: {
      name: "gitBDB User",
      email: "user@example.com",
    },
  });
  return `Commit creado: ${sha.slice(0, 7)} - "${message}"`;
}

// 🔹 Nuevo: git log
export async function gitLog(ref = "main") {
  // Si ref es "main", probamos también master y HEAD por compatibilidad
  const refsToTry =
    ref === "main"
      ? ["main", "master", "HEAD"]
      : [ref];

  let ultimoError = null;

  for (const r of refsToTry) {
    try {
      const log = await git.log({ fs, dir: REPO_DIR, ref: r });

      if (!log.length) {
        return `No hay commits todavía en la rama ${r}.`;
      }

      let out = "";
      for (const entry of log) {
        const { oid, commit } = entry;
        const date = new Date(commit.committer.timestamp * 1000);
        out += `commit ${oid}\n`;
        out += `Author: ${commit.author.name} <${commit.author.email}>\n`;
        out += `Date:   ${date.toLocaleString()}\n\n`;
        out += `    ${commit.message}\n\n`;
      }
      return out;
    } catch (e) {
      ultimoError = e;
    }
  }

  return `No se pudo obtener el log (¿hay commits?): ${
    ultimoError?.message || String(ultimoError)
  }`;
}

export async function gitListBranches() {
  // git.listBranches() only returns branches that have at least one commit.
  // Read refs/heads directly so newly-created branches (empty refs) appear too.
  const pfs = fs.promises;
  const headsDir = `${REPO_DIR}/.git/refs/heads`;

  async function walk(dir) {
    let entries;
    try { entries = await pfs.readdir(dir); } catch { return []; }
    const results = [];
    for (const entry of entries) {
      const full = `${dir}/${entry}`;
      let stat;
      try { stat = await pfs.stat(full); } catch { continue; }
      if (stat.isDirectory()) {
        const nested = await walk(full);
        results.push(...nested);
      } else {
        // Convert filesystem path back to branch name
        results.push(full.slice(headsDir.length + 1));
      }
    }
    return results;
  }

  const branches = await walk(headsDir);

  // Also check packed-refs for branches that may have been written there
  try {
    const packed = await pfs.readFile(`${REPO_DIR}/.git/packed-refs`, "utf8");
    for (const line of packed.split("\n")) {
      if (line.startsWith("#") || !line.trim()) continue;
      const [, ref] = line.split(" ");
      if (ref && ref.startsWith("refs/heads/")) {
        const b = ref.slice("refs/heads/".length);
        if (!branches.includes(b)) branches.push(b);
      }
    }
  } catch { /* no packed-refs yet */ }

  if (!branches.length) return "No hay ramas creadas todavía.";

  let currentBranch;
  try {
    currentBranch = await git.currentBranch({ fs, dir: REPO_DIR, fullname: false });
  } catch { currentBranch = null; }

  return branches
    .sort()
    .map((b) => (b === currentBranch ? `* ${b}` : `  ${b}`))
    .join("\n");
}

export async function gitCreateBranch(name) {
  // Write the ref file directly so branches with `/` in the name work
  // even before the first commit (git.branch() requires HEAD to point to a commit).
  const pfs = fs.promises;
  const refPath = `${REPO_DIR}/.git/refs/heads/${name}`;

  // Ensure parent directories exist (e.g. refs/heads/rescue/ for "rescue/chihiro")
  const parts = refPath.split("/");
  for (let i = 1; i < parts.length - 1; i++) {
    const dir = parts.slice(0, i + 1).join("/");
    try { await pfs.mkdir(dir); } catch { /* already exists */ }
  }

  // Resolve HEAD to get the current commit SHA (may be empty before first commit)
  let sha = "";
  try {
    sha = await git.resolveRef({ fs, dir: REPO_DIR, ref: "HEAD" });
  } catch { /* HEAD not yet pointing to a commit */ }

  await pfs.writeFile(refPath, sha + "\n", "utf8");
  return `Rama creada: ${name}`;
}

export async function gitCheckout(name) {
  const ref =
    name.startsWith("refs/") || name.startsWith("origin/")
      ? name
      : `refs/heads/${name}`;

  // If the branch is empty (no commits yet), isomorphic-git's checkout()
  // fails because it can\'t resolve the ref to a tree.
  // Fix: write HEAD as a symbolic ref so subsequent commits land on this branch.
  const pfs = fs.promises;
  const refFile = `${REPO_DIR}/.git/${ref}`;
  let refContent = "";
  try { refContent = (await pfs.readFile(refFile, "utf8")).trim(); } catch {}

  if (!refContent) {
    await pfs.writeFile(`${REPO_DIR}/.git/HEAD`, `ref: ${ref}\n`, "utf8");
    return `Te moviste a la rama: ${name}`;
  }

  await git.checkout({ fs, dir: REPO_DIR, ref, track: false });
  return `Te moviste a la rama: ${name}`;
}

export async function gitCurrentBranchName() {
  try {
    const name = await git.currentBranch({
      fs,
      dir: REPO_DIR,
      fullname: false,
    });
    return name || "HEAD (detached)";
  } catch {
    return "HEAD (desconocido)";
  }
}

export async function gitMerge(theirs) {
  // Rama actual (ours)
  let ours = await git.currentBranch({
    fs,
    dir: REPO_DIR,
    fullname: false,
  });

  if (!ours) {
    // Caso extremadamente raro, pero por las dudas
    ours = "HEAD";
  }

  try {
    const result = await git.merge({
      fs,
      dir: REPO_DIR,
      ours,
      theirs,
      fastForwardOnly: false, // permitimos merge commit
    });

    if (result.fastForward) {
      return [
        `Merge fast-forward completado.`,
        `La rama ${ours} ahora apunta al mismo commit que ${theirs}.`,
      ].join("\n");
    }

    if (result.oid) {
      return [
        `Merge completado: se integró "${theirs}" en "${ours}".`,
        `Nuevo commit de merge: ${result.oid}`,
      ].join("\n");
    }

    return `Merge completado entre ${ours} y ${theirs}.`;
  } catch (e) {
    // Casos didácticos
    const code = e?.code || "";

    if (code === "MergeNotSupportedError") {
      return [
        "⚠️ Este tipo de merge no está soportado por el simulador.",
        "Probá con un caso más simple (por ejemplo, ramas que divergen poco).",
      ].join("\n");
    }

    if (code === "MergeConflictError") {
      return [
        `⚠️ Se produjo un conflicto de merge entre ${ours} y ${theirs}.`,
        "",
        "Los archivos con conflicto quedaron marcados con:",
        "  <<<<<<< HEAD",
        "  =======",
        "  >>>>>>> rama",
        "",
        "🧩 Pasos típicos para resolver:",
        "  1. Abrí los archivos en el editor y dejá solo la versión correcta.",
        "  2. Guardá los cambios.",
        '  3. Ejecutá: git add <archivo>',
        '  4. Luego: git commit -m "Resuelvo conflicto de merge"',
      ].join("\n");
    }

    return `Error al hacer merge: ${e.message || String(e)}`;
  }
}

// 🔹 Git Remote Commands
export async function gitRemoteAdd(name, url) {
  await git.addRemote({ fs, dir: REPO_DIR, remote: name, url });
  return `Remoto agregado: ${name} -> ${url}`;
}

export async function gitRemoteRemove(name) {
  await git.deleteRemote({ fs, dir: REPO_DIR, remote: name });
  return `Remoto eliminado: ${name}`;
}

export async function gitRemoteList() {
  const remotes = await git.listRemotes({ fs, dir: REPO_DIR });
  if (!remotes.length) {
    return "No hay remotos configurados.";
  }
  let output = "";
  for (const r of remotes) {
    output += `${r.remote}\t${r.url} (fetch)\n`;
    output += `${r.remote}\t${r.url} (push)\n`;
  }
  return output;
}

// 🔹 Git Pull (fetch + merge simulado)
export async function gitPull(remote, branch) {
  // En el simulador, pull trae commits del remoto simulado
  const { getRemoteData } = await import("./githubSim");
  const remoteData = getRemoteData();
  
  if (!remoteData) {
    return "Error: no hay remoto simulado. Usá: github create <nombre>";
  }

  if (!remoteData.commits || remoteData.commits.length === 0) {
    return "El remoto no tiene commits para traer.";
  }

  // Verificar que tenemos los commits remotos localmente
  const localLog = await getHeadLog();
  const localOids = localLog.map(c => c.oid);
  const remoteOids = remoteData.commits.map(c => c.oid);

  const newCommits = remoteOids.filter(oid => !localOids.includes(oid));

  if (newCommits.length === 0) {
    return "Ya estás actualizado con el remoto.";
  }

  return [
    `Pull simulado completado desde ${remote}/${branch}.`,
    `Se trajeron ${newCommits.length} commit(s) nuevo(s).`,
    "💡 En un entorno real, esto haría fetch + merge automático.",
  ].join("\n");
}

// 🔹 Git Clone (inicializar desde remoto)
export async function gitClone(url) {
  const { getRemoteData } = await import("./githubSim");
  const remoteData = getRemoteData();
  
  if (!remoteData) {
    return [
      "Error: no hay repositorio remoto simulado en esa URL.",
      "Primero creá un remoto con: github create <nombre>",
    ].join("\n");
  }

  if (!remoteData.commits || remoteData.commits.length === 0) {
    return "El remoto no tiene commits para clonar.";
  }

  // Simular clone: inicializar repo y copiar estado del remoto
  try {
    await git.init({ fs, dir: REPO_DIR, defaultBranch: "main" });
    await git.addRemote({ 
      fs, 
      dir: REPO_DIR, 
      remote: "origin", 
      url: remoteData.url 
    });

    return [
      `Clonando desde ${url}...`,
      `Repositorio clonado: ${remoteData.name}`,
      `${remoteData.commits.length} commit(s) disponibles.`,
      "💡 En el simulador, los archivos se recrearán al hacer checkout.",
    ].join("\n");
  } catch (e) {
    return `Error al clonar: ${e.message || String(e)}`;
  }
}

// 🔹 Checkout con soporte para commits (hash)
export async function gitCheckoutCommit(ref) {
  try {
    await git.checkout({ fs, dir: REPO_DIR, ref });
    
    // Verificar si es detached HEAD
    const currentBranch = await git.currentBranch({
      fs,
      dir: REPO_DIR,
      fullname: false,
    });

    if (!currentBranch) {
      return [
        `Te moviste al commit: ${ref.slice(0, 7)}`,
        "⚠️ Estás en 'detached HEAD' state.",
        "Para volver a una rama: git checkout main",
      ].join("\n");
    }

    return `Te moviste a: ${ref}`;
  } catch (e) {
    return `Error al hacer checkout: ${e.message || String(e)}`;
  }
}
