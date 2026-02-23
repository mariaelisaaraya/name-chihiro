const MAP = {
  html: { icon: "</>", color: "#f97316", language: "html" },
  htm: { icon: "</>", color: "#f97316", language: "html" },
  css: { icon: "{ }", color: "#3b82f6", language: "css" },
  js: { icon: "JS", color: "#eab308", language: "javascript" },
  mjs: { icon: "JS", color: "#eab308", language: "javascript" },
  cjs: { icon: "JS", color: "#eab308", language: "javascript" },
  json: { icon: "{}", color: "#8b5cf6", language: "json" },
  md: { icon: "MD", color: "#38bdf8", language: "markdown" },
  markdown: { icon: "MD", color: "#38bdf8", language: "markdown" },
};

export function getFileType(path = "") {
  const lower = path.toLowerCase();
  const ext = lower.split(".").pop() || "";
  return ext;
}

export function getFileIcon(path = "") {
  const ext = getFileType(path);
  return MAP[ext]?.icon || "file";
}

export function getFileColor(path = "") {
  const ext = getFileType(path);
  return MAP[ext]?.color || "#9ca3af";
}

export function getMonacoLanguage(path = "") {
  const ext = getFileType(path);
  return MAP[ext]?.language || "plaintext";
}
