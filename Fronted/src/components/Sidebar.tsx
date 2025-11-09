import React, { useMemo, useCallback, memo } from 'react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
}

interface UserRoleConfig {
  canManageUsers: boolean;
  canManageTasks: boolean;
  isWorker: boolean;
}

const DEFAULT_MENU_ITEMS: Omit<MenuItem, 'visible'>[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { id: 'tasks', label: 'Mis Tareas', icon: 'bi-list-check' },
  { id: 'task-management', label: 'Gestión de Tareas', icon: 'bi-plus-circle' },
  { id: 'reports', label: 'Revisión de Reportes', icon: 'bi-clipboard-check' },
  { id: 'statistics', label: 'Estadísticas', icon: 'bi-graph-up' },
  { id: 'users', label: 'Gestión de Usuarios', icon: 'bi-people-fill' },
];

const ADMIN_ROLES = ['superuser', 'admin'] as const;
const WORKER_ROLES = ['adiestrado', 'regular', 'especialista'] as const;

const Sidebar: React.FC<SidebarProps> = memo(({ 
  activeTab, 
  setActiveTab, 
  isCollapsed, 
  onToggle 
}) => {
  const { user } = useAuth();

  const userRoleConfig = useMemo((): UserRoleConfig => {
    const userRole = user?.profile.role;
    return {
      canManageUsers: ADMIN_ROLES.includes(userRole as any),
      canManageTasks: ADMIN_ROLES.includes(userRole as any),
      isWorker: WORKER_ROLES.includes(userRole as any),
    };
  }, [user?.profile.role]);

  const menuItems = useMemo((): MenuItem[] => {
    const { canManageUsers, canManageTasks, isWorker } = userRoleConfig;

    return DEFAULT_MENU_ITEMS.map(item => {
      let visible = true;

      switch (item.id) {
        case 'tasks':
          visible = isWorker;
          break;
        case 'task-management':
        case 'reports':
        case 'statistics':
          visible = canManageTasks;
          break;
        case 'users':
          visible = canManageUsers;
          break;
        default:
          visible = true;
      }

      return { ...item, visible };
    });
  }, [userRoleConfig]);

  const handleTabClick = useCallback((tabId: string): void => {
    setActiveTab(tabId);
  }, [setActiveTab]);

  const toggleAriaLabel = isCollapsed ? "Expandir menú lateral" : "Contraer menú lateral";

  return (
    <aside 
      className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
      aria-label="Menú principal de navegación"
    >
      {/* Sidebar Header */}
      <SidebarHeader 
        isCollapsed={isCollapsed}
        onToggle={onToggle}
        toggleAriaLabel={toggleAriaLabel}
      />

      {/* Navigation Menu */}
      <nav aria-label="Navegación principal">
        <SidebarMenu 
          items={menuItems}
          activeTab={activeTab}
          isCollapsed={isCollapsed}
          onTabClick={handleTabClick}
        />
      </nav>

      {/* User Info */}
      <SidebarUser 
        user={user}
        isCollapsed={isCollapsed}
        isWorker={userRoleConfig.isWorker}
      />
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

// Subcomponent: Sidebar Header
interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggle: () => void;
  toggleAriaLabel: string;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = memo(({ 
  isCollapsed, 
  onToggle, 
  toggleAriaLabel 
}) => (
  <div className="sidebar-header">
    {!isCollapsed && (
      <h2 className="fs-5 fw-bold text-white mb-0">Flujo de Trabajo</h2>
    )}
    <button 
      className="sidebar-toggle-btn"
      onClick={onToggle}
      aria-label={toggleAriaLabel}
      aria-expanded={!isCollapsed}
    >
      <i 
        className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}
        aria-hidden="true"
      ></i>
    </button>
  </div>
));

SidebarHeader.displayName = 'SidebarHeader';

// Subcomponent: Sidebar Menu
interface SidebarMenuProps {
  items: MenuItem[];
  activeTab: string;
  isCollapsed: boolean;
  onTabClick: (tabId: string) => void;
}

const SidebarMenu: React.FC<SidebarMenuProps> = memo(({ 
  items, 
  activeTab, 
  isCollapsed, 
  onTabClick 
}) => (
  <div className="sidebar-menu">
    <ul className="nav nav-pills flex-column mb-auto" role="menubar">
      {items.map((item) => 
        item.visible && (
          <li key={item.id} className="nav-item" role="none">
            <button 
              className={`nav-link w-100 d-flex align-items-center ${
                activeTab === item.id ? 'active' : ''
              }`}
              onClick={() => onTabClick(item.id)}
              role="menuitem"
              aria-current={activeTab === item.id ? 'page' : undefined}
              aria-label={item.label}
            >
              <i 
                className={`${item.icon} me-3`}
                aria-hidden="true"
              ></i>
              {!isCollapsed && (
                <span className="sidebar-menu-text">{item.label}</span>
              )}
            </button>
          </li>
        )
      )}
    </ul>
  </div>
));

SidebarMenu.displayName = 'SidebarMenu';

// Subcomponent: Sidebar User
interface SidebarUserProps {
  user: any; // Usar el tipo específico de tu usuario si está disponible
  isCollapsed: boolean;
  isWorker: boolean;
}

const SidebarUser: React.FC<SidebarUserProps> = memo(({ 
  user, 
  isCollapsed, 
  isWorker 
}) => {
  const userInitial = user?.username?.charAt(0).toUpperCase() || 'U';
  const displayName = user?.first_name || user?.username || 'Usuario';
  const userRole = user?.profile.role || 'usuario';

  return (
    <div className="sidebar-user">
      <div className="d-flex align-items-center">
        <div 
          className="user-avatar"
          aria-label={`Avatar de ${displayName}`}
        >
          {userInitial}
        </div>
        
        {!isCollapsed && (
          <div className="user-info ms-3">
            <div 
              className="sidebar-user-name small text-truncate"
              title={displayName}
            >
              {displayName}
            </div>
            
            <div className="sidebar-user-role text-capitalize">
              <i className="bi bi-shield me-1" aria-hidden="true"></i>
              {userRole}
            </div>
            
            {isWorker && user?.profile && (
              <UserStats 
                tasksCompleted={user.profile.tasks_completed}
                tasksRejected={user.profile.tasks_rejected}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
});

SidebarUser.displayName = 'SidebarUser';

// Subcomponent: User Stats
interface UserStatsProps {
  tasksCompleted: number;
  tasksRejected: number;
}

const UserStats: React.FC<UserStatsProps> = memo(({ 
  tasksCompleted, 
  tasksRejected 
}) => (
  <div 
    className="sidebar-user-stats mt-1"
    aria-label="Estadísticas de tareas"
  >
    <small className="text-success">
      <i className="bi bi-check-circle me-1" aria-hidden="true"></i>
      {tasksCompleted ?? 0}
    </small>
    <small className="text-danger ms-2">
      <i className="bi bi-x-circle me-1" aria-hidden="true"></i>
      {tasksRejected ?? 0}
    </small>
  </div>
));

UserStats.displayName = 'UserStats';

export default Sidebar;