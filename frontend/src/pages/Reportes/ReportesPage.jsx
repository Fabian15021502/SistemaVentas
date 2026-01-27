import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Calendar, FileText, TrendingUp, ArrowLeft } from 'lucide-react';
import ventasService from '../../services/ventasService';
import productosService from '../../services/productosService';
import deudoresService from '../../services/deudoresService';

const ReportesPage = () => {
  const navigate = useNavigate();
  const [reporteActivo, setReporteActivo] = useState('ventas');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [datosVentas, setDatosVentas] = useState([]);
  const [datosProductos, setDatosProductos] = useState([]);
  const [datosDeudores, setDatosDeudores] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Establecer fechas por defecto (último mes)
  useEffect(() => {
    const hoy = new Date();
    const haceUnMes = new Date();
    haceUnMes.setMonth(haceUnMes.getMonth() - 1);
    
    setFechaInicio(haceUnMes.toISOString().split('T')[0]);
    setFechaFin(hoy.toISOString().split('T')[0]);
  }, []);

  const generarReporte = async () => {
    setCargando(true);
    try {
      switch (reporteActivo) {
        case 'ventas': {
          const ventas = await ventasService.obtenerVentas();
          setDatosVentas(ventas);
          break;
        }
        case 'productos': {
          const productos = await productosService.obtenerProductos();
          setDatosProductos(productos);
          break;
        }
        case 'deudores': {
          const deudores = await deudoresService.obtenerDeudores();
          setDatosDeudores(deudores);
          break;
        }
      }
    } catch (error) {
      console.error('Error al generar reporte:', error);
    } finally {
      setCargando(false);
    }
  };

  const exportarAExcel = () => {
    // Implementación básica para exportar
    let datos = [];
    let nombreArchivo = '';
    
    switch (reporteActivo) {
      case 'ventas':
        datos = datosVentas;
        nombreArchivo = `reporte_ventas_${fechaInicio}_${fechaFin}.csv`;
        break;
      case 'productos':
        datos = datosProductos;
        nombreArchivo = 'reporte_productos.csv';
        break;
      case 'deudores':
        datos = datosDeudores;
        nombreArchivo = 'reporte_deudores.csv';
        break;
    }
    
    if (datos.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    
    // Convertir a CSV
    const cabeceras = Object.keys(datos[0]).join(',');
    const filas = datos.map(obj => Object.values(obj).join(','));
    const csv = [cabeceras, ...filas].join('\n');
    
    // Crear y descargar archivo
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const tiposReporte = [
    { id: 'ventas', nombre: 'Reporte de Ventas', icon: TrendingUp, color: 'bg-blue-500' },
    { id: 'productos', nombre: 'Reporte de Productos', icon: FileText, color: 'bg-green-500' },
    { id: 'deudores', nombre: 'Reporte de Deudores', icon: Calendar, color: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
                Volver
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
                <p className="text-sm text-gray-600">Genera informes de ventas, productos y deudores</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Selector de tipo de reporte */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {tiposReporte.map((tipo) => {
            const Icon = tipo.icon;
            return (
              <button
                key={tipo.id}
                onClick={() => setReporteActivo(tipo.id)}
                className={`p-6 rounded-xl shadow-sm border transition-all ${
                  reporteActivo === tipo.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`${tipo.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{tipo.nombre}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {reporteActivo === tipo.id ? 'Seleccionado' : 'Seleccionar'}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Filtros */}
        {reporteActivo === 'ventas' && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros de Fecha</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de fin
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={generarReporte}
                  disabled={cargando}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {cargando ? 'Generando...' : 'Generar Reporte'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Botón de exportación */}
        <div className="flex justify-end mb-8">
          <button
            onClick={exportarAExcel}
            disabled={cargando || (
              (reporteActivo === 'ventas' && datosVentas.length === 0) ||
              (reporteActivo === 'productos' && datosProductos.length === 0) ||
              (reporteActivo === 'deudores' && datosDeudores.length === 0)
            )}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            <Download className="w-5 h-5" />
            Exportar a Excel
          </button>
        </div>

        {/* Vista previa del reporte */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Vista Previa del Reporte
          </h3>
          
          {cargando ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600">Generando reporte...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {reporteActivo === 'ventas' && datosVentas.length > 0 && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método Pago</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {datosVentas.map((venta) => (
                      <tr key={venta.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{venta.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(venta.fecha).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {venta.clienteNombre || 'Cliente General'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${venta.total.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {venta.metodoPago}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              
              {reporteActivo === 'productos' && datosProductos.length > 0 && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {datosProductos.map((producto) => (
                      <tr key={producto.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{producto.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{producto.nombre}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{producto.categoriaId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${producto.precioBase.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            producto.activo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {producto.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              
              {reporteActivo === 'deudores' && datosDeudores.length > 0 && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deuda Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo Pendiente</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {datosDeudores.map((deudor) => (
                      <tr key={deudor.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{deudor.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{deudor.nombre}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{deudor.telefono}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${deudor.totalDeuda.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            deudor.saldoPendiente > 0
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            ${deudor.saldoPendiente.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              
              {!cargando && (
                (reporteActivo === 'ventas' && datosVentas.length === 0) ||
                (reporteActivo === 'productos' && datosProductos.length === 0) ||
                (reporteActivo === 'deudores' && datosDeudores.length === 0)
              ) && (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay datos para mostrar. Genera el reporte primero.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Estadísticas rápidas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Total Registros</h4>
            <p className="text-2xl font-bold text-blue-700">
              {reporteActivo === 'ventas' && datosVentas.length}
              {reporteActivo === 'productos' && datosProductos.length}
              {reporteActivo === 'deudores' && datosDeudores.length}
            </p>
          </div>
          <div className="bg-green-50 rounded-xl p-6 border border-green-100">
            <h4 className="text-sm font-medium text-green-900 mb-2">Total Monetario</h4>
            <p className="text-2xl font-bold text-green-700">
              {reporteActivo === 'ventas' && `$${datosVentas.reduce((sum, v) => sum + (v.total || 0), 0).toLocaleString()}`}
              {reporteActivo === 'productos' && `${datosProductos.length} productos`}
              {reporteActivo === 'deudores' && `$${datosDeudores.reduce((sum, d) => sum + (d.saldoPendiente || 0), 0).toLocaleString()}`}
            </p>
          </div>
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
            <h4 className="text-sm font-medium text-purple-900 mb-2">Periodo</h4>
            <p className="text-2xl font-bold text-purple-700">
              {reporteActivo === 'ventas' 
                ? `${fechaInicio} a ${fechaFin}`
                : 'Todos los registros'
              }
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportesPage;