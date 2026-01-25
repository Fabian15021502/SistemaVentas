import { Plus, Minus, Trash2 } from 'lucide-react';

const CarritoItem = ({ item, onCantidadChange, onEliminar }) => {
  const handleIncrement = () => {
    onCantidadChange(item.id, item.cantidad + 1);
  };

  const handleDecrement = () => {
    if (item.cantidad > 1) {
      onCantidadChange(item.id, item.cantidad - 1);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{item.productoNombre}</h3>
          {item.variacionValor && (
            <p className="text-sm text-gray-600">{item.variacionValor}</p>
          )}
          <p className="text-xs text-gray-500">{item.categoriaNombre}</p>
        </div>
        <button
          onClick={() => onEliminar(item.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleDecrement}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="font-semibold text-lg w-8 text-center">{item.cantidad}</span>
          <button
            onClick={handleIncrement}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
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
  );
};

export default CarritoItem;