from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, F
from django.utils import timezone
from django.contrib.auth.models import User
from .models import Task, TaskAssignment, TaskReport, Notification
from .serializers import (
    TaskSerializer, TaskAssignmentSerializer, TaskReportSerializer,
    NotificationSerializer, TaskCreateSerializer, TaskRejectionSerializer,
    TaskCompletionSerializer, UserBasicSerializer
)
from login.models import UserProfile

class TaskListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_profile = request.user.userprofile
        
        if user_profile.role in ['admin', 'superuser']:
            # Administradores ven todas las tareas
            tasks = Task.objects.all()
        else:
            # Trabajadores ven solo sus tareas asignadas
            tasks = Task.objects.filter(
                Q(assigned_to=request.user) | 
                Q(assignments__assigned_to=request.user)
            ).distinct()
        
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

class TaskCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_profile = request.user.userprofile
        
        # Solo administradores pueden crear tareas
        if user_profile.role not in ['admin', 'superuser']:
            return Response(
                {'error': 'No tienes permisos para crear tareas'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = TaskCreateSerializer(data=request.data)
        if serializer.is_valid():
            task = serializer.save(created_by=request.user)
            
            # Intentar asignar automáticamente la tarea
            assigned_user = self.assign_task_automatically(task)
            
            if assigned_user:
                task.assigned_to = assigned_user
                task.status = 'assigned'
                task.assigned_at = timezone.now()
                task.save()
                
                # Crear notificación
                Notification.objects.create(
                    user=assigned_user,
                    notification_type='task_assigned',
                    title='Nueva Tarea Asignada',
                    message=f'Se te ha asignado la tarea: {task.title}',
                    related_task=task
                )
                
                return Response(
                    {'message': 'Tarea creada y asignada automáticamente', 'task': TaskSerializer(task).data},
                    status=status.HTTP_201_CREATED
                )
            else:
                task.status = 'pending'
                task.save()
                return Response(
                    {'message': 'Tarea creada pero no se pudo asignar automáticamente', 'task': TaskSerializer(task).data},
                    status=status.HTTP_201_CREATED
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def assign_task_automatically(self, task):
        """Asigna automáticamente la tarea a un usuario disponible del nivel correspondiente"""
        # Buscar usuarios con el rol que coincide con la dificultad de la tarea
        users = User.objects.filter(
            userprofile__role=task.difficulty,
            userprofile__is_active_worker=True
        ).annotate(
            current_tasks=Count(
                'assigned_tasks', 
                filter=Q(assigned_tasks__status__in=['assigned', 'in_progress'])
            )
        ).filter(
            current_tasks__lt=F('userprofile__max_tasks')
        ).order_by('current_tasks', 'userprofile__tasks_rejected')
        
        for user in users:
            # Verificar manualmente que puede aceptar más tareas (doble verificación)
            profile = user.userprofile
            if profile.current_task_count < profile.max_tasks:
                # Crear la asignación
                assignment = TaskAssignment.objects.create(
                    task=task,
                    assigned_to=user,
                    assigned_by=task.created_by,
                    status='assigned'
                )
                
                # Actualizar contadores
                profile.tasks_assigned += 1
                profile.save()
                
                return user
        
        return None

class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return Response(
                {'error': 'Tarea no encontrada'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar permisos
        user_profile = request.user.userprofile
        if user_profile.role not in ['admin', 'superuser'] and task.assigned_to != request.user:
            return Response(
                {'error': 'No tienes permisos para ver esta tarea'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = TaskSerializer(task)
        return Response(serializer.data)

class TaskUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, task_id):
        user_profile = request.user.userprofile
        
        # Solo administradores pueden editar tareas
        if user_profile.role not in ['admin', 'superuser']:
            return Response(
                {'error': 'No tienes permisos para editar tareas'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return Response(
                {'error': 'Tarea no encontrada'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = TaskCreateSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            updated_task = serializer.save()
            
            # Si se cambió la dificultad o se reasignó manualmente, actualizar asignación
            if 'difficulty' in request.data or 'assigned_to' in request.data:
                # Cancelar asignaciones existentes
                TaskAssignment.objects.filter(
                    task=task, 
                    status__in=['assigned', 'in_progress']
                ).update(status='cancelled')
                
                # Si se asignó manualmente a un usuario
                if 'assigned_to' in request.data and request.data['assigned_to']:
                    assigned_to_id = request.data['assigned_to']
                    try:
                        assigned_user = User.objects.get(id=assigned_to_id)
                        
                        # Verificar que el usuario puede aceptar la tarea
                        if (assigned_user.userprofile.role == updated_task.difficulty and 
                            assigned_user.userprofile.can_accept_more_tasks):
                            
                            # Crear nueva asignación
                            assignment = TaskAssignment.objects.create(
                                task=updated_task,
                                assigned_to=assigned_user,
                                assigned_by=request.user,
                                status='assigned'
                            )
                            
                            updated_task.assigned_to = assigned_user
                            updated_task.status = 'assigned'
                            updated_task.assigned_at = timezone.now()
                            updated_task.save()
                            
                            # Actualizar contadores
                            profile = assigned_user.userprofile
                            profile.tasks_assigned += 1
                            profile.save()
                            
                            # Notificar al usuario
                            Notification.objects.create(
                                user=assigned_user,
                                notification_type='task_assigned',
                                title='Tarea Reasignada',
                                message=f'Se te ha reasignado la tarea: {updated_task.title}',
                                related_task=updated_task
                            )
                            
                            return Response({
                                'message': 'Tarea actualizada y reasignada manualmente',
                                'task': TaskSerializer(updated_task).data
                            })
                        else:
                            return Response(
                                {'error': 'El usuario seleccionado no puede aceptar esta tarea'}, 
                                status=status.HTTP_400_BAD_REQUEST
                            )
                            
                    except User.DoesNotExist:
                        return Response(
                            {'error': 'Usuario asignado no encontrado'}, 
                            status=status.HTTP_404_NOT_FOUND
                        )
                else:
                    # Si no se asignó manualmente, intentar asignación automática
                    task_creator = TaskCreateView()
                    new_assignee = task_creator.assign_task_automatically(updated_task)
                    
                    if new_assignee:
                        return Response({
                            'message': 'Tarea actualizada y reasignada automáticamente',
                            'task': TaskSerializer(updated_task).data
                        })
                    else:
                        updated_task.status = 'pending'
                        updated_task.save()
                        return Response({
                            'message': 'Tarea actualizada pero no se pudo reasignar automáticamente',
                            'task': TaskSerializer(updated_task).data
                        })
            
            return Response({
                'message': 'Tarea actualizada correctamente',
                'task': TaskSerializer(updated_task).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TaskDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, task_id):
        user_profile = request.user.userprofile
        
        # Solo administradores pueden eliminar tareas
        if user_profile.role not in ['admin', 'superuser']:
            return Response(
                {'error': 'No tienes permisos para eliminar tareas'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return Response(
                {'error': 'Tarea no encontrada'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Guardar información para el mensaje
        task_title = task.title
        
        # Eliminar la tarea (esto eliminará en cascada las asignaciones y reportes)
        task.delete()
        
        return Response(
            {'message': f'Tarea "{task_title}" eliminada correctamente'}, 
            status=status.HTTP_200_OK
        )

class TaskRejectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id, assigned_to=request.user)
            assignment = TaskAssignment.objects.get(task=task, assigned_to=request.user, status='assigned')
        except (Task.DoesNotExist, TaskAssignment.DoesNotExist):
            return Response(
                {'error': 'Tarea no encontrada o no asignada'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = TaskRejectionSerializer(data=request.data)
        if serializer.is_valid():
            reason = serializer.validated_data['reason']
            
            # Rechazar la tarea
            assignment.status = 'rejected'
            assignment.rejected_at = timezone.now()
            assignment.rejected_reason = reason
            assignment.save()
            
            # Actualizar contadores del usuario
            profile = request.user.userprofile
            profile.tasks_rejected += 1
            profile.save()
            
            # Resetear la tarea para reasignación
            task.assigned_to = None
            task.status = 'pending'
            task.save()
            
            # Notificar al administrador
            Notification.objects.create(
                user=task.created_by,
                notification_type='task_rejected',
                title='Tarea Rechazada',
                message=f'{request.user.get_full_name()} rechazó la tarea: {task.title}. Razón: {reason}',
                related_task=task
            )
            
            # REASIGNAR INMEDIATAMENTE usando el mismo algoritmo
            new_assignee = self.assign_task_automatically(task)
            
            if new_assignee:
                # Actualizar la tarea con el nuevo asignado
                task.assigned_to = new_assignee
                task.status = 'assigned'
                task.assigned_at = timezone.now()
                task.save()
                
                # Notificar al nuevo usuario
                Notification.objects.create(
                    user=new_assignee,
                    notification_type='task_assigned',
                    title='Nueva Tarea Asignada',
                    message=f'Se te ha asignado la tarea: {task.title} (reasignada automáticamente)',
                    related_task=task
                )
                
                return Response(
                    {'message': 'Tarea rechazada y reasignada automáticamente a otro usuario'}, 
                    status=status.HTTP_200_OK
                )
            else:
                # Si no se pudo reasignar, dejar en estado pending
                return Response(
                    {'message': 'Tarea rechazada pero no se pudo reasignar automáticamente (no hay usuarios disponibles)'}, 
                    status=status.HTTP_200_OK
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def assign_task_automatically(self, task):
        """Mismo algoritmo de asignación automática que TaskCreateView"""
        # Buscar usuarios con el rol que coincide con la dificultad de la tarea
        users = User.objects.filter(
            userprofile__role=task.difficulty,
            userprofile__is_active_worker=True
        ).annotate(
            current_tasks=Count(
                'assigned_tasks', 
                filter=Q(assigned_tasks__status__in=['assigned', 'in_progress'])
            )
        ).filter(
            current_tasks__lt=F('userprofile__max_tasks')
        ).order_by('current_tasks', 'userprofile__tasks_rejected')
        
        for user in users:
            # Verificar manualmente que puede aceptar más tareas (doble verificación)
            profile = user.userprofile
            if profile.current_task_count < profile.max_tasks:
                # Crear la asignación
                assignment = TaskAssignment.objects.create(
                    task=task,
                    assigned_to=user,
                    assigned_by=task.created_by,  # Mantener al creador original
                    status='assigned'
                )
                
                # Actualizar contadores
                profile.tasks_assigned += 1
                profile.save()
                
                return user
        
        return None

class TaskCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id, assigned_to=request.user)
            assignment = TaskAssignment.objects.get(task=task, assigned_to=request.user, status='assigned')
        except (Task.DoesNotExist, TaskAssignment.DoesNotExist):
            return Response(
                {'error': 'Tarea no encontrada o no asignada'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = TaskCompletionSerializer(data=request.data)
        if serializer.is_valid():
            # Crear reporte
            report = TaskReport.objects.create(
                task_assignment=assignment,
                report_text=serializer.validated_data['report_text'],
                hours_worked=serializer.validated_data['hours_worked'],
                challenges_faced=serializer.validated_data.get('challenges_faced', ''),
                solutions_applied=serializer.validated_data.get('solutions_applied', '')
            )
            
            # Actualizar asignación
            assignment.status = 'completed'
            assignment.completed_at = timezone.now()
            assignment.save()
            
            # Actualizar tarea
            task.status = 'completed'
            task.completed_at = timezone.now()
            task.save()
            
            # Notificar al administrador
            Notification.objects.create(
                user=task.created_by,
                notification_type='report_submitted',
                title='Reporte de Tarea Enviado',
                message=f'{request.user.get_full_name()} completó la tarea: {task.title}',
                related_task=task
            )
            
            return Response(
                {'message': 'Tarea completada y reporte enviado para revisión', 'report': TaskReportSerializer(report).data},
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ReportReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_profile = request.user.userprofile
        
        if user_profile.role not in ['admin', 'superuser']:
            return Response(
                {'error': 'No tienes permisos para revisar reportes'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Obtener todos los reportes, no solo los pendientes
        status_filter = request.GET.get('status', 'pending_review')
        
        if status_filter == 'all':
            reports = TaskReport.objects.all()
        elif status_filter == 'approved':
            reports = TaskReport.objects.filter(status='approved')
        elif status_filter == 'rejected':
            reports = TaskReport.objects.filter(status='rejected')
        elif status_filter == 'needs_correction':
            reports = TaskReport.objects.filter(status='needs_correction')
        else:
            # Por defecto, mostrar pendientes
            reports = TaskReport.objects.filter(status='pending_review')
        
        serializer = TaskReportSerializer(reports, many=True)
        return Response(serializer.data)
    
    def post(self, request, report_id):
        user_profile = request.user.userprofile
        
        if user_profile.role not in ['admin', 'superuser']:
            return Response(
                {'error': 'No tienes permisos para aprobar reportes'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            report = TaskReport.objects.get(id=report_id)
        except TaskReport.DoesNotExist:
            return Response(
                {'error': 'Reporte no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        action = request.data.get('action')
        review_notes = request.data.get('review_notes', '')
        
        if action == 'approve':
            report.status = 'approved'
            report.reviewed_at = timezone.now()
            report.reviewed_by = request.user
            report.review_notes = review_notes
            report.save()
            
            # Actualizar asignación
            assignment = report.task_assignment
            assignment.status = 'approved'
            assignment.approved_at = timezone.now()
            assignment.approved_by = request.user
            assignment.save()
            
            # Actualizar contadores del usuario
            user_profile = assignment.assigned_to.userprofile
            user_profile.tasks_completed += 1
            user_profile.save()
            
            # Notificar al trabajador
            Notification.objects.create(
                user=assignment.assigned_to,
                notification_type='task_approved',
                title='Tarea Aprobada',
                message=f'Tu tarea "{assignment.task.title}" ha sido aprobada',
                related_task=assignment.task
            )
            
            return Response({'message': 'Reporte aprobado exitosamente'})
        
        elif action == 'reject':
            report.status = 'rejected'
            report.reviewed_at = timezone.now()
            report.reviewed_by = request.user
            report.review_notes = review_notes
            report.save()
            
            # Resetear la tarea para corrección
            assignment = report.task_assignment
            assignment.status = 'assigned'  # Volver a asignada para corrección
            assignment.save()
            
            task = assignment.task
            task.status = 'assigned'
            task.save()
            
            # Notificar al trabajador
            Notification.objects.create(
                user=assignment.assigned_to,
                notification_type='system_message',
                title='Tarea Requiere Corrección',
                message=f'Tu reporte para la tarea "{task.title}" requiere correcciones. Notas: {review_notes}',
                related_task=task
            )
            
            return Response({'message': 'Reporte rechazado, se requiere corrección'})
        
        elif action == 'needs_correction':
            report.status = 'needs_correction'
            report.reviewed_at = timezone.now()
            report.reviewed_by = request.user
            report.review_notes = review_notes
            report.save()
            
            return Response({'message': 'Reporte marcado como necesita corrección'})
        
        else:
            return Response(
                {'error': 'Acción no válida. Use "approve", "reject" o "needs_correction"'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
        unread_count = notifications.filter(is_read=False).count()
        
        serializer = NotificationSerializer(notifications, many=True)
        return Response({
            'notifications': serializer.data,
            'unread_count': unread_count
        })
    
    def post(self, request):
        # Marcar notificaciones como leídas
        notification_ids = request.data.get('notification_ids', [])
        if notification_ids:
            Notification.objects.filter(
                id__in=notification_ids, 
                user=request.user
            ).update(is_read=True)
        
        return Response({'message': 'Notificaciones marcadas como leídas'})

class StatisticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_profile = request.user.userprofile
        
        if user_profile.role not in ['admin', 'superuser']:
            return Response(
                {'error': 'No tienes permisos para ver estadísticas'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Estadísticas generales
        total_tasks = Task.objects.count()
        completed_tasks = Task.objects.filter(status='completed').count()
        pending_tasks = Task.objects.filter(status='pending').count()
        assigned_tasks = Task.objects.filter(status='assigned').count()
        
        # Usuarios con más tareas completadas
        top_completers = User.objects.annotate(
            completed_count=Count('assigned_tasks', filter=Q(assigned_tasks__status='approved'))
        ).order_by('-completed_count')[:5]
        
        # Usuarios con más tareas rechazadas
        top_rejecters = User.objects.annotate(
            rejected_count=Count('assigned_tasks', filter=Q(assigned_tasks__status='rejected'))
        ).order_by('-rejected_count')[:5]
        
        return Response({
            'general': {
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'pending_tasks': pending_tasks,
                'assigned_tasks': assigned_tasks,
                'completion_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            },
            'top_completers': UserBasicSerializer(top_completers, many=True).data,
            'top_rejecters': UserBasicSerializer(top_rejecters, many=True).data
        })