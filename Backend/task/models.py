from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Task(models.Model):
    DIFFICULTY_LEVELS = (
        ('adiestrado', 'Adiestrado'),
        ('regular', 'Regular'),
        ('especialista', 'Especialista'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pendiente de Asignación'),
        ('assigned', 'Asignada'),
        ('in_progress', 'En Progreso'),
        ('completed', 'Completada'),
        ('rejected', 'Rechazada'),
        ('cancelled', 'Cancelada'),
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_LEVELS)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Relaciones
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='assigned_tasks')
    
    # Fechas
    created_at = models.DateTimeField(auto_now_add=True)
    assigned_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    deadline = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    estimated_hours = models.PositiveIntegerField(default=1)
    priority = models.PositiveIntegerField(default=1)  # 1-5, donde 5 es más prioritario
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Tarea'
        verbose_name_plural = 'Tareas'
    
    def __str__(self):
        return f"{self.title} - {self.get_difficulty_display()}"

class TaskAssignment(models.Model):
    ASSIGNMENT_STATUS = (
        ('assigned', 'Asignada'),
        ('rejected', 'Rechazada'),
        ('in_progress', 'En Progreso'),
        ('completed', 'Completada'),
        ('approved', 'Aprobada'),
    )
    
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='assignments')
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_assignments')
    assigned_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_assignments')
    
    status = models.CharField(max_length=20, choices=ASSIGNMENT_STATUS, default='assigned')
    assigned_at = models.DateTimeField(auto_now_add=True)
    rejected_at = models.DateTimeField(null=True, blank=True)
    rejected_reason = models.TextField(blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='approved_assignments')
    
    class Meta:
        ordering = ['-assigned_at']
        unique_together = ['task', 'assigned_to']
    
    def __str__(self):
        return f"{self.task.title} - {self.assigned_to.username}"

class TaskReport(models.Model):
    REPORT_STATUS = (
        ('pending_review', 'Pendiente de Revisión'),
        ('approved', 'Aprobado'),
        ('rejected', 'Rechazado'),
        ('needs_correction', 'Requiere Corrección'),
    )
    
    task_assignment = models.OneToOneField(TaskAssignment, on_delete=models.CASCADE, 
                                          related_name='report')
    report_text = models.TextField()
    hours_worked = models.PositiveIntegerField()
    challenges_faced = models.TextField(blank=True)
    solutions_applied = models.TextField(blank=True)
    
    status = models.CharField(max_length=20, choices=REPORT_STATUS, default='pending_review')
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='reviewed_reports')
    review_notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-submitted_at']
    
    def __str__(self):
        return f"Reporte - {self.task_assignment.task.title}"

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('task_assigned', 'Tarea Asignada'),
        ('task_rejected', 'Tarea Rechazada'),
        ('task_completed', 'Tarea Completada'),
        ('report_submitted', 'Reporte Enviado'),
        ('task_approved', 'Tarea Aprobada'),
        ('system_message', 'Mensaje del Sistema'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    related_task = models.ForeignKey(Task, on_delete=models.CASCADE, null=True, blank=True)
    
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_notification_type_display()} - {self.user.username}"