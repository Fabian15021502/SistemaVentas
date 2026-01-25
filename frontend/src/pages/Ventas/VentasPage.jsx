import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Trash2, User, DollarSign, CreditCard, Receipt } from 'lucide-react';
import BuscadorProductos from '../../components/ventas/BuscadorProductos';
import CarritoItem from '../../components/ventas/CarritoItem';
import TicketVenta from '../../components/ventas/TicketVenta';
import ventasService from '../../services/ventasService';

const VentasPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [clienteFiado, setClienteFiado] = useState({ nombre: '', telefono: '' });
  const [ventaCompletada, setVentaCompletada] = useState(null);
  const [detallesVenta, setDetallesVenta] = useState([]);

  // Variable derivada en lugar de useEffect
  const mostrarFormCliente = metodoPago === 'fiado';

  const agregarAlCarrito = (producto) => {
    const existe = carrito.find(
      item => 
        item.productoId === producto.productoId && 
        item.variacionId === producto.variacionId
    );

    if (existe) {
      setCarrito(carrito.map(item =>
        item.productoId === producto.productoId && item.variacionId === producto.variacionId
          ? { 
              ...item, 
              cantidad: item.cantidad + 1,
              subtotal: (item.cantidad + 1) * item.precioUnitario
            }
          : item
      ));
    } else {
      const nuevoItem = {
        id: Date.now() + Math.random(),
        ...producto,
        subtotal: producto.precioUnitario
      };
      setCarrito([...carrito, nuevoItem]);
    }
  };

  const cambiarCantidad = (itemId, nuevaCantidad) => {
    setCarrito(carrito.map(item =>
      item.id === itemId
        ? { 
            ...item, 
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * item.precioUnitario
          }
        : item
    ));
  };

  const eliminarDelCarrito = (itemId) => {
    setCarrito(carrito.filter(item => item.id !== itemId));
  };

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + item.subtotal, 0);
  };

  const limpiarCarrito = () => {
    if (confirm('¿Estás seguro de limpiar el carrito?')) {
      setCarrito([]);
      setMetodoPago('efectivo');
      setClienteFiado({ nombre: '', telefono: '' });
    }
  };

  const validarVenta = () => {
    if (carrito.length === 0) {
      alert('El carrito está vacío');
      return false;
    }

    if (metodoPago === 'fiado') {
      if (!clienteFiado.nombre.trim() || !clienteFiado.telefono.trim()) {
        alert('Por favor ingresa el nombre y teléfono del cliente');
        return false;
      }
    }

    return true;
  };

  const confirmarVenta = () => {
    if (!validarVenta()) return;

    const total = calcularTotal();
    
    const venta = {
      total,
      metodoPago,
      cliente: metodoPago === 'fiado' ? clienteFiado : null
    };

    const detalles = carrito.map(item => ({
      productoId: item.productoId,
      productoNombre: item.productoNombre,
      variacionId: item.variacionId,
      variacionValor: item.variacionValor,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      subtotal: item.subtotal
    }));

    // Registrar venta
    const ventaRegistrada = ventasService.registrarVenta(venta, detalles, user.uid);

    // Mostrar ticket
    setVentaCompletada(ventaRegistrada);
    setDetallesVenta(detalles);

    // Limpiar carrito
    setCarrito([]);
    setMetodoPago('efectivo');
    setClienteFiado({ nombre: '', telefono: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
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
                <h1 className="text-2xl font-bold text-gray-900">Punto de Venta</h1>
                <p className="text-sm text-gray-600">Registra una nueva venta</p>
              </div>
            </div>

            {carrito.length > 0 && (
              <button
                onClick={limpiarCarrito}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Limpiar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Buscador */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Buscar Productos</h2>
              <BuscadorProductos onAgregarProducto={agregarAlCarrito} />
            </div>

            {/* Carrito de productos (solo visible en móvil) */}
            {carrito.length > 0 && (
              <div className="lg:hidden mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Carrito ({carrito.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {carrito.map(item => (
                    <CarritoItem
                      key={item.id}
                      item={item}
                      onCantidadChange={cambiarCantidad}
                      onEliminar={eliminarDelCarrito}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Carrito y Resumen */}
          <div className="space-y-6">
            {/* Carrito */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Carrito ({carrito.length})
                </h2>
              </div>

              {carrito.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {carrito.map(item => (
                    <CarritoItem
                      key={item.id}
                      item={item}
                      onCantidadChange={cambiarCantidad}
                      onEliminar={eliminarDelCarrito}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">El carrito está vacío</p>
                  <p className="text-sm text-gray-400 mt-1">Busca productos para agregar</p>
                </div>
              )}
            </div>

            {/* Resumen y Pago */}
            {carrito.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                {/* Total */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-3xl font-bold text-green-600">
                      ${calcularTotal().toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Método de Pago */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Método de Pago
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setMetodoPago('efectivo')}
                      className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        metodoPago === 'efectivo'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <DollarSign className={`w-5 h-5 ${
                        metodoPago === 'efectivo' ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <span className={`font-medium ${
                        metodoPago === 'efectivo' ? 'text-green-900' : 'text-gray-700'
                      }`}>
                        Efectivo
                      </span>
                    </button>

                    <button
                      onClick={() => setMetodoPago('tarjeta')}
                      className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        metodoPago === 'tarjeta'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <CreditCard className={`w-5 h-5 ${
                        metodoPago === 'tarjeta' ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <span className={`font-medium ${
                        metodoPago === 'tarjeta' ? 'text-blue-900' : 'text-gray-700'
                      }`}>
                        Tarjeta
                      </span>
                    </button>

                    <button
                      onClick={() => setMetodoPago('fiado')}
                      className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        metodoPago === 'fiado'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Receipt className={`w-5 h-5 ${
                        metodoPago === 'fiado' ? 'text-orange-600' : 'text-gray-400'
                      }`} />
                      <span className={`font-medium ${
                        metodoPago === 'fiado' ? 'text-orange-900' : 'text-gray-700'
                      }`}>
                        Fiado / Crédito
                      </span>
                    </button>
                  </div>
                </div>

                {/* Form Cliente (solo si es fiado) */}
                {mostrarFormCliente && (
                  <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-orange-600" />
                      <h3 className="font-semibold text-orange-900">Datos del Cliente</h3>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={clienteFiado.nombre}
                        onChange={(e) => setClienteFiado({ ...clienteFiado, nombre: e.target.value })}
                        placeholder="Nombre completo"
                        className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      />
                      <input
                        type="tel"
                        value={clienteFiado.telefono}
                        onChange={(e) => setClienteFiado({ ...clienteFiado, telefono: e.target.value })}
                        placeholder="Teléfono"
                        className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Botón Confirmar */}
                <button
                  onClick={confirmarVenta}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-[1.02] shadow-lg"
                >
                  Confirmar Venta
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Ticket */}
      {ventaCompletada && (
        <TicketVenta
          venta={ventaCompletada}
          detalles={detallesVenta}
          empleado={user?.email}
          onCerrar={() => setVentaCompletada(null)}
        />
      )}
    </div>
  );
};

export default VentasPage;