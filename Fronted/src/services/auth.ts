export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    profile: {
        role: 'adiestrado' | 'regular' | 'especialista' | 'admin' | 'superuser';
        created_at: string;
        updated_at: string;
        tasks_assigned: number;
        tasks_completed: number;
        tasks_rejected: number;
        is_active_worker: boolean;
        max_tasks: number;
        current_task_count: number;
        can_accept_more_tasks: boolean;
    };
}

export interface LoginData {
    username: string;
    password: string;
}

export interface AuthResponse {
    access: string;
    refresh: string;
    user: User;
}

export interface CreateUserData {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
}

export interface UpdateUserData {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    is_active_worker?: boolean;
    max_tasks?: number;
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

export const authAPI = {
    login: async (loginData: LoginData): Promise<AuthResponse> => {
        const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw errorData;
        }
        return response.json();
    },

    getCurrentUser: async (): Promise<User> => {
        return api.get('/api/auth/me/');
    },

    getUsers: async (): Promise<User[]> => {
        return api.get('/api/auth/users/');
    },

    createUser: async (userData: CreateUserData): Promise<User> => {
        return api.post('/api/auth/users/create/', userData);
    },

    updateUser: async (userId: number, userData: UpdateUserData): Promise<User> => {
        return api.put(`/api/auth/users/update/${userId}/`, userData);
    },

    deleteUser: async (userId: number): Promise<void> => {
        return api.delete(`/api/auth/users/delete/${userId}/`);
    },
};