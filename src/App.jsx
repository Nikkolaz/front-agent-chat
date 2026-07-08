
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Cargar from './pages/Cargar';
import ReporteDetail from './pages/ReporteDetail';
import ChatSesion from './pages/ChatSesion';
import Login from './pages/Login';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

function App() {
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
