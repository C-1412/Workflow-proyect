from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Task, TaskAssignment, TaskReport, Notification

class UserBasicSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email', 'profile')
    
    def get_profile(self, obj):
        return {
            'role': obj.userprofile.role,
            'tasks_completed': obj.userprofile.tasks_completed,
            'tasks_rejected': obj.userprofile.tasks_rejected,
            'current_task_count': obj.userprofile.current_task_count,
            'can_accept_more_tasks': obj.userprofile.can_accept_more_tasks
        }

class TaskSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    current_assignment = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'assigned_at')
    
    def get_current_assignment(self, obj):
        current_assignment = obj.assignments.filter(
            status__in=['assigned', 'in_progress', 'completed']
        ).first()
        if current_assignment:
            return TaskAssignmentSerializer(current_assignment).data
        return None

class TaskAssignmentSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    task_difficulty = serializers.CharField(source='task.difficulty', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    
    class Meta:
        model = TaskAssignment
        fields = '__all__'
        read_only_fields = ('assigned_by', 'assigned_at')

class TaskReportSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task_assignment.task.title', read_only=True)
    assigned_to_name = serializers.CharField(source='task_assignment.assigned_to.get_full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    
    class Meta:
        model = TaskReport
        fields = '__all__'
        read_only_fields = ('submitted_at', 'reviewed_at')

class NotificationSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='related_task.title', read_only=True)
    
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('created_at',)

class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('title', 'description', 'difficulty', 'deadline', 'estimated_hours', 'priority')
    
    def validate_difficulty(self, value):
        valid_difficulties = ['adiestrado', 'regular', 'especialista']
        if value not in valid_difficulties:
            raise serializers.ValidationError('Nivel de dificultad no válido')
        return value

class TaskRejectionSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=500)

class TaskCompletionSerializer(serializers.Serializer):
    report_text = serializers.CharField()
    hours_worked = serializers.IntegerField(min_value=1)
    challenges_faced = serializers.CharField(required=False, allow_blank=True)
    solutions_applied = serializers.CharField(required=False, allow_blank=True)