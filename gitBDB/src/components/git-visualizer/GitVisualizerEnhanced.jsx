// src/components/git-visualizer/GitVisualizerEnhanced.jsx
import React, { useEffect, useState } from "react";
import * as git from "isomorphic-git";
import { fs, REPO_DIR } from "../../gitFs";
import { getRemoteData } from "../../githubSim";
import { gitCurrentBranchName } from "../../gitService";
import GitGraph from "./GitGraph";
import RemoteStatus from "./RemoteStatus";
import PullRequestCard from "./PullRequestCard";
import EmptyState from "./EmptyState";
import "./GitVisualizer.css";

export default function GitVisualizerEnhanced({ theme }) {
  const [branchGraph, setBranchGraph] = useState([]);
  const [currentBranch, setCurrentBranch] = useState("main");
  const [remoteInfo, setRemoteInfo] = useState(null);
  const [remoteCommits, setRemoteCommits] = useState([]);
  const [pullRequests, setPullRequests] = useState([]);
  const [localCommitsCount, setLocalCommitsCount] = useState(0);

  async function loadData() {
    // Rama actual
    try {
      const name = await gitCurrentBranchName();
      setCurrentBranch(name || "HEAD");
    } catch {
      setCurrentBranch("HEAD");
    }

    // Contador de commits locales
    try {
      const log = await git.log({ fs, dir: REPO_DIR, ref: "HEAD" });
      setLocalCommitsCount(log.length);
    } catch {
      setLocalCommitsCount(0);
    }

    // Mapa de ramas con commits
    try {
      const branches = await git.listBranches({ fs, dir: REPO_DIR });
      const graphData = [];

      for (const branch of branches) {
        let blog = [];
        try {
          blog = await git.log({
            fs,
            dir: REPO_DIR,
            ref: branch,
            depth: 20,
          });
        } catch {
          blog = [];
        }

        graphData.push({
          name: branch,
          commits: blog.map((c) => ({
            oid: c.oid,
            message: c.commit.message,
            timestamp: c.commit.committer.timestamp,
          })),
        });
      }

      setBranchGraph(graphData);
    } catch {
      setBranchGraph([]);
    }

    // Remoto simulado
    const remote = getRemoteData();
    if (!remote) {
      setRemoteInfo(null);
      setRemoteCommits([]);
      setPullRequests([]);
    } else {
      setRemoteInfo({
        name: remote.name,
        url: remote.url,
        defaultBranch: remote.defaultBranch,
        lastPushedBranch: remote.lastPushedBranch,
      });
      setRemoteCommits(remote.commits || []);
      setPullRequests(remote.pullRequests || []);
    }
  }

  useEffect(() => {
    loadData();
    // Auto-refresh cada 2 segundos para ver cambios en tiempo casi real
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleBranchClick = (branchName) => {
    // Por ahora solo visual, no cambia rama real
    // En el futuro se podría integrar con commandRunner
    console.log("Branch clicked:", branchName);
  };

  return (
    <div className="git-visualizer" data-theme={theme}>
      <div className="git-visualizer__header">
        <h2 className="git-visualizer__title">
          🔍 Visualizador Git / GitHub
        </h2>
        <button className="git-visualizer__refresh-btn" onClick={loadData}>
          ↻ Refrescar
        </button>
      </div>

      <div className="git-visualizer__content">
        {/* Lado izquierdo: Repo local */}
        <div className="git-visualizer__local">
          <h3 className="git-visualizer__section-title">
            💻 Repo local
            <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.7 }}>
              ({currentBranch})
            </span>
          </h3>

          {branchGraph.length === 0 ? (
            <EmptyState
              icon="📦"
              title="Sin commits todavía"
              message="Inicializá el repo y creá tu primer commit para ver el gráfico."
              command='git init && touch README.md && git add README.md && git commit -m "Primer commit"'
            />
          ) : (
            <>
              <div style={{ fontSize: 11, color: "var(--vsc-muted)", marginBottom: 8 }}>
                💡 Cada círculo es un commit. De izquierda (antiguo) a derecha (nuevo).
              </div>
              <GitGraph
                branchGraph={branchGraph}
                currentBranch={currentBranch}
                onBranchClick={handleBranchClick}
              />
            </>
          )}
        </div>

        {/* Lado derecho: GitHub simulado */}
        <div className="git-visualizer__remote">
          <h3 className="git-visualizer__section-title">
            ☁️ GitHub simulado
          </h3>

          {!remoteInfo ? (
            <EmptyState
              icon="🌐"
              title="Sin remoto configurado"
              message="Creá un repositorio remoto simulado para practicar push, pull y PRs."
              command="github create mi-repo"
            />
          ) : (
            <>
              <RemoteStatus
                remoteInfo={remoteInfo}
                localCommitsCount={localCommitsCount}
                remoteCommitsCount={remoteCommits.length}
              />

              {/* Commits remotos */}
              <div style={{ marginTop: 12 }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 12, opacity: 0.8 }}>
                  Commits remotos ({remoteCommits.length})
                </h4>
                {remoteCommits.length === 0 ? (
                  <div style={{ fontSize: 11, color: "var(--vsc-muted)", fontStyle: "italic" }}>
                    Sin commits remotos. Probá: <code>git push origin main</code>
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: "var(--vsc-muted)" }}>
                    {remoteCommits.slice(0, 3).map((c) => (
                      <div
                        key={c.oid}
                        style={{
                          padding: "4px 6px",
                          background: "rgba(0,0,0,0.3)",
                          borderRadius: 4,
                          marginBottom: 4,
                          fontFamily: "var(--vsc-mono)",
                        }}
                      >
                        <span style={{ color: "#22c55e" }}>{c.oid.slice(0, 7)}</span>{" "}
                        {c.message}
                      </div>
                    ))}
                    {remoteCommits.length > 3 && (
                      <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>
                        ... y {remoteCommits.length - 3} más
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pull Requests */}
              <div style={{ marginTop: 16 }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 12, opacity: 0.8 }}>
                  Pull Requests ({pullRequests.length})
                </h4>
                {pullRequests.length === 0 ? (
                  <div style={{ fontSize: 11, color: "var(--vsc-muted)", fontStyle: "italic" }}>
                    Sin PRs todavía. Probá: <code>github pr create feature/login main</code>
                  </div>
                ) : (
                  <div>
                    {pullRequests.map((pr) => (
                      <PullRequestCard key={pr.id} pr={pr} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
