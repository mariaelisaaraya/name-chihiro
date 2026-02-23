// src/missionValidator.js
import * as git from "isomorphic-git";
import {
  fs,
  REPO_DIR,
  listDir,
  readFile,
  fileExists,
} from "./gitFs";
import { getRemoteData } from "./githubSim";
import { gitCurrentBranchName } from "./gitService";

// Helper: log de HEAD (sin importar si la rama es main/master)
async function getHeadLog() {
  return git.log({ fs, dir: REPO_DIR, ref: "HEAD" });
}

/**
 * MISIÓN 1
 * Objetivo:
 *  - Tener un archivo index.html en /repo
 *  - Haber hecho al menos un commit
 *  - El último commit debe contener "primer commit" en el mensaje
 */
export async function validateMission1() {
  const errors = [];

  // 1) ¿Existe index.html?
  let files = [];
  try {
    files = await listDir(REPO_DIR);
  } catch (e) {
    // ignoramos, se maneja abajo
  }
  if (!files.includes("index.html")) {
    errors.push('No creaste el archivo "index.html" en el repositorio.');
  }

  // 2) ¿Hay commits?
  let log = [];
  try {
    log = await getHeadLog();
  } catch (e) {
    // si falla, log se queda vacío
  }

  if (log.length === 0) {
    errors.push("Todavía no hiciste ningún commit.");
    return { ok: false, errors };
  }

  // 3) ¿El último commit menciona "primer commit"?
  const last = log[0];
  const msg = last.commit.message.toLowerCase();
  if (!msg.includes("primer commit")) {
    errors.push(
      'El mensaje del último commit debe contener la frase "Primer commit".'
    );
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * MISIÓN 2
 * Objetivo:
 *  - Haber creado un GitHub simulado (github create ...)
 *  - Haber pusheado al remoto al menos un commit (git push origin main)
 */
export async function validateMission2() {
  const errors = [];
  const remote = getRemoteData();

  if (!remote) {
    errors.push(
      "Todavía no creaste un repositorio remoto simulado. Usá: github create <nombre>."
    );
    return { ok: false, errors };
  }

  if (!remote.commits || remote.commits.length === 0) {
    errors.push(
      "Todavía no hiciste push al remoto. Probá con: git push origin main."
    );
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * MISIÓN 3
 * Objetivo:
 *  - Haber hecho al menos 2 commits en HEAD
 *  - Haber pusheado esos commits al GitHub simulado
 */
export async function validateMission3() {
  const errors = [];

  // 1) ¿Hay al menos 2 commits locales?
  let log = [];
  try {
    log = await getHeadLog();
  } catch (e) {
    // si falla, log se queda vacío
  }

  if (log.length < 2) {
    errors.push(
      "Necesitás al menos 2 commits en el repo local. Hacé un segundo commit."
    );
  }

  // 2) ¿El remoto tiene al menos 2 commits?
  const remote = getRemoteData();
  if (!remote || !remote.commits || remote.commits.length < 2) {
    errors.push(
      "Tu GitHub simulado no tiene aún 2 commits. Asegurate de hacer git push origin main después del segundo commit."
    );
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * MISIÓN 4
 * Objetivo:
 *  - Crear una rama llamada "feature/login"
 *  - Hacer al menos un commit en esa rama
 *  - Hacer push al remoto simulado de esa rama: git push origin feature/login
 */
export async function validateMission4() {
  const errors = [];

  // 1) ¿Existe la rama feature/login?
  let branches = [];
  try {
    branches = await git.listBranches({ fs, dir: REPO_DIR });
  } catch (e) {}

  if (!branches.includes("feature/login")) {
    errors.push('No creaste la rama "feature/login". Usá: git branch feature/login');
  }

  // 2) ¿Tiene commits propios?
  let logFeature = [];
  try {
    logFeature = await git.log({
      fs,
      dir: REPO_DIR,
      ref: "feature/login",
    });
  } catch (e) {}

  if (logFeature.length === 0) {
    errors.push(
      'La rama "feature/login" no tiene commits. Cambiá a esa rama (git checkout feature/login) y hacé al menos un commit.'
    );
  }

  // 3) ¿Se hizo push de esa rama al remoto?
  const remote = getRemoteData();
  if (!remote) {
    errors.push(
      "Todavía no creaste un remoto simulado. Usá: github create <nombre>."
    );
  } else {
    if (remote.lastPushedBranch !== "feature/login") {
      errors.push(
        'No hiciste push de la rama "feature/login". Probá con: git push origin feature/login.'
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
/**
 * MISIÓN 5
 * Objetivo:
 *  - Tener un archivo index.html
 *  - Que no esté vacío
 *  - Que tenga un <h1>...</h1> cuyo contenido incluya la palabra "git"
 */
export async function validateMission5() {
  const errors = [];
  const path = `${REPO_DIR}/index.html`;

  // 1) ¿Existe index.html?
  const exists = await fileExists(path);
  if (!exists) {
    errors.push('No encontré el archivo "index.html" en /repo.');
    return { ok: false, errors };
  }

  // 2) ¿Tiene contenido?
  let html;
  try {
    html = await readFile(path);
  } catch (e) {
    errors.push(
      `No pude leer index.html: ${e.message || String(e)}`
    );
    return { ok: false, errors };
  }

  const trimmed = html.trim();
  if (trimmed.length === 0) {
    errors.push("El archivo index.html está vacío. Escribí algo de contenido.");
  }

  // 3) ¿Tiene un <h1>...?</h1>
  const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/i;
  const h1Match = trimmed.match(h1Regex);

  if (!h1Match) {
    errors.push(
      'No encontré ningún encabezado <h1> en index.html. Agregá un <h1> con un título principal.'
    );
  } else {
    const h1Text = h1Match[1].toLowerCase();
    if (!h1Text.includes("git")) {
      errors.push(
        'El texto dentro de <h1> debería mencionar la palabra "Git" (por ejemplo: "Mi primera página con Git").'
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * MISIÓN 6
 * Objetivo:
 *  - Tener ramas "main" y "feature/login"
 *  - Que la rama "main" ya incorpore los cambios de "feature/login"
 *    (es decir, que ambas apunten al mismo commit final).
 *
 * Flujo sugerido para el alumno:
 *  1. git checkout main
 *  2. git merge feature/login
 */
export async function validateMission6() {
  const errors = [];

  let mainOid = null;
  let featureOid = null;

  // 1) ¿Existe rama main?
  try {
    mainOid = await git.resolveRef({
      fs,
      dir: REPO_DIR,
      ref: "refs/heads/main",
    });
  } catch {
    errors.push(
      'No encontré la rama "main". Asegurate de haber inicializado el repo con rama main y hecho al menos un commit.'
    );
  }

  // 2) ¿Existe rama feature/login?
  try {
    featureOid = await git.resolveRef({
      fs,
      dir: REPO_DIR,
      ref: "refs/heads/feature/login",
    });
  } catch {
    errors.push(
      'No encontré la rama "feature/login". Creala con: git branch feature/login y trabajá en ella.'
    );
  }

  if (!mainOid || !featureOid) {
    return { ok: false, errors };
  }

  // 3) ¿main contiene los cambios de feature/login?
  if (mainOid !== featureOid) {
    errors.push(
      'La rama "main" todavía no contiene los cambios de "feature/login". ' +
        'Probá desde main con: git merge feature/login'
    );
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * MISIÓN 7 — Generar un conflicto de merge simple
 *
 * Objetivo:
 *  - Que exista la rama "conflicto"
 *  - Que al hacer merge desde main, se haya producido un conflicto
 */
export async function validateMission7() {
  const errors = [];

  // Detectar si hubo conflicto
  const conflictFiles = await git.statusMatrix({ fs, dir: REPO_DIR })
    .then(matrix =>
      matrix.filter(([path, head, workdir, stage]) => stage === 0 && workdir === 2)
        .map(([path]) => path)
    )
    .catch(() => []);

  if (conflictFiles.length === 0) {
    errors.push(
      "No se detectaron archivos en conflicto. Necesitás producir un conflicto modificando la misma línea en dos ramas distintas."
    );
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * MISIÓN 8 — Resolver el conflicto y completar el merge
 */
export async function validateMission8() {
  const errors = [];

  // Detectar si aún hay marcadores <<<<<<< >>>>>>>
  let conflictMarkers = false;

  const files = await listDir(REPO_DIR);
  const visible = files.filter((f) => f !== ".git");

  for (const file of visible) {
    const full = `${REPO_DIR}/${file}`;
    const content = await readFile(full);
    if (
      content.includes("<<<<<<<") ||
      content.includes("=======") ||
      content.includes(">>>>>>>")
    ) {
      conflictMarkers = true;
      break;
    }
  }

  if (conflictMarkers) {
    errors.push(
      "Todavía quedan marcadores de conflicto (<<<<<<< ======= >>>>>>>). Tenés que resolverlos y luego hacer commit."
    );
  }

  // Detectar si se completó el merge
  let mergeDone = true;
  try {
    const log = await git.log({ fs, dir: REPO_DIR, ref: "HEAD" });
    mergeDone = log[0].commit.message.toLowerCase().includes("resuelvo");
  } catch {
    mergeDone = false;
  }

  if (!mergeDone) {
    errors.push(
      'Después de resolver el conflicto tenés que hacer: git add <archivo> y luego: git commit -m "Resuelvo conflicto"'
    );
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * MISIÓN 9
 * Crear un Pull Request simulado desde una rama de feature hacia main.
 *
 * Esta misión valida:
 *  - Que exista un remoto simulado.
 *  - Que exista al menos una rama distinta de main.
 *  - Que haya un PR creado en el remoto simulado.
 */
export async function validateMission9() {
  const errors = [];

  const remote = getRemoteData();
  if (!remote) {
    errors.push(
      "Todavía no creaste un remoto simulado. Usá: github create <nombre-repo>"
    );
    return { ok: false, errors };
  }

  // Debe haber al menos un PR
  const prs = remote.pullRequests || [];
  if (prs.length === 0) {
    errors.push(
      "No encontré Pull Requests. Creá uno con:\ngithub pr create <rama> main"
    );
    return { ok: false, errors };
  }

  // Debe haber PR abierto (OPEN)
  const open = prs.find((p) => p.status === "OPEN");
  if (!open) {
    errors.push(
      "No encontré ningún PR abierto. Asegurate de crear uno desde tu rama de feature."
    );
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * MISIÓN 10 - Configurar remoto origin
 * Validar que existe un remoto configurado con git remote
 */
export async function validateMission10() {
  const errors = [];

  // Verificar que existe configuración de remoto en git
  let remotes = [];
  try {
    remotes = await git.listRemotes({ fs, dir: REPO_DIR });
  } catch (e) {
    errors.push("No se pudo verificar la configuración de remotos.");
    return { ok: false, errors };
  }

  const origin = remotes.find(r => r.remote === "origin");
  if (!origin) {
    errors.push(
      'No configuraste el remoto "origin". Usá: git remote add origin <url>'
    );
  } else {
    // Verificar que la URL coincida con el remoto simulado
    const remote = getRemoteData();
    if (remote && !origin.url.includes(remote.name)) {
      errors.push(
        `La URL del remoto origin no coincide con tu repo simulado. Esperado: ${remote.url}`
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * MISIÓN 11 - Push inicial
 * Validar que se hizo push al remoto
 */
export async function validateMission11() {
  const errors = [];

  const remote = getRemoteData();
  if (!remote) {
    errors.push(
      "No hay remoto simulado. Creá uno con: github create <nombre>"
    );
    return { ok: false, errors };
  }

  if (!remote.commits || remote.commits.length === 0) {
    errors.push(
      "No hiciste push al remoto. Asegurate de hacer git push origin main después de commitear."
    );
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * MISIÓN 12 - Pull desde remoto
 * Validar que se ejecutó git pull (verificamos que HEAD esté actualizado)
 */
export async function validateMission12() {
  const errors = [];

  const remote = getRemoteData();
  if (!remote || !remote.commits || remote.commits.length === 0) {
    errors.push(
      "El remoto no tiene commits. Hacé push primero para poder hacer pull."
    );
    return { ok: false, errors };
  }

  // Verificar que local tiene los mismos commits que remoto
  let localLog = [];
  try {
    localLog = await getHeadLog();
  } catch (e) {
    errors.push("No se pudo obtener el log local.");
    return { ok: false, errors };
  }

  const localCommitIds = localLog.map(c => c.oid);
  const remoteCommitIds = remote.commits.map(c => c.oid);

  const hasAllRemoteCommits = remoteCommitIds.every(oid => 
    localCommitIds.includes(oid)
  );

  if (!hasAllRemoteCommits) {
    errors.push(
      "Tu repo local no tiene todos los commits del remoto. Usá: git pull origin main"
    );
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * MISIÓN 13 - Commit message validado
 * El mensaje del último commit debe mencionar el archivo modificado
 */
export async function validateMission13() {
  const errors = [];

  let log = [];
  try {
    log = await getHeadLog();
  } catch (e) {
    errors.push("No hay commits todavía.");
    return { ok: false, errors };
  }

  if (log.length === 0) {
    errors.push("No hay commits todavía.");
    return { ok: false, errors };
  }

  const lastCommit = log[0];
  const message = lastCommit.commit.message.toLowerCase();

  // Obtener archivos del último commit
  let files = [];
  try {
    files = await git.listFiles({ fs, dir: REPO_DIR, ref: lastCommit.oid });
  } catch (e) {}

  // Buscar archivos js/html/css/md
  const hasJs = files.some(f => f.endsWith(".js"));
  const hasHtml = files.some(f => f.endsWith(".html"));
  const hasCss = files.some(f => f.endsWith(".css"));
  const hasMd = files.some(f => f.endsWith(".md"));

  let valid = false;

  // El mensaje debe mencionar el tipo de archivo o el nombre
  if (hasJs && (message.includes("js") || message.includes("javascript") || message.includes("app"))) {
    valid = true;
  }
  if (hasHtml && (message.includes("html") || message.includes("index"))) {
    valid = true;
  }
  if (hasCss && (message.includes("css") || message.includes("style"))) {
    valid = true;
  }
  if (hasMd && (message.includes("readme") || message.includes("md"))) {
    valid = true;
  }

  if (!valid) {
    errors.push(
      "El mensaje del commit debe mencionar el archivo modificado o su tipo (ej: 'Add app.js', 'Update styles', 'Fix HTML')."
    );
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * MISIÓN 14 - Tres commits en secuencia
 */
export async function validateMission14() {
  const errors = [];

  let log = [];
  try {
    log = await getHeadLog();
  } catch (e) {
    errors.push("No hay commits todavía.");
    return { ok: false, errors };
  }

  if (log.length < 3) {
    errors.push(
      `Necesitás al menos 3 commits. Actualmente tenés ${log.length}.`
    );
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * MISIÓN 15 - Checkout a commit anterior
 * Validar que el usuario está en detached HEAD
 */
export async function validateMission15() {
  const errors = [];

  const currentBranch = await gitCurrentBranchName();
  
  if (currentBranch && currentBranch !== "HEAD (detached)") {
    errors.push(
      "No estás en detached HEAD. Usá git log para ver commits anteriores y luego git checkout <hash> para moverte a uno."
    );
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * MISIÓN 16 - Volver a main
 * Validar que el usuario volvió a la rama main
 */
export async function validateMission16() {
  const errors = [];

  const currentBranch = await gitCurrentBranchName();
  
  if (currentBranch !== "main") {
    errors.push(
      'No estás en la rama main. Usá: git checkout main para volver.'
    );
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * MISIÓN 17 - Clonar repositorio remoto
 * Validar que el repo local tiene commits del remoto
 */
export async function validateMission17() {
  const errors = [];

  const remote = getRemoteData();
  if (!remote) {
    errors.push(
      "No hay remoto simulado. Creá uno primero con: github create <nombre>"
    );
    return { ok: false, errors };
  }

  let log = [];
  try {
    log = await getHeadLog();
  } catch (e) {
    errors.push(
      "El repositorio local no tiene commits. Usá: git clone <url> para clonar desde el remoto."
    );
    return { ok: false, errors };
  }

  if (log.length === 0) {
    errors.push(
      "El repositorio local está vacío. Usá: git clone <url>"
    );
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * MISIÓN 18 - Publish en Pages
 * Validar que se ejecutó git pages publish
 */
export async function validateMission18() {
  const errors = [];

  const remote = getRemoteData();
  if (!remote) {
    errors.push("No hay remoto simulado.");
    return { ok: false, errors };
  }

  if (!remote.pagesUrl) {
    errors.push(
      "No publicaste el sitio. Usá: git pages publish"
    );
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * MISIÓN 19 - Republish tras cambios
 * Validar que se actualizó el deploy
 */
export async function validateMission19() {
  const errors = [];

  const remote = getRemoteData();
  if (!remote) {
    errors.push("No hay remoto simulado.");
    return { ok: false, errors };
  }

  if (!remote.pagesUrl) {
    errors.push(
      "No publicaste el sitio inicialmente. Usá: git pages publish"
    );
    return { ok: false, errors };
  }

  if (!remote.pagesLastUpdate) {
    errors.push(
      "No hay registro de actualización. Usá: git pages republish después de hacer cambios."
    );
  } else {
    // Verificar que hubo un commit después del primer publish
    const log = await getHeadLog().catch(() => []);
    if (log.length < 2) {
      errors.push(
        "Necesitás hacer al menos un commit nuevo después del publish inicial."
      );
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
