"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon, Palette } from "lucide-react";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: "light", name: "Light", icon: Sun },
    { id: "dark", name: "Dark", icon: Moon },
    { id: "warm", name: "Warm", icon: Palette },
  ] as const;

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {themes.map(({ id, name, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setTheme(id as "light" | "dark" | "warm")}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${theme === id
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          title={`Switch to ${name} theme`}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{name}</span>
        </button>
      ))}
    </div>
  );
}
