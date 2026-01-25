import { X, ShoppingCart, DollarSign, Calendar, CreditCard } from 'lucide-react';

const HistorialDeuda = ({ deudor, historial, onCerrar }) => {
  if (!deudor) return null;

  const getMetodoIcon = (metodo) => {
    switch(metodo) {
      case 'efectivo':
        return <DollarSign className="w-4 h-4" />;
      case 'tarjeta':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-full">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Historial de Deuda</h2>
                <p className="text-blue-100">{deudor.nombre}</p>
              </div>
            </div>
            <button
              onClick={onCerrar}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-blue-200 text-xs mb-1">Deuda Total</p>
              <p className="text-xl font-bold">${deudor.totalDeuda.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-blue-200 text-xs mb-1">Pagado</p>
              <p className="text-xl font-bold text-green-300">
                ${(deudor.totalDeuda - deudor.saldoPendiente).toLocaleString()}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-blue-200 text-xs mb-1">Pendiente</p>
              <p className="text-xl font-bold text-orange-300">
                ${deudor.saldoPendiente.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {historial.length > 0 ? (
            <div className="space-y-6">
              {historial.map((deuda) => (
                <div key={deuda.id} className="border border-gray-200 rounded-lg p-4">
                  {/* Info de la deuda */}
                  <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {new Date(deuda.fecha).toLocaleDateString('es-CO', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Venta #{deuda.ventaId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Monto Original</p>
                      <p className="text-xl font-bold text-gray-900">
                        ${deuda.montoOriginal.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Abonos */}
                  {deuda.abonos && deuda.abonos.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Abonos Realizados ({deuda.abonos.length})
                      </h4>
                      <div className="space-y-2">
                        {deuda.abonos.map((abono) => (
                          <div
                            key={abono.id}
                            className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-green-100 p-2 rounded-lg">
                                {getMetodoIcon(abono.metodoPago)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  ${abono.monto.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {new Date(abono.fecha).toLocaleDateString('es-CO')} •{' '}
                                  {abono.metodoPago}
                                </p>
                                {abono.nota && (
                                  <p className="text-xs text-gray-500 mt-1">{abono.nota}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Estado y saldo */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        deuda.estado === 'Pagada'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {deuda.estado}
                    </span>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Saldo</p>
                      <p className={`text-lg font-bold ${
                        deuda.saldo === 0 ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        ${deuda.saldo.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay historial de deudas</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={onCerrar}
            className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistorialDeuda;