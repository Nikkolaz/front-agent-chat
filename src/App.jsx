
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Cargar from './pages/Cargar';
import ReporteDetail from './pages/ReporteDetail';
import ChatSesion from './pages/ChatSesion';
import Login from './pages/Login';
import Configuracion from './components/Configuracion';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Mantener el backend vivo enviando un pulso cada 5 segundos
    const interval = setInterval(() => {
      fetch(`/api/heartbeat`, { method: 'POST' }).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="cargar" element={<Cargar />} />
          <Route path="reportes/:id" element={<ReporteDetail />} />
          <Route path="sesion/:id" element={<ChatSesion />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
