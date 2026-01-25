import { User, Phone, Calendar, DollarSign, AlertCircle } from 'lucide-react';

const DeudorCard = ({ deudor, onVerDetalle, onRegistrarAbono }) => {
  const getDiasMora = () => {
    if (!deudor.fechaCreacion) return 0;
    const fechaCreacion = new Date(deudor.fechaCreacion);
    const ahora = new Date();
    return Math.floor((ahora - fechaCreacion) / (1000 * 60 * 60 * 24));
  };

  const diasMora = getDiasMora();
  const esMoroso = diasMora > 30;

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 p-6 hover:shadow-md transition-all ${
      esMoroso ? 'border-red-300' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full ${
            esMoroso ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            <User className={`w-6 h-6 ${
              esMoroso ? 'text-red-600' : 'text-blue-600'
            }`} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{deudor.nombre}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
              <Phone className="w-3 h-3" />
              <span>{deudor.telefono}</span>
            </div>
          </div>
        </div>
        
        {esMoroso && (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            Moroso
          </span>
        )}
      </div>

      {/* Deuda Info */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Deuda Total:</span>
          <span className="text-lg font-bold text-gray-900">
            ${deudor.totalDeuda.toLocaleString()}
          </span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
          <span className="text-sm text-orange-800 font-medium">Saldo Pendiente:</span>
          <span className="text-xl font-bold text-orange-600">
            ${deudor.saldoPendiente.toLocaleString()}
          </span>
        </div>

        {deudor.saldoPendiente < deudor.totalDeuda && (
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <span className="text-sm text-green-700">Pagado:</span>
            <span className="text-lg font-bold text-green-600">
              ${(deudor.totalDeuda - deudor.saldoPendiente).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Fecha y días */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
        <Calendar className="w-3 h-3" />
        <span>
          Cliente desde {new Date(deudor.fechaCreacion).toLocaleDateString('es-CO')}
          {diasMora > 0 && ` • ${diasMora} días`}
        </span>
      </div>

      {/* Botones */}
      <div className="flex gap-2">
        <button
          onClick={() => onVerDetalle(deudor)}
          className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
        >
          Ver Historial
        </button>
        {deudor.saldoPendiente > 0 && (
          <button
            onClick={() => onRegistrarAbono(deudor)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            <DollarSign className="w-4 h-4" />
            Abonar
          </button>
        )}
      </div>
    </div>
  );
};

export default DeudorCard;