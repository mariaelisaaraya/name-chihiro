// src/SuggestionsPanel.jsx
import React, { useEffect, useState } from "react";
import * as git from "isomorphic-git";
import { fs, REPO_DIR, listDir } from "./gitFs";
import { getRemoteData } from "./githubSim";
import { gitCurrentBranchName } from "./gitService";

export function SuggestionsPanel() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const buildSuggestions = async () => {
    setLoading(true);
    const items = [];

    // 1) ¿Repo inicializado?
    let hasHead = false;
    try {
      await fs.promises.readFile(`${REPO_DIR}/.git/HEAD`, {
        encoding: "utf8",
      });
      hasHead = true;
    } catch {
      hasHead = false;
    }

    if (!hasHead) {
      setSuggestions([
        "Todavía no inicializaste el repositorio.",
        '💡 Empezá con: git init',
      ]);
      setLoading(false);
      return;
    }

    // 2) Rama actual
    let currentBranch = null;
    try {
      currentBranch = await gitCurrentBranchName();
    } catch {
      currentBranch = null;
    }

    // 3) Commits en HEAD
    let headLog = [];
    try {
      headLog = await git.log({ fs, dir: REPO_DIR, ref: "HEAD" });
    } catch {
      headLog = [];
    }

    if (headLog.length === 0) {
      items.push(
        "Aún no hay commits en este repo.",
        '💡 Tip: creá o editá un archivo (por ejemplo "index.html"), agregalo con git add y luego: git commit -m "tu mensaje"'
      );
    } else if (headLog.length < 3) {
      items.push(
        `Tenés ${headLog.length} commit(s) en la rama actual${
          currentBranch ? ` (${currentBranch})` : ""
        }.`,
        "💡 Podés seguir practicando pequeños commits: cambiá algo, hacé git add y git commit de nuevo."
      );
    } else {
      items.push(
        `Ya tenés varios commits en la rama actual${
          currentBranch ? ` (${currentBranch})` : ""
        }.`,
        '💡 Es un buen momento para practicar ramas: por ejemplo, creá "feature/login" con: git branch feature/login'
      );
    }

    // 4) ¿Hay archivos en /repo?
    let entries = [];
    try {
      entries = await listDir(REPO_DIR);
    } catch {
      entries = [];
    }
    const visibleFiles = entries.filter((f) => f !== ".git");

    if (visibleFiles.length === 0) {
      items.push(
        "",
        "No hay archivos de trabajo en /repo.",
        '💡 Tip: creá uno desde el editor o con: touch index.html'
      );
    }

    // 5) Remoto simulado (GitHub)
    const remote = getRemoteData();
    if (!remote) {
      items.push(
        "",
        "Todavía no creaste un remoto simulado.",
        '💡 Probá con: github create mi-repo',
        "Luego podés subir tus commits con: git push origin main"
      );
    } else {
      // ¿hay branch actual en el remoto?
      const remoteBranch = remote.lastPushedBranch;
      const remoteCommits = remote.commits || [];
      if (remoteCommits.length === 0) {
        items.push(
          "",
          `Tenés un remoto simulado ("${remote.name || "mi-repo"}"), pero aún no subiste commits.`,
          `💡 Tip: si estás en main, probá con: git push origin main`
        );
      } else if (
        currentBranch &&
        remoteBranch &&
        currentBranch !== remoteBranch
      ) {
        items.push(
          "",
          `Última rama pusheada al remoto: ${remoteBranch}.`,
          `💡 Si querés subir esta rama (${currentBranch}), usá: git push origin ${currentBranch}`
        );
      }
    }

    // 6) Sugerencia suave sobre merge si hay al menos 2 ramas
    let branches = [];
    try {
      branches = await git.listBranches({ fs, dir: REPO_DIR });
    } catch {
      branches = [];
    }

    if (branches.length >= 2) {
      items.push(
        "",
        `Ramas locales: ${branches.join(", ")}`,
        '💡 Podés practicar merge desde "main" integrando otra rama, por ejemplo: git merge feature/login'
      );
    }

    setSuggestions(items);
    setLoading(false);
  };

  useEffect(() => {
    buildSuggestions();
  }, []);

  return (
    <div
      style={{
        marginTop: "12px",
        background: "#020617",
        borderRadius: "8px",
        border: "1px solid #1f2937",
        padding: "10px",
        fontSize: "13px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "6px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "14px",
            color: "#e5e7eb",
          }}
        >
          Sugerencias / próximos pasos
        </h3>
        <button
          type="button"
          onClick={buildSuggestions}
          disabled={loading}
          style={{
            background: "#4b5563",
            border: "none",
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: "11px",
            color: "#f9fafb",
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {suggestions.length === 0 ? (
        <p style={{ margin: 0, color: "#9ca3af", fontSize: "12px" }}>
          No hay sugerencias por ahora. Ejecutá algunos comandos y volvé a
          actualizar.
        </p>
      ) : (
        <ul
          style={{
            margin: 0,
            paddingLeft: "18px",
            color: "#e5e7eb",
          }}
        >
          {suggestions.map((s, i) =>
            s === "" ? (
              <li key={i} style={{ listStyle: "none", marginTop: "4px" }} />
            ) : (
              <li key={i} style={{ marginBottom: "2px" }}>
                {s}
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
