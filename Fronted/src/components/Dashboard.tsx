import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskAPI } from '../services/task';
import type {  Task, Statistics } from '../services/task';


const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [recentTasks, setRecentTasks] = useState<Task[]>([]);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [tasksData, statsData] = await Promise.all([
                taskAPI.getTasks(),
                user?.profile.role === 'admin' || user?.profile.role === 'superuser' 
                    ? taskAPI.getStatistics() 
                    : Promise.resolve(null)
            ]);
            
            // Obtener las 5 tareas más recientes
            const recent = tasksData
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5);
            
            setRecentTasks(recent);
            setStatistics(statsData);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        {
            title: 'Tareas Totales',
            value: statistics?.general.total_tasks.toString() || '0',
            icon: 'bi-list-task',
            color: 'primary',
            border: 'border-left-primary'
        },
        {
            title: 'Completadas',
            value: statistics?.general.completed_tasks.toString() || '0',
            icon: 'bi-check-circle',
            color: 'success',
            border: 'border-left-success'
        },
        {
            title: 'Pendientes',
            value: statistics?.general.pending_tasks.toString() || '0',
            icon: 'bi-clock',
            color: 'warning',
            border: 'border-left-warning'
        },
        {
            title: 'Eficiencia',
            value: statistics ? `${statistics.general.completion_rate.toFixed(1)}%` : '0%',
            icon: 'bi-graph-up',
            color: 'info',
            border: 'border-left-info'
        }
    ];

    const getStatusBadge = (status: string) => {
        const statusConfig: { [key: string]: { class: string, text: string } } = {
            'pending': { class: 'bg-secondary', text: 'Pendiente' },
            'assigned': { class: 'bg-primary', text: 'Asignada' },
            'in_progress': { class: 'bg-warning text-dark', text: 'En Progreso' },
            'completed': { class: 'bg-success', text: 'Completada' },
            'rejected': { class: 'bg-danger', text: 'Rechazada' }
        };
        const config = statusConfig[status] || { class: 'bg-secondary', text: status };
        return <span className={`badge ${config.class}`}>{config.text}</span>;
    };

    return (
        <div className="fade-in">
            {/* Header del Dashboard */}
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-4 mb-4 border-bottom">
                <div>
                    <h1 className="h2 text-gradient mb-1">Dashboard</h1>
                    <p className="text-muted mb-0">
                        Bienvenido al panel de control del sistema
                    </p>
                </div>
                <div className="btn-toolbar mb-2 mb-md-0">
                    <div className="btn-group me-2">
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={loadDashboardData}>
                            <i className="bi bi-arrow-clockwise me-1"></i>
                            Actualizar
                        </button>
                    </div>
                </div>
            </div>

            {/* Tarjetas de estadísticas */}
            {(user?.profile.role === 'admin' || user?.profile.role === 'superuser') && (
                <div className="row mb-4">
                    {stats.map((stat, index) => (
                        <div key={index} className="col-xl-3 col-md-6 mb-4">
                            <div className={`card stats-card h-100 ${stat.border}`}>
                                <div className="card-body">
                                    <div className="row no-gutters align-items-center">
                                        <div className="col mr-2">
                                            <div className={`text-xs font-weight-bold text-uppercase mb-1 text-${stat.color}`}>
                                                {stat.title}
                                            </div>
                                            <div className="h5 mb-0 font-weight-bold text-primary">
                                                {stat.value}
                                            </div>
                                        </div>
                                        <div className="col-auto">
                                            <i className={`bi ${stat.icon} fa-2x text-${stat.color}`}></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tareas Recientes */}
            <div className="row mt-4">
                <div className="col-12">
                    <div className="card shadow-custom">
                        <div className="card-header">
                            <h6 className="m-0 font-weight-bold text-primary">
                                <i className="bi bi-clock-history me-2"></i>
                                Tareas Recientes
                            </h6>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Cargando...</span>
                                    </div>
                                </div>
                            ) : recentTasks.length === 0 ? (
                                <div className="text-center py-4">
                                    <i className="bi bi-inbox display-4 text-muted"></i>
                                    <p className="text-muted mt-2">No hay tareas recientes para mostrar</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Título</th>
                                                <th>Dificultad</th>
                                                <th>Estado</th>
                                                <th>Asignado a</th>
                                                <th>Fecha</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentTasks.map(task => (
                                                <tr key={task.id}>
                                                    <td>
                                                        <strong>{task.title}</strong>
                                                        <br />
                                                        <small className="text-muted">{task.description.substring(0, 50)}...</small>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${
                                                            task.difficulty === 'adiestrado' ? 'bg-info' :
                                                            task.difficulty === 'regular' ? 'bg-warning text-dark' : 'bg-danger'
                                                        }`}>
                                                            {task.difficulty}
                                                        </span>
                                                    </td>
                                                    <td>{getStatusBadge(task.status)}</td>
                                                    <td>
                                                        {task.assigned_to_name || 
                                                            <span className="text-muted">No asignado</span>
                                                        }
                                                    </td>
                                                    <td>
                                                        <small className="text-muted">
                                                            {new Date(task.created_at).toLocaleDateString()}
                                                        </small>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;