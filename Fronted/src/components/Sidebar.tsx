import React from 'react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isCollapsed: boolean;
    onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isCollapsed, onToggle }) => {
    const { user } = useAuth();

    const canManageUsers = user?.profile.role === 'superuser' || user?.profile.role === 'admin';
    const canManageTasks = user?.profile.role === 'superuser' || user?.profile.role === 'admin';
    const isWorker = user?.profile.role === 'adiestrado' || user?.profile.role === 'regular' || user?.profile.role === 'especialista';

    const handleTabClick = (tab: string) => {
        setActiveTab(tab);
    };

    const menuItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'bi-speedometer2',
            visible: true
        },
        {
            id: 'tasks',
            label: 'Mis Tareas',
            icon: 'bi-list-check',
            visible: isWorker
        },
        {
            id: 'task-management',
            label: 'Gestión de Tareas',
            icon: 'bi-plus-circle',
            visible: canManageTasks
        },
        {
            id: 'reports',
            label: 'Revisión de Reportes',
            icon: 'bi-clipboard-check',
            visible: canManageTasks
        },
        {
            id: 'statistics',
            label: 'Estadísticas',
            icon: 'bi-graph-up',
            visible: canManageTasks
        },
        {
            id: 'users',
            label: 'Gestión de Usuarios',
            icon: 'bi-people-fill',
            visible: canManageUsers
        }
    ];

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Header del sidebar con botón de toggle - MEJORADO */}
            <div className="sidebar-header">
                {!isCollapsed && (
                    <span className="fs-5 fw-bold text-white">Flujo de Trabajo</span>
                )}
                <button 
                    className="sidebar-toggle-btn"
                    onClick={onToggle}
                    aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
                >
                    <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
                </button>
            </div>

            {/* Menú de navegación - MEJORADO */}
            <div className="sidebar-menu">
                <ul className="nav nav-pills flex-column mb-auto">
                    {menuItems.map((item) => 
                        item.visible && (
                            <li key={item.id} className="nav-item">
                                <button 
                                    className={`nav-link w-100 d-flex align-items-center ${
                                        activeTab === item.id ? 'active' : ''
                                    }`}
                                    onClick={() => handleTabClick(item.id)}
                                >
                                    <i className={`${item.icon} me-3`}></i>
                                    {!isCollapsed && <span>{item.label}</span>}
                                </button>
                            </li>
                        )
                    )}
                </ul>
            </div>

            {/* Información del usuario - MEJORADO */}
            <div className="sidebar-user">
                <div className="d-flex align-items-center">
                    <div className="user-avatar">
                        {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    {!isCollapsed && (
                        <div className="user-info ms-3">
                            <div className="sidebar-user-name small text-truncate">
                                {user?.first_name || user?.username}
                            </div>
                            <div className="sidebar-user-role text-capitalize">
                                <i className="bi bi-shield me-1"></i>
                                {user?.profile.role}
                            </div>
                            {isWorker && (
                                <div className="sidebar-user-stats mt-1">
                                    <small className="text-success">
                                        <i className="bi bi-check-circle me-1"></i>
                                        {user.profile.tasks_completed}
                                    </small>
                                    <small className="text-danger ms-2">
                                        <i className="bi bi-x-circle me-1"></i>
                                        {user.profile.tasks_rejected}
                                    </small>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;