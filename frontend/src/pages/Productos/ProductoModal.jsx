import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const ProductoModal = ({ isOpen, onClose, onSave, producto = null, categorias = [] }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    categoriaId: '',
    precioBase: '',
    variaciones: []
  });

  const [nuevaVariacion, setNuevaVariacion] = useState({
    tipo: '',
    valor: '',
    precioAdicional: 0
  });

  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre,
        categoriaId: producto.categoriaId,
        precioBase: producto.precioBase,
        variaciones: producto.variaciones || []
      });
    } else {
      setFormData({
        nombre: '',
        categoriaId: categorias.length > 0 ? categorias[0].id : '',
        precioBase: '',
        variaciones: []
      });
    }
  }, [producto, isOpen, categorias]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      precioBase: parseFloat(formData.precioBase),
      categoriaId: parseInt(formData.categoriaId)
    });
    onClose();
  };

  const agregarVariacion = () => {
    if (nuevaVariacion.tipo && nuevaVariacion.valor) {
      const newId = Math.max(0, ...formData.variaciones.map(v => v.id || 0)) + 1;
      setFormData({
        ...formData,
        variaciones: [
          ...formData.variaciones,
          {
            id: newId,
            tipo: nuevaVariacion.tipo,
            valor: nuevaVariacion.valor,
            precioAdicional: parseFloat(nuevaVariacion.precioAdicional) || 0
          }
        ]
      });
      setNuevaVariacion({ tipo: '', valor: '', precioAdicional: 0 });
    }
  };

  const eliminarVariacion = (id) => {
    setFormData({
      ...formData,
      variaciones: formData.variaciones.filter(v => v.id !== id)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {producto ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Información Básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Coca-Cola"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  value={formData.categoriaId}
                  onChange={(e) => setFormData({ ...formData, categoriaId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Base *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.precioBase}
                  onChange={(e) => setFormData({ ...formData, precioBase: e.target.value })}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  step="100"
                  required
                />
              </div>
            </div>

            {/* Variaciones */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Variaciones (Opcional)</h3>
              
              {/* Lista de variaciones existentes */}
              {formData.variaciones.length > 0 && (
                <div className="space-y-2 mb-4">
                  {formData.variaciones.map((variacion) => (
                    <div
                      key={variacion.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{variacion.tipo}:</span>
                        <span className="ml-2 text-gray-600">{variacion.valor}</span>
                        {variacion.precioAdicional > 0 && (
                          <span className="ml-2 text-green-600 font-medium">
                            +${variacion.precioAdicional.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => eliminarVariacion(variacion.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Agregar nueva variación */}
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={nuevaVariacion.tipo}
                    onChange={(e) => setNuevaVariacion({ ...nuevaVariacion, tipo: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tipo (ej: Tamaño)"
                  />
                  <input
                    type="text"
                    value={nuevaVariacion.valor}
                    onChange={(e) => setNuevaVariacion({ ...nuevaVariacion, valor: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Valor (ej: 1.5L)"
                  />
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">+$</span>
                    <input
                      type="number"
                      value={nuevaVariacion.precioAdicional}
                      onChange={(e) => setNuevaVariacion({ ...nuevaVariacion, precioAdicional: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="0"
                      step="100"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={agregarVariacion}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Variación
                </button>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {producto ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductoModal;