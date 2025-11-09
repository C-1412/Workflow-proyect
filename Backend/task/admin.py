from django.contrib import admin
from .models import Task, TaskAssignment, TaskReport, Notification

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'difficulty', 'status', 'created_by', 'assigned_to', 'created_at')
    list_filter = ('difficulty', 'status', 'created_at')
    search_fields = ('title', 'description')
    readonly_fields = ('created_at', 'assigned_at', 'completed_at')

@admin.register(TaskAssignment)
class TaskAssignmentAdmin(admin.ModelAdmin):
    list_display = ('task', 'assigned_to', 'status', 'assigned_at', 'completed_at')
    list_filter = ('status', 'assigned_at')
    search_fields = ('task__title', 'assigned_to__username')
    readonly_fields = ('assigned_at', 'rejected_at', 'started_at', 'completed_at', 'approved_at')

@admin.register(TaskReport)
class TaskReportAdmin(admin.ModelAdmin):
    list_display = ('task_assignment', 'status', 'submitted_at', 'reviewed_at')
    list_filter = ('status', 'submitted_at')
    search_fields = ('task_assignment__task__title', 'report_text')
    readonly_fields = ('submitted_at', 'reviewed_at')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'notification_type', 'title', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('user__username', 'title', 'message')
    readonly_fields = ('created_at',)