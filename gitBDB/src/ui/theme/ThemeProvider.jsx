import React, { createContext, useContext, useEffect, useState } from "react";
import "./theme.css";

const ThemeContext = createContext({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: (theme) => {},
});

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    // Initialize from localStorage or default to dark
    const saved = localStorage.getItem("git-trainer-theme");
    return saved === "light" ? "light" : "dark";
  });

  useEffect(() => {
    // Persist theme to localStorage
    localStorage.setItem("git-trainer-theme", theme);
    
    // Apply theme to document root
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = (newTheme) => {
    if (newTheme === "dark" || newTheme === "light") {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
