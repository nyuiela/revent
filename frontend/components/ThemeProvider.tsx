"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "warm" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark" | "warm";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Get theme from localStorage or default to system
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme && ["light", "dark", "warm", "system"].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  // Get the resolved theme (actual theme to apply)
  const resolvedTheme = (() => {
    if (theme === "system") {
      if (typeof window !== "undefined") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      return "light"; // SSR fallback
    }
    return theme as "light" | "dark" | "warm";
  })();

  useEffect(() => {
    if (!mounted) return;

    // Apply theme to document
    const root = document.documentElement;

    // Remove all theme classes
    root.classList.remove("light", "dark", "warm");

    // Add current theme class
    root.classList.add(resolvedTheme);

    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme, resolvedTheme, mounted]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: "system", setTheme: handleSetTheme, resolvedTheme: "light" }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
