import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductosPage from './pages/Productos/ProductosPage';
import VentasPage from './pages/Ventas/VentasPage';
import DeudoresPage from './pages/Deudores/DeudoresPage';  // ← Agregar

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
        />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />}
        />
        <Route
          path="/productos"
          element={isAuthenticated ? <ProductosPage /> : <Navigate to="/" />}
        />
        <Route
          path="/ventas"
          element={isAuthenticated ? <VentasPage /> : <Navigate to="/" />}
        />
        <Route
          path="/deudores"
          element={isAuthenticated ? <DeudoresPage /> : <Navigate to="/" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;