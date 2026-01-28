import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Search,
  Filter,
  Download,
  RefreshCw,
  Plus
} from 'lucide-react';
import inventarioService from '../../services/inventarioService';
import productosService from '../../services/productosService';
import StockCard from '../../components/inventario/StockCard';
import MovimientoModal from '../../components/inventario/MovimientoModal';

const InventarioPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [inventario, setInventario] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // todos, bajo, sin-stock
  
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  
  const [estadisticas, setEstadisticas] = useState({
    totalProductos: 0,
    productosConStock: 0,
    productosSinStock: 0,
    productosStockBajo: 0,
    valorTotalInventario: 0
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [inventarioData, productosData, stats] = await Promise.all([
        inventarioService.obtenerInventario(),
        productosService.obtenerProductos(),
        inventarioService.obtenerEstadisticasInventario()
      ]);
      
      setInventario(inventarioData);
      setProductos(productosData);
      setEstadisticas(stats);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar inventario: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  const handleRegistrarMovimiento = async (datos) => {
    try {
      await inventarioService.registrarMovimiento({
        ...datos,
        productoId: itemSeleccionado.productoId,
        usuario: user?.email || 'system'
      });
      
      await cargarDatos();
      setModalMovimiento(false);
      setItemSeleccionado(null);
    } catch (error) {
      console.error('Error al registrar movimiento:', error);
      throw error;
    }
  };

  const handleVerMovimientos = (item) => {
    navigate(`/inventario/movimientos/${item.productoId}`);
  };

  const handleAjustar = (item) => {
    setItemSeleccionado(item);
    setModalMovimiento(true);
  };

  const exportarInventario = () => {
    const csvContent = 'ID Producto,Nombre,Stock Actual,Stock Mínimo,Stock Máximo,Costo Promedio,Valor Total,Ubicación\n' +
      inventarioFiltrado.map(item => {
        const producto = productos.find(p => p.id === item.productoId);
        const valorTotal = item.cantidad * (item.costoPromedio || 0);
        return `${item.productoId},"${producto?.nombre || 'N/A'}",${item.cantidad},${item.stockMinimo},${item.stockMaximo},${item.costoPromedio || 0},${valorTotal},"${item.ubicacion || ''}"`;
      }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filtrar inventario
  const inventarioFiltrado = inventario.filter(item => {
    const producto = productos.find(p => p.id === item.productoId);
    
    // Filtro por búsqueda
    if (busqueda.trim()) {
      const terminoLower = busqueda.toLowerCase();
      const nombreMatch = producto?.nombre.toLowerCase().includes(terminoLower);
      const idMatch = String(item.productoId).includes(busqueda);
      if (!nombreMatch && !idMatch) return false;
    }

    // Filtro por estado
    switch (filtroEstado) {
      case 'sin-stock':
        return item.cantidad === 0;
      case 'bajo':
        return item.stockMinimo > 0 && item.cantidad <= item.stockMinimo && item.cantidad > 0;
      case 'todos':
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Control de Inventario</h1>
                <p className="text-sm text-gray-600">Gestiona el stock y movimientos de productos</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Actualizar"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={exportarInventario}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Productos</h3>
            <p className="text-2xl font-bold text-gray-900">{estadisticas.totalProductos}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Con Stock</h3>
            <p className="text-2xl font-bold text-green-600">{estadisticas.productosConStock}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Sin Stock</h3>
            <p className="text-2xl font-bold text-red-600">{estadisticas.productosSinStock}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-orange-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Stock Bajo</h3>
            <p className="text-2xl font-bold text-orange-600">{estadisticas.productosStockBajo}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Valor Total</h3>
            <p className="text-xl font-bold text-purple-600">
              ${estadisticas.valorTotalInventario.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o ID..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filtro por estado */}
            <div className="flex gap-2">
              <button
                onClick={() => setFiltroEstado('todos')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  filtroEstado === 'todos'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFiltroEstado('bajo')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  filtroEstado === 'bajo'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Stock Bajo
              </button>
              <button
                onClick={() => setFiltroEstado('sin-stock')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  filtroEstado === 'sin-stock'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sin Stock
              </button>
            </div>
          </div>
        </div>

        {/* Grid de Inventario */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventarioFiltrado.length > 0 ? (
            inventarioFiltrado.map((item) => {
              const producto = productos.find(p => p.id === item.productoId);
              return (
                <StockCard
                  key={item.id || item.productoId}
                  item={item}
                  producto={producto}
                  onVerMovimientos={handleVerMovimientos}
                  onAjustar={handleAjustar}
                />
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay productos que mostrar</p>
              {busqueda && (
                <p className="text-sm text-gray-400 mt-2">
                  Intenta con otra búsqueda
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Movimiento */}
      {modalMovimiento && itemSeleccionado && (
        <MovimientoModal
          isOpen={modalMovimiento}
          onClose={() => {
            setModalMovimiento(false);
            setItemSeleccionado(null);
          }}
          onRegistrar={handleRegistrarMovimiento}
          producto={productos.find(p => p.id === itemSeleccionado.productoId)}
          stockActual={itemSeleccionado.cantidad}
        />
      )}
    </div>
  );
};

export default InventarioPage;