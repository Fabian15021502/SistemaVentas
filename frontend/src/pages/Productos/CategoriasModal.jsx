import { useState } from 'react';
import { X } from 'lucide-react';

const CategoriasModal = ({ isOpen, onClose, onSave, categoria = null }) => {
  // 🔧 CORRECCIÓN: Inicializar con los valores del producto si existe
  // Esto evita el warning de setState en useEffect
  const [formData, setFormData] = useState({
    nombre: categoria?.nombre || '',
    descripcion: categoria?.descripcion || ''
  });

  // 🔧 CORRECCIÓN: Resetear form cuando cambia la categoría o se abre/cierra
  // Usar un key en el formulario en lugar de useEffect
  const resetForm = () => {
    if (categoria) {
      setFormData({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: ''
      });
    }
  };

  // Resetear cuando se abre el modal
  if (isOpen && !formData.nombre && categoria) {
    resetForm();
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleClose = () => {
    setFormData({ nombre: '', descripcion: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {categoria ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Categoría *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Bebidas"
                required
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
                placeholder="Descripción de la categoría..."
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {categoria ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoriasModal;