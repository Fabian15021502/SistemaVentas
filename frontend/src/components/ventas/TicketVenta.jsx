import { X, Printer, Check } from 'lucide-react';

const TicketVenta = ({ venta, detalles, onCerrar, empleado }) => {
  const handleImprimir = () => {
    window.print();
  };

  if (!venta) return null;

  const fecha = new Date(venta.fechaHora);
  const fechaFormateada = fecha.toLocaleDateString('es-CO');
  const horaFormateada = fecha.toLocaleTimeString('es-CO', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-full">
                <Check className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">¡Venta Exitosa!</h2>
            </div>
            <button
              onClick={onCerrar}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-green-100 text-sm">Ticket #{venta.id}</p>
        </div>

        {/* Ticket Content */}
        <div className="p-6 print:p-8" id="ticket-print">
          {/* Info del negocio */}
          <div className="text-center mb-6 pb-4 border-b-2 border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Mi Tienda</h1>
            <p className="text-sm text-gray-600">Sistema de Ventas</p>
          </div>

          {/* Info de la venta */}
          <div className="space-y-2 mb-6 pb-4 border-b border-gray-200 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha:</span>
              <span className="font-medium">{fechaFormateada}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hora:</span>
              <span className="font-medium">{horaFormateada}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ticket:</span>
              <span className="font-medium">#{venta.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vendedor:</span>
              <span className="font-medium">{empleado || 'N/A'}</span>
            </div>
            {venta.cliente && (
              <div className="flex justify-between">
                <span className="text-gray-600">Cliente:</span>
                <span className="font-medium">{venta.cliente.nombre}</span>
              </div>
            )}
          </div>

          {/* Productos */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Productos</h3>
            <div className="space-y-3">
              {detalles.map((detalle, index) => (
                <div key={index} className="text-sm">
                  <div className="flex justify-between mb-1">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {detalle.productoNombre}
                        {detalle.variacionValor && (
                          <span className="text-gray-600 ml-1">({detalle.variacionValor})</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{detalle.cantidad} x ${detalle.precioUnitario.toLocaleString()}</span>
                    <span className="font-medium text-gray-900">
                      ${detalle.subtotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="mb-6 pb-4 border-b-2 border-gray-900">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-gray-900">TOTAL:</span>
              <span className="text-2xl font-bold text-green-600">
                ${venta.total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Método de pago */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Método de pago:</span>
              <span className="font-medium capitalize">
                {venta.metodoPago === 'fiado' ? 'Crédito' : venta.metodoPago}
              </span>
            </div>
            {venta.metodoPago === 'fiado' && (
              <div className="mt-2 p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-orange-800">
                  ⚠️ Venta a crédito - Saldo pendiente: ${venta.total.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">¡Gracias por su compra!</p>
            <p className="text-xs">Este es su comprobante de compra</p>
          </div>
        </div>

        {/* Botones */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3">
          <button
            onClick={handleImprimir}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors print:hidden"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
          <button
            onClick={onCerrar}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors print:hidden"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Estilos de impresión */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #ticket-print, #ticket-print * {
            visibility: visible;
          }
          #ticket-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default TicketVenta;