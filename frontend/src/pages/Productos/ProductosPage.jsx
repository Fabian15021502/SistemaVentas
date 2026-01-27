import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Package, Grid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import productosService from '../../services/productosService';
import CategoriaCard from '../../components/productos/CategoriaCard';
import ProductCard from '../../components/productos/ProductCard';
import CategoriasModal from './CategoriasModal';
import ProductoModal from './ProductoModal';

const ProductosPage = () => {
  const navigate = useNavigate();

  const [vista, setVista] = useState('productos');
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [modalCategoria, setModalCategoria] = useState(false);
  const [modalProducto, setModalProducto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [productoEditando, setProductoEditando] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [categoriasData, productosData] = await Promise.all([
        productosService.obtenerCategorias(),
        productosService.obtenerProductos()
      ]);
      setCategorias(categoriasData);
      setProductos(productosData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== CATEGORÍAS ==========

  const handleGuardarCategoria = async (datos) => {
    try {
      if (categoriaEditando) {
        await productosService.actualizarCategoria(categoriaEditando.id, datos);
      } else {
        await productosService.crearCategoria(datos);
      }
      await cargarDatos();
      setCategoriaEditando(null);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleEditarCategoria = (categoria) => {
    setCategoriaEditando(categoria);
    setModalCategoria(true);
  };

  const handleEliminarCategoria = async (id) => {
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
      try {
        await productosService.eliminarCategoria(id);
        await cargarDatos();
      } catch (error) {
        alert(error.message);
      }
    }
  };

  // ========== PRODUCTOS ==========

  const handleGuardarProducto = async (datos) => {
    try {
      if (productoEditando) {
        await productosService.actualizarProducto(productoEditando.id, datos);
      } else {
        await productosService.crearProducto(datos);
      }
      await cargarDatos();
      setProductoEditando(null);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleEditarProducto = (producto) => {
    setProductoEditando(producto);
    setModalProducto(true);
  };

  const handleEliminarProducto = async (id) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await productosService.eliminarProducto(id);
        await cargarDatos();
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }
  };

  // ========== FILTROS ==========

  const productosFiltrados = busqueda.trim()
    ? productos.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : productos;

  const getProductosCount = (categoriaId) => {
    return productos.filter(p => p.categoriaId === categoriaId).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Cargando productos...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Productos</h1>
                <p className="text-sm text-gray-600">Administra tus productos y categorías</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {vista === 'productos' ? (
                <button
                  onClick={() => {
                    setProductoEditando(null);
                    setModalProducto(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Producto
                </button>
              ) : (
                <button
                  onClick={() => {
                    setCategoriaEditando(null);
                    setModalCategoria(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Categoría
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setVista('productos')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              vista === 'productos'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Package className="w-5 h-5" />
            Productos ({productos.length})
          </button>
          <button
            onClick={() => setVista('categorias')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              vista === 'categorias'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Grid className="w-5 h-5" />
            Categorías ({categorias.length})
          </button>
        </div>

        {/* Búsqueda (solo para productos) */}
        {vista === 'productos' && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Grid de Productos */}
        {vista === 'productos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productosFiltrados.length > 0 ? (
              productosFiltrados.map((producto) => (
                <ProductCard
                  key={producto.id}
                  producto={producto}
                  categoria={categorias.find(c => c.id === producto.categoriaId)}
                  onEdit={handleEditarProducto}
                  onDelete={handleEliminarProducto}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay productos que mostrar</p>
                <button
                  onClick={() => {
                    setProductoEditando(null);
                    setModalProducto(true);
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Crear primer producto
                </button>
              </div>
            )}
          </div>
        )}

        {/* Grid de Categorías */}
        {vista === 'categorias' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categorias.length > 0 ? (
              categorias.map((categoria) => (
                <CategoriaCard
                  key={categoria.id}
                  categoria={categoria}
                  productosCount={getProductosCount(categoria.id)}
                  onEdit={handleEditarCategoria}
                  onDelete={handleEliminarCategoria}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Grid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay categorías que mostrar</p>
                <button
                  onClick={() => {
                    setCategoriaEditando(null);
                    setModalCategoria(true);
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Crear primera categoría
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modales */}
      <CategoriasModal
        isOpen={modalCategoria}
        onClose={() => {
          setModalCategoria(false);
          setCategoriaEditando(null);
        }}
        onSave={handleGuardarCategoria}
        categoria={categoriaEditando}
      />

      <ProductoModal
        isOpen={modalProducto}
        onClose={() => {
          setModalProducto(false);
          setProductoEditando(null);
        }}
        onSave={handleGuardarProducto}
        producto={productoEditando}
        categorias={categorias}
      />
    </div>
  );
};

export default ProductosPage;