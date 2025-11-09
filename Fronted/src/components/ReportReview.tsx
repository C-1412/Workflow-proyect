import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { taskAPI } from '../services/task';
import type { TaskReport } from '../services/task';
import Swal from 'sweetalert2';

interface StatusConfig {
  class: string;
  text: string;
}

interface ReviewAction {
  action: 'approve' | 'reject' | 'needs_correction';
  label: string;
  buttonClass: string;
  icon: string;
  successMessage: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending_review: { class: 'bg-warning text-dark', text: 'Pendiente' },
  approved: { class: 'bg-success', text: 'Aprobado' },
  rejected: { class: 'bg-danger', text: 'Rechazado' },
  needs_correction: { class: 'bg-info', text: 'Requiere Corrección' },
};

const STATUS_DISPLAY_TEXT: Record<string, string> = {
  pending_review: 'Pendientes de Revisión',
  approved: 'Aprobados',
  rejected: 'Rechazados',
  needs_correction: 'Requieren Corrección',
  all: 'Todos los Reportes',
};

const REVIEW_ACTIONS: ReviewAction[] = [
  {
    action: 'needs_correction',
    label: 'Necesita Corrección',
    buttonClass: 'btn-warning',
    icon: 'bi-exclamation-triangle',
    successMessage: 'marcado como necesita corrección',
  },
  {
    action: 'reject',
    label: 'Rechazar',
    buttonClass: 'btn-danger',
    icon: 'bi-x-circle',
    successMessage: 'rechazado',
  },
  {
    action: 'approve',
    label: 'Aprobar',
    buttonClass: 'btn-success',
    icon: 'bi-check-circle',
    successMessage: 'aprobado',
  },
];

const FILTER_BUTTONS = [
  { key: 'pending_review', label: 'Pendientes', variant: 'primary' },
  { key: 'approved', label: 'Aprobados', variant: 'success' },
  { key: 'rejected', label: 'Rechazados', variant: 'danger' },
  { key: 'needs_correction', label: 'Corrección', variant: 'info' },
  { key: 'all', label: 'Todos', variant: 'secondary' },
] as const;

const ReportReview: React.FC = () => {
  const [reports, setReports] = useState<TaskReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedReport, setSelectedReport] = useState<TaskReport | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('pending_review');

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const loadReports = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const reportsData = await taskAPI.getReports(statusFilter);
      setReports(reportsData);
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los reportes.',
        background: 'var(--surface-color)',
        color: 'var(--text-primary)',
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  const handleReview = useCallback((report: TaskReport): void => {
    setSelectedReport(report);
    setReviewNotes('');
    setShowReviewModal(true);
  }, []);

  const closeModal = useCallback((): void => {
    setShowReviewModal(false);
    setSelectedReport(null);
    setReviewNotes('');
  }, []);

  const confirmReview = useCallback(async (action: 'approve' | 'reject' | 'needs_correction'): Promise<void> => {
    if (!selectedReport) return;

    try {
      await taskAPI.reviewReport(selectedReport.id, action, reviewNotes);
      
      const actionConfig = REVIEW_ACTIONS.find(a => a.action === action);
      await Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: `Reporte ${actionConfig?.successMessage || 'procesado'} correctamente.`,
        background: 'var(--surface-color)',
        color: 'var(--text-primary)',
      });
      
      closeModal();
      await loadReports();
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo procesar el reporte.',
        background: 'var(--surface-color)',
        color: 'var(--text-primary)',
      });
    }
  }, [selectedReport, reviewNotes, closeModal, loadReports]);

  const getStatusBadge = useCallback((status: string): JSX.Element => {
    const config = STATUS_CONFIG[status] || { class: 'bg-secondary', text: status };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  }, []);

  const formatDate = useCallback((dateString: string): string => 
    new Date(dateString).toLocaleDateString(),
  []);

  const isPendingReview = useMemo(() => 
    selectedReport?.status === 'pending_review',
    [selectedReport]
  );

  const filteredReports = useMemo(() => reports, [reports]);

  const LoadingSpinner: React.FC = () => (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Cargando...</span>
      </div>
    </div>
  );

  const EmptyState: React.FC = () => (
    <div className="col-12">
      <div className="card shadow-custom">
        <div className="card-body text-center py-5">
          <i className="bi bi-clipboard-check display-4 text-success mb-3"></i>
          <h5 className="text-success">
            ¡No hay reportes {STATUS_DISPLAY_TEXT[statusFilter]?.toLowerCase()}!
          </h5>
          <p className="text-muted">
            Todos los reportes han sido revisados o no hay reportes para mostrar.
          </p>
        </div>
      </div>
    </div>
  );

  const ReportCard: React.FC<{ report: TaskReport }> = ({ report }) => (
    <div className="col-12 mb-4">
      <div className="card shadow-custom">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">{report.task_title}</h5>
          <div>
            {getStatusBadge(report.status)}
            {report.reviewed_at && (
              <small className="text-muted ms-2">
                Revisado: {formatDate(report.reviewed_at)}
              </small>
            )}
          </div>
        </div>
        
        <div className="card-body">
          <ReportDetails report={report} />
        </div>
        
        <div className="card-footer">
          <ReportActions 
            report={report} 
            onReview={handleReview}
            getStatusBadge={getStatusBadge}
          />
        </div>
      </div>
    </div>
  );

  const ReportDetails: React.FC<{ report: TaskReport }> = ({ report }) => (
    <>
      <div className="row">
        <div className="col-md-6">
          <p><strong>Trabajador:</strong> <span className="text-primary">{report.assigned_to_name}</span></p>
          <p><strong>Horas trabajadas:</strong> <span className="text-info">{report.hours_worked}</span></p>
          <p><strong>Fecha de envío:</strong> {formatDate(report.submitted_at)}</p>
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
    </>
  );

  const ReportActions: React.FC<{ 
    report: TaskReport; 
    onReview: (report: TaskReport) => void;
    getStatusBadge: (status: string) => JSX.Element;
  }> = ({ report, onReview, getStatusBadge }) => {
    if (report.status === 'pending_review') {
      return (
        <button 
          className="btn btn-primary" 
          onClick={() => onReview(report)}
        >
          <i className="bi bi-eye me-1"></i>
          Revisar Reporte
        </button>
      );
    }

    return (
      <div className="d-flex justify-content-between align-items-center">
        <span className="text-muted">
          Estado: {getStatusBadge(report.status)}
        </span>
        <button 
          className="btn btn-outline-secondary" 
          onClick={() => onReview(report)}
        >
          <i className="bi bi-eye me-1"></i>
          Ver Detalles
        </button>
      </div>
    );
  };

  const ReviewModal: React.FC = () => {
    if (!showReviewModal || !selectedReport) return null;

    return (
      <div 
        className="modal fade show d-block" 
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} 
        tabIndex={-1}
        role="dialog"
        aria-labelledby="reviewModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="reviewModalLabel">
                {isPendingReview ? 'Revisar Reporte' : 'Ver Detalles del Reporte'}
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={closeModal}
                aria-label="Cerrar"
              ></button>
            </div>
            
            <div className="modal-body">
              <ModalContent 
                report={selectedReport} 
                reviewNotes={reviewNotes}
                onNotesChange={setReviewNotes}
                isPendingReview={isPendingReview}
                formatDate={formatDate}
              />
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={closeModal}
              >
                {isPendingReview ? 'Cancelar' : 'Cerrar'}
              </button>
              
              {isPendingReview && (
                <ReviewActionButtons onConfirmReview={confirmReview} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ModalContent: React.FC<{
    report: TaskReport;
    reviewNotes: string;
    onNotesChange: (notes: string) => void;
    isPendingReview: boolean;
    formatDate: (date: string) => string;
  }> = ({ report, reviewNotes, onNotesChange, isPendingReview, formatDate }) => (
    <>
      <div className="mb-4">
        <h6>Información del Reporte</h6>
        <div className="row">
          <div className="col-md-6">
            <p><strong>Tarea:</strong> {report.task_title}</p>
            <p><strong>Trabajador:</strong> {report.assigned_to_name}</p>
          </div>
          <div className="col-md-6">
            <p><strong>Horas trabajadas:</strong> {report.hours_worked}</p>
            <p><strong>Fecha:</strong> {formatDate(report.submitted_at)}</p>
            {report.reviewed_by_name && (
              <p><strong>Revisado por:</strong> {report.reviewed_by_name}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h6>Reporte de Trabajo</h6>
        <div className="bg-light p-3 rounded">
          <p className="mb-0">{report.report_text}</p>
        </div>
      </div>

      {report.challenges_faced && (
        <div className="mb-4">
          <h6>Desafíos Enfrentados</h6>
          <p className="text-muted">{report.challenges_faced}</p>
        </div>
      )}

      {report.solutions_applied && (
        <div className="mb-4">
          <h6>Soluciones Aplicadas</h6>
          <p className="text-muted">{report.solutions_applied}</p>
        </div>
      )}

      {report.review_notes && (
        <div className="mb-4">
          <h6>Notas de Revisión Anteriores</h6>
          <div className="bg-warning bg-opacity-10 p-3 rounded">
            <p className="mb-0">{report.review_notes}</p>
          </div>
        </div>
      )}

      {isPendingReview && (
        <div className="mb-3">
          <label htmlFor="reviewNotes" className="form-label">
            Notas de revisión
          </label>
          <textarea 
            className="form-control" 
            id="reviewNotes" 
            rows={3} 
            value={reviewNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Agrega comentarios, sugerencias o razones para la decisión..."
          ></textarea>
        </div>
      )}
    </>
  );

  const ReviewActionButtons: React.FC<{ onConfirmReview: (action: 'approve' | 'reject' | 'needs_correction') => void }> = 
    ({ onConfirmReview }) => (
      <>
        {REVIEW_ACTIONS.map((actionConfig) => (
          <button
            key={actionConfig.action}
            type="button"
            className={`btn ${actionConfig.buttonClass}`}
            onClick={() => onConfirmReview(actionConfig.action)}
          >
            <i className={`${actionConfig.icon} me-1`}></i>
            {actionConfig.label}
          </button>
        ))}
      </>
    );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-4 mb-4 border-bottom">
        <div>
          <h1 className="h2 text-gradient mb-1">Revisión de Reportes</h1>
          <p className="text-muted mb-0">
            Revisa y aprueba los reportes de tareas completadas
          </p>
        </div>
        <div className="btn-group">
          <button 
            className="btn btn-outline-primary btn-sm" 
            onClick={loadReports}
            disabled={isLoading}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            {isLoading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-custom">
            <div className="card-body">
              <h6 className="card-title mb-3">Filtrar por Estado</h6>
              <div className="btn-group" role="group" aria-label="Filtros de estado">
                {FILTER_BUTTONS.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    className={`btn ${statusFilter === filter.key ? `btn-${filter.variant}` : `btn-outline-${filter.variant}`}`}
                    onClick={() => setStatusFilter(filter.key)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="row">
        {filteredReports.length === 0 ? (
          <EmptyState />
        ) : (
          filteredReports.map(report => (
            <ReportCard key={report.id} report={report} />
          ))
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal />
    </div>
  );
};

export default ReportReview;