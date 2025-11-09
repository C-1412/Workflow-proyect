import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const Login: React.FC = () => {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await login({ username, password });
            await Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'Login exitoso',
                timer: 2000,
                showConfirmButton: false,
                background: 'var(--surface-color)',
                color: 'var(--text-primary)'
            });
        } catch (error: any) {
            let errorMessage = 'Error en el login';
            
            if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            } else if (error.response?.data?.username) {
                errorMessage = error.response.data.username[0];
            } else if (error.response?.data?.password) {
                errorMessage = error.response.data.password[0];
            } else if (error.response?.data?.non_field_errors) {
                errorMessage = error.response.data.non_field_errors[0];
            } else if (error.message === 'Network Error') {
                errorMessage = 'Error de conexión con el servidor';
            }

            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
                background: 'var(--surface-color)',
                color: 'var(--text-primary)'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="card-body">
                    <h3 className="login-title">
                        <i className="bi bi-diagram-3-fill me-2"></i>
                        Flujo de Trabajo
                    </h3>
                    <p className="text-center text-muted mb-4">
                        Ingresa tus credenciales para continuar
                    </p>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="username" className="form-label">
                                <i className="bi bi-person me-1"></i>
                                Usuario
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={loading}
                                placeholder="Ingresa tu usuario"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="password" className="form-label">
                                <i className="bi bi-lock me-1"></i>
                                Contraseña
                            </label>
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                placeholder="Ingresa tu contraseña"
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="btn btn-primary w-100 py-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    Accediendo...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-box-arrow-in-right me-2"></i>
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