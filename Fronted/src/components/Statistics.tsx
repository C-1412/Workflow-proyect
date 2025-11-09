import React, { useState, useEffect } from 'react';
import { taskAPI,} from '../services/task';
import type { Statistics as StatisticsData } from '../services/task';
import Swal from 'sweetalert2';

const Statistics: React.FC = () => {
    const [statistics, setStatistics] = useState<StatisticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStatistics();
    }, []);

    const loadStatistics = async () => {
        try {
            const stats = await taskAPI.getStatistics();
            setStatistics(stats);
        } catch (error: any) {
            Swal.fire('Error', 'No se pudieron cargar las estadísticas.', 'error');
        } finally {
            setLoading(false);
        }
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

    if (!statistics) {
        return (
            <div className="alert alert-danger">
                No se pudieron cargar las estadísticas.
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-4 mb-4 border-bottom">
                <div>
                    <h1 className="h2 text-gradient mb-1">Estadísticas del Sistema</h1>
                    <p className="text-muted mb-0">
                        Métricas y análisis del rendimiento del sistema
                    </p>
                </div>
                <button className="btn btn-outline-primary btn-sm" onClick={loadStatistics}>
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Actualizar
                </button>
            </div>

            {/* Estadísticas generales */}
            <div className="row mb-4">
                <div className="col-xl-3 col-md-6 mb-4">
                    <div className="card stats-card border-left-primary">
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                        Total Tareas
                                    </div>
                                    <div className="h5 mb-0 font-weight-bold text-primary">
                                        {statistics.general.total_tasks}
                                    </div>
                                </div>
                                <div className="col-auto">
                                    <i className="bi bi-list-task fa-2x text-primary"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-md-6 mb-4">
                    <div className="card stats-card border-left-success">
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                                        Tareas Completadas
                                    </div>
                                    <div className="h5 mb-0 font-weight-bold text-success">
                                        {statistics.general.completed_tasks}
                                    </div>
                                </div>
                                <div className="col-auto">
                                    <i className="bi bi-check-circle fa-2x text-success"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-md-6 mb-4">
                    <div className="card stats-card border-left-warning">
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                        Tareas Pendientes
                                    </div>
                                    <div className="h5 mb-0 font-weight-bold text-warning">
                                        {statistics.general.pending_tasks}
                                    </div>
                                </div>
                                <div className="col-auto">
                                    <i className="bi bi-clock fa-2x text-warning"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-3 col-md-6 mb-4">
                    <div className="card stats-card border-left-info">
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                                        Tasa de Completación
                                    </div>
                                    <div className="h5 mb-0 font-weight-bold text-info">
                                        {statistics.general.completion_rate.toFixed(1)}%
                                    </div>
                                </div>
                                <div className="col-auto">
                                    <i className="bi bi-graph-up fa-2x text-info"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-lg-6">
                    <div className="card shadow-custom mb-4">
                        <div className="card-header">
                            <h6 className="m-0 font-weight-bold text-primary">
                                <i className="bi bi-trophy me-2"></i>
                                Top 5 - Más Tareas Completadas
                            </h6>
                        </div>
                        <div className="card-body">
                            {statistics.top_completers.length === 0 ? (
                                <p className="text-muted text-center py-3">No hay datos disponibles.</p>
                            ) : (
                                <div className="list-group list-group-flush">
                                    {statistics.top_completers.map((user, index) => (
                                        <div key={user.id} className="list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <span className="fw-bold text-primary me-2">#{index + 1}</span>
                                                {user.first_name} {user.last_name} 
                                                <small className="text-muted ms-2">({user.username})</small>
                                                <br />
                                                <small className="text-muted">
                                                    <i className="bi bi-shield me-1"></i>
                                                    {user.profile.role}
                                                </small>
                                            </div>
                                            <span className="badge bg-success rounded-pill">
                                                {user.profile.tasks_completed} tareas
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-lg-6">
                    <div className="card shadow-custom mb-4">
                        <div className="card-header">
                            <h6 className="m-0 font-weight-bold text-primary">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                Top 5 - Más Tareas Rechazadas
                            </h6>
                        </div>
                        <div className="card-body">
                            {statistics.top_rejecters.length === 0 ? (
                                <p className="text-muted text-center py-3">No hay datos disponibles.</p>
                            ) : (
                                <div className="list-group list-group-flush">
                                    {statistics.top_rejecters.map((user, index) => (
                                        <div key={user.id} className="list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <span className="fw-bold text-primary me-2">#{index + 1}</span>
                                                {user.first_name} {user.last_name}
                                                <small className="text-muted ms-2">({user.username})</small>
                                                <br />
                                                <small className="text-muted">
                                                    <i className="bi bi-shield me-1"></i>
                                                    {user.profile.role}
                                                </small>
                                            </div>
                                            <span className="badge bg-danger rounded-pill">
                                                {user.profile.tasks_rejected} rechazos
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Información adicional */}
            <div className="row">
                <div className="col-12">
                    <div className="card shadow-custom">
                        <div className="card-header">
                            <h6 className="m-0 font-weight-bold text-primary">
                                <i className="bi bi-info-circle me-2"></i>
                                Resumen del Sistema
                            </h6>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-6">
                                    <p><strong>Tareas asignadas actualmente:</strong> {statistics.general.assigned_tasks}</p>
                                    <p><strong>Tasa de eficiencia:</strong> 
                                        <span className={`badge ms-2 ${
                                            statistics.general.completion_rate >= 80 ? 'bg-success' :
                                            statistics.general.completion_rate >= 60 ? 'bg-warning text-dark' : 'bg-danger'
                                        }`}>
                                            {statistics.general.completion_rate.toFixed(1)}%
                                        </span>
                                    </p>
                                </div>
                                <div className="col-md-6">
                                    <p><strong>Total trabajadores activos:</strong> {statistics.top_completers.length + statistics.top_rejecters.length}</p>
                                    <p><strong>Promedio de tareas por trabajador:</strong> 
                                        {(statistics.general.total_tasks / (statistics.top_completers.length + statistics.top_rejecters.length) || 0).toFixed(1)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Statistics;