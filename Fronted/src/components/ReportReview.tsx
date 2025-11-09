import React, { useState, useEffect } from 'react';
import { taskAPI } from '../services/task';
import type { TaskReport } from '../services/task';
import Swal from 'sweetalert2';

const ReportReview: React.FC = () => {
    const [reports, setReports] = useState<TaskReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<TaskReport | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewNotes, setReviewNotes] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('pending_review');

    useEffect(() => {
        loadReports();
    }, [statusFilter]);

    const loadReports = async () => {
        try {
            const reportsData = await taskAPI.getReports(statusFilter);
            setReports(reportsData);
        } catch (error: any) {
            Swal.fire('Error', 'No se pudieron cargar los reportes.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleReview = (report: TaskReport) => {
        setSelectedReport(report);
        setShowReviewModal(true);
    };

    const confirmReview = async (action: 'approve' | 'reject' | 'needs_correction') => {
        if (!selectedReport) return;

        try {
            await taskAPI.reviewReport(selectedReport.id, action, reviewNotes);
            Swal.fire('Éxito', `Reporte ${action === 'approve' ? 'aprobado' : action === 'reject' ? 'rechazado' : 'marcado como necesita corrección'} correctamente.`, 'success');
            setShowReviewModal(false);
            setReviewNotes('');
            setSelectedReport(null);
            loadReports();
        } catch (error: any) {
            Swal.fire('Error', 'No se pudo procesar el reporte.', 'error');
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: { [key: string]: { class: string, text: string } } = {
            'pending_review': { class: 'bg-warning text-dark', text: 'Pendiente' },
            'approved': { class: 'bg-success', text: 'Aprobado' },
            'rejected': { class: 'bg-danger', text: 'Rechazado' },
            'needs_correction': { class: 'bg-info', text: 'Requiere Corrección' }
        };
        const config = statusConfig[status] || { class: 'bg-secondary', text: status };
        return <span className={`badge ${config.class}`}>{config.text}</span>;
    };

    const getStatusDisplayText = (status: string) => {
        const statusText: { [key: string]: string } = {
            'pending_review': 'Pendientes de Revisión',
            'approved': 'Aprobados',
            'rejected': 'Rechazados',
            'needs_correction': 'Requieren Corrección',
            'all': 'Todos los Reportes'
        };
        return statusText[status] || status;
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
                    <h1 className="h2 text-gradient mb-1">Revisión de Reportes</h1>
                    <p className="text-muted mb-0">
                        Revisa y aprueba los reportes de tareas completadas
                    </p>
                </div>
                <div className="btn-group">
                    <button className="btn btn-outline-primary btn-sm" onClick={loadReports}>
                        <i className="bi bi-arrow-clockwise me-1"></i>
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Filtros de estado */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card shadow-custom">
                        <div className="card-body">
                            <h6 className="card-title mb-3">Filtrar por Estado</h6>
                            <div className="btn-group" role="group">
                                <button
                                    type="button"
                                    className={`btn ${statusFilter === 'pending_review' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setStatusFilter('pending_review')}
                                >
                                    Pendientes
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${statusFilter === 'approved' ? 'btn-success' : 'btn-outline-success'}`}
                                    onClick={() => setStatusFilter('approved')}
                                >
                                    Aprobados
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${statusFilter === 'rejected' ? 'btn-danger' : 'btn-outline-danger'}`}
                                    onClick={() => setStatusFilter('rejected')}
                                >
                                    Rechazados
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${statusFilter === 'needs_correction' ? 'btn-info' : 'btn-outline-info'}`}
                                    onClick={() => setStatusFilter('needs_correction')}
                                >
                                    Corrección
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${statusFilter === 'all' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                                    onClick={() => setStatusFilter('all')}
                                >
                                    Todos
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                {reports.length === 0 ? (
                    <div className="col-12">
                        <div className="card shadow-custom">
                            <div className="card-body text-center py-5">
                                <i className="bi bi-clipboard-check display-4 text-success mb-3"></i>
                                <h5 className="text-success">¡No hay reportes {getStatusDisplayText(statusFilter).toLowerCase()}!</h5>
                                <p className="text-muted">Todos los reportes han sido revisados o no hay reportes para mostrar.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    reports.map(report => (
                        <div key={report.id} className="col-12 mb-4">
                            <div className="card shadow-custom">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">{report.task_title}</h5>
                                    <div>
                                        {getStatusBadge(report.status)}
                                        {report.reviewed_at && (
                                            <small className="text-muted ms-2">
                                                Revisado: {new Date(report.reviewed_at).toLocaleDateString()}
                                            </small>
                                        )}
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <p><strong>Trabajador:</strong> <span className="text-primary">{report.assigned_to_name}</span></p>
                                            <p><strong>Horas trabajadas:</strong> <span className="text-info">{report.hours_worked}</span></p>
                                            <p><strong>Fecha de envío:</strong> {new Date(report.submitted_at).toLocaleDateString()}</p>
                                            {report.reviewed_by_name && (
                                                <p><strong>Revisado por:</strong> <span className="text-success">{report.reviewed_by_name}</span></p>
                                            )}
                                        </div>
                                        <div className="col-md-6">
                                            <p><strong>Desafíos enfrentados:</strong></p>
                                            <p className="text-muted">{report.challenges_faced || 'No se reportaron desafíos'}</p>
                                        </div>
                                    </div>
                                    <div className="row mt-3">
                                        <div className="col-12">
                                            <p><strong>Soluciones aplicadas:</strong></p>
                                            <p className="text-muted">{report.solutions_applied || 'No se reportaron soluciones'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <p><strong>Reporte de trabajo:</strong></p>
                                        <div className="bg-light p-3 rounded">
                                            <p className="mb-0">{report.report_text}</p>
                                        </div>
                                    </div>
                                    {report.review_notes && (
                                        <div className="mt-3">
                                            <p><strong>Notas de revisión:</strong></p>
                                            <div className="bg-warning bg-opacity-10 p-3 rounded">
                                                <p className="mb-0">{report.review_notes}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="card-footer">
                                    {report.status === 'pending_review' && (
                                        <button 
                                            className="btn btn-primary" 
                                            onClick={() => handleReview(report)}
                                        >
                                            <i className="bi bi-eye me-1"></i>
                                            Revisar Reporte
                                        </button>
                                    )}
                                    {report.status !== 'pending_review' && (
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="text-muted">
                                                Estado: {getStatusBadge(report.status)}
                                            </span>
                                            <button 
                                                className="btn btn-outline-secondary" 
                                                onClick={() => handleReview(report)}
                                            >
                                                <i className="bi bi-eye me-1"></i>
                                                Ver Detalles
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal para revisar reporte */}
            {showReviewModal && selectedReport && (
                <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex={-1}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {selectedReport.status === 'pending_review' ? 'Revisar Reporte' : 'Ver Detalles del Reporte'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowReviewModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-4">
                                    <h6>Información del Reporte</h6>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <p><strong>Tarea:</strong> {selectedReport.task_title}</p>
                                            <p><strong>Trabajador:</strong> {selectedReport.assigned_to_name}</p>
                                        </div>
                                        <div className="col-md-6">
                                            <p><strong>Horas trabajadas:</strong> {selectedReport.hours_worked}</p>
                                            <p><strong>Fecha:</strong> {new Date(selectedReport.submitted_at).toLocaleDateString()}</p>
                                            {selectedReport.reviewed_by_name && (
                                                <p><strong>Revisado por:</strong> {selectedReport.reviewed_by_name}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h6>Reporte de Trabajo</h6>
                                    <div className="bg-light p-3 rounded">
                                        <p className="mb-0">{selectedReport.report_text}</p>
                                    </div>
                                </div>

                                {selectedReport.challenges_faced && (
                                    <div className="mb-4">
                                        <h6>Desafíos Enfrentados</h6>
                                        <p className="text-muted">{selectedReport.challenges_faced}</p>
                                    </div>
                                )}

                                {selectedReport.solutions_applied && (
                                    <div className="mb-4">
                                        <h6>Soluciones Aplicadas</h6>
                                        <p className="text-muted">{selectedReport.solutions_applied}</p>
                                    </div>
                                )}

                                {selectedReport.review_notes && (
                                    <div className="mb-4">
                                        <h6>Notas de Revisión Anteriores</h6>
                                        <div className="bg-warning bg-opacity-10 p-3 rounded">
                                            <p className="mb-0">{selectedReport.review_notes}</p>
                                        </div>
                                    </div>
                                )}

                                {selectedReport.status === 'pending_review' && (
                                    <div className="mb-3">
                                        <label htmlFor="reviewNotes" className="form-label">Notas de revisión</label>
                                        <textarea 
                                            className="form-control" 
                                            id="reviewNotes" 
                                            rows={3} 
                                            value={reviewNotes}
                                            onChange={(e) => setReviewNotes(e.target.value)}
                                            placeholder="Agrega comentarios, sugerencias o razones para la decisión..."
                                        ></textarea>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowReviewModal(false)}>
                                    {selectedReport.status === 'pending_review' ? 'Cancelar' : 'Cerrar'}
                                </button>
                                
                                {selectedReport.status === 'pending_review' && (
                                    <>
                                        <button type="button" className="btn btn-warning" onClick={() => confirmReview('needs_correction')}>
                                            <i className="bi bi-exclamation-triangle me-1"></i>
                                            Necesita Corrección
                                        </button>
                                        <button type="button" className="btn btn-danger" onClick={() => confirmReview('reject')}>
                                            <i className="bi bi-x-circle me-1"></i>
                                            Rechazar
                                        </button>
                                        <button type="button" className="btn btn-success" onClick={() => confirmReview('approve')}>
                                            <i className="bi bi-check-circle me-1"></i>
                                            Aprobar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportReview;