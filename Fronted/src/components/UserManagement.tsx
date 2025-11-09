import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type {User, CreateUserData, UpdateUserData } from '../services/auth';
import { authAPI } from '../services/auth';
import Swal from 'sweetalert2';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const { user: currentUser } = useAuth();

    const [newUser, setNewUser] = useState<CreateUserData>({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'adiestrado' // Cambiado de 'user' a 'adiestrado'
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const usersData = await authAPI.getUsers();
            setUsers(usersData);
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los usuarios: ' + (error.response?.data?.error || error.message)
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            await authAPI.createUser(newUser);
            await Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'Usuario creado correctamente'
            });
            
            // Reset form
            setNewUser({
                username: '',
                email: '',
                password: '',
                first_name: '',
                last_name: '',
                role: 'adiestrado' // Cambiado de 'user' a 'adiestrado'
            });
            
            // Reload users
            loadUsers();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo crear el usuario: ' + (error.response?.data?.error || error.message)
            });
        } finally {
            setCreating(false);
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setShowEditModal(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            const updatedUserData: UpdateUserData = {
                username: editingUser.username,
                email: editingUser.email,
                first_name: editingUser.first_name,
                last_name: editingUser.last_name,
                role: editingUser.profile.role
            };

            await authAPI.updateUser(editingUser.id, updatedUserData);
            await Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'Usuario actualizado correctamente'
            });
            setShowEditModal(false);
            setEditingUser(null);
            loadUsers();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo actualizar el usuario: ' + (error.response?.data?.error || error.message)
            });
        }
    };

    const handleDeleteUser = async (user: User) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: `El usuario "${user.username}" será eliminado permanentemente.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await authAPI.deleteUser(user.id);
                await Swal.fire(
                    'Eliminado!',
                    'El usuario ha sido eliminado.',
                    'success'
                );
                loadUsers();
            } catch (error: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo eliminar el usuario: ' + (error.response?.data?.error || error.message)
                });
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewUser(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (editingUser) {
            if (name === 'role') {
                setEditingUser({
                    ...editingUser,
                    profile: {
                        ...editingUser.profile,
                        role: value as any
                    }
                });
            } else {
                setEditingUser({
                    ...editingUser,
                    [name]: value
                });
            }
        }
    };

    const canEditRole = currentUser?.profile.role === 'superuser';

    // Función para obtener la clase del badge según el rol
    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'superuser':
                return 'bg-danger';
            case 'admin':
                return 'bg-warning text-dark';
            case 'especialista':
                return 'bg-danger';
            case 'regular':
                return 'bg-warning text-dark';
            case 'adiestrado':
                return 'bg-info';
            default:
                return 'bg-secondary';
        }
    };

    // Función para obtener el texto legible del rol
    const getRoleDisplayText = (role: string) => {
        switch (role) {
            case 'superuser':
                return 'Super Usuario';
            case 'admin':
                return 'Administrador';
            case 'especialista':
                return 'Especialista';
            case 'regular':
                return 'Regular';
            case 'adiestrado':
                return 'Adiestrado';
            default:
                return role;
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 className="h2">Gestión de Usuarios</h1>
            </div>

            {/* Formulario de creación */}
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
                                    name="username"
                                    value={newUser.username}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label htmlFor="email" className="form-label">Email *</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    id="email"
                                    name="email"
                                    value={newUser.email}
                                    onChange={handleInputChange}
                                    required
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
                                    name="first_name"
                                    value={newUser.first_name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label htmlFor="last_name" className="form-label">Apellido</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="last_name"
                                    name="last_name"
                                    value={newUser.last_name}
                                    onChange={handleInputChange}
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
                                    name="password"
                                    value={newUser.password}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label htmlFor="role" className="form-label">Rol</label>
                                <select
                                    className="form-control"
                                    id="role"
                                    name="role"
                                    value={newUser.role}
                                    onChange={handleInputChange}
                                    disabled={!canEditRole}
                                >
                                    <option value="adiestrado">Adiestrado</option>
                                    <option value="regular">Regular</option>
                                    <option value="especialista">Especialista</option>
                                    <option value="admin">Administrador</option>
                                    {canEditRole && <option value="superuser">Super Usuario</option>}
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
                            disabled={creating}
                        >
                            {creating ? 'Creando...' : 'Crear Usuario'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Lista de usuarios */}
            <div className="card">
                <div className="card-header">
                    <h5 className="card-title mb-0">Lista de Usuarios</h5>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="text-center">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Cargando...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Usuario</th>
                                        <th>Nombre</th>
                                        <th>Email</th>
                                        <th>Rol</th>
                                        <th>Tareas Completadas</th>
                                        <th>Tareas Rechazadas</th>
                                        <th>Fecha Creación</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td>{user.id}</td>
                                            <td>{user.username}</td>
                                            <td>{user.first_name} {user.last_name}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={`badge ${getRoleBadgeClass(user.profile.role)}`}>
                                                    {getRoleDisplayText(user.profile.role)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-success">
                                                    <i className="bi bi-check-circle me-1"></i>
                                                    {user.profile.tasks_completed}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-danger">
                                                    <i className="bi bi-x-circle me-1"></i>
                                                    {user.profile.tasks_rejected}
                                                </span>
                                            </td>
                                            <td>{new Date(user.profile.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <button 
                                                    className="btn btn-sm btn-outline-primary me-1"
                                                    onClick={() => handleEditUser(user)}
                                                    disabled={user.id === currentUser?.id}
                                                >
                                                    Editar
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDeleteUser(user)}
                                                    disabled={user.id === currentUser?.id}
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal para editar usuario */}
            {showEditModal && editingUser && (
                <div className="modal fade show d-block">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Editar Usuario</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowEditModal(false)}
                                    aria-label="Cerrar"
                                ></button>
                            </div>
                            <form onSubmit={handleUpdateUser}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label htmlFor="edit-username" className="form-label">Usuario *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="edit-username"
                                            name="username"
                                            value={editingUser.username}
                                            onChange={handleEditInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="edit-email" className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="edit-email"
                                            name="email"
                                            value={editingUser.email}
                                            onChange={handleEditInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="edit-first_name" className="form-label">Nombre</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="edit-first_name"
                                            name="first_name"
                                            value={editingUser.first_name}
                                            onChange={handleEditInputChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="edit-last_name" className="form-label">Apellido</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="edit-last_name"
                                            name="last_name"
                                            value={editingUser.last_name}
                                            onChange={handleEditInputChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="edit-role" className="form-label">Rol</label>
                                        <select
                                            className="form-control"
                                            id="edit-role"
                                            name="role"
                                            value={editingUser.profile.role}
                                            onChange={handleEditInputChange}
                                            disabled={!canEditRole}
                                        >
                                            <option value="adiestrado">Adiestrado</option>
                                            <option value="regular">Regular</option>
                                            <option value="especialista">Especialista</option>
                                            <option value="admin">Administrador</option>
                                            {canEditRole && <option value="superuser">Super Usuario</option>}
                                        </select>
                                    </div>
                                    {(editingUser.profile.role === 'adiestrado' || 
                                      editingUser.profile.role === 'regular' || 
                                      editingUser.profile.role === 'especialista') && (
                                        <>
                                            <div className="mb-3">
                                                <label htmlFor="edit-is_active_worker" className="form-label">
                                                    <input
                                                        type="checkbox"
                                                        id="edit-is_active_worker"
                                                        name="is_active_worker"
                                                        checked={editingUser.profile.is_active_worker}
                                                        onChange={(e) => setEditingUser({
                                                            ...editingUser,
                                                            profile: {
                                                                ...editingUser.profile,
                                                                is_active_worker: e.target.checked
                                                            }
                                                        })}
                                                        className="form-check-input me-2"
                                                    />
                                                    Trabajador Activo
                                                </label>
                                            </div>
                                            <div className="mb-3">
                                                <label htmlFor="edit-max_tasks" className="form-label">Límite de Tareas</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    id="edit-max_tasks"
                                                    name="max_tasks"
                                                    value={editingUser.profile.max_tasks}
                                                    onChange={(e) => setEditingUser({
                                                        ...editingUser,
                                                        profile: {
                                                            ...editingUser.profile,
                                                            max_tasks: parseInt(e.target.value)
                                                        }
                                                    })}
                                                    min="1"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary" 
                                        onClick={() => setShowEditModal(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Guardar Cambios
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;