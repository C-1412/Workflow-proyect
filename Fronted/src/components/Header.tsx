import React, { useCallback, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface ThemeConfig {
  icon: string;
  label: string;
  nextTheme: 'light' | 'dark';
}

const THEME_CONFIG: Record<'light' | 'dark', ThemeConfig> = {
  light: {
    icon: 'bi-moon-stars',
    label: 'oscuro',
    nextTheme: 'dark',
  },
  dark: {
    icon: 'bi-sun',
    label: 'claro',
    nextTheme: 'light',
  },
};

const Header: React.FC = memo(() => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = useCallback((): void => {
    logout();
  }, [logout]);

  const currentThemeConfig = THEME_CONFIG[theme];

  return (
    <header className="navbar navbar-dark fixed-top shadow-sm">
      <div className="container-fluid">
        <div className="navbar-brand mb-0 h1 d-flex align-items-center">
          <i className="bi bi-diagram-3-fill me-2" aria-hidden="true"></i>
          <span>Empresa</span>
        </div>
        
        <div className="d-flex align-items-center">
          {/* Theme Toggle Button */}
          <button 
            className="btn btn-outline-light btn-sm me-3" 
            onClick={toggleTheme}
            aria-label={`Cambiar a modo ${currentThemeConfig.label}`}
            title={`Cambiar a modo ${currentThemeConfig.label}`}
          >
            <i className={`bi ${currentThemeConfig.icon}`} aria-hidden="true"></i>
          </button>
          
          {/* Logout Button */}
          <button 
            className="btn btn-outline-light btn-sm" 
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <i className="bi bi-box-arrow-right" aria-hidden="true"></i>
            <span className="d-none d-md-inline ms-1">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;