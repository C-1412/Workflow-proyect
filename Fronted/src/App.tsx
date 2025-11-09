import './App.css'
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import TaskManagement from './components/TaskManagement';
import TaskList from './components/TaskList';
import ReportReview from './components/ReportReview';
import Statistics from './components/Statistics';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

const MainLayout: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <Dashboard />;
            case 'users':
                return <UserManagement />;
            case 'tasks':
                return <TaskList />;
            case 'task-management':
                return <TaskManagement />;
            case 'reports':
                return <ReportReview />;
            case 'statistics':
                return <Statistics />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="app-container">
            <Header />
            <div className="main-wrapper">
                <Sidebar 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab}
                    isCollapsed={isSidebarCollapsed}
                    onToggle={toggleSidebar}
                />
                <main className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                    <div className="container-fluid py-4">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-dark">
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status" >
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <h5 className="text-white">Cargando sistema...</h5>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Login />;
    }

    return <MainLayout />;
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;