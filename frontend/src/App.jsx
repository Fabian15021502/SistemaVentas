import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TestAPI from "./pages/TestAPI";
import TestTailwind from "./pages/TestTailwind";
import ProductosPage from "./pages/Productos/ProductosPage";
import VentasPage from "./pages/Ventas/VentasPage";
import DeudoresPage from "./pages/Deudores/DeudoresPage";
import ReportesPage from "./pages/Reportes/ReportesPage";
import InventarioPage from "./pages/Inventario/InventarioPage"; // ✅ AGREGADO
import TurnoCajaPage from "./pages/TurnoCaja/TurnoCajaPage"; // ✅ AGREGADO

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
            path="/inventario"
            element={
              <PrivateRoute>
                <InventarioPage />
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
          <Route
            path="/turno-caja"
            element={
              <PrivateRoute>
                <TurnoCajaPage />
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
