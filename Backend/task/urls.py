from django.urls import path
from .views import (
    TaskListView, TaskCreateView, TaskDetailView, TaskRejectView, TaskCompleteView,
    ReportReviewView, NotificationListView, StatisticsView, TaskUpdateView, 
    TaskDeleteView
)

urlpatterns = [
    # Tareas
    path('', TaskListView.as_view(), name='task-list'),
    path('create/', TaskCreateView.as_view(), name='task-create'),
    path('<int:task_id>/', TaskDetailView.as_view(), name='task-detail'),
    path('<int:task_id>/update/', TaskUpdateView.as_view(), name='task-update'),
    path('<int:task_id>/delete/', TaskDeleteView.as_view(), name='task-delete'),
    path('<int:task_id>/reject/', TaskRejectView.as_view(), name='task-reject'),
    path('<int:task_id>/complete/', TaskCompleteView.as_view(), name='task-complete'),
    
    # Reportes
    path('reports/', ReportReviewView.as_view(), name='report-list'),
    path('reports/<int:report_id>/review/', ReportReviewView.as_view(), name='report-review'),
    
    # Notificaciones
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    
    # Estadísticas
    path('statistics/', StatisticsView.as_view(), name='statistics'),
]