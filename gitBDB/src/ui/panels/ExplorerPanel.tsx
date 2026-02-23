import React, { useEffect, useMemo, useState } from "react";
import { pfs, REPO_DIR, writeFile as fsWriteFile } from "../../gitFs";
import { useEditor } from "../editor/EditorContext";
import { getFileIcon, getFileColor } from "../editor/fileTypeUtils";

type Node = {
  name: string;
  path: string; // relative to /repo
  isDir: boolean;
  children?: Node[];
};

async function readTree(base: string): Promise<Node[]> {
  let entries: string[] = [];
  try {
    entries = await pfs.readdir(base);
  } catch {
    return [];
  }

  const nodes: Node[] = [];
  for (const name of entries) {
    if (name === ".git") continue;
    const full = `${base}/${name}`;
    try {
      const stat = await pfs.stat(full);
      const isDir = stat.isDirectory();
      const rel = full.startsWith(`${REPO_DIR}/`) ? full.slice(REPO_DIR.length + 1) : name;
      const node: Node = { name, path: rel, isDir };
      if (isDir) {
        node.children = await readTree(full);
      }
      nodes.push(node);
    } catch (e) {
      console.error("Error reading entry", full, e);
    }
  }

  return nodes.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function NodeRow({ node, depth, activePath, onOpen, onRename, onDelete }: any) {
  const padding = 8 + depth * 12;
  const color = node.isDir ? "var(--vsc-text)" : getFileColor(node.path);
  const icon = node.isDir ? "📂" : getFileIcon(node.path);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "2px 6px",
        paddingLeft: padding,
        cursor: node.isDir ? "default" : "pointer",
        background: activePath === node.path ? "rgba(255,255,255,0.06)" : "transparent",
        borderRadius: 4,
      }}
      onClick={() => {
        if (!node.isDir) onOpen(node.path);
      }}
    >
      <span style={{ opacity: 0.95, marginRight: 6, color, fontWeight: 700, fontSize: 12 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 12, color }}>{node.name}</span>
      {!node.isDir && (
        <span style={{ display: "flex", gap: 6, opacity: 0.6 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRename(node.path);
            }}
            style={iconBtnStyle}
            title="Rename"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.path);
            }}
            style={iconBtnStyle}
            title="Delete"
          >
            🗑️
          </button>
        </span>
      )}
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "2px 4px",
  color: "inherit",
};

export default function ExplorerPanel() {
  const { openFile, activeFile } = useEditor();
  const [tree, setTree] = useState<Node[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const refresh = async () => {
    setLoading(true);
    const nodes = await readTree(REPO_DIR);
    setTree(nodes);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    const full = `${REPO_DIR}/${name}`;
    try {
      await fsWriteFile(full, "");
      setNewName("");
      setCreating(false);
      await refresh();
      await openFile(name);
    } catch (e) {
      console.error("create failed", e);
    }
  };

  const handleRename = async (path: string) => {
    const newBase = prompt("Nuevo nombre", path.split("/").pop() || path);
    if (!newBase) return;
    const src = `${REPO_DIR}/${path}`;
    const dst = `${REPO_DIR}/${newBase}`;
    try {
      await pfs.rename(src, dst);
      await refresh();
    } catch (e) {
      console.error("rename failed", e);
    }
  };

  const handleDelete = async (path: string) => {
    const ok = window.confirm(`Borrar ${path}?`);
    if (!ok) return;
    try {
      await pfs.unlink(`${REPO_DIR}/${path}`);
      await refresh();
    } catch (e) {
      console.error("delete failed", e);
    }
  };

  const flat = useMemo(() => tree, [tree]);

  const renderTree = (nodes: Node[], depth = 0) => {
    return nodes.map((n) => (
      <React.Fragment key={n.path}>
        <NodeRow
          node={n}
          depth={depth}
          activePath={activeFile}
          onOpen={openFile}
          onRename={handleRename}
          onDelete={handleDelete}
        />
        {n.children && n.children.length > 0 && renderTree(n.children, depth + 1)}
      </React.Fragment>
    ));
  };

  return (
    <div style={{ padding: 10, fontSize: 12, height: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 11, letterSpacing: 0.8, fontWeight: 700, opacity: 0.9 }}>EXPLORER</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={iconBtnStyle} title="Refresh" onClick={refresh}>🔄</button>
          <button style={iconBtnStyle} title="New File" onClick={() => setCreating((v) => !v)}>➕</button>
        </div>
      </div>

      {creating && (
        <div style={{ display: "flex", gap: 6 }}>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="script.js"
            style={{ flex: 1, padding: "4px 6px", borderRadius: 4, border: "1px solid var(--vsc-border)" }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setCreating(false);
            }}
          />
          <button style={iconBtnStyle} onClick={handleCreate}>Crear</button>
        </div>
      )}

      <div style={{ flex: 1, overflow: "auto", minHeight: 0, paddingRight: 4 }}>
        {loading && <div style={{ opacity: 0.6 }}>Cargando...</div>}
        {!loading && flat.length === 0 && <div style={{ opacity: 0.6 }}>Sin archivos</div>}
        {!loading && renderTree(flat)}
      </div>
    </div>
  );
}
