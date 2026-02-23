// src/gitFs.js
import LightningFS from "@isomorphic-git/lightning-fs";

const fs = new LightningFS("git-trainer-fs");
const pfs = fs.promises;

export const REPO_DIR = "/repo";

export async function initFileSystem() {
  try {
    await pfs.mkdir(REPO_DIR);
  } catch (e) {
    // si ya existe, no pasa nada
  }

  try {
    await pfs.writeFile(`${REPO_DIR}/README.md`, "Proyecto Git Trainer\n");
  } catch (e) {
    // si ya existe, lo dejamos
  }
}

export async function listDir(path = REPO_DIR) {
  return pfs.readdir(path);
}

export async function readFile(path) {
  return pfs.readFile(path, { encoding: "utf8" });
}

export async function writeFile(path, content = "") {
  await pfs.writeFile(path, content, { encoding: "utf8" });
}

export async function fileExists(path) {
  try {
    await pfs.stat(path);
    return true;
  } catch {
    return false;
  }
}

// 🔹 NUEVO: borrar todo el contenido de /repo (incluyendo .git)
async function clearDir(path, isRoot = false) {
  let entries = [];
  try {
    entries = await pfs.readdir(path);
  } catch {
    return;
  }

  for (const name of entries) {
    const full = `${path}/${name}`;
    let stat;
    try {
      stat = await pfs.stat(full);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      await clearDir(full, false);
      try {
        await pfs.rmdir(full);
      } catch {}
    } else {
      try {
        await pfs.unlink(full);
      } catch {}
    }
  }

  if (!isRoot) {
    try {
      await pfs.rmdir(path);
    } catch {}
  }
}

// 🔹 NUEVO: función pública para reiniciar el repo
export async function resetFileSystem() {
  // limpia /repo y lo vuelve a crear vacío
  await clearDir(REPO_DIR, true);
  try {
    await pfs.mkdir(REPO_DIR);
  } catch {}
}

export { fs, pfs };

export async function createFileWithTemplate(file) {
  const path = `${REPO_DIR}/${file}`;

  if (file.toLowerCase().endsWith(".html")) {
    const template = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${file}</title>
</head>
<body>

</body>
</html>
`;
    await writeFile(path, template);
    return;
  }

  // Podés extender para .css, .js, etc.
  await writeFile(path, "");
}
