import { useState } from 'react';
import { X, DollarSign, CreditCard, Receipt, AlertCircle } from 'lucide-react';

const AbonoModal = ({ isOpen, onClose, deudor, onRegistrarAbono }) => {
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [nota, setNota] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !deudor) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const montoNumerico = parseFloat(monto);

    // Validaciones
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      setError('Ingresa un monto válido');
      setLoading(false);
      return;
    }

    if (montoNumerico > deudor.saldoPendiente) {
      setError(`El abono no puede ser mayor al saldo pendiente ($${deudor.saldoPendiente.toLocaleString()})`);
      setLoading(false);
      return;
    }

    try {
      await onRegistrarAbono({
        deudorId: deudor.id,
        monto: montoNumerico,
        metodoPago,
        nota
      });

      // Limpiar y cerrar
      setMonto('');
      setNota('');
      setMetodoPago('efectivo');
      onClose();
    } catch (err) {
      setError(err.message || 'Error al registrar el abono');
    } finally {
      setLoading(false);
    }
  };

  const setSaldoCompleto = () => {
    setMonto(deudor.saldoPendiente.toString());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-full">
                <DollarSign className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">Registrar Abono</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Info del deudor */}
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-green-100 text-sm mb-1">Cliente</p>
            <p className="font-semibold">{deudor.nombre}</p>
            <p className="text-sm text-green-200 mt-1">{deudor.telefono}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Saldo pendiente */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-800 font-medium">Saldo Pendiente:</span>
              <span className="text-2xl font-bold text-orange-600">
                ${deudor.saldoPendiente.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Monto */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto del Abono *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-semibold"
                placeholder="0"
                min="0"
                step="100"
                required
                disabled={loading}
              />
            </div>
            <button
              type="button"
              onClick={setSaldoCompleto}
              className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Pagar saldo completo
            </button>
          </div>

          {/* Método de pago */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Método de Pago
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setMetodoPago('efectivo')}
                disabled={loading}
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
                type="button"
                onClick={() => setMetodoPago('tarjeta')}
                disabled={loading}
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
                type="button"
                onClick={() => setMetodoPago('transferencia')}
                disabled={loading}
                className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  metodoPago === 'transferencia'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Receipt className={`w-5 h-5 ${
                  metodoPago === 'transferencia' ? 'text-purple-600' : 'text-gray-400'
                }`} />
                <span className={`font-medium ${
                  metodoPago === 'transferencia' ? 'text-purple-900' : 'text-gray-700'
                }`}>
                  Transferencia
                </span>
              </button>
            </div>
          </div>

          {/* Nota */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nota (Opcional)
            </label>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows="3"
              placeholder="Agregar comentario sobre el abono..."
              disabled={loading}
            />
          </div>

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
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-colors font-semibold disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Registrar Abono'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AbonoModal;