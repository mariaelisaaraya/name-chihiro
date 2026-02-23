// src/GitVisualizer.jsx
import React, { useEffect, useState } from "react";
import * as git from "isomorphic-git";
import { fs, REPO_DIR } from "./gitFs";
import { getRemoteData } from "./githubSim";
import { gitCurrentBranchName } from "./gitService";

export function GitVisualizer({ theme }) {
  const [localCommits, setLocalCommits] = useState([]);
  const [remoteCommits, setRemoteCommits] = useState([]);
  const [remoteInfo, setRemoteInfo] = useState(null);
  const [currentBranch, setCurrentBranch] = useState("main");
  const [error, setError] = useState("");
  const [branchGraph, setBranchGraph] = useState([]);
  const [pullRequests, setPullRequests] = useState([]);

  async function loadData() {
    setError("");

    // Rama actual
    try {
      const name = await gitCurrentBranchName();
      setCurrentBranch(name || "HEAD");
    } catch {
      setCurrentBranch("HEAD");
    }

    // Log local (HEAD)
    try {
      const log = await git.log({ fs, dir: REPO_DIR, ref: "HEAD" });
      const mapped = log.map((entry) => {
        const date = new Date(entry.commit.author.timestamp * 1000);
        return {
          oid: entry.oid,
          message: entry.commit.message,
          author: entry.commit.author.name,
          date: date.toLocaleString(),
        };
      });
      setLocalCommits(mapped);
    } catch (e) {
      setLocalCommits([]);
    }

    // Mapa de ramas
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
      const mapped = (remote.commits || []).map((c) => {
        const date = new Date(c.timestamp * 1000);
        return {
          oid: c.oid,
          message: c.message,
          author: c.author,
          date: date.toLocaleString(),
        };
      });
      setRemoteCommits(mapped);
      setPullRequests(remote.pullRequests || []);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div
      style={{
        background: theme === "dark" ? "#0C0C0C" : "#ffffff",
        color: theme === "dark" ? "#e5e7eb" : "#1f2937",
        borderRadius: "8px",
        padding: "12px",
        height: "400px",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", marginBottom: "8px" }}>
        <h2 style={{ margin: 0, fontSize: "16px", flex: 1 }}>
          Visualizador Git / GitHub simulado
        </h2>
        <button
          onClick={loadData}
          style={{
            background: "#22c55e",
            border: "none",
            borderRadius: "4px",
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          Refrescar
        </button>
      </div>

      {error && (
        <div style={{ color: "#f97316", marginBottom: "8px" }}>{error}</div>
      )}

      <div style={{ display: "flex", gap: "8px", flex: 1, overflow: "hidden" }}>
        {/* Local */}
        <div
          style={{
            flex: 1,
            borderRight: "1px solid #1f2937",
            paddingRight: "8px",
            overflowY: "auto",
          }}
        >
          <h3 style={{ marginTop: 0, fontSize: "14px" }}>
            Repo local ({currentBranch})
          </h3>

          {localCommits.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#9ca3af" }}>
              Sin commits aún. Creá uno con:
              <br />
              <code>git commit -m "mensaje"</code>
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {localCommits.map((c) => (
                <li
                  key={c.oid}
                  style={{
                    marginBottom: "8px",
                    padding: "6px",
                    background: "#020617",
                    borderRadius: "4px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      color: "#38bdf8",
                    }}
                  >
                    {c.oid.slice(0, 7)}
                  </div>
                  <div style={{ fontSize: "13px" }}>{c.message}</div>
                  <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                    {c.author} — {c.date}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* 🔹 Esquema de ramas */}
          <div
            style={{
              marginTop: "8px",
              borderTop: "1px solid #111827",
              paddingTop: "6px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#9ca3af",
                marginBottom: "4px",
              }}
            >
              Mapa de ramas (local). Cada círculo es un commit, de izquierda
              (más antiguo) a derecha (más reciente).
            </div>

            {branchGraph.length === 0 ? (
              <p style={{ fontSize: "12px", color: "#6b7280" }}>
                No hay ramas locales todavía. Creá una con:{" "}
                <code>git branch nombre-rama</code>
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "12px",
                }}
              >
                {branchGraph.map((branch, idx) => {
                  const colors = [
                    "#22c55e",
                    "#3b82f6",
                    "#eab308",
                    "#ec4899",
                    "#a855f7",
                  ];
                  const color = colors[idx % colors.length];
                  const commits = [...branch.commits].reverse(); // más viejo a la izquierda

                  return (
                    <div
                      key={branch.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "90px",
                          textAlign: "right",
                          color:
                            branch.name === currentBranch
                              ? "#e5e7eb"
                              : "#9ca3af",
                          fontWeight:
                            branch.name === currentBranch ? 600 : 400,
                        }}
                      >
                        {branch.name}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          gap: "4px",
                          alignItems: "center",
                          overflowX: "auto",
                        }}
                      >
                        {commits.length === 0 ? (
                          <span
                            style={{ color: "#6b7280", fontSize: "11px" }}
                          >
                            (sin commits)
                          </span>
                        ) : (
                          commits.map((c, i) => (
                            <div
                              key={c.oid + i}
                              title={`${c.oid.slice(0, 7)} - ${c.message}`}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "2px",
                              }}
                            >
                              <div
                                style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: "999px",
                                  background: color,
                                  boxShadow:
                                    branch.name === currentBranch &&
                                      i === commits.length - 1
                                      ? `0 0 0 2px #f9fafb55`
                                      : "none",
                                }}
                              ></div>
                              {i < commits.length - 1 && (
                                <div
                                  style={{
                                    width: 18,
                                    height: 1,
                                    background: "#4b5563",
                                  }}
                                />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Remote */}
        <div
          style={{
            flex: 1,
            paddingLeft: "8px",
            overflowY: "auto",
          }}
        >
          <h3 style={{ marginTop: 0, fontSize: "14px" }}>GitHub simulado</h3>

          {!remoteInfo ? (
            <p style={{ fontSize: "13px", color: "#9ca3af" }}>
              No hay remoto todavía.
              <br />
              Creá uno con:
              <br />
              <code>github create mi-repo</code>
            </p>
          ) : (
            <>
              <p style={{ fontSize: "12px", marginBottom: "4px" }}>
                <strong>Repo:</strong> {remoteInfo.name}
                <br />
                <strong>URL:</strong> {remoteInfo.url}
                <br />
                <strong>Rama por defecto:</strong>{" "}
                {remoteInfo.defaultBranch}
                <br />
                <strong>Última rama pusheada:</strong>{" "}
                {remoteInfo.lastPushedBranch || "(ninguna)"}
              </p>

              {remoteCommits.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#9ca3af" }}>
                  Sin commits remotos.
                  <br />
                  Probá:
                  <br />
                  <code>git push origin main</code>
                </p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {remoteCommits.map((c) => (
                    <li
                      key={c.oid}
                      style={{
                        marginBottom: "8px",
                        padding: "6px",
                        background: "#020617",
                        borderRadius: "4px",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontSize: "12px",
                          color: "#22c55e",
                        }}
                      >
                        {c.oid.slice(0, 7)}
                      </div>
                      <div style={{ fontSize: "13px" }}>{c.message}</div>
                      <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                        {c.author} — {c.date}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* 🔹 Pull Requests simulados */}
              <div
                style={{
                  marginTop: "12px",
                  borderTop: "1px solid #1f2937",
                  paddingTop: "8px",
                }}
              >
                <h4 style={{ margin: "0 0 4px", fontSize: "13px" }}>
                  Pull Requests simulados
                </h4>

                {pullRequests.length === 0 ? (
                  <p style={{ fontSize: "12px", color: "#9ca3af" }}>
                    No hay PRs todavía.
                    <br />
                    Probá crear uno con:
                    <br />
                    <code>github pr create feature/login main</code>
                  </p>
                ) : (
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    {pullRequests.map((pr) => (
                      <li
                        key={pr.id}
                        style={{
                          padding: "6px 8px",
                          borderRadius: "6px",
                          background: "#020617",
                          border: "1px solid #1f2937",
                          fontSize: "12px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "4px",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: "12px",
                            }}
                          >
                            #{pr.id} —{" "}
                            {pr.title || `${pr.fromBranch} → ${pr.toBranch}`}
                          </span>

                          <span
                            style={{
                              fontSize: "11px",
                              padding: "1px 6px",
                              borderRadius: "999px",
                              background:
                                pr.status === "MERGED"
                                  ? "#16a34a33"
                                  : "#fbbf2433",
                              color:
                                pr.status === "MERGED"
                                  ? "#4ade80"
                                  : "#facc15",
                              border:
                                pr.status === "MERGED"
                                  ? "1px solid #16a34a"
                                  : "1px solid #facc15",
                              textTransform: "uppercase",
                            }}
                          >
                            {pr.status}
                          </span>
                        </div>

                        <div style={{ color: "#9ca3af", marginBottom: "4px" }}>
                          {pr.fromBranch} → {pr.toBranch}
                        </div>

                        <div style={{ fontSize: "11px", color: "#6b7280" }}>
                          💡 Para mergear este PR desde la consola:
                          <br />
                          <code>github pr merge {pr.id}</code>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
