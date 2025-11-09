import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskAPI } from '../services/task';
import type { Task, CreateTaskData } from '../services/task';
import Swal from 'sweetalert2';

const TaskManagement: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [newTask, setNewTask] = useState<CreateTaskData>({
        title: '',
        description: '',
        difficulty: 'adiestrado',
        estimated_hours: 1,
        priority: 1
    });
    const { user } = useAuth();

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const tasksData = await taskAPI.getTasks();
            setTasks(tasksData);
        } catch (error: any) {
            Swal.fire('Error', 'No se pudieron cargar las tareas.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await taskAPI.createTask(newTask);
            Swal.fire('Éxito', 'Tarea creada correctamente.', 'success');
            setShowCreateModal(false);
            setNewTask({
                title: '',
                description: '',
                difficulty: 'adiestrado',
                estimated_hours: 1,
                priority: 1
            });
            loadTasks();
        } catch (error: any) {
            Swal.fire('Error', 'No se pudo crear la tarea.', 'error');
        }
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setShowEditModal(true);
    };

    const handleUpdateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTask) return;

        try {
            const updateData = {
                title: editingTask.title,
                description: editingTask.description,
                difficulty: editingTask.difficulty,
                estimated_hours: editingTask.estimated_hours,
                priority: editingTask.priority,
                deadline: editingTask.deadline || undefined
            };

            await taskAPI.updateTask(editingTask.id, updateData);
            Swal.fire('Éxito', 'Tarea actualizada correctamente.', 'success');
            setShowEditModal(false);
            setEditingTask(null);
            loadTasks();
        } catch (error: any) {
            Swal.fire('Error', 'No se pudo actualizar la tarea.', 'error');
        }
    };

    const handleDeleteTask = async (task: Task) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: `La tarea "${task.title}" será eliminada permanentemente.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await taskAPI.deleteTask(task.id);
                Swal.fire('Eliminada!', 'La tarea ha sido eliminada.', 'success');
                loadTasks();
            } catch (error: any) {
                Swal.fire('Error', 'No se pudo eliminar la tarea.', 'error');
            }
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: { [key: string]: { class: string, text: string } } = {
            'pending': { class: 'bg-secondary', text: 'Pendiente' },
            'assigned': { class: 'bg-primary', text: 'Asignada' },
            'in_progress': { class: 'bg-warning text-dark', text: 'En Progreso' },
            'completed': { class: 'bg-success', text: 'Completada' },
            'rejected': { class: 'bg-danger', text: 'Rechazada' },
            'cancelled': { class: 'bg-dark', text: 'Cancelada' }
        };
        const config = statusConfig[status] || { class: 'bg-secondary', text: status };
        return <span className={`badge ${config.class}`}>{config.text}</span>;
    };

    const getDifficultyBadge = (difficulty: string) => {
        const difficultyConfig: { [key: string]: { class: string, text: string } } = {
            'adiestrado': { class: 'bg-info', text: 'Adiestrado' },
            'regular': { class: 'bg-warning text-dark', text: 'Regular' },
            'especialista': { class: 'bg-danger', text: 'Especialista' }
        };
        const config = difficultyConfig[difficulty] || { class: 'bg-secondary', text: difficulty };
        return <span className={`badge ${config.class}`}>{config.text}</span>;
    };

    const getPriorityBadge = (priority: number) => {
        const priorityConfig: { [key: string]: { class: string, text: string } } = {
            '1': { class: 'bg-success', text: 'Baja' },
            '2': { class: 'bg-info', text: 'Media-Baja' },
            '3': { class: 'bg-warning text-dark', text: 'Media' },
            '4': { class: 'bg-orange', text: 'Media-Alta' },
            '5': { class: 'bg-danger', text: 'Alta' }
        };
        const config = priorityConfig[priority.toString()] || { class: 'bg-secondary', text: `Prioridad ${priority}` };
        return <span className={`badge ${config.class}`}>{config.text}</span>;
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-4 mb-4 border-bottom">
                <div>
                    <h1 className="h2 text-gradient mb-1">Gestión de Tareas</h1>
                    <p className="text-muted mb-0">Crea y gestiona las tareas del sistema</p>
                </div>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    <i className="bi bi-plus-circle me-2"></i>
                    Crear Tarea
                </button>
            </div>

            <div className="row">
                {tasks.length === 0 ? (
                    <div className="col-12">
                        <div className="card shadow-custom">
                            <div className="card-body text-center py-5">
                                <i className="bi bi-inbox display-4 text-muted mb-3"></i>
                                <h5 className="text-muted">No hay tareas creadas</h5>
                                <p className="text-muted">Comienza creando la primera tarea del sistema</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} className="col-md-6 col-lg-4 mb-4">
                            <div className="card shadow-custom h-100">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h6 className="card-title mb-0 text-truncate">{task.title}</h6>
                                    {getStatusBadge(task.status)}
                                </div>
                                <div className="card-body">
                                    <p className="card-text text-muted small">{task.description}</p>
                                    <div className="mb-2">
                                        <strong>Dificultad:</strong> {getDifficultyBadge(task.difficulty)}
                                    </div>
                                    <div className="mb-2">
                                        <strong>Prioridad:</strong> {getPriorityBadge(task.priority)}
                                    </div>
                                    <div className="mb-2">
                                        <strong>Horas estimadas:</strong> {task.estimated_hours}
                                    </div>
                                    <div className="mb-2">
                                        <strong>Asignado a:</strong> 
                                        {task.assigned_to_name ? (
                                            <span className="text-primary"> {task.assigned_to_name}</span>
                                        ) : (
                                            <span className="text-muted"> No asignado</span>
                                        )}
                                    </div>
                                    {task.deadline && (
                                        <div className="mb-2">
                                            <strong>Fecha límite:</strong> 
                                            <span className={new Date(task.deadline) < new Date() ? 'text-danger' : 'text-success'}>
                                                {' '}{new Date(task.deadline).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="mb-2">
                                        <strong>Creado por:</strong> {task.created_by_name}
                                    </div>
                                </div>
                                <div className="card-footer bg-transparent">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <small className="text-muted">
                                            {new Date(task.created_at).toLocaleDateString()}
                                        </small>
                                        <div className="btn-group">
                                            <button 
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => handleEditTask(task)}
                                                title="Editar tarea"
                                            >
                                                <i className="bi bi-pencil"></i>
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleDeleteTask(task)}
                                                title="Eliminar tarea"
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal para crear tarea */}
            {showCreateModal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex={-1}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Crear Nueva Tarea</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowCreateModal(false)}
                                ></button>
                            </div>
                            <form onSubmit={handleCreateTask}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label htmlFor="title" className="form-label">Título *</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            id="title" 
                                            value={newTask.title}
                                            onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="description" className="form-label">Descripción *</label>
                                        <textarea 
                                            className="form-control" 
                                            id="description" 
                                            rows={3} 
                                            value={newTask.description}
                                            onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                                            required
                                        ></textarea>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="difficulty" className="form-label">Dificultad *</label>
                                            <select 
                                                className="form-control" 
                                                id="difficulty" 
                                                value={newTask.difficulty}
                                                onChange={(e) => setNewTask({...newTask, difficulty: e.target.value as any})}
                                                required
                                            >
                                                <option value="adiestrado">Adiestrado</option>
                                                <option value="regular">Regular</option>
                                                <option value="especialista">Especialista</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="estimated_hours" className="form-label">Horas estimadas *</label>
                                            <input 
                                                type="number" 
                                                className="form-control" 
                                                id="estimated_hours" 
                                                value={newTask.estimated_hours}
                                                onChange={(e) => setNewTask({...newTask, estimated_hours: parseInt(e.target.value)})}
                                                min="1"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="priority" className="form-label">Prioridad *</label>
                                            <select 
                                                className="form-control" 
                                                id="priority" 
                                                value={newTask.priority}
                                                onChange={(e) => setNewTask({...newTask, priority: parseInt(e.target.value)})}
                                                required
                                            >
                                                <option value="1">1 - Baja</option>
                                                <option value="2">2 - Media-Baja</option>
                                                <option value="3">3 - Media</option>
                                                <option value="4">4 - Media-Alta</option>
                                                <option value="5">5 - Alta</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="deadline" className="form-label">Fecha límite</label>
                                            <input 
                                                type="datetime-local" 
                                                className="form-control" 
                                                id="deadline" 
                                                value={newTask.deadline || ''}
                                                onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                                    <button type="submit" className="btn btn-primary">Crear Tarea</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para editar tarea */}
            {showEditModal && editingTask && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex={-1}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Editar Tarea</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowEditModal(false)}
                                ></button>
                            </div>
                            <form onSubmit={handleUpdateTask}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label htmlFor="edit-title" className="form-label">Título *</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            id="edit-title" 
                                            value={editingTask.title}
                                            onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="edit-description" className="form-label">Descripción *</label>
                                        <textarea 
                                            className="form-control" 
                                            id="edit-description" 
                                            rows={3} 
                                            value={editingTask.description}
                                            onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                                            required
                                        ></textarea>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="edit-difficulty" className="form-label">Dificultad *</label>
                                            <select 
                                                className="form-control" 
                                                id="edit-difficulty" 
                                                value={editingTask.difficulty}
                                                onChange={(e) => setEditingTask({...editingTask, difficulty: e.target.value as any})}
                                                required
                                            >
                                                <option value="adiestrado">Adiestrado</option>
                                                <option value="regular">Regular</option>
                                                <option value="especialista">Especialista</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="edit-estimated_hours" className="form-label">Horas estimadas *</label>
                                            <input 
                                                type="number" 
                                                className="form-control" 
                                                id="edit-estimated_hours" 
                                                value={editingTask.estimated_hours}
                                                onChange={(e) => setEditingTask({...editingTask, estimated_hours: parseInt(e.target.value)})}
                                                min="1"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="edit-priority" className="form-label">Prioridad *</label>
                                            <select 
                                                className="form-control" 
                                                id="edit-priority" 
                                                value={editingTask.priority}
                                                onChange={(e) => setEditingTask({...editingTask, priority: parseInt(e.target.value)})}
                                                required
                                            >
                                                <option value="1">1 - Baja</option>
                                                <option value="2">2 - Media-Baja</option>
                                                <option value="3">3 - Media</option>
                                                <option value="4">4 - Media-Alta</option>
                                                <option value="5">5 - Alta</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="edit-deadline" className="form-label">Fecha límite</label>
                                            <input 
                                                type="datetime-local" 
                                                className="form-control" 
                                                id="edit-deadline" 
                                                value={editingTask.deadline || ''}
                                                onChange={(e) => setEditingTask({...editingTask, deadline: e.target.value || null})}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancelar</button>
                                    <button type="submit" className="btn btn-primary">Actualizar Tarea</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskManagement;