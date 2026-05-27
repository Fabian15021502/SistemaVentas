import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Receipt, Edit2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import facturasService from '../../services/facturasService';
import EditarFacturaModal from '../../components/facturas/EditarFacturaModal';

const FacturasPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facturaEditando, setFacturaEditando] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    cargarFacturas();
  }, [user]);

  const cargarFacturas = async () => {
    try {
      setLoading(true);
      const ultimasFacturas = await facturasService.obtenerUltimasFacturas(
        user?.email || user?.uid,
        3
      );
      setFacturas(ultimasFacturas);
    } catch (error) {
      console.error('Error al cargar facturas:', error);
      alert('Error al cargar facturas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditarFactura = (factura) => {
    setFacturaEditando(factura);
    setMostrarModal(true);
  };

  const handleGuardarCambios = async (ventaId, datosActualizados) => {
    try {
      await facturasService.actualizarVenta(ventaId, datosActualizados);
      await cargarFacturas();
      alert('Factura actualizada exitosamente');
    } catch (error) {
      console.error('Error al actualizar factura:', error);
      throw error;
    }
  };

  const handleCancelarFactura = async (factura) => {
    const motivo = prompt('Ingrese el motivo de cancelación:');
    if (!motivo) return;

    try {
      await facturasService.cancelarVenta(factura.id, motivo);
      await cargarFacturas();
      alert('Factura cancelada exitosamente');
    } catch (error) {
      console.error('Error al cancelar factura:', error);
      alert('Error: ' + error.message);
    }
  };

  const puedeEditarFactura = (factura) => {
    // fecha puede ser Timestamp de Firestore {seconds:N}, string ISO, o Date
    const f = factura.fecha;
    let fechaVenta;
    if (f?.seconds)        fechaVenta = new Date(f.seconds * 1000);
    else if (f?._seconds)  fechaVenta = new Date(f._seconds * 1000);
    else                   fechaVenta = new Date(f);

    if (isNaN(fechaVenta)) return true; // si no se puede parsear, permitir edición
    const ahora = new Date();
    const horasTranscurridas = (ahora - fechaVenta) / (1000 * 60 * 60);
    return horasTranscurridas <= 24;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Cargando facturas...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mis Facturas Recientes</h1>
                <p className="text-sm text-gray-600">Últimas 3 facturas - 24 horas para editar</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">Importante</p>
            <p className="text-sm text-blue-600 mt-1">
              Solo puedes editar o cancelar facturas de las últimas 24 horas.
              Después de ese tiempo, las facturas quedan bloqueadas.
            </p>
          </div>
        </div>

        {/* Lista de Facturas */}
        <div className="space-y-6">
          {facturas.length > 0 ? (
            facturas.map((factura) => {
              const puedeEditar = puedeEditarFactura(factura);
              const _f = factura.fecha;
              const fechaVenta = _f?.seconds ? new Date(_f.seconds*1000) : _f?._seconds ? new Date(_f._seconds*1000) : new Date(_f);

              return (
                <div key={factura.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  {/* Header de Factura */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Receipt className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          Factura #{factura.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {fechaVenta.toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {puedeEditar ? (
                        <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Editable
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          <XCircle className="w-3 h-3" />
                          Bloqueada
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detalles */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Total</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${factura.total.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Método de Pago</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">
                        {factura.metodoPago}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Cliente</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {factura.clienteNombre || 'Cliente General'}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Productos</h4>
                    <div className="space-y-2">
                      {factura.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {item.productoNombre}
                              {item.variacionValor && (
                                <span className="text-gray-600 ml-2">({item.variacionValor})</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600">
                              {item.cantidad} x ${item.precioUnitario.toLocaleString()}
                            </p>
                          </div>
                          <p className="font-semibold text-gray-900">
                            ${item.subtotal.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botones */}
                  {puedeEditar && (
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleEditarFactura(factura)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar Factura
                      </button>
                      <button
                        onClick={() => handleCancelarFactura(factura)}
                        className="flex-1 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                      >
                        Cancelar Factura
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tienes facturas recientes</p>
              <button
                onClick={() => navigate('/ventas')}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crear Nueva Venta
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Edición */}
      <EditarFacturaModal
        isOpen={mostrarModal}
        onClose={() => {
          setMostrarModal(false);
          setFacturaEditando(null);
        }}
        factura={facturaEditando}
        onGuardar={handleGuardarCambios}
      />
    </div>
  );
};

export default FacturasPage;