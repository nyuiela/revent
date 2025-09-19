"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface DynamicThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  accent: string;
  background?: string;
  primary?: string;
  secondary?: string;
  isConfigLoading: boolean;
}

const DynamicThemeContext = createContext<DynamicThemeContextType | undefined>(undefined);

export function DynamicThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [config, setConfig] = useState<any>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    
    // Apply immediately
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(initialTheme);
  }, []);

  // Fetch config on mount
  useEffect(() => {
    async function fetchConfig() {
      try {
        setIsConfigLoading(true);
        const response = await fetch('/api/config');
        if (response.ok) {
          const configData = await response.json();
          setConfig(configData);
        }
      } catch (error) {
        console.error('Failed to fetch config:', error);
      } finally {
        setIsConfigLoading(false);
      }
    }

    fetchConfig();
  }, []);

  // Apply theme changes instantly
  const applyTheme = (newTheme: Theme) => {
    // Update DOM immediately
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    
    // Save to localStorage
    localStorage.setItem('theme', newTheme);
    
    // Apply custom CSS variables from config
    if (config?.theme) {
      const style = document.documentElement.style;
      if (config.theme.accent) {
        style.setProperty('--theme-accent', config.theme.accent);
      }
      if (config.theme.background) {
        style.setProperty('--theme-background', config.theme.background);
      }
      if (config.theme.primary) {
        style.setProperty('--theme-primary', config.theme.primary);
      }
      if (config.theme.secondary) {
        style.setProperty('--theme-secondary', config.theme.secondary);
      }
    }
  };

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme, config?.theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    // Apply immediately for instant feedback
    applyTheme(newTheme);
  };

  const value: DynamicThemeContextType = {
    theme,
    toggleTheme,
    setTheme: (newTheme) => {
      setTheme(newTheme);
      applyTheme(newTheme);
    },
    accent: config?.theme?.accent || '#7c3aed',
    background: config?.theme?.background,
    primary: config?.theme?.primary,
    secondary: config?.theme?.secondary,
    isConfigLoading,
  };

  return (
    <DynamicThemeContext.Provider value={value}>
      {children}
    </DynamicThemeContext.Provider>
  );
}

export function useDynamicTheme() {
  const context = useContext(DynamicThemeContext);
  if (context === undefined) {
    throw new Error('useDynamicTheme must be used within a DynamicThemeProvider');
  }
  return context;
}
