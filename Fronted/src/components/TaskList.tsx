import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskAPI } from '../services/task';
import type { Task, TaskRejectionData, TaskCompletionData } from '../services/task';
import Swal from 'sweetalert2';

const TaskList: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [completionData, setCompletionData] = useState<TaskCompletionData>({
        report_text: '',
        hours_worked: 1,
        challenges_faced: '',
        solutions_applied: ''
    });
    const { user } = useAuth();

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const tasksData = await taskAPI.getTasks();
            // Filtrar solo las tareas asignadas al usuario actual
            const userTasks = tasksData.filter(task => 
                task.assigned_to === user?.id && 
                ['assigned', 'in_progress'].includes(task.status)
            );
            setTasks(userTasks);
        } catch (error: any) {
            Swal.fire('Error', 'No se pudieron cargar las tareas.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = (task: Task) => {
        setSelectedTask(task);
        setShowRejectModal(true);
    };

    const confirmReject = async () => {
        if (!selectedTask) return;

        try {
            await taskAPI.rejectTask(selectedTask.id, { reason: rejectionReason });
            Swal.fire('Éxito', 'Tarea rechazada correctamente.', 'success');
            setShowRejectModal(false);
            setRejectionReason('');
            setSelectedTask(null);
            loadTasks();
        } catch (error: any) {
            Swal.fire('Error', 'No se pudo rechazar la tarea.', 'error');
        }
    };

    const handleComplete = (task: Task) => {
        setSelectedTask(task);
        setShowCompleteModal(true);
    };

    const confirmComplete = async () => {
        if (!selectedTask) return;

        try {
            await taskAPI.completeTask(selectedTask.id, completionData);
            Swal.fire('Éxito', 'Tarea completada y reporte enviado.', 'success');
            setShowCompleteModal(false);
            setCompletionData({
                report_text: '',
                hours_worked: 1,
                challenges_faced: '',
                solutions_applied: ''
            });
            setSelectedTask(null);
            loadTasks();
        } catch (error: any) {
            Swal.fire('Error', 'No se pudo completar la tarea.', 'error');
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
                    <h1 className="h2 text-gradient mb-1">Mis Tareas</h1>
                    <p className="text-muted mb-0">
                        Gestiona las tareas asignadas a ti
                    </p>
                </div>
                <div className="btn-group">
                    <button className="btn btn-outline-primary btn-sm" onClick={loadTasks}>
                        <i className="bi bi-arrow-clockwise me-1"></i>
                        Actualizar
                    </button>
                </div>
            </div>

            <div className="row">
                {tasks.length === 0 ? (
                    <div className="col-12">
                        <div className="card shadow-custom">
                            <div className="card-body text-center py-5">
                                <i className="bi bi-check-circle display-4 text-success mb-3"></i>
                                <h5 className="text-success">¡No tienes tareas pendientes!</h5>
                                <p className="text-muted">Todas las tareas asignadas están completadas o no hay tareas para mostrar.</p>
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
                                    {task.deadline && (
                                        <div className="mb-2">
                                            <strong>Fecha límite:</strong> 
                                            <span className={new Date(task.deadline) < new Date() ? 'text-danger' : 'text-success'}>
                                                {' '}{new Date(task.deadline).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="mb-2">
                                        <strong>Asignada:</strong> {new Date(task.assigned_at || task.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="card-footer bg-transparent">
                                    {task.status === 'assigned' && (
                                        <div className="d-grid gap-2">
                                            <button 
                                                className="btn btn-success btn-sm" 
                                                onClick={() => handleComplete(task)}
                                            >
                                                <i className="bi bi-check-circle me-1"></i>
                                                Completar
                                            </button>
                                            <button 
                                                className="btn btn-outline-danger btn-sm" 
                                                onClick={() => handleReject(task)}
                                            >
                                                <i className="bi bi-x-circle me-1"></i>
                                                Rechazar
                                            </button>
                                        </div>
                                    )}
                                    {task.status === 'in_progress' && (
                                        <div className="d-grid">
                                            <button 
                                                className="btn btn-warning btn-sm" 
                                                onClick={() => handleComplete(task)}
                                            >
                                                <i className="bi bi-send-check me-1"></i>
                                                Enviar para Revisión
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal para rechazar tarea */}
            {showRejectModal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex={-1}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Rechazar Tarea</h5>
                                <button type="button" className="btn-close" onClick={() => setShowRejectModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>¿Estás seguro de que deseas rechazar la tarea "<strong>{selectedTask?.title}</strong>"?</p>
                                <div className="mb-3">
                                    <label htmlFor="rejectionReason" className="form-label">Razón del rechazo *</label>
                                    <textarea 
                                        className="form-control" 
                                        id="rejectionReason" 
                                        rows={3} 
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Explica por qué rechazas esta tarea..."
                                        required
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>Cancelar</button>
                                <button 
                                    type="button" 
                                    className="btn btn-danger" 
                                    onClick={confirmReject}
                                    disabled={!rejectionReason.trim()}
                                >
                                    Rechazar Tarea
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para completar tarea */}
            {showCompleteModal && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex={-1}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Completar Tarea</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCompleteModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>Completar la tarea: "<strong>{selectedTask?.title}</strong>"</p>
                                <div className="mb-3">
                                    <label htmlFor="reportText" className="form-label">Reporte de trabajo *</label>
                                    <textarea 
                                        className="form-control" 
                                        id="reportText" 
                                        rows={5} 
                                        value={completionData.report_text}
                                        onChange={(e) => setCompletionData({...completionData, report_text: e.target.value})}
                                        placeholder="Describe el trabajo realizado, los resultados obtenidos y cualquier información relevante..."
                                        required
                                    ></textarea>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="hoursWorked" className="form-label">Horas trabajadas *</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        id="hoursWorked" 
                                        value={completionData.hours_worked}
                                        onChange={(e) => setCompletionData({...completionData, hours_worked: parseInt(e.target.value)})}
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="challengesFaced" className="form-label">Desafíos enfrentados</label>
                                    <textarea 
                                        className="form-control" 
                                        id="challengesFaced" 
                                        rows={3} 
                                        value={completionData.challenges_faced}
                                        onChange={(e) => setCompletionData({...completionData, challenges_faced: e.target.value})}
                                        placeholder="Describe los desafíos o problemas que enfrentaste durante la realización de la tarea..."
                                    ></textarea>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="solutionsApplied" className="form-label">Soluciones aplicadas</label>
                                    <textarea 
                                        className="form-control" 
                                        id="solutionsApplied" 
                                        rows={3} 
                                        value={completionData.solutions_applied}
                                        onChange={(e) => setCompletionData({...completionData, solutions_applied: e.target.value})}
                                        placeholder="Describe las soluciones o estrategias que aplicaste para superar los desafíos..."
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCompleteModal(false)}>Cancelar</button>
                                <button 
                                    type="button" 
                                    className="btn btn-success" 
                                    onClick={confirmComplete}
                                    disabled={!completionData.report_text.trim()}
                                >
                                    Enviar Reporte
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskList;