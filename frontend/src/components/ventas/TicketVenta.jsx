// src/components/ventas/TicketVenta.jsx
// VERSIÓN MEJORADA - Más completa que la anterior

import { X, CheckCircle, Printer, Receipt, Calendar, CreditCard, User, Phone } from 'lucide-react';

const TicketVenta = ({ venta, items = [], onClose }) => {
  
  const itemsArray = Array.isArray(items) ? items : [];
  
  const handleImprimir = () => {
    window.print();
  };

  if (!venta) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header con diseño mejorado */}
        <div className="bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white p-8 rounded-t-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">¡Venta Exitosa!</h2>
                <p className="text-green-100 text-sm mt-1">Transacción completada</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Número de factura destacado */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 text-green-100 text-sm mb-1">
              <Receipt className="w-4 h-4" />
              <span>Número de Factura</span>
            </div>
            <p className="text-4xl font-bold">#{String(venta.id).padStart(6, '0')}</p>
          </div>
        </div>

        {/* Contenido del ticket */}
        <div className="p-6">
          
          {/* Información de la venta */}
          <div className="mb-6 pb-6 border-b-2 border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Detalles de la Transacción
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-600 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fecha y Hora:
                </span>
                <span className="font-semibold text-gray-900">
                  {new Date(venta.fechaHora).toLocaleString('es-CO', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-600 text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Método de Pago:
                </span>
                <span className="font-semibold text-gray-900 capitalize px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {venta.metodoPago}
                </span>
              </div>
              
              {venta.cliente && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Información del Cliente
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">Nombre:</span>
                      <span className="font-medium text-gray-900">
                        {venta.cliente.nombre}
                      </span>
                    </div>
                    {venta.cliente.telefono && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          Teléfono:
                        </span>
                        <span className="font-medium text-gray-900">
                          {venta.cliente.telefono}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lista de productos mejorada */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-green-600" />
              Productos ({itemsArray.length})
            </h3>
            <div className="space-y-2">
              {itemsArray.length > 0 ? (
                itemsArray.map((item, index) => (
                  <div 
                    key={index} 
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-lg">
                          {item.productoNombre}
                        </p>
                        {item.variacionValor && (
                          <p className="text-sm text-gray-600 mt-1">
                            Variación: {item.variacionValor}
                          </p>
                        )}
                      </div>
                      <p className="font-bold text-green-600 text-lg">
                        ${item.subtotal?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-500 pt-2 border-t border-gray-200">
                      <span>Cantidad: {item.cantidad}</span>
                      <span>Precio unit: ${item.precioUnitario?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No hay productos para mostrar</p>
                </div>
              )}
            </div>
          </div>

          {/* Total destacado */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-500 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium mb-1">TOTAL A PAGAR</p>
                <p className="text-5xl font-black text-green-600">
                  ${venta.total?.toLocaleString() || 0}
                </p>
              </div>
              <div className="bg-green-500 text-white p-4 rounded-full">
                <Receipt className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            <button
              onClick={handleImprimir}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Printer className="w-5 h-5" />
              Imprimir Ticket
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
            >
              Cerrar
            </button>
          </div>

          {/* Mensaje de agradecimiento */}
          <div className="mt-6 pt-6 border-t-2 border-dashed border-gray-300">
            <p className="text-center text-gray-600 font-medium text-lg">
              ¡Gracias por su compra!
            </p>
            <p className="text-center text-gray-500 text-sm mt-2">
              Lo esperamos pronto
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketVenta;