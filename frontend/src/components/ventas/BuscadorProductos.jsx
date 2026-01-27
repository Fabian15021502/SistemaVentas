import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import productosService from '../../services/productosService';

const BuscadorProductos = ({ onAgregarProducto }) => {
  const [busqueda, setBusqueda] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [productosData, categoriasData] = await Promise.all([
          productosService.obtenerProductos(),
          productosService.obtenerCategorias()
        ]);
        setProductos(productosData);
        setCategorias(categoriasData);
      } catch (error) {
        console.error('Error al cargar productos:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Filtrar productos basado en la búsqueda
  const productosFiltrados = busqueda.trim()
    ? productos.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      )
    : [];

  const handleSeleccionarProducto = (producto) => {
    setProductoSeleccionado(producto);
    if (producto.variaciones && producto.variaciones.length > 0) {
      // Esperar a que el usuario seleccione una variación
    } else {
      handleAgregar(producto, null);
    }
  };

  const handleAgregar = (producto, variacion) => {
    const categoria = categorias.find(c => c.id === producto.categoriaId);
    let precioFinal = producto.precioBase;
    
    if (variacion) {
      precioFinal += variacion.precioAdicional;
    }

    onAgregarProducto({
      productoId: producto.id,
      productoNombre: producto.nombre,
      categoriaNombre: categoria?.nombre || 'Sin categoría',
      variacionId: variacion?.id || null,
      variacionValor: variacion?.valor || null,
      precioUnitario: precioFinal,
      cantidad: 1
    });

    // Limpiar
    setBusqueda('');
    setProductoSeleccionado(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Cargando productos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>

      {/* Resultados de búsqueda */}
      {productosFiltrados.length > 0 && !productoSeleccionado && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {productosFiltrados.map((producto) => (
            <button
              key={producto.id}
              onClick={() => handleSeleccionarProducto(producto)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{producto.nombre}</p>
                  <p className="text-sm text-gray-500">
                    {categorias.find(c => c.id === producto.categoriaId)?.nombre}
                  </p>
                </div>
                <p className="text-lg font-bold text-green-600">
                  ${producto.precioBase.toLocaleString()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal de selección de variación */}
      {productoSeleccionado && productoSeleccionado.variaciones && productoSeleccionado.variaciones.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            Selecciona una opción de {productoSeleccionado.nombre}
          </h3>
          <div className="space-y-2">
            {productoSeleccionado.variaciones.map((variacion) => (
              <button
                key={variacion.id}
                onClick={() => handleAgregar(productoSeleccionado, variacion)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-blue-100 rounded-lg transition-colors border border-gray-200"
              >
                <span className="font-medium text-gray-900">{variacion.valor}</span>
                <span className="text-lg font-bold text-green-600">
                  ${(productoSeleccionado.precioBase + variacion.precioAdicional).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setProductoSeleccionado(null)}
            className="mt-3 w-full py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

export default BuscadorProductos;