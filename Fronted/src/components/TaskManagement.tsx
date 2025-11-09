import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskAPI } from '../services/task';
import type { Task, CreateTaskData } from '../services/task';
import Swal from 'sweetalert2';

interface BadgeConfig {
  class: string;
  text: string;
}

interface StatusConfig {
  [key: string]: BadgeConfig;
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

interface TaskModalProps {
  task: Task | CreateTaskData | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  submitLabel: string;
  onChange: (field: string, value: any) => void;
  isSubmitting?: boolean;
}

const STATUS_CONFIG: StatusConfig = {
  pending: { class: 'bg-secondary', text: 'Pendiente' },
  assigned: { class: 'bg-primary', text: 'Asignada' },
  in_progress: { class: 'bg-warning text-dark', text: 'En Progreso' },
  completed: { class: 'bg-success', text: 'Completada' },
  rejected: { class: 'bg-danger', text: 'Rechazada' },
  cancelled: { class: 'bg-dark', text: 'Cancelada' },
};

const DIFFICULTY_CONFIG: StatusConfig = {
  adiestrado: { class: 'bg-info', text: 'Adiestrado' },
  regular: { class: 'bg-warning text-dark', text: 'Regular' },
  especialista: { class: 'bg-danger', text: 'Especialista' },
};

const PRIORITY_CONFIG: StatusConfig = {
  '1': { class: 'bg-success', text: 'Baja' },
  '2': { class: 'bg-info', text: 'Media-Baja' },
  '3': { class: 'bg-warning text-dark', text: 'Media' },
  '4': { class: 'bg-orange', text: 'Media-Alta' },
  '5': { class: 'bg-danger', text: 'Alta' },
};

const PRIORITY_OPTIONS = [
  { value: 1, label: '1 - Baja' },
  { value: 2, label: '2 - Media-Baja' },
  { value: 3, label: '3 - Media' },
  { value: 4, label: '4 - Media-Alta' },
  { value: 5, label: '5 - Alta' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'adiestrado', label: 'Adiestrado' },
  { value: 'regular', label: 'Regular' },
  { value: 'especialista', label: 'Especialista' },
];

const ALERT_CONFIG = {
  success: {
    icon: 'success' as const,
    title: 'Éxito',
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

const DEFAULT_TASK_DATA: CreateTaskData = {
  title: '',
  description: '',
  difficulty: 'adiestrado',
  estimated_hours: 1,
  priority: 1,
};

const TaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<CreateTaskData>(DEFAULT_TASK_DATA);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const { user } = useAuth();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const tasksData = await taskAPI.getTasks();
      setTasks(tasksData);
    } catch (error) {
      await Swal.fire({
        ...ALERT_CONFIG.error,
        text: 'No se pudieron cargar las tareas.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreateTask = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      await taskAPI.createTask(newTask);
      
      await Swal.fire({
        ...ALERT_CONFIG.success,
        text: 'Tarea creada correctamente.',
      });
      
      setShowCreateModal(false);
      setNewTask(DEFAULT_TASK_DATA);
      await loadTasks();
    } catch (error) {
      await Swal.fire({
        ...ALERT_CONFIG.error,
        text: 'No se pudo crear la tarea.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [newTask, loadTasks]);

  const handleEditTask = useCallback((task: Task): void => {
    setEditingTask(task);
    setShowEditModal(true);
  }, []);

  const handleUpdateTask = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      setIsSubmitting(true);
      const updateData: CreateTaskData = {
        title: editingTask.title,
        description: editingTask.description,
        difficulty: editingTask.difficulty,
        estimated_hours: editingTask.estimated_hours,
        priority: editingTask.priority,
        deadline: editingTask.deadline || undefined,
      };

      await taskAPI.updateTask(editingTask.id, updateData);
      
      await Swal.fire({
        ...ALERT_CONFIG.success,
        text: 'Tarea actualizada correctamente.',
      });
      
      setShowEditModal(false);
      setEditingTask(null);
      await loadTasks();
    } catch (error) {
      await Swal.fire({
        ...ALERT_CONFIG.error,
        text: 'No se pudo actualizar la tarea.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [editingTask, loadTasks]);

  const handleDeleteTask = useCallback(async (task: Task): Promise<void> => {
    const result = await Swal.fire({
      ...ALERT_CONFIG.warning,
      text: `La tarea "${task.title}" será eliminada permanentemente.`,
    });

    if (result.isConfirmed) {
      try {
        await taskAPI.deleteTask(task.id);
        
        await Swal.fire({
          ...ALERT_CONFIG.success,
          title: 'Eliminada!',
          text: 'La tarea ha sido eliminada.',
        });
        
        await loadTasks();
      } catch (error) {
        await Swal.fire({
          ...ALERT_CONFIG.error,
          text: 'No se pudo eliminar la tarea.',
        });
      }
    }
  }, [loadTasks]);

  const closeModals = useCallback((): void => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingTask(null);
    setNewTask(DEFAULT_TASK_DATA);
  }, []);

  const handleTaskChange = useCallback((field: string, value: any): void => {
    setNewTask(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleEditingTaskChange = useCallback((field: string, value: any): void => {
    if (!editingTask) return;
    setEditingTask(prev => prev ? { ...prev, [field]: value } : null);
  }, [editingTask]);

  const getBadge = useCallback((config: StatusConfig, key: string): JSX.Element => {
    const badgeConfig = config[key] || { class: 'bg-secondary', text: key };
    return <span className={`badge ${badgeConfig.class}`}>{badgeConfig.text}</span>;
  }, []);

  const getStatusBadge = useCallback((status: string): JSX.Element => 
    getBadge(STATUS_CONFIG, status),
  [getBadge]);

  const getDifficultyBadge = useCallback((difficulty: string): JSX.Element => 
    getBadge(DIFFICULTY_CONFIG, difficulty),
  [getBadge]);

  const getPriorityBadge = useCallback((priority: number): JSX.Element => 
    getBadge(PRIORITY_CONFIG, priority.toString()),
  [getBadge]);

  const isDeadlinePassed = useCallback((deadline: string): boolean => 
    new Date(deadline) < new Date(),
  []);

  const formatDate = useCallback((dateString: string): string => 
    new Date(dateString).toLocaleDateString(),
  []);

  const LoadingSpinner: React.FC = () => (
    <div 
      className="d-flex justify-content-center align-items-center" 
      style={{ height: '200px' }}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Cargando tareas...</span>
      </div>
    </div>
  );

  const EmptyState: React.FC = () => (
    <div className="col-12">
      <div className="card shadow-custom">
        <div className="card-body text-center py-5">
          <i className="bi bi-inbox display-4 text-muted mb-3" aria-hidden="true"></i>
          <h5 className="text-muted">No hay tareas creadas</h5>
          <p className="text-muted">Comienza creando la primera tarea del sistema</p>
        </div>
      </div>
    </div>
  );

  const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => (
    <div className="col-md-6 col-lg-4 mb-4">
      <div className="card shadow-custom h-100">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h6 className="card-title mb-0 text-truncate" title={task.title}>
            {task.title}
          </h6>
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
              <span className={isDeadlinePassed(task.deadline) ? 'text-danger' : 'text-success'}>
                {' '}{formatDate(task.deadline)}
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
              {formatDate(task.created_at)}
            </small>
            <div className="btn-group">
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => onEdit(task)}
                aria-label={`Editar tarea: ${task.title}`}
                title="Editar tarea"
              >
                <i className="bi bi-pencil" aria-hidden="true"></i>
              </button>
              <button 
                className="btn btn-sm btn-outline-danger"
                onClick={() => onDelete(task)}
                aria-label={`Eliminar tarea: ${task.title}`}
                title="Eliminar tarea"
              >
                <i className="bi bi-trash" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const TaskModal: React.FC<TaskModalProps> = ({
    task,
    isOpen,
    onClose,
    onSubmit,
    title,
    submitLabel,
    onChange,
    isSubmitting = false,
  }) => {
    if (!isOpen || !task) return null;

    return (
      <div 
        className="modal fade show d-block" 
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} 
        tabIndex={-1}
        role="dialog"
        aria-labelledby="taskModalLabel"
        aria-modal="true"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="taskModalLabel">{title}</h5>
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
                  <label htmlFor="title" className="form-label">Título *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="title" 
                    value={task.title}
                    onChange={(e) => onChange('title', e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Descripción *</label>
                  <textarea 
                    className="form-control" 
                    id="description" 
                    rows={3} 
                    value={task.description}
                    onChange={(e) => onChange('description', e.target.value)}
                    required
                    disabled={isSubmitting}
                  ></textarea>
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="difficulty" className="form-label">Dificultad *</label>
                    <select 
                      className="form-control" 
                      id="difficulty" 
                      value={task.difficulty}
                      onChange={(e) => onChange('difficulty', e.target.value)}
                      required
                      disabled={isSubmitting}
                    >
                      {DIFFICULTY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label htmlFor="estimated_hours" className="form-label">Horas estimadas *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      id="estimated_hours" 
                      value={task.estimated_hours}
                      onChange={(e) => onChange('estimated_hours', parseInt(e.target.value))}
                      min="1"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="priority" className="form-label">Prioridad *</label>
                    <select 
                      className="form-control" 
                      id="priority" 
                      value={task.priority}
                      onChange={(e) => onChange('priority', parseInt(e.target.value))}
                      required
                      disabled={isSubmitting}
                    >
                      {PRIORITY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label htmlFor="deadline" className="form-label">Fecha límite</label>
                    <input 
                      type="datetime-local" 
                      className="form-control" 
                      id="deadline" 
                      value={task.deadline || ''}
                      onChange={(e) => onChange('deadline', e.target.value || null)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
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
                      Procesando...
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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-4 mb-4 border-bottom">
        <div>
          <h1 className="h2 text-gradient mb-1">Gestión de Tareas</h1>
          <p className="text-muted mb-0">Crea y gestiona las tareas del sistema</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          aria-label="Crear nueva tarea"
        >
          <i className="bi bi-plus-circle me-2" aria-hidden="true"></i>
          Crear Tarea
        </button>
      </div>

      {/* Tasks Grid */}
      <div className="row">
        {tasks.length === 0 ? (
          <EmptyState />
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          ))
        )}
      </div>

      {/* Create Task Modal */}
      <TaskModal
        task={newTask}
        isOpen={showCreateModal}
        onClose={closeModals}
        onSubmit={handleCreateTask}
        title="Crear Nueva Tarea"
        submitLabel="Crear Tarea"
        onChange={handleTaskChange}
        isSubmitting={isSubmitting}
      />

      {/* Edit Task Modal */}
      <TaskModal
        task={editingTask}
        isOpen={showEditModal}
        onClose={closeModals}
        onSubmit={handleUpdateTask}
        title="Editar Tarea"
        submitLabel="Actualizar Tarea"
        onChange={handleEditingTaskChange}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default TaskManagement;