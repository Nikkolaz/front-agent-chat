import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Cargar from './pages/Cargar';
import ReporteDetail from './pages/ReporteDetail';
import ChatSesion from './pages/ChatSesion';
import Login from './pages/Login';
import Configuracion from './components/Configuracion';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.role !== 'superadmin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  useEffect(() => {
    // Mantener el backend vivo enviando un pulso cada 5 segundos
    const interval = setInterval(() => {
      fetch('/api/heartbeat', { method: 'POST' }).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="cargar" element={<Cargar />} />
          <Route path="reportes/:id" element={<ReporteDetail />} />
          <Route path="sesion/:id" element={<ChatSesion />} />
          <Route
            path="configuracion"
            element={
              <AdminRoute>
                <Configuracion />
              </AdminRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
