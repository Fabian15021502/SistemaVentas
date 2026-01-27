// src/pages/TestAPI.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkApiHealth } from '../config/googleSheets';
import productosService from '../services/productosService';
import ventasService from '../services/ventasService';
import deudoresService from '../services/deudoresService';
import dashboardService from '../services/dashboardService';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';

export default function TestAPI() {
  const navigate = useNavigate();
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [testType, setTestType] = useState(''); // success, error, loading

  const ejecutarTest = async (nombreTest, funcionTest) => {
    setLoading(true);
    setTestType('loading');
    setResult(`⏳ Ejecutando ${nombreTest}...`);
    
    try {
      const response = await funcionTest();
      setTestType('success');
      setResult(`✅ ${nombreTest} - EXITOSO\n\n${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setTestType('error');
      setResult(`❌ ${nombreTest} - ERROR\n\n${error.message}\n\n${error.stack || ''}`);
    } finally {
      setLoading(false);
    }
  };

  const tests = {
    // ========== CONEXIÓN ==========
    conexion: () => ejecutarTest('Verificar Conexión API', async () => {
      const isHealthy = await checkApiHealth();
      if (!isHealthy) throw new Error('API no disponible');
      return { status: 'API Conectada correctamente', timestamp: new Date().toISOString() };
    }),

    // ========== CATEGORÍAS ==========
    getCategorias: () => ejecutarTest('Obtener Categorías', () => 
      productosService.obtenerCategorias()
    ),
    
    crearCategoria: () => ejecutarTest('Crear Categoría', () =>
      productosService.crearCategoria({
        nombre: `Categoría Test ${Date.now()}`,
        descripcion: 'Categoría creada desde prueba React'
      })
    ),

    // ========== PRODUCTOS ==========
    getProductos: () => ejecutarTest('Obtener Productos', () =>
      productosService.obtenerProductos()
    ),

    crearProducto: () => ejecutarTest('Crear Producto', async () => {
      const categorias = await productosService.obtenerCategorias();
      if (categorias.length === 0) {
        throw new Error('No hay categorías disponibles. Crea una primero.');
      }
      
      return productosService.crearProducto({
        nombre: `Producto Test ${Date.now()}`,
        categoriaId: categorias[0].id,
        precioBase: 5000,
        variaciones: [
          { tipo: 'Tamaño', valor: 'Pequeño', precioAdicional: 0 },
          { tipo: 'Tamaño', valor: 'Grande', precioAdicional: 1000 }
        ]
      });
    }),

    // ========== VENTAS ==========
    getVentas: () => ejecutarTest('Obtener Ventas', () =>
      ventasService.obtenerVentas()
    ),

    registrarVenta: () => ejecutarTest('Registrar Venta', async () => {
      const productos = await productosService.obtenerProductos();
      if (productos.length === 0) {
        throw new Error('No hay productos disponibles. Crea uno primero.');
      }

      const producto = productos[0];
      const cantidad = 2;
      const precioUnitario = producto.precioBase;
      const subtotal = cantidad * precioUnitario;

      return ventasService.registrarVenta({
        empleadoId: 'test@test.com',
        total: subtotal,
        metodoPago: 'efectivo',
        clienteNombre: 'Cliente de Prueba',
        clienteTelefono: '3001234567',
        items: [
          {
            productoId: producto.id,
            productoNombre: producto.nombre,
            cantidad: cantidad,
            precioUnitario: precioUnitario,
            subtotal: subtotal
          }
        ]
      });
    }),

    // ========== DEUDORES ==========
    getDeudores: () => ejecutarTest('Obtener Deudores', () =>
      deudoresService.obtenerDeudores()
    ),

    crearDeudor: () => ejecutarTest('Crear Deudor', () =>
      deudoresService.crearDeudor({
        nombre: `Deudor Test ${Date.now()}`,
        telefono: '3001234567'
      })
    ),

    crearDeuda: () => ejecutarTest('Crear Deuda', async () => {
      const deudores = await deudoresService.obtenerDeudores();
      if (deudores.length === 0) {
        throw new Error('No hay deudores disponibles. Crea uno primero.');
      }

      return deudoresService.crearDeuda({
        deudorId: deudores[0].id,
        monto: 50000,
        ventaId: ''
      });
    }),

    registrarAbono: () => ejecutarTest('Registrar Abono', async () => {
      const deudores = await deudoresService.obtenerDeudores();
      if (deudores.length === 0) {
        throw new Error('No hay deudores disponibles.');
      }

      const deudas = await deudoresService.obtenerDeudasPorDeudor(deudores[0].id);
      if (deudas.length === 0) {
        throw new Error('El deudor no tiene deudas pendientes.');
      }

      const deudaPendiente = deudas.find(d => d.estado === 'pendiente');
      if (!deudaPendiente) {
        throw new Error('No hay deudas pendientes.');
      }

      return deudoresService.registrarAbono({
        deudaId: deudaPendiente.id,
        monto: 10000,
        metodoPago: 'efectivo',
        notas: 'Abono de prueba',
        registradoPor: 'test@test.com'
      });
    }),

    // ========== DASHBOARD ==========
    getEstadisticas: () => ejecutarTest('Obtener Estadísticas Dashboard', () =>
      dashboardService.obtenerEstadisticas()
    ),

    getVentasPorCategoria: () => ejecutarTest('Ventas por Categoría', () =>
      dashboardService.obtenerVentasPorCategoria(30)
    ),

    getTopProductos: () => ejecutarTest('Top Productos', () =>
      dashboardService.obtenerTopProductos(5, 30)
    )
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">🧪 Pruebas de API - Google Sheets</h1>
              <p className="text-gray-600 mt-2">Verifica que la integración con Google Sheets funcione correctamente</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <ArrowLeft size={20} />
              Volver
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de Pruebas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Pruebas Disponibles</h2>
            
            <div className="space-y-6">
              {/* Conexión */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">🔌 CONEXIÓN</h3>
                <button 
                  onClick={tests.conexion}
                  disabled={loading}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'Probando...' : 'Verificar Conexión'}
                </button>
              </div>

              {/* Categorías */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">📁 CATEGORÍAS</h3>
                <div className="space-y-2">
                  <button 
                    onClick={tests.getCategorias}
                    disabled={loading}
                    className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                  >
                    Obtener Categorías
                  </button>
                  <button 
                    onClick={tests.crearCategoria}
                    disabled={loading}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    Crear Categoría
                  </button>
                </div>
              </div>

              {/* Productos */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">🛍️ PRODUCTOS</h3>
                <div className="space-y-2">
                  <button 
                    onClick={tests.getProductos}
                    disabled={loading}
                    className="w-full bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 disabled:bg-gray-400 transition-colors"
                  >
                    Obtener Productos
                  </button>
                  <button 
                    onClick={tests.crearProducto}
                    disabled={loading}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                  >
                    Crear Producto
                  </button>
                </div>
              </div>

              {/* Ventas */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">💰 VENTAS</h3>
                <div className="space-y-2">
                  <button 
                    onClick={tests.getVentas}
                    disabled={loading}
                    className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:bg-gray-400 transition-colors"
                  >
                    Obtener Ventas
                  </button>
                  <button 
                    onClick={tests.registrarVenta}
                    disabled={loading}
                    className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
                  >
                    Registrar Venta
                  </button>
                </div>
              </div>

              {/* Deudores */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">💳 DEUDORES</h3>
                <div className="space-y-2">
                  <button 
                    onClick={tests.getDeudores}
                    disabled={loading}
                    className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition-colors"
                  >
                    Obtener Deudores
                  </button>
                  <button 
                    onClick={tests.crearDeudor}
                    disabled={loading}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                  >
                    Crear Deudor
                  </button>
                  <button 
                    onClick={tests.crearDeuda}
                    disabled={loading}
                    className="w-full bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 disabled:bg-gray-400 transition-colors"
                  >
                    Crear Deuda
                  </button>
                  <button 
                    onClick={tests.registrarAbono}
                    disabled={loading}
                    className="w-full bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-900 disabled:bg-gray-400 transition-colors"
                  >
                    Registrar Abono
                  </button>
                </div>
              </div>

              {/* Dashboard */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">📊 DASHBOARD</h3>
                <div className="space-y-2">
                  <button 
                    onClick={tests.getEstadisticas}
                    disabled={loading}
                    className="w-full bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 disabled:bg-gray-400 transition-colors"
                  >
                    Estadísticas Generales
                  </button>
                  <button 
                    onClick={tests.getVentasPorCategoria}
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
                  >
                    Ventas por Categoría
                  </button>
                  <button 
                    onClick={tests.getTopProductos}
                    disabled={loading}
                    className="w-full bg-indigo-700 text-white px-4 py-2 rounded-lg hover:bg-indigo-800 disabled:bg-gray-400 transition-colors"
                  >
                    Top Productos
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de Resultados */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              {testType === 'loading' && <Loader2 className="animate-spin" size={24} />}
              {testType === 'success' && <CheckCircle className="text-green-500" size={24} />}
              {testType === 'error' && <XCircle className="text-red-500" size={24} />}
              Resultado
            </h2>
            
            {result ? (
              <div className={`p-4 rounded-lg ${
                testType === 'success' ? 'bg-green-50 border border-green-200' :
                testType === 'error' ? 'bg-red-50 border border-red-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-[600px]">
                  {result}
                </pre>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">
                <p className="text-lg">Selecciona una prueba para comenzar</p>
                <p className="text-sm mt-2">Los resultados aparecerán aquí</p>
              </div>
            )}
          </div>
        </div>

        {/* Instrucciones */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-yellow-800 mb-2">⚠️ Instrucciones</h3>
          <ul className="list-disc list-inside space-y-1 text-yellow-700">
            <li>Asegúrate de haber configurado la URL del API en <code className="bg-yellow-100 px-1 rounded">src/config/googleSheets.js</code></li>
            <li>Verifica que el SHEET_ID esté correctamente configurado en Google Apps Script</li>
            <li>Ejecuta primero "Verificar Conexión" para asegurar que todo funcione</li>
            <li>Si encuentras errores, revisa la consola del navegador (F12)</li>
            <li>Puedes eliminar esta página en producción</li>
          </ul>
        </div>
      </div>
    </div>
  );
}