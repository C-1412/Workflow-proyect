import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { User, CreateUserData, UpdateUserData } from '../services/auth';
import { authAPI } from '../services/auth';
import Swal from 'sweetalert2';

interface RoleConfig {
  badgeClass: string;
  displayText: string;
  canAssign: boolean;
}

interface UserFormData extends Omit<CreateUserData, 'role'> {
  role: string;
}

interface UserTableProps {
  users: User[];
  currentUser: User | null;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  getRoleBadge: (role: string) => JSX.Element;
}

interface UserModalProps {
  user: User | UserFormData | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  submitLabel: string;
  onChange: (field: string, value: any, isProfile?: boolean) => void;
  canEditRole: boolean;
  isSubmitting?: boolean;
  isEdit?: boolean;
}

const ROLE_CONFIG: Record<string, RoleConfig> = {
  superuser: {
    badgeClass: 'bg-danger',
    displayText: 'Super Usuario',
    canAssign: true,
  },
  admin: {
    badgeClass: 'bg-warning text-dark',
    displayText: 'Administrador',
    canAssign: true,
  },
  especialista: {
    badgeClass: 'bg-danger',
    displayText: 'Especialista',
    canAssign: true,
  },
  regular: {
    badgeClass: 'bg-warning text-dark',
    displayText: 'Regular',
    canAssign: true,
  },
  adiestrado: {
    badgeClass: 'bg-info',
    displayText: 'Adiestrado',
    canAssign: true,
  },
};

const ROLE_OPTIONS = [
  { value: 'adiestrado', label: 'Adiestrado' },
  { value: 'regular', label: 'Regular' },
  { value: 'especialista', label: 'Especialista' },
  { value: 'admin', label: 'Administrador' },
  { value: 'superuser', label: 'Super Usuario' },
];

const ALERT_CONFIG = {
  success: {
    icon: 'success' as const,
    title: '¡Éxito!',
    background: 'var(--surface-color)',
    color: 'var(--text-primary)',
  },
  error: {
    icon: 'error' as const,
    title: 'Error',
    background: 'var(--surface-color)',
    color: 'var(--text-primary)',
  },
  warning: {
    icon: 'warning' as const,
    title: '¿Estás seguro?',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    background: 'var(--surface-color)',
    color: 'var(--text-primary)',
  },
};

const DEFAULT_USER_DATA: UserFormData = {
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  role: 'adiestrado',
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [newUser, setNewUser] = useState<UserFormData>(DEFAULT_USER_DATA);
  
  const { user: currentUser } = useAuth();

  const canEditRole = useMemo(() => 
    currentUser?.profile.role === 'superuser',
    [currentUser?.profile.role]
  );

  const filteredRoleOptions = useMemo(() => 
    ROLE_OPTIONS.filter(option => 
      canEditRole || option.value !== 'superuser'
    ),
    [canEditRole]
  );

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const usersData = await authAPI.getUsers();
      setUsers(usersData);
    } catch (error: any) {
      await Swal.fire({
        ...ALERT_CONFIG.error,
        text: `No se pudieron cargar los usuarios: ${error.response?.data?.error || error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreateUser = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsCreating(true);

    try {
      await authAPI.createUser(newUser as CreateUserData);
      
      await Swal.fire({
        ...ALERT_CONFIG.success,
        text: 'Usuario creado correctamente',
      });
      
      setNewUser(DEFAULT_USER_DATA);
      await loadUsers();
    } catch (error: any) {
      await Swal.fire({
        ...ALERT_CONFIG.error,
        text: `No se pudo crear el usuario: ${error.response?.data?.error || error.message}`,
      });
    } finally {
      setIsCreating(false);
    }
  }, [newUser, loadUsers]);

  const handleEditUser = useCallback((user: User): void => {
    setEditingUser(user);
    setShowEditModal(true);
  }, []);

  const handleUpdateUser = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    try {
      const updatedUserData: UpdateUserData = {
        username: editingUser.username,
        email: editingUser.email,
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        role: editingUser.profile.role,
      };

      await authAPI.updateUser(editingUser.id, updatedUserData);
      
      await Swal.fire({
        ...ALERT_CONFIG.success,
        text: 'Usuario actualizado correctamente',
      });
      
      setShowEditModal(false);
      setEditingUser(null);
      await loadUsers();
    } catch (error: any) {
      await Swal.fire({
        ...ALERT_CONFIG.error,
        text: `No se pudo actualizar el usuario: ${error.response?.data?.error || error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [editingUser, loadUsers]);

  const handleDeleteUser = useCallback(async (user: User): Promise<void> => {
    const result = await Swal.fire({
      ...ALERT_CONFIG.warning,
      text: `El usuario "${user.username}" será eliminado permanentemente.`,
    });

    if (result.isConfirmed) {
      try {
        await authAPI.deleteUser(user.id);
        
        await Swal.fire({
          icon: 'success',
          title: 'Eliminado!',
          text: 'El usuario ha sido eliminado.',
          background: 'var(--surface-color)',
          color: 'var(--text-primary)',
        });
        
        await loadUsers();
      } catch (error: any) {
        await Swal.fire({
          ...ALERT_CONFIG.error,
          text: `No se pudo eliminar el usuario: ${error.response?.data?.error || error.message}`,
        });
      }
    }
  }, [loadUsers]);

  const handleInputChange = useCallback((
    field: string, 
    value: any, 
    isProfile: boolean = false
  ): void => {
    setNewUser(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleEditInputChange = useCallback((
    field: string, 
    value: any, 
    isProfile: boolean = false
  ): void => {
    if (!editingUser) return;

    if (isProfile) {
      setEditingUser({
        ...editingUser,
        profile: {
          ...editingUser.profile,
          [field]: value,
        },
      });
    } else {
      setEditingUser({
        ...editingUser,
        [field]: value,
      });
    }
  }, [editingUser]);

  const closeEditModal = useCallback((): void => {
    setShowEditModal(false);
    setEditingUser(null);
  }, []);

  const getRoleBadge = useCallback((role: string): JSX.Element => {
    const config = ROLE_CONFIG[role] || { 
      badgeClass: 'bg-secondary', 
      displayText: role 
    };
    
    return (
      <span className={`badge ${config.badgeClass}`}>
        {config.displayText}
      </span>
    );
  }, []);

  const formatDate = useCallback((dateString: string): string =>
    new Date(dateString).toLocaleDateString(),
  []);

  const isCurrentUser = useCallback((userId: number): boolean =>
    userId === currentUser?.id,
  [currentUser?.id]);

  const isWorkerRole = useCallback((role: string): boolean =>
    ['adiestrado', 'regular', 'especialista'].includes(role),
  []);

  const LoadingSpinner: React.FC = () => (
    <div className="text-center">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Cargando usuarios...</span>
      </div>
    </div>
  );

  const UserForm: React.FC = () => (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="card-title mb-0">Crear Nuevo Usuario</h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleCreateUser}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="username" className="form-label">Usuario *</label>
              <input
                type="text"
                className="form-control"
                id="username"
                value={newUser.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                required
                disabled={isCreating}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="email" className="form-label">Email *</label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={newUser.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                disabled={isCreating}
              />
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="first_name" className="form-label">Nombre</label>
              <input
                type="text"
                className="form-control"
                id="first_name"
                value={newUser.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="last_name" className="form-label">Apellido</label>
              <input
                type="text"
                className="form-control"
                id="last_name"
                value={newUser.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                disabled={isCreating}
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="password" className="form-label">Contraseña *</label>
              <input
                type="password"
                className="form-control"
                id="password"
                value={newUser.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                disabled={isCreating}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="role" className="form-label">Rol</label>
              <select
                className="form-control"
                id="role"
                value={newUser.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                disabled={!canEditRole || isCreating}
              >
                {filteredRoleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {!canEditRole && (
                <small className="form-text text-muted">
                  Solo los super usuarios pueden asignar roles de super usuario
                </small>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                Creando...
              </>
            ) : (
              'Crear Usuario'
            )}
          </button>
        </form>
      </div>
    </div>
  );

  const UserTable: React.FC<UserTableProps> = ({ 
    users, 
    currentUser, 
    onEdit, 
    onDelete, 
    getRoleBadge 
  }) => (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">Lista de Usuarios</h5>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-striped" aria-label="Lista de usuarios">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Usuario</th>
                <th scope="col">Nombre</th>
                <th scope="col">Email</th>
                <th scope="col">Rol</th>
                <th scope="col">Tareas Completadas</th>
                <th scope="col">Tareas Rechazadas</th>
                <th scope="col">Fecha Creación</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.first_name} {user.last_name}</td>
                  <td>{user.email}</td>
                  <td>{getRoleBadge(user.profile.role)}</td>
                  <td>
                    <span className="text-success">
                      <i className="bi bi-check-circle me-1" aria-hidden="true"></i>
                      {user.profile.tasks_completed}
                    </span>
                  </td>
                  <td>
                    <span className="text-danger">
                      <i className="bi bi-x-circle me-1" aria-hidden="true"></i>
                      {user.profile.tasks_rejected}
                    </span>
                  </td>
                  <td>{formatDate(user.profile.created_at)}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={() => onEdit(user)}
                      disabled={isCurrentUser(user.id)}
                      aria-label={`Editar usuario ${user.username}`}
                    >
                      Editar
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDelete(user)}
                      disabled={isCurrentUser(user.id)}
                      aria-label={`Eliminar usuario ${user.username}`}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const UserModal: React.FC<UserModalProps> = ({
    user,
    isOpen,
    onClose,
    onSubmit,
    title,
    submitLabel,
    onChange,
    canEditRole,
    isSubmitting = false,
    isEdit = false,
  }) => {
    if (!isOpen || !user) return null;

    const isUser = isEdit ? (user as User) : null;
    const userRole = isEdit ? (user as User).profile.role : (user as UserFormData).role;

    return (
      <div 
        className="modal fade show d-block" 
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        tabIndex={-1}
        role="dialog"
        aria-labelledby="userModalLabel"
        aria-modal="true"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="userModalLabel">{title}</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose}
                aria-label="Cerrar"
                disabled={isSubmitting}
              ></button>
            </div>
            
            <form onSubmit={onSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="edit-username" className="form-label">Usuario *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="edit-username"
                    value={user.username}
                    onChange={(e) => onChange('username', e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="edit-email" className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    id="edit-email"
                    value={user.email}
                    onChange={(e) => onChange('email', e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="edit-first_name" className="form-label">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    id="edit-first_name"
                    value={user.first_name}
                    onChange={(e) => onChange('first_name', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="edit-last_name" className="form-label">Apellido</label>
                  <input
                    type="text"
                    className="form-control"
                    id="edit-last_name"
                    value={user.last_name}
                    onChange={(e) => onChange('last_name', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="edit-role" className="form-label">Rol</label>
                  <select
                    className="form-control"
                    id="edit-role"
                    value={userRole}
                    onChange={(e) => onChange('role', e.target.value, isEdit)}
                    disabled={!canEditRole || isSubmitting}
                  >
                    {filteredRoleOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {isEdit && isUser && isWorkerRole(userRole) && (
                  <>
                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          id="edit-is_active_worker"
                          className="form-check-input"
                          checked={isUser.profile.is_active_worker}
                          onChange={(e) => onChange('is_active_worker', e.target.checked, true)}
                          disabled={isSubmitting}
                        />
                        <label htmlFor="edit-is_active_worker" className="form-check-label">
                          Trabajador Activo
                        </label>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="edit-max_tasks" className="form-label">Límite de Tareas</label>
                      <input
                        type="number"
                        className="form-control"
                        id="edit-max_tasks"
                        value={isUser.profile.max_tasks}
                        onChange={(e) => onChange('max_tasks', parseInt(e.target.value), true)}
                        min="1"
                        disabled={isSubmitting}
                      />
                    </div>
                  </>
                )}
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                      Guardando...
                    </>
                  ) : (
                    submitLabel
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">Gestión de Usuarios</h1>
      </div>

      {/* Create User Form */}
      <UserForm />

      {/* Users Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <UserTable
          users={users}
          currentUser={currentUser}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          getRoleBadge={getRoleBadge}
        />
      )}

      {/* Edit User Modal */}
      <UserModal
        user={editingUser}
        isOpen={showEditModal}
        onClose={closeEditModal}
        onSubmit={handleUpdateUser}
        title="Editar Usuario"
        submitLabel="Guardar Cambios"
        onChange={handleEditInputChange}
        canEditRole={canEditRole}
        isSubmitting={isSubmitting}
        isEdit={true}
      />
    </div>
  );
};

export default UserManagement;