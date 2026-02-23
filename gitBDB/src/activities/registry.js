// src/activities/registry.js
// Registro centralizado de actividades accesible por ID (para routing).
import { CHIHIRO_ACTIVITY } from "./chihiroActivity";

export const ACTIVITY_REGISTRY = {
  "act-1": {
    id: "act-1",
    title: "Actividad 1 – Git local (básico)",
    description:
      "Trabajá con Git local: inicializar el repo, agregar archivos y hacer commits. No se usa GitHub simulado ni editor.",
    showEditor: false,
    solutionCommands: [
      "git init",
      "touch index.html",
      "git add index.html",
      'git commit -m "Primer commit"',
      "touch styles.css",
      "git add styles.css",
      'git commit -m "Segundo commit"',
    ],
    allowedCommands: [
      "help", "ls", "cat", "touch", "pwd",
      "git init", "git status", "git add", "git commit", "git log",
      "git branch", "git checkout"
    ],
    missions: [
      {
        id: "m1",
        title: "Misión 1 – Tu primer commit",
        description:
          'Creá el archivo "index.html", agregalo con git add y hacé un commit cuyo mensaje incluya la frase "Primer commit".',
        validatorKey: "m1",
      },
      {
        id: "m3",
        title: "Misión 3 – Seguir trabajando y actualizar el remoto",
        description:
          "Agregá al menos un segundo commit en el repo local y volvé a pushear al remoto simulado. Local y remoto deben tener al menos 2 commits.",
        validatorKey: "m3",
      },
    ],
    seedFiles: [
      { path: "README.md", content: "Proyecto Git Trainer\n" },
    ],
  },
  "act-2": {
    id: "act-2",
    title: "Actividad 2 – Git + GitHub simulado",
    description:
      "Practicá Git local y GitHub simulado: commits, push al remoto y ramas.",
    showEditor: false,
    solutionCommands: [
      "git init",
      "touch index.html",
      "git add index.html",
      'git commit -m "Primer commit"',
      "github create mi-proyecto",
      "git push origin main",
      "touch app.js",
      "git add app.js",
      'git commit -m "Segundo commit"',
      "git push origin main",
      "git checkout -b feature/login",
      "touch login.html",
      "git add login.html",
      'git commit -m "Agregado login"',
      "git push origin feature/login",
      "git checkout main",
      "git merge feature/login",
    ],
    allowedCommands: [
      "help", "ls", "cat", "touch", "pwd",
      "git init", "git status", "git add", "git commit", "git log",
      "git branch", "git checkout", "git merge", "git push",
      "github create", "github status"
    ],
    missions: [
      {
        id: "m1",
        title: "Misión 1 – Tu primer commit",
        description:
          'Creá el archivo "index.html", agregalo con git add y hacé un commit cuyo mensaje incluya la frase "Primer commit".',
        validatorKey: "m1",
      },
      {
        id: "m2",
        title: "Misión 2 – Subir cambios al GitHub simulado",
        description:
          'Creá un repo remoto simulado con "github create ..." y luego subí tus commits con "git push origin main".',
        validatorKey: "m2",
      },
      {
        id: "m3",
        title: "Misión 3 – Seguir trabajando y actualizar el remoto",
        description:
          "Agregá al menos un segundo commit en el repo local y volvé a pushear al remoto simulado. Local y remoto deben tener al menos 2 commits.",
        validatorKey: "m3",
      },
      {
        id: "m4",
        title: 'Misión 4 – Rama "feature/login"',
        description:
          'Creá la rama "feature/login", cambiate a esa rama (git checkout feature/login), hacé al menos un commit y luego subí esa rama al GitHub simulado con "git push origin feature/login".',
        validatorKey: "m4",
      },
      {
        id: "m6",
        title: 'Misión 6 – Merge de "feature/login" a "main"',
        description:
          'Desde la rama "main", integrá los cambios de "feature/login" usando "git merge feature/login". Al final, ambas ramas deben apuntar al mismo commit.',
        validatorKey: "m6",
      },
    ],
    seedFiles: [
      { path: "README.md", content: "Repo con remoto simulado\n" },
    ],
  },
  "act-3": {
    id: "act-3",
    title: "Actividad 3 – Git + GitHub + HTML",
    description:
      'Además de Git y GitHub simulado, trabajá con el editor para crear "index.html" y validar su contenido.',
    showEditor: true,
    solutionCommands: [
      "git init",
      "touch index.html",
      '# Editar index.html: agregar <h1> con la palabra "Git"',
      "git add index.html",
      'git commit -m "Primer commit"',
      "github create mi-web",
      "git push origin main",
      "touch README.md",
      "git add README.md",
      'git commit -m "Segundo commit"',
      "git push origin main",
      "git checkout -b feature/login",
      "touch login.html",
      "git add login.html",
      'git commit -m "Agregado login"',
      "git push origin feature/login",
      "git checkout main",
      "git merge feature/login",
      "# Para crear conflicto: editar mismo archivo en 2 ramas",
      "# Resolver: editar archivo, git add, git commit",
      "github pr create feature/nueva-feature main",
    ],
    allowedCommands: [
      "help", "ls", "cat", "touch", "pwd",
      "git init", "git status", "git add", "git commit", "git log",
      "git branch", "git checkout", "git merge", "git push", "git conflicts",
      "github create", "github status", "github pr"
    ],
    missions: [
      {
        id: "m1",
        title: "Misión 1 – Tu primer commit",
        description:
          'Creá el archivo "index.html", agregalo con git add y hacé un commit cuyo mensaje incluya la frase "Primer commit".',
        validatorKey: "m1",
      },
      {
        id: "m2",
        title: "Misión 2 – Subir cambios al GitHub simulado",
        description:
          'Creá un repo remoto simulado con "github create ..." y luego subí tus commits con "git push origin main".',
        validatorKey: "m2",
      },
      {
        id: "m3",
        title: "Misión 3 – Seguir trabajando y actualizar el remoto",
        description:
          "Agregá al menos un segundo commit en el repo local y volvé a pushear al remoto simulado. Local y remoto deben tener al menos 2 commits.",
        validatorKey: "m3",
      },
      {
        id: "m4",
        title: 'Misión 4 – Rama "feature/login"',
        description:
          'Creá la rama "feature/login", cambiate a esa rama (git checkout feature/login), hacé al menos un commit y luego subí esa rama al GitHub simulado con "git push origin feature/login".',
        validatorKey: "m4",
      },
      {
        id: "m5",
        title: 'Misión 5 – Página inicial con Git',
        description:
          'En el archivo "index.html", escribí una página simple que tenga un <h1> cuyo texto mencione la palabra "Git". Después podés versionarla con git add / git commit.',
        validatorKey: "m5",
      },
      {
        id: "m6",
        title: 'Misión 6 – Merge de "feature/login" a "main"',
        description:
          'Desde la rama "main", integrá los cambios de "feature/login" usando "git merge feature/login". Al final, ambas ramas deben apuntar al mismo commit.',
        validatorKey: "m6",
      },
      {
        id: "m7",
        title: "Misión 7 – Generar un conflicto de merge",
        description:
          "Trabajá en dos ramas y provocá un conflicto modificando la misma línea del mismo archivo.",
        validatorKey: "m7",
      },
      {
        id: "m8",
        title: "Misión 8 – Resolver el conflicto de merge",
        description:
          "Abrí el editor, resolvé el conflicto eliminando las marcas y dejá la versión correcta. Luego: git add, git commit.",
        validatorKey: "m8",
      },
      {
        id: "m9",
        title: "Misión 9 – Mi Primer Pull Request",
        description:
          "Creá una rama de feature, hacé commits, subí la rama al remoto y luego creá un Pull Request (github pr create <from> main). Verificá que aparezca en el visualizador.",
        validatorKey: "m9",
      },
    ],
    seedFiles: [
      {
        path: "index.html",
        content: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Actividad 3</title>
</head>
<body>
  <h1>Practicando Git</h1>
  <p>Completá las misiones usando el terminal.</p>
</body>
</html>
`,
      },
      { path: "README.md", content: "Actividad 3 con HTML inicial\n" },
    ],
  },
  "act-4": {
    id: "act-4",
    title: "Actividad 4 – Remotes + Push/Pull",
    description:
      "Practicá la gestión de repositorios remotos: configurar origin, verificar remotos, sincronizar cambios con push y pull.",
    showEditor: false,
    solutionCommands: [
      "git init",
      "touch README.md",
      "git add README.md",
      'git commit -m "Initial commit"',
      "github create mi-proyecto",
      "git remote add origin https://github-sim.local/mi-proyecto.git",
      "git remote -v",
      "git push origin main",
      "# Simular cambio remoto (otro dev pushea)",
      "git pull origin main",
      "touch app.js",
      "git add app.js",
      'git commit -m "Add app.js with proper description"',
      "git push origin main",
    ],
    allowedCommands: [
      "help", "ls", "cat", "touch", "pwd",
      "git init", "git status", "git add", "git commit", "git log",
      "git branch", "git checkout", "git merge", "git push", "git pull",
      "git remote",
      "github create", "github status"
    ],
    missions: [
      {
        id: "m10",
        title: "Misión 10 – Configurar remoto origin",
        description:
          'Creá un repo remoto con "github create", luego configurá origin con "git remote add origin <url>" y verificá con "git remote -v".',
        validatorKey: "m10",
      },
      {
        id: "m11",
        title: "Misión 11 – Push inicial",
        description:
          "Hacé al menos un commit local y subilo al remoto con git push origin main.",
        validatorKey: "m11",
      },
      {
        id: "m12",
        title: "Misión 12 – Pull desde remoto",
        description:
          "Simulá que hay cambios nuevos en el remoto y traelos con git pull origin main.",
        validatorKey: "m12",
      },
      {
        id: "m13",
        title: "Misión 13 – Commit message validado",
        description:
          "Creá un archivo nuevo (ej: app.js), agregalo y hacé commit con un mensaje que mencione el archivo o su tipo (js/javascript).",
        validatorKey: "m13",
      },
    ],
    seedFiles: [
      { path: "README.md", content: "# Proyecto con Remoto\n" },
    ],
  },
  "act-5": {
    id: "act-5",
    title: "Actividad 5 – Historia y Checkout de Commits",
    description:
      "Aprendé a moverte entre versiones del proyecto usando checkout de commits. Volvé a estados anteriores y luego regresá a la rama main.",
    showEditor: true,
    solutionCommands: [
      "git init",
      "touch v1.txt",
      "git add v1.txt",
      'git commit -m "Version 1"',
      "touch v2.txt",
      "git add v2.txt",
      'git commit -m "Version 2"',
      "touch v3.txt",
      "git add v3.txt",
      'git commit -m "Version 3"',
      "git log",
      "# Copiar hash del primer commit",
      "git checkout <hash-commit-1>",
      "ls  # Ver que solo existe v1.txt",
      "git checkout main",
      "ls  # Ahora ves v1, v2, v3",
    ],
    allowedCommands: [
      "help", "ls", "cat", "touch", "pwd",
      "git init", "git status", "git add", "git commit", "git log",
      "git branch", "git checkout"
    ],
    missions: [
      {
        id: "m14",
        title: "Misión 14 – Tres commits en secuencia",
        description:
          "Creá 3 commits diferentes (pueden ser 3 archivos distintos: v1.txt, v2.txt, v3.txt) para tener un historial claro.",
        validatorKey: "m14",
      },
      {
        id: "m15",
        title: "Misión 15 – Checkout a commit anterior",
        description:
          "Usá git log para obtener el hash de un commit anterior y hacé git checkout <hash> para moverte a ese estado (detached HEAD).",
        validatorKey: "m15",
      },
      {
        id: "m16",
        title: "Misión 16 – Volver a main",
        description:
          "Desde el estado detached, volvé a la rama main con git checkout main.",
        validatorKey: "m16",
      },
    ],
    seedFiles: [],
  },
  "act-6": {
    id: "act-6",
    title: "Actividad 6 – Clone y GitHub Pages",
    description:
      "Cloná un repositorio remoto simulado y desplegá tu sitio con GitHub Pages (simulado). Actualizá el deploy con cambios nuevos.",
    showEditor: true,
    solutionCommands: [
      "# Primero crear remoto con contenido",
      "git init",
      "touch index.html",
      "git add index.html",
      'git commit -m "Initial site"',
      "github create mi-sitio",
      "git push origin main",
      "",
      "# Simular clone (reset local y traer desde remoto)",
      "git clone https://github-sim.local/mi-sitio.git",
      "ls  # Ver archivos clonados",
      "",
      "# Publicar en Pages",
      "git pages publish",
      "# URL: https://pages-sim.local/mi-sitio",
      "",
      "# Hacer cambios y republicar",
      "touch styles.css",
      "git add styles.css",
      'git commit -m "Add styles"',
      "git push origin main",
      "git pages republish",
    ],
    allowedCommands: [
      "help", "ls", "cat", "touch", "pwd",
      "git init", "git status", "git add", "git commit", "git log",
      "git branch", "git checkout", "git push", "git clone",
      "git pages",
      "github create", "github status"
    ],
    missions: [
      {
        id: "m17",
        title: "Misión 17 – Clonar repositorio remoto",
        description:
          "Usá git clone <url> para inicializar el repo local desde el remoto simulado. Verificá que los archivos y commits se copiaron.",
        validatorKey: "m17",
      },
      {
        id: "m18",
        title: "Misión 18 – Publish en Pages",
        description:
          "Desplegá tu sitio con git pages publish. El comando debe devolver una URL simulada de tu sitio publicado.",
        validatorKey: "m18",
      },
      {
        id: "m19",
        title: "Misión 19 – Republish tras cambios",
        description:
          "Hacé un nuevo commit, pushealo al remoto y luego actualizá el deploy con git pages republish.",
        validatorKey: "m19",
      },
    ],
    seedFiles: [],
  },
  chihiro: CHIHIRO_ACTIVITY,
};

export function listActivities() {
  return Object.values(ACTIVITY_REGISTRY);
}

export function getActivityById(id) {
  return ACTIVITY_REGISTRY[id] || null;
}
