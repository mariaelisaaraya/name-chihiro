import React, { useMemo } from "react";
import { useEditor } from "../editor/EditorContext";
import { getFileIcon, getFileColor, getMonacoLanguage } from "../editor/fileTypeUtils";
import CodeMirrorEditor from "../editor/CodeMirrorEditor";

export default function EditorArea() {
  const { openFiles, activeFile, fileContents, setActiveFile, closeFile, updateContent, saveFile } = useEditor();

  const tabs = useMemo(() => openFiles, [openFiles]);
  const activeContent = activeFile ? fileContents[activeFile] ?? "" : "";
  const activeLanguage = activeFile ? getMonacoLanguage(activeFile) : "plaintext";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "4px 6px", borderBottom: "1px solid var(--vsc-border)", minHeight: 32 }}>
        {tabs.map((path) => {
          const isActive = path === activeFile;
          const name = path.split("/").pop() || path;
          const color = getFileColor(path);
          const icon = getFileIcon(path);
          return (
            <div
              key={path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px",
                borderRadius: 4,
                cursor: "pointer",
                background: isActive ? "var(--vsc-hover-bg)" : "transparent",
                border: `1px solid ${isActive ? "var(--vsc-border)" : "transparent"}`,
                color: "var(--vsc-text)",
                fontSize: 12,
              }}
              onClick={() => setActiveFile(path)}
            >
              <span style={{ color, fontWeight: 700 }}>{icon}</span>
              <span>{name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(path);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "inherit",
                  cursor: "pointer",
                  fontSize: 12,
                  padding: 0,
                }}
                title="Close"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: "auto", background: "var(--vsc-editor-bg)", padding: 8 }}>
        {!activeFile && (
          <div style={{ opacity: 0.6, fontSize: 13, padding: 16 }}>
            Seleccioná un archivo en el Explorer para empezar a editar.
          </div>
        )}

        {activeFile && (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, opacity: 0.8 }}>{activeFile}</span>
              <span style={{ fontSize: 11, opacity: 0.6 }}>({activeLanguage})</span>
              <button
                onClick={() => saveFile(activeFile)}
                style={{
                  border: "1px solid var(--vsc-border)",
                  background: "var(--vsc-hover-bg)",
                  color: "var(--vsc-text)",
                  borderRadius: 4,
                  padding: "4px 8px",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Guardar
              </button>
            </div>

            <div style={{ flex: 1, minHeight: 0 }}>
              <CodeMirrorEditor
                path={activeFile}
                value={activeContent}
                onChange={(val) => updateContent(activeFile, val)}
                onSave={() => saveFile(activeFile)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
