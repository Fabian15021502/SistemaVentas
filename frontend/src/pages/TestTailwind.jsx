function TestTailwind() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
        <div className="text-center mb-6">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Tailwind Funciona!
          </h1>
          <p className="text-gray-600">
            Si ves este diseño con colores y estilos, Tailwind CSS está configurado correctamente.
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm text-blue-800">✓ Degradado de fondo</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <p className="text-sm text-green-800">✓ Tarjeta con sombra</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
            <p className="text-sm text-purple-800">✓ Bordes redondeados</p>
          </div>
        </div>

        <button className="mt-6 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition transform hover:scale-105">
          Botón con Hover
        </button>
      </div>
    </div>
  );
}

export default TestTailwind;