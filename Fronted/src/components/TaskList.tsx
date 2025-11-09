import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskAPI } from '../services/task';
import type { Task, TaskRejectionData, TaskCompletionData } from '../services/task';
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
  onReject: (task: Task) => void;
  onComplete: (task: Task) => void;
}

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  submitLabel: string;
  submitVariant: 'success' | 'danger';
  children: React.ReactNode;
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
};

const DEFAULT_COMPLETION_DATA: TaskCompletionData = {
  report_text: '',
  hours_worked: 1,
  challenges_faced: '',
  solutions_applied: '',
};

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [completionData, setCompletionData] = useState<TaskCompletionData>(DEFAULT_COMPLETION_DATA);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const { user } = useAuth();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const tasksData = await taskAPI.getTasks();
      
      const userTasks = tasksData.filter(task => 
        task.assigned_to === user?.id && 
        ['assigned', 'in_progress'].includes(task.status)
      );
      
      setTasks(userTasks);
    } catch (error) {
      await Swal.fire({
        ...ALERT_CONFIG.error,
        text: 'No se pudieron cargar las tareas.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const handleReject = useCallback((task: Task): void => {
    setSelectedTask(task);
    setRejectionReason('');
    setShowRejectModal(true);
  }, []);

  const handleComplete = useCallback((task: Task): void => {
    setSelectedTask(task);
    setCompletionData(DEFAULT_COMPLETION_DATA);
    setShowCompleteModal(true);
  }, []);

  const closeModals = useCallback((): void => {
    setShowRejectModal(false);
    setShowCompleteModal(false);
    setSelectedTask(null);
    setRejectionReason('');
    setCompletionData(DEFAULT_COMPLETION_DATA);
  }, []);

  const confirmReject = useCallback(async (): Promise<void> => {
    if (!selectedTask || !rejectionReason.trim()) return;

    try {
      setIsSubmitting(true);
      await taskAPI.rejectTask(selectedTask.id, { reason: rejectionReason });
      
      await Swal.fire({
        ...ALERT_CONFIG.success,
        text: 'Tarea rechazada correctamente.',
      });
      
      closeModals();
      await loadTasks();
    } catch (error) {
      await Swal.fire({
        ...ALERT_CONFIG.error,
        text: 'No se pudo rechazar la tarea.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedTask, rejectionReason, closeModals, loadTasks]);

  const confirmComplete = useCallback(async (): Promise<void> => {
    if (!selectedTask || !completionData.report_text.trim()) return;

    try {
      setIsSubmitting(true);
      await taskAPI.completeTask(selectedTask.id, completionData);
      
      await Swal.fire({
        ...ALERT_CONFIG.success,
        text: 'Tarea completada y reporte enviado.',
      });
      
      closeModals();
      await loadTasks();
    } catch (error) {
      await Swal.fire({
        ...ALERT_CONFIG.error,
        text: 'No se pudo completar la tarea.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedTask, completionData, closeModals, loadTasks]);

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

  const userTasks = useMemo(() => tasks, [tasks]);

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
          <i className="bi bi-check-circle display-4 text-success mb-3" aria-hidden="true"></i>
          <h5 className="text-success">¡No tienes tareas pendientes!</h5>
          <p className="text-muted">
            Todas las tareas asignadas están completadas o no hay tareas para mostrar.
          </p>
        </div>
      </div>
    </div>
  );

  const TaskCard: React.FC<TaskCardProps> = ({ task, onReject, onComplete }) => (
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
          
          {task.deadline && (
            <div className="mb-2">
              <strong>Fecha límite:</strong>
              <span className={isDeadlinePassed(task.deadline) ? 'text-danger' : 'text-success'}>
                {' '}{formatDate(task.deadline)}
              </span>
            </div>
          )}
          
          <div className="mb-2">
            <strong>Asignada:</strong> {formatDate(task.assigned_at || task.created_at)}
          </div>
        </div>
        
        <div className="card-footer bg-transparent">
          <TaskActions 
            task={task}
            onReject={onReject}
            onComplete={onComplete}
          />
        </div>
      </div>
    </div>
  );

  const TaskActions: React.FC<TaskCardProps> = ({ task, onReject, onComplete }) => {
    if (task.status === 'assigned') {
      return (
        <div className="d-grid gap-2">
          <button 
            className="btn btn-success btn-sm" 
            onClick={() => onComplete(task)}
            aria-label={`Completar tarea: ${task.title}`}
          >
            <i className="bi bi-check-circle me-1" aria-hidden="true"></i>
            Completar
          </button>
          <button 
            className="btn btn-outline-danger btn-sm" 
            onClick={() => onReject(task)}
            aria-label={`Rechazar tarea: ${task.title}`}
          >
            <i className="bi bi-x-circle me-1" aria-hidden="true"></i>
            Rechazar
          </button>
        </div>
      );
    }

    if (task.status === 'in_progress') {
      return (
        <div className="d-grid">
          <button 
            className="btn btn-warning btn-sm" 
            onClick={() => onComplete(task)}
            aria-label={`Enviar para revisión: ${task.title}`}
          >
            <i className="bi bi-send-check me-1" aria-hidden="true"></i>
            Enviar para Revisión
          </button>
        </div>
      );
    }

    return null;
  };

  const TaskModal: React.FC<TaskModalProps> = ({
    task,
    isOpen,
    onClose,
    onSubmit,
    title,
    submitLabel,
    submitVariant,
    children,
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
            
            <div className="modal-body">
              {children}
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
                type="button" 
                className={`btn btn-${submitVariant}`}
                onClick={onSubmit}
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
          </div>
        </div>
      </div>
    );
  };

  const RejectModal: React.FC = () => (
    <TaskModal
      task={selectedTask}
      isOpen={showRejectModal}
      onClose={closeModals}
      onSubmit={confirmReject}
      title="Rechazar Tarea"
      submitLabel="Rechazar Tarea"
      submitVariant="danger"
      isSubmitting={isSubmitting}
    >
      <p>
        ¿Estás seguro de que deseas rechazar la tarea 
        "<strong>{selectedTask?.title}</strong>"?
      </p>
      <div className="mb-3">
        <label htmlFor="rejectionReason" className="form-label">
          Razón del rechazo *
        </label>
        <textarea 
          className="form-control" 
          id="rejectionReason" 
          rows={3} 
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Explica por qué rechazas esta tarea..."
          required
          disabled={isSubmitting}
        ></textarea>
      </div>
    </TaskModal>
  );

  const CompleteModal: React.FC = () => (
    <TaskModal
      task={selectedTask}
      isOpen={showCompleteModal}
      onClose={closeModals}
      onSubmit={confirmComplete}
      title="Completar Tarea"
      submitLabel="Enviar Reporte"
      submitVariant="success"
      isSubmitting={isSubmitting}
    >
      <p>
        Completar la tarea: "<strong>{selectedTask?.title}</strong>"
      </p>
      
      <div className="mb-3">
        <label htmlFor="reportText" className="form-label">
          Reporte de trabajo *
        </label>
        <textarea 
          className="form-control" 
          id="reportText" 
          rows={5} 
          value={completionData.report_text}
          onChange={(e) => setCompletionData(prev => ({ ...prev, report_text: e.target.value }))}
          placeholder="Describe el trabajo realizado, los resultados obtenidos y cualquier información relevante..."
          required
          disabled={isSubmitting}
        ></textarea>
      </div>
      
      <div className="mb-3">
        <label htmlFor="hoursWorked" className="form-label">
          Horas trabajadas *
        </label>
        <input 
          type="number" 
          className="form-control" 
          id="hoursWorked" 
          value={completionData.hours_worked}
          onChange={(e) => setCompletionData(prev => ({ ...prev, hours_worked: parseInt(e.target.value) || 1 }))}
          min="1"
          required
          disabled={isSubmitting}
        />
      </div>
      
      <div className="mb-3">
        <label htmlFor="challengesFaced" className="form-label">
          Desafíos enfrentados
        </label>
        <textarea 
          className="form-control" 
          id="challengesFaced" 
          rows={3} 
          value={completionData.challenges_faced}
          onChange={(e) => setCompletionData(prev => ({ ...prev, challenges_faced: e.target.value }))}
          placeholder="Describe los desafíos o problemas que enfrentaste durante la realización de la tarea..."
          disabled={isSubmitting}
        ></textarea>
      </div>
      
      <div className="mb-3">
        <label htmlFor="solutionsApplied" className="form-label">
          Soluciones aplicadas
        </label>
        <textarea 
          className="form-control" 
          id="solutionsApplied" 
          rows={3} 
          value={completionData.solutions_applied}
          onChange={(e) => setCompletionData(prev => ({ ...prev, solutions_applied: e.target.value }))}
          placeholder="Describe las soluciones o estrategias que aplicaste para superar los desafíos..."
          disabled={isSubmitting}
        ></textarea>
      </div>
    </TaskModal>
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-4 mb-4 border-bottom">
        <div>
          <h1 className="h2 text-gradient mb-1">Mis Tareas</h1>
          <p className="text-muted mb-0">
            Gestiona las tareas asignadas a ti
          </p>
        </div>
        <div className="btn-group">
          <button 
            className="btn btn-outline-primary btn-sm" 
            onClick={loadTasks}
            disabled={isLoading}
            aria-label="Actualizar lista de tareas"
          >
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
            {isLoading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="row">
        {userTasks.length === 0 ? (
          <EmptyState />
        ) : (
          userTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onReject={handleReject}
              onComplete={handleComplete}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <RejectModal />
      <CompleteModal />
    </div>
  );
};

export default TaskList;