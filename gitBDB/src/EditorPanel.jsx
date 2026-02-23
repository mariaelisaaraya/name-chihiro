// src/EditorPanel.jsx
import React, { useEffect, useState } from "react";
import { REPO_DIR, listDir, readFile, writeFile, fileExists, createFileWithTemplate } from "./gitFs";

// 🧠 CodeMirror
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { css } from "@codemirror/lang-css";
import { oneDark } from "@codemirror/theme-one-dark";

export function EditorPanel({ theme }) {
    const [files, setFiles] = useState([]);
    const [selected, setSelected] = useState("");
    const [content, setContent] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);
    const [newFileName, setNewFileName] = useState("");

    const isEmpty = content.trim().length === 0;

    const refreshFiles = async () => {
        try {
            const entries = await listDir(REPO_DIR);
            setFiles(entries.filter((f) => f !== ".git"));
        } catch {
            setFiles([]);
        }
    };

    useEffect(() => {
        refreshFiles();
    }, []);

    const handleSelectFile = async (name) => {
        setSelected(name);
        setStatus("");
        setLoading(true);
        try {
            const path = `${REPO_DIR}/${name}`;
            const exists = await fileExists(path);
            if (!exists) {
                setContent("");
                setStatus("El archivo no existe. Podés crearlo y guardarlo.");
            } else {
                const txt = await readFile(path);
                setContent(txt);
            }
        } catch (e) {
            setStatus(`Error al leer archivo: ${e.message || String(e)}`);
            setContent("");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selected) {
            setStatus("Elegí un archivo primero.");
            return;
        }
        setLoading(true);
        setStatus("");
        try {
            const path = `${REPO_DIR}/${selected}`;
            await writeFile(path, content);
            setStatus(
                isEmpty
                    ? "Archivo guardado, pero está vacío. Podés agregar contenido antes de commitear."
                    : "Archivo guardado. Podés versionarlo con git add / git commit."
            );
            await refreshFiles();
        } catch (e) {
            setStatus(`Error al guardar: ${e.message || String(e)}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFile = async (e) => {
        e.preventDefault();
        const name = newFileName.trim();
        if (!name) return;

        setLoading(true);
        setStatus("");

        try {
            const path = `${REPO_DIR}/${name}`;
            const exists = await fileExists(path);

            if (exists) {
                // El archivo ya existe en el FS (por ejemplo, porque lo creaste con touch)
                setStatus("Ese archivo ya existe. Se cargó su contenido actual.");
            } else {
                // 👇 Usamos la plantilla compartida (HTML básico para .html, vacío para otros, etc.)
                await createFileWithTemplate(name);

                // Mensaje más educativo
                const isHtml = name.toLowerCase().endsWith(".html");
                setStatus(
                    isHtml
                        ? `Archivo HTML creado con plantilla básica: ${name}`
                        : `Archivo creado: ${name}`
                );
            }

            setNewFileName("");

            // Volvemos a leer la lista (para que aparezca si es nuevo)
            await refreshFiles();

            // Y lo abrimos en el editor, siempre desde el FS real
            await handleSelectFile(name);
        } catch (e) {
            setStatus(`Error al crear archivo: ${e.message || String(e)}`);
        } finally {
            setLoading(false);
        }
    };

    const getExtensionsForFile = () => {
        if (!selected) return [];
        const lower = selected.toLowerCase();

        if (lower.endsWith(".html") || lower.endsWith(".htm")) {
            return [html()];
        }
        if (lower.endsWith(".js")) {
            return [javascript()];
        }
        if (lower.endsWith(".css")) {
            return [css()];
        }

        // por defecto, sin lenguaje específico (texto plano con tema)
        return [];
    };


    return (
        <div
            style={{
                background: theme === "dark" ? "#0C0C0C" : "#ffffff",
                border: `1px solid ${theme === "dark" ? "#1f2937" : "#cbd5e1"}`,
                marginBottom: "12px",
                borderRadius: "8px",
                padding: "10px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "8px",
                    alignItems: "center",
                }}
            >
                <div>
                    <h2 style={{ margin: 0, fontSize: "16px", color: theme === "dark" ? "#e5e7eb" : "#1f2937", }}>
                        Editor de archivos (repo /repo)
                    </h2>
                    <p
                        style={{
                            margin: 0,
                            fontSize: "12px",
                            color: theme === "dark" ? "#9ca3af" : "#6b7280",
                        }}
                    >
                        Editá archivos como <code>index.html</code>,{" "}
                        <code>main.js</code>, etc. Después usá{" "}
                        <code>git add</code> y <code>git commit</code> en la consola.
                    </p>
                </div>
                <button
                    onClick={refreshFiles}
                    style={{
                        background: "#3b82f6",
                        border: "none",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        fontSize: "12px",
                        color: "#f9fafb",
                        cursor: "pointer",
                    }}
                >
                    Actualizar lista
                </button>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "180px 1fr",
                    gap: "8px",
                }}
            >
                {/* Lista de archivos */}
                <div
                    style={{
                        borderRight: "1px solid #1f2937",
                        paddingRight: "17px",
                        fontSize: "13px",
                    }}
                >
                    <div style={{ marginBottom: "6px" }}>
                        <strong>Archivos en /repo</strong>
                    </div>
                    {files.length === 0 ? (
                        <p style={{ fontSize: "12px", color: "#9ca3af" }}>
                            No hay archivos todavía. Creá uno nuevo.
                        </p>
                    ) : (
                        <ul
                            style={{
                                listStyle: "none",
                                padding: 0,
                                margin: 0,
                                maxHeight: "140px",
                                overflowY: "auto",
                            }}
                        >
                            {files.map((f) => (
                                <li key={f} style={{ marginBottom: "4px" }}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectFile(f)}
                                        style={{
                                            background:
                                                selected === f ? "#7391e4ff" : "transparent",
                                            borderRadius: "4px",
                                            border:
                                                selected === f
                                                    ? "1px solid #3b82f6"
                                                    : "1px solid transparent",
                                            padding: "2px 6px",
                                            fontSize: "12px",
                                            color: theme === "dark" ? "#e5e7eb" : "#1f2937",
                                            cursor: "pointer",
                                            width: "100%",
                                            textAlign: "left",
                                        }}
                                    >
                                        {f}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <form onSubmit={handleCreateFile} style={{ marginTop: "8px", textAlign: "center" }}>
                        <input
                            type="text"
                            placeholder="index.html"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "4px 6px",
                                fontSize: "12px",
                                borderRadius: "4px",
                                border: "1px solid #374151",
                                background: "#020617",
                                color: "#e5e7eb",
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                marginTop: "4px",
                                width: "100%",
                                background: "#22c55e",
                                border: "none",
                                borderRadius: "4px",
                                padding: "4px 6px",
                                fontSize: "12px",
                                color: "#022c22",
                                cursor: "pointer",
                            }}
                        >
                            Crear / abrir
                        </button>
                    </form>
                </div>

                {/* Editor con CodeMirror */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div
                        style={{
                            fontSize: "12px",
                            color: "#9ca3af",
                            minHeight: "18px",
                        }}
                    >
                        {selected
                            ? `Editando: ${selected}`
                            : "Elegí un archivo o creá uno nuevo."}
                    </div>

                    <div
                        style={{
                            borderRadius: "4px",
                            overflow: "hidden",
                            border: "1px solid #374151",
                            background: "#0b1120",
                        }}
                    >
                        <CodeMirror
                            value={content}
                            height="200px"
                            theme={oneDark}
                            extensions={getExtensionsForFile()}
                            onChange={(value) => setContent(value)}
                            basicSetup={{
                                lineNumbers: true,
                                highlightActiveLine: true,
                                foldGutter: true,
                            }}
                        />
                    </div>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: "4px",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "11px",
                                color: status
                                    ? status.startsWith("Error")
                                        ? "#f97316"
                                        : "#22c55e"
                                    : isEmpty
                                        ? "#f97316"
                                        : "#9ca3af",
                            }}
                        >
                            {status
                                ? status
                                : isEmpty
                                    ? "El archivo está vacío. Podés agregar contenido antes de commitear."
                                    : "Tip: después usá git add / git commit en la consola."}
                        </span>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!selected || loading}
                            style={{
                                background: "#3b82f6",
                                border: "none",
                                borderRadius: "4px",
                                padding: "4px 10px",
                                fontSize: "12px",
                                color: "#f9fafb",
                                cursor: "pointer",
                                opacity: !selected || loading ? 0.6 : 1,
                            }}
                        >
                            {loading ? "Guardando..." : "Guardar archivo"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
