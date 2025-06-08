import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

/**
 * Custom hook for managing theme state across the extension
 * Handles loading saved theme preference, system theme detection, and theme toggling
 * @returns {Object} Theme state and toggle function
 */
const useTheme = (): {
  theme: Theme;
  toggleTheme: () => void;
} => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const loadTheme = async (): Promise<void> => {
      try {
        const { theme: savedTheme } = await chrome.storage.local.get('theme');

        if (!savedTheme) {
          const prefersDark = window.matchMedia(
            '(prefers-color-scheme: dark)'
          ).matches;
          const systemTheme = prefersDark ? 'dark' : 'light';
          setTheme(systemTheme);
          document.documentElement.setAttribute('data-theme', systemTheme);
        } else {
          setTheme(savedTheme);
          document.documentElement.setAttribute('data-theme', savedTheme);
        }
      } catch (error) {
        // Fallback to light theme if stored value cannot be loaded
        setTheme('light');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    };

    loadTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = async (e: MediaQueryListEvent): Promise<void> => {
      try {
        const { theme: savedTheme } = await chrome.storage.local.get('theme');
        if (!savedTheme) {
          const newTheme = e.matches ? 'dark' : 'light';
          setTheme(newTheme);
          document.documentElement.setAttribute('data-theme', newTheme);
        }
      } catch (error) {
        // Ignore errors during theme change detection
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = (): void => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    if (
      typeof chrome !== 'undefined' &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.set({ theme: newTheme });
    } else {
      localStorage.setItem('theme', newTheme);
    }
  };

  return { theme, toggleTheme };
};

export default useTheme;
