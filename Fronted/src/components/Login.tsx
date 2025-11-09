import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

interface LoginForm {
  username: string;
  password: string;
}

interface ApiError {
  response?: {
    data?: {
      detail?: string;
      username?: string[];
      password?: string[];
      non_field_errors?: string[];
    };
  };
  message?: string;
}

const SUCCESS_ALERT_CONFIG = {
  icon: 'success' as const,
  title: '¡Éxito!',
  text: 'Login exitoso',
  timer: 2000,
  showConfirmButton: false,
  background: 'var(--surface-color)',
  color: 'var(--text-primary)',
};

const getErrorAlertConfig = (message: string) => ({
  icon: 'error' as const,
  title: 'Error',
  text: message,
  background: 'var(--surface-color)',
  color: 'var(--text-primary)',
});

const extractErrorMessage = (error: ApiError): string => {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.response?.data?.username?.[0]) {
    return error.response.data.username[0];
  }
  if (error.response?.data?.password?.[0]) {
    return error.response.data.password[0];
  }
  if (error.response?.data?.non_field_errors?.[0]) {
    return error.response.data.non_field_errors[0];
  }
  if (error.message === 'Network Error') {
    return 'Error de conexión con el servidor';
  }
  
  return 'Error en el login';
};

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginForm>({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { login } = useAuth();

  const handleInputChange = useCallback((field: keyof LoginForm) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
    }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      await Swal.fire(getErrorAlertConfig('Por favor, completa todos los campos'));
      return;
    }

    setIsLoading(true);

    try {
      await login(formData);
      await Swal.fire(SUCCESS_ALERT_CONFIG);
    } catch (error) {
      const errorMessage = extractErrorMessage(error as ApiError);
      await Swal.fire(getErrorAlertConfig(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [formData, login]);

  const isFormValid = formData.username.trim() && formData.password.trim();

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="card-body">
          <div className="text-center mb-4">
            <h3 className="login-title">
              <i className="bi bi-diagram-3-fill me-2" aria-hidden="true"></i>
              Flujo de Trabajo
            </h3>
            <p className="text-muted mb-0">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="username" className="form-label">
                <i className="bi bi-person me-1" aria-hidden="true"></i>
                Usuario
              </label>
              <input
                type="text"
                className="form-control"
                id="username"
                value={formData.username}
                onChange={handleInputChange('username')}
                required
                disabled={isLoading}
                placeholder="Ingresa tu usuario"
                autoComplete="username"
                aria-describedby="usernameHelp"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label">
                <i className="bi bi-lock me-1" aria-hidden="true"></i>
                Contraseña
              </label>
              <input
                type="password"
                className="form-control"
                id="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                required
                disabled={isLoading}
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
                aria-describedby="passwordHelp"
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-100 py-2"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <>
                  <span 
                    className="spinner-border spinner-border-sm me-2" 
                    role="status"
                    aria-hidden="true"
                  />
                  Accediendo...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2" aria-hidden="true"></i>
                  Acceder al Sistema
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <small className="text-muted">
              © 2026 Flujo de Trabajo - Sistema de Gestión
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;