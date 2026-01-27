import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TestAPI from './pages/TestAPI';
import TestTailwind from './pages/TestTailwind';
import ProductosPage from "./pages/Productos/ProductosPage";
import VentasPage from "./pages/Ventas/VentasPage";
import DeudoresPage from "./pages/Deudores/DeudoresPage";
import ReportesPage from "./pages/Reportes/ReportesPage";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Ruta pública - Login */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/productos" 
            element={
              <PrivateRoute>
                <ProductosPage />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/ventas" 
            element={
              <PrivateRoute>
                <VentasPage />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/deudores" 
            element={
              <PrivateRoute>
                <DeudoresPage />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/reportes" 
            element={
              <PrivateRoute>
                <ReportesPage />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/test-api" 
            element={
              <PrivateRoute>
                <TestAPI />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/test-tailwind" 
            element={
              <PrivateRoute>
                <TestTailwind />
              </PrivateRoute>
            } 
          />
          
          {/* Redirecciones */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;