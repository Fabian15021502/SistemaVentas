import { useState } from 'react';
import { X, TrendingUp, TrendingDown, RefreshCw, AlertCircle, DollarSign } from 'lucide-react';

const MovimientoModal = ({ isOpen, onClose, onRegistrar, item, producto, stockActual }) => {
  const [formData, setFormData] = useState({
    tipo: 'entrada',
    cantidad: '',
    motivo: '',
    referencia: '',
    costo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cantidad = parseInt(formData.cantidad);

    // Validaciones
    if (isNaN(cantidad) || cantidad <= 0) {
      setError('Ingresa una cantidad válida');
      setLoading(false);
      return;
    }

    if (formData.tipo === 'salida' && cantidad > stockActual) {
      setError(`No hay suficiente stock. Stock actual: ${stockActual}`);
      setLoading(false);
      return;
    }

    if (!formData.motivo.trim()) {
      setError('El motivo es obligatorio');
      setLoading(false);
      return;
    }

    try {
      // 🔧 CORRECCIÓN: Pasar correctamente productoId y variacionId
      const movimientoData = {
        productoId: item.productoId,
        tipo: formData.tipo,
        cantidad,
        motivo: formData.motivo,
        referencia: formData.referencia,
        costo: formData.costo ? parseFloat(formData.costo) : 0
      };

      // Solo agregar variacionId si existe
      if (item.variacionId) {
        movimientoData.variacionId = item.variacionId;
      }

      console.log('📝 Enviando movimiento:', movimientoData);

      await onRegistrar(movimientoData);

      // Limpiar y cerrar
      setFormData({
        tipo: 'entrada',
        cantidad: '',
        motivo: '',
        referencia: '',
        costo: ''
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al registrar movimiento');
    } finally {
      setLoading(false);
    }
  };

  const getTipoInfo = () => {
    switch (formData.tipo) {
      case 'entrada':
        return {
          icon: TrendingUp,
          color: 'green',
          label: 'Entrada de Inventario',
          description: 'Aumenta el stock disponible'
        };
      case 'salida':
        return {
          icon: TrendingDown,
          color: 'red',
          label: 'Salida de Inventario',
          description: 'Disminuye el stock disponible'
        };
      case 'ajuste':
        return {
          icon: RefreshCw,
          color: 'blue',
          label: 'Ajuste de Inventario',
          description: 'Corrección de stock por diferencias'
        };
      default:
        return { icon: RefreshCw, color: 'gray', label: '', description: '' };
    }
  };

  const tipoInfo = getTipoInfo();
  const TipoIcon = tipoInfo.icon;

  const calcularStockFinal = () => {
    const cantidad = parseInt(formData.cantidad) || 0;
    switch (formData.tipo) {
      case 'entrada':
      case 'ajuste':
        return stockActual + cantidad;
      case 'salida':
        return Math.max(0, stockActual - cantidad);
      default:
        return stockActual;
    }
  };

  // Obtener nombre de la variación si existe
  const getNombreVariacion = () => {
    if (!item || !item.variacionId) return '';
    
    // Si producto tiene variaciones, buscar el nombre
    if (producto && producto.variaciones && producto.variaciones.length > 0) {
      const variacion = producto.variaciones.find(v => v.id === item.variacionId);
      if (variacion) {
        return ` - ${variacion.valor}`;
      }
    }
    
    return '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`bg-gradient-to-r from-${tipoInfo.color}-600 to-${tipoInfo.color}-700 text-white p-6 rounded-t-xl`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-full">
                <TipoIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Registrar Movimiento</h2>
                <p className="text-sm text-white/90">
                  {producto?.nombre || 'Producto'}{getNombreVariacion()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stock actual */}
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-sm text-white/80 mb-1">Stock Actual</p>
            <p className="text-3xl font-bold">{stockActual.toLocaleString()}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Tipo de movimiento */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Movimiento *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: 'entrada' })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.tipo === 'entrada'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <TrendingUp className={`w-6 h-6 mx-auto mb-2 ${
                  formData.tipo === 'entrada' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <p className={`text-sm font-medium ${
                  formData.tipo === 'entrada' ? 'text-green-900' : 'text-gray-700'
                }`}>
                  Entrada
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: 'salida' })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.tipo === 'salida'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <TrendingDown className={`w-6 h-6 mx-auto mb-2 ${
                  formData.tipo === 'salida' ? 'text-red-600' : 'text-gray-400'
                }`} />
                <p className={`text-sm font-medium ${
                  formData.tipo === 'salida' ? 'text-red-900' : 'text-gray-700'
                }`}>
                  Salida
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: 'ajuste' })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.tipo === 'ajuste'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <RefreshCw className={`w-6 h-6 mx-auto mb-2 ${
                  formData.tipo === 'ajuste' ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <p className={`text-sm font-medium ${
                  formData.tipo === 'ajuste' ? 'text-blue-900' : 'text-gray-700'
                }`}>
                  Ajuste
                </p>
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">{tipoInfo.description}</p>
          </div>

          {/* Cantidad */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad *
            </label>
            <input
              type="number"
              value={formData.cantidad}
              onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
              placeholder="0"
              min="1"
              required
              disabled={loading}
            />
            {formData.cantidad && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Stock después del movimiento: 
                  <span className="font-bold ml-2">{calcularStockFinal().toLocaleString()}</span>
                </p>
              </div>
            )}
          </div>

          {/* Motivo */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo *
            </label>
            <select
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            >
              <option value="">Seleccionar motivo</option>
              {formData.tipo === 'entrada' && (
                <>
                  <option value="Compra a proveedor">Compra a proveedor</option>
                  <option value="Devolución de cliente">Devolución de cliente</option>
                  <option value="Producción">Producción</option>
                  <option value="Donación">Donación</option>
                  <option value="Otro">Otro</option>
                </>
              )}
              {formData.tipo === 'salida' && (
                <>
                  <option value="Venta">Venta</option>
                  <option value="Merma">Merma</option>
                  <option value="Producto dañado">Producto dañado</option>
                  <option value="Obsequio">Obsequio</option>
                  <option value="Robo/Pérdida">Robo/Pérdida</option>
                  <option value="Otro">Otro</option>
                </>
              )}
              {formData.tipo === 'ajuste' && (
                <>
                  <option value="Corrección de inventario">Corrección de inventario</option>
                  <option value="Diferencia en conteo">Diferencia en conteo</option>
                  <option value="Error de registro">Error de registro</option>
                  <option value="Otro">Otro</option>
                </>
              )}
            </select>
          </div>

          {/* Referencia */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referencia (Opcional)
            </label>
            <input
              type="text"
              value={formData.referencia}
              onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Orden de compra #123, Factura #456"
              disabled={loading}
            />
          </div>

          {/* Costo (solo para entradas) */}
          {formData.tipo === 'entrada' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costo Unitario (Opcional)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <DollarSign className="w-5 h-5" />
                </span>
                <input
                  type="number"
                  value={formData.costo}
                  onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>
              {formData.costo && formData.cantidad && (
                <p className="text-sm text-gray-600 mt-2">
                  Costo total: ${(parseFloat(formData.costo) * parseInt(formData.cantidad)).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-3 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 bg-gradient-to-r from-${tipoInfo.color}-600 to-${tipoInfo.color}-700 hover:from-${tipoInfo.color}-700 hover:to-${tipoInfo.color}-800`}
            >
              {loading ? 'Registrando...' : 'Registrar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MovimientoModal;