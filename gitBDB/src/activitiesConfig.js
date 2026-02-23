// src/activitiesConfig.js

// Cada actividad representa un "escenario" de práctica
export const ACTIVITIES = [
  {
    id: "git-basico",
    name: "Actividad 1 – Git local (básico)",
    description:
      "Trabajá con Git local: inicializar el repo, agregar archivos y hacer commits. No se usa GitHub simulado ni editor.",
    showEditor: false,
    enabledMissionIds: ["m1", "m3"], // solo misiones de Git local
  },
  {
    id: "git-github",
    name: "Actividad 2 – Git + GitHub simulado",
    description:
      "Practicá Git local y GitHub simulado: commits, push al remoto y ramas.",
    showEditor: false,
    enabledMissionIds: ["m1", "m2", "m3", "m4","m6"],
  },
  {
    id: "git-github-editor-html",
    name: "Actividad 3 – Git + GitHub + HTML",
    description:
      'Además de Git y GitHub simulado, trabajá con el editor para crear "index.html" y validar su contenido.',
    showEditor: true,
    enabledMissionIds: ["m1","m2","m3","m4","m5","m6","m7","m8","m9"],
  },
];
