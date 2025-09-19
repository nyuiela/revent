"use client";

import { useDynamicTheme } from '@/context/DynamicThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme, accent, isConfigLoading } = useDynamicTheme();

  const handleToggle = () => {
    // Force immediate DOM update
    const root = document.documentElement;
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    // Remove all theme classes immediately
    root.classList.remove('light', 'dark');
    // Add new theme class immediately
    root.classList.add(newTheme);
    
    // Call the context toggle
    toggleTheme();
  };

  if (isConfigLoading) {
    return (
      <button
        disabled
        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed"
        aria-label="Loading theme"
      >
        <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-transparent"></div>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
      style={{
        '--theme-accent': accent,
      } as React.CSSProperties}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        {/* Sun icon */}
        <svg 
          className={`absolute inset-0 w-5 h-5 text-gray-600 dark:text-gray-300 transition-all duration-300 ${
            theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-180 scale-75'
          }`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        
        {/* Moon icon */}
        <svg 
          className={`absolute inset-0 w-5 h-5 text-gray-600 dark:text-gray-300 transition-all duration-300 ${
            theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-75'
          }`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </div>
    </button>
  );
}
