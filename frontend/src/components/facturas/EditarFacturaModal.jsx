import { useState, useEffect } from 'react';
import { X, Edit2, Trash2, AlertCircle, Save, Plus } from 'lucide-react';
import BuscadorProductos from '../ventas/BuscadorProductos';

const EditarFacturaModal = ({ isOpen, onClose, factura, onGuardar }) => {
  const [items, setItems] = useState([]);
  const [metodoPago, setMetodoPago] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mostrarBuscador, setMostrarBuscador] = useState(false);

  useEffect(() => {
    if (factura) {
      setItems(factura.items.map(item => ({
        ...item,
        id: item.id || Date.now() + Math.random()
      })));
      setMetodoPago(factura.metodoPago);
      setClienteNombre(factura.clienteNombre || '');
      setClienteTelefono(factura.clienteTelefono || '');
    }
  }, [factura]);

  if (!isOpen || !factura) return null;

  const calcularTotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleCantidadChange = (itemId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      handleEliminarItem(itemId);
      return;
    }

    setItems(items.map(item => 
      item.id === itemId 
        ? {
            ...item,
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * item.precioUnitario
          }
        : item
    ));
  };

  const handleEliminarItem = (itemId) => {
    if (items.length === 1) {
      setError('Debe haber al menos un producto en la factura');
      return;
    }
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleAgregarProducto = (producto) => {
    const existe = items.find(
      item => 
        item.productoId === producto.productoId && 
        item.variacionId === producto.variacionId
    );

    if (existe) {
      handleCantidadChange(existe.id, existe.cantidad + 1);
    } else {
      const nuevoItem = {
        id: Date.now() + Math.random(),
        productoId: producto.productoId,
        productoNombre: producto.productoNombre,
        variacionId: producto.variacionId || null,
        variacionValor: producto.variacionValor || '',
        cantidad: 1,
        precioUnitario: producto.precioUnitario,
        subtotal: producto.precioUnitario
      };
      setItems([...items, nuevoItem]);
    }
    setMostrarBuscador(false);
  };

  const handleGuardar = async () => {
    setLoading(true);
    setError('');

    try {
      if (items.length === 0) {
        throw new Error('Debe haber al menos un producto');
      }

      const datosActualizados = {
        items: items.map(item => ({
          productoId: item.productoId,
          productoNombre: item.productoNombre,
          variacionId: item.variacionId,
          variacion: item.variacionValor,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal
        })),
        total: calcularTotal(),
        metodoPago,
        clienteNombre,
        clienteTelefono
      };

      await onGuardar(factura.id, datosActualizados);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fechaVenta = new Date(factura.fecha);
  const horasTranscurridas = (new Date() - fechaVenta) / (1000 * 60 * 60);
  const puedeEditar = horasTranscurridas <= 24;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Editar Factura #{factura.id}</h2>
              <p className="text-blue-100 text-sm mt-1">
                {fechaVenta.toLocaleString('es-CO')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {!puedeEditar && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800 font-medium">No se puede editar</p>
                <p className="text-sm text-red-600 mt-1">
                  Solo se pueden editar facturas de las últimas 24 horas
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Items */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Productos</h3>
              {puedeEditar && (
                <button
                  onClick={() => setMostrarBuscador(!mostrarBuscador)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Producto
                </button>
              )}
            </div>

            {mostrarBuscador && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <BuscadorProductos onAgregarProducto={handleAgregarProducto} />
              </div>
            )}

            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{item.productoNombre}</h4>
                      {item.variacionValor && (
                        <p className="text-sm text-gray-600">{item.variacionValor}</p>
                      )}
                    </div>
                    {puedeEditar && (
                      <button
                        onClick={() => handleEliminarItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {puedeEditar ? (
                        <>
                          <button
                            onClick={() => handleCantidadChange(item.id, item.cantidad - 1)}
                            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                          >
                            -
                          </button>
                          <span className="font-semibold text-lg w-12 text-center">
                            {item.cantidad}
                          </span>
                          <button
                            onClick={() => handleCantidadChange(item.id, item.cantidad + 1)}
                            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                          >
                            +
                          </button>
                        </>
                      ) : (
                        <span className="font-semibold text-lg">
                          Cantidad: {item.cantidad}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        ${item.precioUnitario.toLocaleString()} c/u
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        ${item.subtotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Método de pago y cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                disabled={!puedeEditar}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
                <option value="fiado">Fiado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente
              </label>
              <input
                type="text"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                disabled={!puedeEditar}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Nombre del cliente"
              />
            </div>
          </div>

          {/* Total */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-3xl font-bold text-blue-600">
                ${calcularTotal().toLocaleString()}
              </span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            {puedeEditar && (
              <button
                onClick={handleGuardar}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditarFacturaModal;