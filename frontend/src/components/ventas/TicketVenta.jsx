// src/components/ventas/TicketVenta.jsx
// VERSIÓN CORREGIDA CON VALIDACIONES

import { X, CheckCircle, Printer } from 'lucide-react';

const TicketVenta = ({ venta, items = [], onClose }) => {
  
  // 🔧 VALIDACIÓN: Asegurarse de que items es un array
  const itemsArray = Array.isArray(items) ? items : [];
  
  const handleImprimir = () => {
    window.print();
  };

  if (!venta) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8" />
              <h2 className="text-2xl font-bold">¡Venta Exitosa!</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-green-100 text-sm">
            Factura #{venta.id}
          </p>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Info de la venta */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha y Hora:</span>
                <span className="font-medium text-gray-900">
                  {new Date(venta.fechaHora).toLocaleString('es-CO')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Método de Pago:</span>
                <span className="font-medium text-gray-900 capitalize">
                  {venta.metodoPago}
                </span>
              </div>
              {venta.cliente && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-medium text-gray-900">
                      {venta.cliente.nombre}
                    </span>
                  </div>
                  {venta.cliente.telefono && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Teléfono:</span>
                      <span className="font-medium text-gray-900">
                        {venta.cliente.telefono}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Productos</h3>
            <div className="space-y-3">
              {itemsArray.length > 0 ? (
                itemsArray.map((item, index) => (
                  <div key={index} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {item.productoNombre}
                      </p>
                      {item.variacionValor && (
                        <p className="text-sm text-gray-600">
                          {item.variacionValor}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {item.cantidad} x ${item.precioUnitario?.toLocaleString() || 0}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      ${item.subtotal?.toLocaleString() || 0}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No hay items para mostrar</p>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-3xl font-bold text-green-600">
                ${venta.total?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={handleImprimir}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Cerrar
            </button>
          </div>

          {/* Mensaje de agradecimiento */}
          <p className="text-center text-sm text-gray-500 mt-6">
            ¡Gracias por su compra!
          </p>
        </div>
      </div>
    </div>
  );
};

export default TicketVenta;