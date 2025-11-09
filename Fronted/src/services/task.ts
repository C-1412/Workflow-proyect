export interface Task {
    id: number;
    title: string;
    description: string;
    difficulty: 'adiestrado' | 'regular' | 'especialista';
    status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
    created_by: number;
    assigned_to: number | null;
    created_at: string;
    assigned_at: string | null;
    completed_at: string | null;
    deadline: string | null;
    estimated_hours: number;
    priority: number;
    created_by_name?: string;
    assigned_to_name?: string;
    current_assignment?: TaskAssignment;
}

export interface TaskAssignment {
    id: number;
    task: number;
    assigned_to: number;
    assigned_by: number;
    status: 'assigned' | 'rejected' | 'in_progress' | 'completed' | 'approved';
    assigned_at: string;
    rejected_at: string | null;
    rejected_reason: string | null;
    started_at: string | null;
    completed_at: string | null;
    approved_at: string | null;
    approved_by: number | null;
    task_title?: string;
    task_difficulty?: string;
    assigned_to_name?: string;
    assigned_by_name?: string;
    approved_by_name?: string;
}

export interface TaskReport {
    id: number;
    task_assignment: number;
    report_text: string;
    hours_worked: number;
    challenges_faced: string;
    solutions_applied: string;
    status: 'pending_review' | 'approved' | 'rejected' | 'needs_correction';
    submitted_at: string;
    reviewed_at: string | null;
    reviewed_by: number | null;
    review_notes: string;
    task_title?: string;
    assigned_to_name?: string;
    reviewed_by_name?: string;
}

export interface Notification {
    id: number;
    user: number;
    notification_type: 'task_assigned' | 'task_rejected' | 'task_completed' | 'report_submitted' | 'task_approved' | 'system_message';
    title: string;
    message: string;
    related_task: number | null;
    is_read: boolean;
    created_at: string;
    task_title?: string;
}

export interface CreateTaskData {
    title: string;
    description: string;
    difficulty: 'adiestrado' | 'regular' | 'especialista';
    deadline?: string | null;
    estimated_hours: number;
    priority: number;
}

export interface TaskRejectionData {
    reason: string;
}

export interface TaskCompletionData {
    report_text: string;
    hours_worked: number;
    challenges_faced?: string;
    solutions_applied?: string;
}

export interface Statistics {
    general: {
        total_tasks: number;
        completed_tasks: number;
        pending_tasks: number;
        assigned_tasks: number;
        completion_rate: number;
    };
    top_completers: Array<{
        id: number;
        username: string;
        first_name: string;
        last_name: string;
        email: string;
        profile: {
            role: string;
            tasks_completed: number;
            tasks_rejected: number;
            current_task_count: number;
            can_accept_more_tasks: boolean;
        };
    }>;
    top_rejecters: Array<{
        id: number;
        username: string;
        first_name: string;
        last_name: string;
        email: string;
        profile: {
            role: string;
            tasks_completed: number;
            tasks_rejected: number;
            current_task_count: number;
            can_accept_more_tasks: boolean;
        };
    }>;
}

const API_BASE_URL = 'http://localhost:8000';

const api = {
    get: async (url: string) => {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}${url}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    post: async (url: string, data?: any) => {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: data ? JSON.stringify(data) : undefined,
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    put: async (url: string, data: any) => {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    delete: async (url: string) => {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        if (response.status !== 204) {
            return response.json();
        }
    },
};

export const taskAPI = {
    getTasks: async (): Promise<Task[]> => {
        return api.get('/api/tasks/');
    },

    createTask: async (taskData: CreateTaskData): Promise<{message: string, task: Task}> => {
        return api.post('/api/tasks/create/', taskData);
    },

    getTask: async (taskId: number): Promise<Task> => {
        return api.get(`/api/tasks/${taskId}/`);
    },

    updateTask: async (taskId: number, taskData: Partial<CreateTaskData>): Promise<{message: string, task: Task}> => {
        return api.put(`/api/tasks/${taskId}/update/`, taskData);
    },
    deleteTask: async (taskId: number): Promise<{message: string}> => {
        return api.delete(`/api/tasks/${taskId}/delete/`);
    },

    rejectTask: async (taskId: number, rejectionData: TaskRejectionData): Promise<void> => {
        return api.post(`/api/tasks/${taskId}/reject/`, rejectionData);
    },

    completeTask: async (taskId: number, completionData: TaskCompletionData): Promise<{message: string, report: TaskReport}> => {
        return api.post(`/api/tasks/${taskId}/complete/`, completionData);
    },

    getReports: async (status?: string): Promise<TaskReport[]> => {
        const url = status ? `/api/tasks/reports/?status=${status}` : '/api/tasks/reports/';
        return api.get(url);
    },

    reviewReport: async (reportId: number, action: 'approve' | 'reject' | 'needs_correction', reviewNotes?: string): Promise<void> => {
        return api.post(`/api/tasks/reports/${reportId}/review/`, { action, review_notes: reviewNotes });
    },

    getNotifications: async (): Promise<{ notifications: Notification[]; unread_count: number }> => {
        return api.get('/api/tasks/notifications/');
    },

    markNotificationsAsRead: async (notificationIds: number[]): Promise<void> => {
        return api.post('/api/tasks/notifications/', { notification_ids: notificationIds });
    },

    getStatistics: async (): Promise<Statistics> => {
        return api.get('/api/tasks/statistics/');
    },
};