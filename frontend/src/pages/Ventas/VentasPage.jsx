// src/pages/Ventas/VentasPage.jsx
// VERSIÓN COMPLETA CORREGIDA - COPIAR Y PEGAR TODO

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Trash2, User, DollarSign, CreditCard, Receipt, AlertTriangle } from 'lucide-react';
import BuscadorProductos from '../../components/ventas/BuscadorProductos';
import CarritoItem from '../../components/ventas/CarritoItem';
import TicketVenta from '../../components/ventas/TicketVenta';
import ventasService from '../../services/ventasService';
import turnoService from '../../services/turnoService';
import inventarioService from '../../services/inventarioService';

const VentasPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [clienteFiado, setClienteFiado] = useState({ nombre: '', telefono: '' });
  const [ventaCompletada, setVentaCompletada] = useState(null);
  const [detallesVenta, setDetallesVenta] = useState([]);
  const [deudoresExistentes, setDeudoresExistentes] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  
  // 🔧 NUEVO: Estados para validación de turno/caja
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [cajaActiva, setCajaActiva] = useState(null);
  const [validandoSistema, setValidandoSistema] = useState(true);
  const [inventario, setInventario] = useState([]);

  // Variable derivada
  const mostrarFormCliente = metodoPago === 'fiado';

  // 🔧 NUEVO: Validar turno y caja al cargar
  useEffect(() => {
    const validarSistema = async () => {
      try {
        setValidandoSistema(true);
        
        // Verificar turno activo
        const turno = await turnoService.obtenerTurnoActivo();
        setTurnoActivo(turno);
        
        if (!turno) {
          alert('⚠️ No hay un turno activo. Por favor, abre el turno antes de realizar ventas.');
          navigate('/turno-caja');
          return;
        }
        
        // Verificar caja activa del empleado
        const caja = await turnoService.obtenerCajaActiva(turno.id, user.email);
        setCajaActiva(caja);
        
        if (!caja) {
          alert('⚠️ No tienes una caja abierta. Por favor, abre tu caja antes de realizar ventas.');
          navigate('/turno-caja');
          return;
        }
        
        // Cargar inventario
        const inv = await inventarioService.obtenerInventario();
        setInventario(inv);
        
        console.log('✅ Sistema validado - Turno:', turno.id, 'Caja:', caja.id);
      } catch (error) {
        console.error('Error al validar sistema:', error);
        alert('Error al validar el sistema: ' + error.message);
        navigate('/dashboard');
      } finally {
        setValidandoSistema(false);
      }
    };

    if (user) {
      validarSistema();
    }
  }, [user, navigate]);

  // Cargar deudores cuando se activa modo fiado
  useEffect(() => {
    const cargarDeudores = async () => {
      if (metodoPago === 'fiado') {
        try {
          const deudoresService = (await import('../../services/deudoresService')).default;
          const deudores = await deudoresService.obtenerDeudores();
          setDeudoresExistentes(deudores);
        } catch (error) {
          console.error('Error al cargar deudores:', error);
        }
      }
    };
    cargarDeudores();
  }, [metodoPago]);

  // Filtrar deudores según lo que escribe el usuario
  const deudoresFiltrados = deudoresExistentes.filter(d => 
    clienteFiado.nombre.trim() &&
    d.nombre.toLowerCase().includes(clienteFiado.nombre.toLowerCase())
  ).slice(0, 5);

  const seleccionarDeudor = (deudor) => {
    setClienteFiado({
      nombre: deudor.nombre,
      telefono: String(deudor.telefono || '')
    });
    setMostrarSugerencias(false);
  };

  // 🔧 NUEVO: Función para obtener stock disponible
  const obtenerStockDisponible = (productoId, variacionId) => {
    const itemInv = inventario.find(inv => 
      parseInt(inv.productoId) === parseInt(productoId) && 
      (variacionId ? parseInt(inv.variacionId) === parseInt(variacionId) : !inv.variacionId)
    );
    return itemInv ? parseFloat(itemInv.cantidad) : 0;
  };

  const agregarAlCarrito = (producto) => {
    // 🔧 VALIDAR STOCK antes de agregar
    const stockDisponible = obtenerStockDisponible(producto.productoId, producto.variacionId);
    
    if (stockDisponible === 0) {
      alert(`⚠️ ${producto.productoNombre} ${producto.variacionValor || ''} no tiene stock disponible`);
      return;
    }
    
    const existe = carrito.find(
      item => 
        item.productoId === producto.productoId && 
        item.variacionId === producto.variacionId
    );

    if (existe) {
      // Verificar si al incrementar no excede el stock
      const nuevaCantidad = existe.cantidad + 1;
      if (nuevaCantidad > stockDisponible) {
        alert(`⚠️ Stock insuficiente. Disponible: ${stockDisponible} unidades`);
        return;
      }
      
      setCarrito(carrito.map(item =>
        item.productoId === producto.productoId && item.variacionId === producto.variacionId
          ? { 
              ...item, 
              cantidad: nuevaCantidad,
              subtotal: nuevaCantidad * item.precioUnitario
            }
          : item
      ));
    } else {
      const nuevoItem = {
        id: Date.now() + Math.random(),
        ...producto,
        stockDisponible: stockDisponible, // 🔧 Guardar stock para referencia
        subtotal: producto.precioUnitario
      };
      setCarrito([...carrito, nuevoItem]);
    }
  };

  const cambiarCantidad = (itemId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(itemId);
      return;
    }
    
    const item = carrito.find(i => i.id === itemId);
    if (!item) return;
    
    // 🔧 VALIDAR que no exceda el stock
    const stockDisponible = obtenerStockDisponible(item.productoId, item.variacionId);
    
    if (nuevaCantidad > stockDisponible) {
      alert(`⚠️ Stock insuficiente. Disponible: ${stockDisponible} unidades`);
      return;
    }
    
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
      const nombreValido = clienteFiado.nombre && String(clienteFiado.nombre).trim() !== '';
      const telefonoValido = clienteFiado.telefono && String(clienteFiado.telefono).trim() !== '';
      
      if (!nombreValido || !telefonoValido) {
        alert('Por favor ingresa el nombre y teléfono del cliente');
        return false;
      }
    }

    return true;
  };

  const confirmarVenta = async () => {
    if (!validarVenta()) return;

    try {
      const total = calcularTotal();
      
      const venta = {
        empleadoId: user?.email || 'system',  // 🔧 CORRECCIÓN: Usar email
        total,
        metodoPago,
        clienteNombre: metodoPago === 'fiado' ? String(clienteFiado.nombre).trim() : 'Cliente General',
        clienteTelefono: metodoPago === 'fiado' ? String(clienteFiado.telefono).trim() : '',
        items: carrito.map(item => ({
          productoId: item.productoId,
          productoNombre: item.productoNombre,
          variacionId: item.variacionId || '',
          variacion: item.variacionValor || '',
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal
        }))
      };

      console.log('💰 Registrando venta:', venta);

      // Registrar venta (ya incluye validación de stock)
      const ventaRegistrada = await ventasService.registrarVenta(venta);

      console.log('✅ Venta registrada:', ventaRegistrada);

      // Si es venta fiada, crear/buscar deudor y registrar deuda
      if (metodoPago === 'fiado') {
        try {
          console.log('💳 Procesando venta fiada...');
          
          const deudoresService = (await import('../../services/deudoresService')).default;
          
          let deudor = null;
          const deudores = await deudoresService.obtenerDeudores();
          
          const nombreBusqueda = String(clienteFiado.nombre).toLowerCase().trim();
          const telefonoBusqueda = String(clienteFiado.telefono).trim();
          
          deudor = deudores.find(d => 
            d.nombre.toLowerCase() === nombreBusqueda ||
            (d.telefono && String(d.telefono) === telefonoBusqueda)
          );
          
          if (!deudor) {
            console.log('👤 Creando nuevo deudor...');
            deudor = await deudoresService.crearDeudor({
              nombre: String(clienteFiado.nombre).trim(),
              telefono: String(clienteFiado.telefono).trim()
            });
            console.log('✅ Deudor creado:', deudor);
          } else {
            console.log('✅ Deudor encontrado:', deudor.nombre);
          }
          
          console.log('💰 Registrando deuda...');
          await deudoresService.crearDeuda({
            deudorId: deudor.id,
            ventaId: ventaRegistrada.id,
            monto: total
          });
          console.log('✅ Deuda registrada');
          
        } catch (deudaError) {
          console.error('⚠️ Error al procesar deuda:', deudaError);
          alert('Venta registrada, pero hubo un error al registrar la deuda: ' + deudaError.message);
        }
      }

      // 🔧 CORRECCIÓN: Guardar items ANTES de mostrar ticket
      const itemsVenta = [...carrito]; // Copiar carrito antes de limpiarlo
      
      // Mostrar ticket
      setVentaCompletada({
        id: ventaRegistrada.id,
        fechaHora: ventaRegistrada.fecha,
        total: venta.total,
        metodoPago: venta.metodoPago,
        cliente: metodoPago === 'fiado' ? {
          nombre: String(clienteFiado.nombre).trim(),
          telefono: String(clienteFiado.telefono).trim()
        } : null
      });
      
      setDetallesVenta(itemsVenta); // Usar la copia guardada

      // Limpiar carrito
      setCarrito([]);
      setMetodoPago('efectivo');
      setClienteFiado({ nombre: '', telefono: '' });
      
      // 🔧 Recargar inventario después de la venta
      const inv = await inventarioService.obtenerInventario();
      setInventario(inv);
      
    } catch (error) {
      console.error('Error al confirmar venta:', error);
      alert('Error al registrar la venta: ' + error.message);
    }
  };

  // 🔧 Mostrar loading mientras valida sistema
  if (validandoSistema) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Validando sistema...</p>
        </div>
      </div>
    );
  }

  // 🔧 Mostrar advertencia si no hay turno o caja
  if (!turnoActivo || !cajaActiva) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sistema no disponible</h2>
            <p className="text-gray-600 mb-6">
              {!turnoActivo && 'No hay un turno activo. '}
              {!cajaActiva && 'No tienes una caja abierta. '}
              Por favor, abre el turno y tu caja antes de realizar ventas.
            </p>
            <button
              onClick={() => navigate('/turno-caja')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Ir a Turno y Caja
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con info de turno/caja */}
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
                <p className="text-sm text-gray-600">
                  Turno #{turnoActivo?.id} • Caja #{cajaActiva?.id}
                </p>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna izquierda - Buscador */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                Agregar Productos
              </h2>
              <BuscadorProductos onAgregarProducto={agregarAlCarrito} />
            </div>

            {/* Carrito */}
            {carrito.length > 0 && (
              <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Carrito ({carrito.length} {carrito.length === 1 ? 'producto' : 'productos'})
                </h3>
                <div className="space-y-3">
                  {carrito.map((item) => (
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

          {/* Columna derecha - Resumen */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Resumen de Venta</h2>

              {/* Método de Pago */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Método de Pago
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMetodoPago('efectivo')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      metodoPago === 'efectivo'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium">Efectivo</span>
                  </button>
                  <button
                    onClick={() => setMetodoPago('tarjeta')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      metodoPago === 'tarjeta'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="font-medium">Tarjeta</span>
                  </button>
                  <button
                    onClick={() => setMetodoPago('transferencia')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      metodoPago === 'transferencia'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Receipt className="w-4 h-4" />
                    <span className="font-medium text-sm">Transfer.</span>
                  </button>
                  <button
                    onClick={() => setMetodoPago('fiado')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      metodoPago === 'fiado'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="font-medium">Fiado</span>
                  </button>
                </div>
              </div>

              {/* Formulario Cliente (solo para fiado) */}
              {mostrarFormCliente && (
                <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h3 className="text-sm font-semibold text-orange-900 mb-3">
                    Datos del Cliente
                  </h3>
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Nombre completo *"
                        value={clienteFiado.nombre}
                        onChange={(e) => {
                          setClienteFiado({ ...clienteFiado, nombre: e.target.value });
                          setMostrarSugerencias(e.target.value.trim().length > 0);
                        }}
                        onFocus={() => setMostrarSugerencias(clienteFiado.nombre.trim().length > 0)}
                        className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      
                      {mostrarSugerencias && deudoresFiltrados.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {deudoresFiltrados.map((deudor) => (
                            <button
                              key={deudor.id}
                              onClick={() => seleccionarDeudor(deudor)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <p className="font-medium text-gray-900">{deudor.nombre}</p>
                              <p className="text-sm text-gray-600">{deudor.telefono}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="tel"
                      placeholder="Teléfono *"
                      value={clienteFiado.telefono}
                      onChange={(e) => setClienteFiado({ ...clienteFiado, telefono: e.target.value })}
                      className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-3xl font-bold text-blue-600">
                    ${calcularTotal().toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Botón Confirmar */}
              <button
                onClick={confirmarVenta}
                disabled={carrito.length === 0}
                className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
                  carrito.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {carrito.length === 0 ? 'Agrega productos' : 'Confirmar Venta'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Ticket */}
      {ventaCompletada && (
        <TicketVenta
          venta={ventaCompletada}
          items={detallesVenta}
          onClose={() => {
            setVentaCompletada(null);
            setDetallesVenta([]);
          }}
        />
      )}
    </div>
  );
};

export default VentasPage;