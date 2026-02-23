// src/Terminal.jsx
import React, { useState, useRef, useEffect } from "react";
import { runCommand } from "./commandRunner";
import { gitCurrentBranchName } from "./gitService";
import { useTranslation } from "react-i18next";

const PROMPT_PREFIX = "$";

export function Terminal({ theme }) {
  const { t } = useTranslation("terminal");
  const [lines, setLines] = useState(() => [
    t("welcome"),
    t("help"),
  ]);
  const [current, setCurrent] = useState("");
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [branch, setBranch] = useState("main");
  const logRef = useRef(null);

  // Estado para el tip educativo
  const [hint, setHint] = useState(null);
  const hintTimeoutRef = useRef(null);

  // Cargar rama actual al montar
  useEffect(() => {
    updateBranch();
  }, []);

  // Autoscroll dentro del panel
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [lines]);

  // Cleanup del timeout del hint
  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
    };
  }, []);

  const appendLine = (line) => {
    setLines((prev) => [...prev, line]);
  };

  const updateBranch = async () => {
    try {
      const b = await gitCurrentBranchName();
      setBranch(b || "main");
    } catch {
      setBranch("main");
    }
  };

  // Separa el texto normal del hint, usando los marcadores especiales
  function splitResultAndHint(result) {
    const START = "[[HINT_START]]";
    const END = "[[HINT_END]]";

    const startIndex = result.indexOf(START);
    const endIndex = result.indexOf(END);

    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
      // No hay hint embebido
      return { text: result, hint: null };
    }

    const text = result.slice(0, startIndex).trimEnd();
    const hintBody = result
      .slice(startIndex + START.length, endIndex)
      .trim();

    return { text, hint: hintBody || null };
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const input = current;
    if (!input.trim()) return;

    // guardar en historial
    setHistory((prev) => [...prev, input]);
    setHistoryIndex(-1);

    // mostrar comando en el log
    appendLine(`${PROMPT_PREFIX}${branch}: ${input}`);
    setCurrent("");

    // clear se maneja del lado del frontend
    if (input.trim() === "clear") {
      setLines([]);
      return;
    }

    try {
      const result = await runCommand(input);
      if (result) {
        const { text, hint: newHint } = splitResultAndHint(result);

        if (text) {
          appendLine(text);
        }

        if (newHint) {
          // Limpiamos cualquier timeout anterior
          if (hintTimeoutRef.current) {
            clearTimeout(hintTimeoutRef.current);
          }

          // Mostramos el tip
          setHint(newHint);

          // Lo ocultamos automáticamente después de 8 segundos
          hintTimeoutRef.current = setTimeout(() => {
            setHint(null);
          }, 8000);
        }
      }

      if (input.trim().startsWith("git ")) {
        await updateBranch();
      }
    } catch (err) {
      appendLine(`Error: ${err.message || String(err)}`);
    }
  };

  const handleKeyDown = (e) => {
    // Ctrl+L limpia la pantalla
    if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setLines([]);
      return;
    }

    // Historial con flechas
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      setHistoryIndex((prev) => {
        const nextIndex =
          prev === -1 ? history.length - 1 : Math.max(0, prev - 1);
        setCurrent(history[nextIndex] || "");
        return nextIndex;
      });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (history.length === 0) return;
      setHistoryIndex((prev) => {
        if (prev === -1) return -1;
        const nextIndex = prev + 1;
        if (nextIndex >= history.length) {
          setCurrent("");
          return -1;
        }
        setCurrent(history[nextIndex] || "");
        return nextIndex;
      });
    }
  };

  return (
    <div className="terminal-container">
      <div ref={logRef} className="terminal-log">
        {lines.map((line, i) => (
          <div key={i} className="terminal-line">{line}</div>
        ))}
      </div>

      {/* Cartelito del tip educativo */}
      {hint && (
        <div className="terminal-hint">
          <strong className="terminal-hint-icon">💡 Tip:</strong>
          <pre className="terminal-hint-text">{hint}</pre>
        </div>
      )}

      <form onSubmit={handleSubmit} className="terminal-input-form">
        {/* PROMPT ESTILO GIT BASH CON DH */}
        <div className="terminal-prompt">
          <span className="terminal-prompt-user">gitBDB@GIT-TRAINER</span>
          <span className="terminal-prompt-mingw"> MINGW64</span>
          <span className="terminal-prompt-path"> ~/repo</span>
          <span className="terminal-prompt-branch"> ({branch})</span>
          <span className="terminal-prompt-dollar">$ </span>
        </div>
        <input
          autoFocus
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="terminal-input"
        />
      </form>
    </div>
  );
}
