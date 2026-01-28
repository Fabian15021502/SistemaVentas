import { Package, AlertTriangle, TrendingDown, TrendingUp, MapPin } from 'lucide-react';

const StockCard = ({ item, producto, onVerMovimientos, onAjustar }) => {
  const getStockStatus = () => {
    if (item.cantidad === 0) {
      return { status: 'sin-stock', label: 'Sin Stock', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    }
    if (item.stockMinimo > 0 && item.cantidad <= item.stockMinimo) {
      return { status: 'bajo', label: 'Stock Bajo', color: 'bg-orange-100 text-orange-800', icon: TrendingDown };
    }
    if (item.stockMaximo > 0 && item.cantidad >= item.stockMaximo) {
      return { status: 'alto', label: 'Stock Alto', color: 'bg-blue-100 text-blue-800', icon: TrendingUp };
    }
    return { status: 'normal', label: 'Stock Normal', color: 'bg-green-100 text-green-800', icon: Package };
  };

  const status = getStockStatus();
  const StatusIcon = status.icon;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-lg mb-1">{producto?.nombre || 'Producto'}</h3>
          <p className="text-sm text-gray-500">ID: {item.productoId}</p>
          {item.ubicacion && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
              <MapPin className="w-3 h-3" />
              <span>{item.ubicacion}</span>
            </div>
          )}
        </div>
        
        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
      </div>

      {/* Stock Info */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm text-blue-800 font-medium">Stock Actual:</span>
          <span className="text-2xl font-bold text-blue-900">
            {item.cantidad.toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">Mínimo</p>
            <p className="text-lg font-semibold text-gray-900">{item.stockMinimo}</p>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">Máximo</p>
            <p className="text-lg font-semibold text-gray-900">{item.stockMaximo}</p>
          </div>
        </div>

        {item.costoPromedio > 0 && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-700 mb-1">Valor en Inventario</p>
            <p className="text-xl font-bold text-green-800">
              ${(item.cantidad * item.costoPromedio).toLocaleString()}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Costo promedio: ${item.costoPromedio.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Notas */}
      {item.notas && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Notas:</p>
          <p className="text-sm text-gray-700">{item.notas}</p>
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <button
          onClick={() => onVerMovimientos(item)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          <Package className="w-4 h-4" />
          Movimientos
        </button>
        <button
          onClick={() => onAjustar(item)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
        >
          Ajustar Stock
        </button>
      </div>

      {/* Última actualización */}
      {item.fechaActualizacion && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Última actualización: {new Date(item.fechaActualizacion).toLocaleDateString('es-CO')}
          </p>
        </div>
      )}
    </div>
  );
};

export default StockCard;