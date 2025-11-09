import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  isLight: boolean;
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

// Constants
const STORAGE_KEYS = {
  THEME: 'theme',
} as const;

const HTML_ATTRIBUTES = {
  THEME: 'data-bs-theme',
} as const;

const ERROR_MESSAGES = {
  PROVIDER: 'useTheme must be used within a ThemeProvider',
} as const;

// Utility functions
const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getStoredTheme = (): Theme | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch (error) {
    console.warn('Error reading theme from localStorage:', error);
    return null;
  }
};

const applyThemeToDocument = (theme: Theme): void => {
  if (typeof document === 'undefined') return;
  
  document.body.setAttribute(HTML_ATTRIBUTES.THEME, theme);
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'light' 
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Priority: stored theme -> system theme -> default theme
    return getStoredTheme() || getSystemTheme() || defaultTheme;
  });

  const setTheme = useCallback((newTheme: Theme): void => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback((): void => {
    setThemeState(current => current === 'light' ? 'dark' : 'light');
  }, []);

  // Apply theme to document and localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (error) {
      console.warn('Error saving theme to localStorage:', error);
    }
    
    applyThemeToDocument(theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (event: MediaQueryListEvent): void => {
      // Only update if user hasn't explicitly set a preference
      const storedTheme = getStoredTheme();
      if (!storedTheme) {
        setThemeState(event.matches ? 'dark' : 'light');
      }
    };

    // Modern API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  const contextValue = useMemo((): ThemeContextType => ({
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  }), [theme, toggleTheme, setTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error(ERROR_MESSAGES.PROVIDER);
  }
  
  return context;
};

// Hook para componentes que necesiten saber si el tema está siendo cargado
export const useThemeWithStatus = (): ThemeContextType & { isInitialized: boolean } => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error(ERROR_MESSAGES.PROVIDER);
  }
  
  return {
    ...context,
    isInitialized: true, // En este caso siempre está inicializado después del render inicial
  };
};

// Utility hook para componentes que solo necesiten saber el tema actual
export const useCurrentTheme = (): Theme => {
  const { theme } = useTheme();
  return theme;
};

// Utility hook para componentes que necesiten lógica condicional basada en el tema
export const useThemeClass = (lightClass: string, darkClass: string): string => {
  const { theme } = useTheme();
  return theme === 'light' ? lightClass : darkClass;
};