import React, { createContext, useContext, useMemo, useRef, useState } from "react";
import { pfs, REPO_DIR, writeFile as fsWriteFile, readFile as fsReadFile, fileExists as fsExists } from "../../gitFs";

const EditorContext = createContext(null);

function normalizeToRepo(path) {
  if (!path) return REPO_DIR;
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (clean.startsWith(REPO_DIR)) return clean;
  return `${REPO_DIR}${clean}`;
}

function stripRepo(path) {
  if (!path) return null;
  if (path.startsWith(`${REPO_DIR}/`)) return path.slice(REPO_DIR.length + 1);
  if (path === REPO_DIR) return "";
  return path.replace(/^\//, "");
}

export function EditorProvider({ children }) {
  const [openFiles, setOpenFiles] = useState([]); // paths relative to /repo
  const [activeFile, setActiveFile] = useState(null); // relative path
  const [fileContents, setFileContents] = useState({});
  const saveTimers = useRef(new Map());

  const openFile = async (relativePath) => {
    const repoPath = normalizeToRepo(relativePath);
    const rel = stripRepo(repoPath);
    if (!rel) return;

    // Load content if not cached
    if (!fileContents[rel]) {
      try {
        const exists = await fsExists(repoPath);
        const content = exists ? await fsReadFile(repoPath) : "";
        setFileContents((prev) => ({ ...prev, [rel]: content }));
      } catch (e) {
        console.error("Error reading file", e);
        setFileContents((prev) => ({ ...prev, [rel]: "" }));
      }
    }

    setOpenFiles((prev) => (prev.includes(rel) ? prev : [...prev, rel]));
    setActiveFile(rel);
  };

  const closeFile = (relativePath) => {
    setOpenFiles((prev) => prev.filter((p) => p !== relativePath));
    setFileContents((prev) => {
      const next = { ...prev };
      delete next[relativePath];
      return next;
    });
    setActiveFile((current) => {
      if (current !== relativePath) return current;
      const remaining = openFiles.filter((p) => p !== relativePath);
      return remaining.length ? remaining[remaining.length - 1] : null;
    });
  };

  const updateContent = (relativePath, text) => {
    setFileContents((prev) => ({ ...prev, [relativePath]: text }));
    scheduleSave(relativePath, text);
  };

  const saveFile = async (relativePath) => {
    if (!relativePath) return;
    const repoPath = normalizeToRepo(relativePath);
    const content = fileContents[relativePath] ?? "";
    await fsWriteFile(repoPath, content);
  };

  const scheduleSave = (relativePath, text) => {
    const existing = saveTimers.current.get(relativePath);
    if (existing) clearTimeout(existing);
    const handle = setTimeout(async () => {
      try {
        await fsWriteFile(normalizeToRepo(relativePath), text ?? "");
      } catch (e) {
        console.error("Auto-save failed", e);
      }
    }, 400);
    saveTimers.current.set(relativePath, handle);
  };

  const value = useMemo(
    () => ({
      openFiles,
      activeFile,
      fileContents,
      openFile,
      closeFile,
      setActiveFile,
      updateContent,
      saveFile,
      stripRepo,
      normalizeToRepo,
    }),
    [openFiles, activeFile, fileContents]
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used within EditorProvider");
  return ctx;
}
