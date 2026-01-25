import { Edit2, Trash2, Tag } from 'lucide-react';

const ProductCard = ({ producto, categoria, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg mb-1">{producto.nombre}</h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {categoria?.nombre || 'Sin categoría'}
            </span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            ${producto.precioBase.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Variaciones */}
      {producto.variaciones && producto.variaciones.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-700 mb-2">Variaciones:</p>
          <div className="flex flex-wrap gap-2">
            {producto.variaciones.map((variacion) => (
              <span
                key={variacion.id}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
              >
                <Tag className="w-3 h-3 mr-1" />
                {variacion.valor}
                {variacion.precioAdicional > 0 && (
                  <span className="ml-1 text-green-600 font-medium">
                    +${variacion.precioAdicional.toLocaleString()}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <button
          onClick={() => onEdit(producto)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          <span className="text-sm font-medium">Editar</span>
        </button>
        <button
          onClick={() => onDelete(producto.id)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm font-medium">Eliminar</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;