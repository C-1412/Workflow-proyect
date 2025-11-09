import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { taskAPI } from '../services/task';
import type { Statistics as StatisticsData } from '../services/task';
import Swal from 'sweetalert2';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'info' | 'danger';
  border: string;
}

interface TopUser {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  profile: {
    role: string;
    tasks_completed: number;
    tasks_rejected: number;
  };
}

interface UserListProps {
  users: TopUser[];
  type: 'completers' | 'rejecters';
  title: string;
  icon: string;
}

const STAT_CARDS_CONFIG: Omit<StatCardProps, 'value'>[] = [
  {
    title: 'Total Tareas',
    icon: 'bi-list-task',
    color: 'primary',
    border: 'border-left-primary',
  },
  {
    title: 'Tareas Completadas',
    icon: 'bi-check-circle',
    color: 'success',
    border: 'border-left-success',
  },
  {
    title: 'Tareas Pendientes',
    icon: 'bi-clock',
    color: 'warning',
    border: 'border-left-warning',
  },
  {
    title: 'Tasa de Completación',
    icon: 'bi-graph-up',
    color: 'info',
    border: 'border-left-info',
  },
];

const ALERT_CONFIG = {
  error: {
    icon: 'error' as const,
    title: 'Error',
    text: 'No se pudieron cargar las estadísticas.',
    background: 'var(--surface-color)',
    color: 'var(--text-primary)',
  },
};

const Statistics: React.FC = () => {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadStatistics = useCallback(async (): Promise<void> => {
    const loadingState = isLoading ? setIsLoading : setIsRefreshing;
    
    try {
      loadingState(true);
      const stats = await taskAPI.getStatistics();
      setStatistics(stats);
    } catch (error) {
      await Swal.fire(ALERT_CONFIG.error);
    } finally {
      loadingState(false);
    }
  }, [isLoading]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const statCardsData = useMemo((): StatCardProps[] => {
    if (!statistics) return [];

    const values = [
      statistics.general.total_tasks.toString(),
      statistics.general.completed_tasks.toString(),
      statistics.general.pending_tasks.toString(),
      `${statistics.general.completion_rate.toFixed(1)}%`,
    ];

    return STAT_CARDS_CONFIG.map((config, index) => ({
      ...config,
      value: values[index],
    }));
  }, [statistics]);

  const totalActiveWorkers = useMemo((): number => {
    if (!statistics) return 0;
    
    const workerIds = new Set([
      ...statistics.top_completers.map(user => user.id),
      ...statistics.top_rejecters.map(user => user.id),
    ]);
    
    return workerIds.size;
  }, [statistics]);

  const averageTasksPerWorker = useMemo((): number => {
    if (!statistics || totalActiveWorkers === 0) return 0;
    return statistics.general.total_tasks / totalActiveWorkers;
  }, [statistics, totalActiveWorkers]);

  const efficiencyBadgeClass = useMemo((): string => {
    if (!statistics) return 'bg-secondary';
    
    const { completion_rate } = statistics.general;
    return completion_rate >= 80 ? 'bg-success' :
           completion_rate >= 60 ? 'bg-warning text-dark' : 'bg-danger';
  }, [statistics]);

  const LoadingSpinner: React.FC = () => (
    <div 
      className="d-flex justify-content-center align-items-center" 
      style={{ height: '200px' }}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Cargando estadísticas...</span>
      </div>
    </div>
  );

  const ErrorState: React.FC = () => (
    <div 
      className="alert alert-danger" 
      role="alert"
      aria-live="polite"
    >
      <i className="bi bi-exclamation-triangle-fill me-2"></i>
      No se pudieron cargar las estadísticas.
    </div>
  );

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, border }) => (
    <div className="col-xl-3 col-md-6 mb-4">
      <div className={`card stats-card h-100 ${border}`}>
        <div className="card-body">
          <div className="row no-gutters align-items-center">
            <div className="col mr-2">
              <div className={`text-xs font-weight-bold text-uppercase mb-1 text-${color}`}>
                {title}
              </div>
              <div className={`h5 mb-0 font-weight-bold text-${color}`}>
                {value}
              </div>
            </div>
            <div className="col-auto">
              <i 
                className={`bi ${icon} fa-2x text-${color}`}
                aria-hidden="true"
              ></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const UserList: React.FC<UserListProps> = ({ users, type, title, icon }) => (
    <div className="col-lg-6">
      <div className="card shadow-custom mb-4">
        <div className="card-header">
          <h6 className="m-0 font-weight-bold text-primary">
            <i className={`${icon} me-2`} aria-hidden="true"></i>
            {title}
          </h6>
        </div>
        <div className="card-body">
          {users.length === 0 ? (
            <p 
              className="text-muted text-center py-3"
              aria-live="polite"
            >
              No hay datos disponibles.
            </p>
          ) : (
            <div 
              className="list-group list-group-flush"
              role="list"
              aria-label={`Lista de ${title.toLowerCase()}`}
            >
              {users.map((user, index) => (
                <div 
                  key={user.id} 
                  className="list-group-item d-flex justify-content-between align-items-center"
                  role="listitem"
                >
                  <div>
                    <span 
                      className="fw-bold text-primary me-2"
                      aria-label={`Posición ${index + 1}`}
                    >
                      #{index + 1}
                    </span>
                    {user.first_name} {user.last_name}
                    <small className="text-muted ms-2">({user.username})</small>
                    <br />
                    <small className="text-muted">
                      <i className="bi bi-shield me-1" aria-hidden="true"></i>
                      {user.profile.role}
                    </small>
                  </div>
                  <span 
                    className={`badge rounded-pill ${
                      type === 'completers' ? 'bg-success' : 'bg-danger'
                    }`}
                  >
                    {type === 'completers' 
                      ? `${user.profile.tasks_completed} tareas`
                      : `${user.profile.tasks_rejected} rechazos`
                    }
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const SystemSummary: React.FC = () => {
    if (!statistics) return null;

    return (
      <div className="col-12">
        <div className="card shadow-custom">
          <div className="card-header">
            <h6 className="m-0 font-weight-bold text-primary">
              <i className="bi bi-info-circle me-2" aria-hidden="true"></i>
              Resumen del Sistema
            </h6>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <p>
                  <strong>Tareas asignadas actualmente:</strong> {statistics.general.assigned_tasks}
                </p>
                <p>
                  <strong>Tasa de eficiencia:</strong>
                  <span className={`badge ms-2 ${efficiencyBadgeClass}`}>
                    {statistics.general.completion_rate.toFixed(1)}%
                  </span>
                </p>
              </div>
              <div className="col-md-6">
                <p>
                  <strong>Total trabajadores activos:</strong> {totalActiveWorkers}
                </p>
                <p>
                  <strong>Promedio de tareas por trabajador:</strong> 
                  {averageTasksPerWorker.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!statistics) {
    return <ErrorState />;
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-4 mb-4 border-bottom">
        <div>
          <h1 className="h2 text-gradient mb-1">Estadísticas del Sistema</h1>
          <p className="text-muted mb-0">
            Métricas y análisis del rendimiento del sistema
          </p>
        </div>
        <button 
          className="btn btn-outline-primary btn-sm" 
          onClick={() => loadStatistics()}
          disabled={isRefreshing}
          aria-label="Actualizar estadísticas"
        >
          <i 
            className={`bi bi-arrow-clockwise me-1 ${isRefreshing ? 'spinning' : ''}`}
            aria-hidden="true"
          ></i>
          {isRefreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        {statCardsData.map((stat, index) => (
          <StatCard
            key={`${stat.title}-${index}`}
            {...stat}
          />
        ))}
      </div>

      {/* Top Users */}
      <div className="row">
        <UserList
          users={statistics.top_completers}
          type="completers"
          title="Top 5 - Más Tareas Completadas"
          icon="bi-trophy"
        />
        <UserList
          users={statistics.top_rejecters}
          type="rejecters"
          title="Top 5 - Más Tareas Rechazadas"
          icon="bi-exclamation-triangle"
        />
      </div>

      {/* System Summary */}
      <div className="row mt-4">
        <SystemSummary />
      </div>
    </div>
  );
};

export default Statistics;