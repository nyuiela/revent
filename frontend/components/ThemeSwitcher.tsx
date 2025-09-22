"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon, Palette, Monitor } from "lucide-react";

interface ThemeSwitcherProps {
  className?: string;
}

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themes = [
    { id: "light", name: "Light", icon: Sun },
    { id: "dark", name: "Dark", icon: Moon },
    { id: "warm", name: "Warm", icon: Palette },
    { id: "system", name: "System", icon: Monitor },
  ] as const;

  return (
    <div className={`flex items-center gap-1 p-1 bg-muted rounded-lg ${className || ''}`}>
      {themes.map(({ id, name, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setTheme(id as "light" | "dark" | "warm" | "system")}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${theme === id
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          title={`Switch to ${name} theme${id === "system" ? ` (currently ${resolvedTheme})` : ""}`}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:hidden text-xs">{name}</span>
        </button>
      ))}
    </div>
  );
}
