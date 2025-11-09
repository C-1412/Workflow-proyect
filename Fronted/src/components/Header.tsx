import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Header: React.FC = () => {
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const handleLogout = () => {
        logout();
    };

    return (
        <header className="navbar navbar-dark fixed-top shadow-sm">
            <div className="container-fluid">
                <span className="navbar-brand mb-0 h1 d-flex align-items-center">
                    <i className="bi bi-diagram-3-fill me-2"></i>
                    Empresa
                </span>
                
                <div className="d-flex align-items-center">

                    {/* Botón de cambio de tema */}
                    <button 
                        className="btn btn-outline-light btn-sm me-3" 
                        onClick={toggleTheme}
                        title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
                    >
                        <i className={`bi ${theme === 'light' ? 'bi-moon-stars' : 'bi-sun'}`}></i>
                    </button>
                    
                    {/* Botón de salir */}
                    <button 
                        className="btn btn-outline-light btn-sm" 
                        onClick={handleLogout}
                        title="Cerrar sesión"
                    >
                        <i className="bi bi-box-arrow-right"></i>
                        <span className="d-none d-md-inline ms-1">Salir</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;