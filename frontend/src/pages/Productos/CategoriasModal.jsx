import { X } from 'lucide-react';
import { useMemo } from 'react';

const CategoriasModal = ({ isOpen, onClose, onSave, categoria = null }) => {
  // 🔧 CORRECCIÓN: Usar useMemo para inicializar el estado sin useEffect
  const initialFormData = useMemo(() => {
    if (categoria) {
      return {
        nombre: categoria.nombre || '',
        descripcion: categoria.descripcion || ''
      };
    }
    return {
      nombre: '',
      descripcion: ''
    };
  }, [categoria]);

  // Usar un key para forzar el reset del formulario cuando cambia la categoría
  const formKey = useMemo(() => {
    return categoria ? `edit-${categoria.id}` : 'new';
  }, [categoria]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = {
      nombre: e.target.nombre.value,
      descripcion: e.target.descripcion.value
    };
    onSave(formData);
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
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form key={formKey} onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Categoría *
              </label>
              <input
                type="text"
                name="nombre"
                defaultValue={initialFormData.nombre}
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
                name="descripcion"
                defaultValue={initialFormData.descripcion}
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
              onClick={onClose}
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