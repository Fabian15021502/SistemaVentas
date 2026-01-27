import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  LogOut, 
  ShoppingCart, 
  Package, 
  TrendingUp,
  DollarSign,
  AlertCircle,
  User,
  Calendar,
  BarChart3,
  Loader2,
  RefreshCw,
  Users
} from 'lucide-react';
import dashboardService from '../services/dashboardService';
import VentasChart from '../components/dashboard/VentasChart';
import CategoriasChart from '../components/dashboard/CategoriasChart';
import TopProductos from '../components/dashboard/TopProductos';
import VentasPorEmpleado from '../components/dashboard/VentasPorEmpleado';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metricas, setMetricas] = useState({
    ventasHoy: { total: 0, cantidad: 0 },
    productos: { total: 0 },
    deuda: { total: 0, deudores: 0 }
  });
  const [ventasSemana, setVentasSemana] = useState([]);
  const [ventasCategorias, setVentasCategorias] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [ventasPorEmpleado, setVentasPorEmpleado] = useState([]);

  // Función para cargar datos
  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar estadísticas básicas primero (más rápido)
      const stats = await dashboardService.obtenerEstadisticas();
      
      setMetricas({
        ventasHoy: {
          total: stats.totalDiario || 0,
          cantidad: stats.ventasHoy || 0
        },
        productos: {
          total: stats.totalProductos || 0
        },
        deuda: {
          total: stats.deudaTotal || 0,
          deudores: 0
        }
      });

      setLoading(false);

      // Cargar datos adicionales en paralelo (en background)
      Promise.all([
        dashboardService.obtenerVentasSemana(),
        dashboardService.obtenerTopProductos(5),
        dashboardService.obtenerVentasPorCategoria(),
        dashboardService.obtenerVentasPorEmpleado(30) // AGREGADO
      ]).then(([semana, productos, categorias, empleados]) => {
        setVentasSemana(semana);
        setTopProductos(productos);
        setVentasCategorias(categorias);
        setVentasPorEmpleado(empleados); // AGREGADO
      }).catch(error => {
        console.error('Error cargando datos adicionales:', error);
      });

    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      setLoading(false);
    }
  };

  // Cargar datos al montar
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (mounted) {
        await cargarDatos();
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    dashboardService.limpiarCache();
    await cargarDatos();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  const userName = user?.email?.split('@')[0] || 'Usuario';

  const stats = [
    {
      title: 'Ventas de Hoy',
      value: `$${metricas.ventasHoy.total.toLocaleString()}`,
      subtitle: `${metricas.ventasHoy.cantidad} transacciones`,
      icon: DollarSign,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Productos Activos',
      value: metricas.productos.total,
      subtitle: 'En inventario',
      icon: Package,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Deudas Pendientes',
      value: `$${metricas.deuda.total.toLocaleString()}`,
      subtitle: `${metricas.deuda.deudores} deudores`,
      icon: AlertCircle,
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      title: 'Promedio Diario',
      value: `$${Math.round(ventasSemana.reduce((sum, v) => sum + v.total, 0) / (ventasSemana.length || 1)).toLocaleString()}`,
      subtitle: 'Última semana',
      icon: TrendingUp,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sistema de Ventas</h1>
              <p className="text-sm text-gray-600 mt-1">
                Bienvenido, <span className="font-medium">{userName}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Actualizar datos"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {new Date().toLocaleDateString('es-CO', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.lightColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Gráficos principales - 3 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Ventas de la última semana */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ventas - Última Semana</h3>
                <p className="text-sm text-gray-500">Tendencia diaria</p>
              </div>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            {ventasSemana.length > 0 ? (
              <VentasChart data={ventasSemana} tipo="area" />
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-gray-400">Cargando datos...</p>
              </div>
            )}
          </div>

          {/* Ventas por categoría */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ventas por Categoría</h3>
                <p className="text-sm text-gray-500">Distribución de ventas</p>
              </div>
            </div>
            {ventasCategorias.length > 0 ? (
              <CategoriasChart data={ventasCategorias} />
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-gray-400">Cargando datos...</p>
              </div>
            )}
          </div>

          {/* NUEVO: Ventas por Empleado */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ventas por Empleado</h3>
                <p className="text-sm text-gray-500">Últimos 30 días</p>
              </div>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            {ventasPorEmpleado.length > 0 ? (
              <VentasPorEmpleado data={ventasPorEmpleado} />
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-gray-400">Cargando datos...</p>
              </div>
            )}
          </div>
        </div>

        {/* Grid inferior */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top productos */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Top 5 Productos</h3>
                <p className="text-sm text-gray-500">Más vendidos</p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <TopProductos productos={topProductos} />
          </div>

          {/* Acciones rápidas */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/ventas')}
                className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
              >
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Nueva Venta</span>
              </button>
              
              <button
                onClick={() => navigate('/productos')}
                className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
              >
                <Package className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Ver Productos</span>
              </button>
              
              <button
                onClick={() => navigate('/deudores')}
                className="w-full flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"
              >
                <User className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">Deudores</span>
              </button>
              
              <button
                onClick={() => navigate('/reportes')}
                className="w-full flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left"
              >
                <BarChart3 className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-900">Reportes</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;