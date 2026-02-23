import React, { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html as htmlLang } from "@codemirror/lang-html";
import { css as cssLang } from "@codemirror/lang-css";
import { javascript as jsLang } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { autocompletion } from "@codemirror/autocomplete";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { indentWithTab, defaultKeymap } from "@codemirror/commands";
import { highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers } from "@codemirror/view";

import { getMonacoLanguage } from "./fileTypeUtils";

function languageExtensions(language) {
  switch (language) {
    case "html":
      return [htmlLang()];
    case "css":
      return [cssLang()];
    case "javascript":
      return [jsLang({ jsx: true, typescript: false })];
    case "markdown":
      return [];
    default:
      return [];
  }
}

export default function CodeMirrorEditor({ value, path, theme = "dark", onChange, onSave }) {
  const language = useMemo(() => getMonacoLanguage(path), [path]);

  const extensions = useMemo(() => {
    const langExt = languageExtensions(language);
    return [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      closeBrackets(),
      autocompletion(),
      keymap.of([...closeBracketsKeymap, indentWithTab, ...defaultKeymap]),
      ...langExt,
    ];
  }, [language]);

  return (
    <CodeMirror
      value={value}
      height="100%"
      theme={theme === "dark" ? oneDark : "light"}
      extensions={extensions}
      basicSetup={{
        lineNumbers: false,
        highlightActiveLine: false,
      }}
      onChange={(val) => onChange?.(val)}
      onKeyDown={(view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
          event.preventDefault();
          onSave?.();
          return true;
        }
        return false;
      }}
      style={{
        fontFamily: "var(--vsc-mono)",
        fontSize: 13,
      }}
    />
  );
}
