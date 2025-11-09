from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    # Roles actualizados para coincidir con dificultades de tareas
    ROLE_CHOICES = (
        ('adiestrado', 'Adiestrado'),
        ('regular', 'Regular'),
        ('especialista', 'Especialista'),
        ('admin', 'Administrador'),
        ('superuser', 'Super Usuario'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='userprofile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='adiestrado')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Contadores para estadísticas
    tasks_assigned = models.PositiveIntegerField(default=0)
    tasks_completed = models.PositiveIntegerField(default=0)
    tasks_rejected = models.PositiveIntegerField(default=0)
    
    # Estado del trabajador
    is_active_worker = models.BooleanField(default=True)
    max_tasks = models.PositiveIntegerField(default=5)  # Límite de tareas simultáneas

    def __str__(self):
        return f"{self.user.username} - {self.role}"
    
    @property
    def current_task_count(self):
        from task.models import TaskAssignment
        return TaskAssignment.objects.filter(
            assigned_to=self.user, 
            status__in=['assigned', 'in_progress']
        ).count()
    
    @property
    def can_accept_more_tasks(self):
        return self.current_task_count < self.max_tasks and self.is_active_worker

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        # Asignar rol por defecto basado en si es staff o no
        default_role = 'admin' if instance.is_staff else 'adiestrado'
        UserProfile.objects.create(user=instance, role=default_role)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'userprofile'):
        instance.userprofile.save()
    else:
        default_role = 'admin' if instance.is_staff else 'adiestrado'
        UserProfile.objects.create(user=instance, role=default_role)