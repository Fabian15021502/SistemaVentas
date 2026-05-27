import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, 
  DollarSign, 
  CreditCard, 
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  TrendingUp,
  X
} from 'lucide-react';
import turnoService from '../../services/TurnoService';

const TurnoCajaPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [cajaActiva, setCajaActiva] = useState(null);
  const [ventasTurno, setVentasTurno] = useState([]);
  const [ventasCaja, setVentasCaja] = useState([]);
  const [cierresCaja, setCierresCaja] = useState([]);
  
  // Modales
  const [mostrarModalAperturaTurno, setMostrarModalAperturaTurno] = useState(false);
  const [mostrarModalAperturaCaja, setMostrarModalAperturaCaja] = useState(false);
  const [mostrarModalCierreCaja, setMostrarModalCierreCaja] = useState(false);
  const [mostrarModalCierreTurno, setMostrarModalCierreTurno] = useState(false);
  
  // Estados de formularios
  const [baseApertura, setBaseApertura] = useState('');
  const [formCierre, setFormCierre] = useState({
    efectivoReal: '',
    tarjetaReal: '',
    transferenciaReal: '',
    observaciones: ''
  });
  const [observacionesTurno, setObservacionesTurno] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [user]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const turno = await turnoService.obtenerTurnoActivo();
      setTurnoActivo(turno);

      if (turno) {
        // Cargar ventas del turno
        const ventasTurnoData = await turnoService.obtenerVentasDelTurno(turno.id);
        setVentasTurno(ventasTurnoData);

        // Cargar caja activa del usuario
        const caja = await turnoService.obtenerCajaActiva(turno.id, user.email);
        setCajaActiva(caja);

        if (caja) {
          // Cargar ventas de la caja
          const ventasCajaData = await turnoService.obtenerVentasDeCaja(caja.id);
          setVentasCaja(ventasCajaData);
        }

        // Cargar cierres de caja del turno
        const cierres = await turnoService.obtenerCierresCaja(turno.id);
        setCierresCaja(cierres);
      } else {
        setMostrarModalAperturaTurno(true);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // TURNO
  const handleAbrirTurno = async () => {
    try {
      await turnoService.abrirTurno();
      setMostrarModalAperturaTurno(false);
      await cargarDatos();
    } catch (error) {
      alert('Error al abrir turno: ' + error.message);
    }
  };

  const handleCerrarTurno = async () => {
    try {
      if (cajaActiva) {
        alert('Debes cerrar tu caja antes de cerrar el turno');
        return;
      }

      await turnoService.cerrarTurno(turnoActivo.id, { observaciones: observacionesTurno });
      setMostrarModalCierreTurno(false);
      alert('Turno cerrado exitosamente');
      navigate('/dashboard');
    } catch (error) {
      alert('Error al cerrar turno: ' + error.message);
    }
  };

  // CAJA
  const handleAbrirCaja = async () => {
    try {
      const base = parseFloat(baseApertura);
      if (isNaN(base) || base < 0) {
        alert('Ingresa una base válida');
        return;
      }

      await turnoService.abrirCaja({
        empleado: user.email,
        baseInicial: base
      });

      setMostrarModalAperturaCaja(false);
      setBaseApertura('');
      await cargarDatos();
    } catch (error) {
      alert('Error al abrir caja: ' + error.message);
    }
  };

  const handleCerrarCaja = async () => {
    try {
      const efectivo = parseFloat(formCierre.efectivoReal) || 0;
      const tarjeta = parseFloat(formCierre.tarjetaReal) || 0;
      const transferencia = parseFloat(formCierre.transferenciaReal) || 0;

      await turnoService.cerrarCaja(cajaActiva.id, {
        efectivoReal: efectivo,
        tarjetaReal: tarjeta,
        transferenciaReal: transferencia,
        observaciones: formCierre.observaciones
      });

      setMostrarModalCierreCaja(false);
      setFormCierre({
        efectivoReal: '',
        tarjetaReal: '',
        transferenciaReal: '',
        observaciones: ''
      });

      alert('Caja cerrada exitosamente');
      await cargarDatos();
    } catch (error) {
      alert('Error al cerrar caja: ' + error.message);
    }
  };

  // Cálculos
  const calcularTotales = (ventas) => {
    const totales = {
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
      fiado: 0,
      total: 0
    };

    ventas.forEach(venta => {
      const metodo = (venta.metodoPago || '').toLowerCase();
      const total = parseFloat(venta.total) || 0;
      
      if (metodo && totales[metodo] !== undefined) {
        totales[metodo] += total;
      }
      totales.total += total;
    });

    return totales;
  };

  const totalesTurno = calcularTotales(ventasTurno);
  const totalesCaja = cajaActiva ? calcularTotales(ventasCaja) : null;
  const totalEfectivoEsperado = cajaActiva ? (cajaActiva.baseInicial + totalesCaja.efectivo) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

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
                <h1 className="text-2xl font-bold text-gray-900">Control de Turno y Caja</h1>
                <p className="text-sm text-gray-600">
                  {turnoActivo ? 'Turno activo' : 'Sin turno activo'}
                  {cajaActiva && ' • Caja abierta'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {turnoActivo && !cajaActiva && (
                <button
                  onClick={() => setMostrarModalAperturaCaja(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  Abrir Caja
                </button>
              )}

              {cajaActiva && (
                <button
                  onClick={() => setMostrarModalCierreCaja(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Cerrar Caja
                </button>
              )}

              {turnoActivo && !cajaActiva && (
                <button
                  onClick={() => setMostrarModalCierreTurno(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Cerrar Turno
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {turnoActivo ? (
          <div className="space-y-6">
            {/* Info del Turno */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Turno Activo</h2>
                  <p className="text-blue-100 text-sm">
                    Iniciado: {(() => {
                      const f = turnoActivo.fechaInicio;
                      const d = f?.seconds ? new Date(f.seconds * 1000) : f?._seconds ? new Date(f._seconds * 1000) : new Date(f);
                      return isNaN(d) ? '' : d.toLocaleString('es-CO');
                    })()}
                  </p>
                </div>
                <Clock className="w-12 h-12 opacity-50" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-blue-100 text-sm">Efectivo</p>
                  <p className="text-2xl font-bold">${totalesTurno.efectivo.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Tarjeta</p>
                  <p className="text-2xl font-bold">${totalesTurno.tarjeta.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Transferencia</p>
                  <p className="text-2xl font-bold">${totalesTurno.transferencia.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Total</p>
                  <p className="text-3xl font-bold">${totalesTurno.total.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Info de Mi Caja */}
            {cajaActiva ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Mi Caja</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Base Inicial</p>
                    <p className="text-xl font-bold text-gray-900">${(parseFloat(cajaActiva.baseInicial) || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Efectivo Esperado</p>
                    <p className="text-xl font-bold text-green-600">${totalEfectivoEsperado.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ventas</p>
                    <p className="text-xl font-bold text-blue-600">{ventasCaja.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-xl font-bold text-purple-600">${totalesCaja.total.toLocaleString()}</p>
                  </div>
                </div>

                {/* Ventas de mi caja */}
                <div className="mt-6">
                  <h3 className="text-md font-semibold text-gray-900 mb-3">Mis Ventas</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Hora</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Método</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {ventasCaja.map((venta) => (
                          <tr key={venta.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {(() => {
                                const f = venta.fecha;
                                const d = f?.seconds ? new Date(f.seconds * 1000) : f?._seconds ? new Date(f._seconds * 1000) : new Date(f);
                                return isNaN(d) ? '--:--' : d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
                              })()}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                venta.metodoPago === 'efectivo' ? 'bg-green-100 text-green-800' :
                                venta.metodoPago === 'tarjeta' ? 'bg-blue-100 text-blue-800' :
                                venta.metodoPago === 'transferencia' ? 'bg-purple-100 text-purple-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {venta.metodoPago}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm font-semibold text-gray-900">
                              ${venta.total.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                <p className="text-yellow-900 font-medium">No tienes una caja abierta</p>
                <button
                  onClick={() => setMostrarModalAperturaCaja(true)}
                  className="mt-4 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Abrir Caja
                </button>
              </div>
            )}

            {/* Cierres de Caja del Turno */}
            {cierresCaja.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Cierres de Caja del Turno ({cierresCaja.length})
                </h2>
                <div className="space-y-3">
                  {cierresCaja.map((cierre) => (
                    <div key={cierre.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{cierre.empleado.split('@')[0]}</p>
                          <p className="text-xs text-gray-600">
                            {(() => {
                              const f = cierre.fechaCierre;
                              const d = f?.seconds ? new Date(f.seconds * 1000) : f?._seconds ? new Date(f._seconds * 1000) : new Date(f);
                              return isNaN(d) ? 'Sin fecha' : d.toLocaleString('es-CO');
                            })()}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          cierre.diferencia === 0 ? 'bg-green-100 text-green-800' :
                          cierre.diferencia > 0 ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {cierre.diferencia >= 0 ? '+' : ''}${(cierre.diferencia ?? 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Esperado:</span>
                          <span className="ml-2 font-semibold">${(cierre.totalEsperado ?? 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Real:</span>
                          <span className="ml-2 font-semibold">${(cierre.totalReal ?? 0).toLocaleString()}</span>
                        </div>
                      </div>
                      {cierre.observaciones && (
                        <p className="text-sm text-gray-600 mt-2 italic">"{cierre.observaciones}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">No hay turno activo</p>
            <button
              onClick={() => setMostrarModalAperturaTurno(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Abrir Turno del Día
            </button>
          </div>
        )}
      </main>

      {/* Modal Apertura Turno */}
      {mostrarModalAperturaTurno && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
              <h2 className="text-xl font-bold">Apertura de Turno</h2>
              <p className="text-blue-100 text-sm mt-1">Inicia el turno del día</p>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                ¿Estás seguro de abrir el turno del día? Una vez abierto, los empleados podrán abrir sus cajas.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setMostrarModalAperturaTurno(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAbrirTurno}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Abrir Turno
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Apertura Caja */}
      {mostrarModalAperturaCaja && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-xl">
              <h2 className="text-xl font-bold">Apertura de Caja</h2>
              <p className="text-green-100 text-sm mt-1">Ingresa la base inicial de efectivo</p>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Inicial (Efectivo) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={baseApertura}
                    onChange={(e) => setBaseApertura(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-semibold"
                    placeholder="0"
                    min="0"
                    step="1000"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setMostrarModalAperturaCaja(false);
                    setBaseApertura('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAbrirCaja}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Abrir Caja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cierre Caja */}
      {mostrarModalCierreCaja && totalesCaja && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6 rounded-t-xl sticky top-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Cierre de Caja</h2>
                  <p className="text-orange-100 text-sm mt-1">Verifica los montos</p>
                </div>
                <button
                  onClick={() => setMostrarModalCierreCaja(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Valores Esperados */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-3">Valores Esperados del Sistema</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-700">Efectivo (Base + Ventas)</p>
                    <p className="text-lg font-bold text-blue-900">${totalEfectivoEsperado.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Tarjeta</p>
                    <p className="text-lg font-bold text-blue-900">${totalesCaja.tarjeta.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Transferencia</p>
                    <p className="text-lg font-bold text-blue-900">${totalesCaja.transferencia.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Total</p>
                    <p className="text-lg font-bold text-blue-900">
                      ${(totalEfectivoEsperado + totalesCaja.tarjeta + totalesCaja.transferencia).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Valores Reales */}
              <h3 className="font-semibold text-gray-900 mb-4">Valores Reales Contados</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Efectivo Real *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formCierre.efectivoReal}
                      onChange={(e) => setFormCierre({ ...formCierre, efectivoReal: e.target.value })}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  {formCierre.efectivoReal && (
                    <p className={`text-sm mt-1 ${
                      parseFloat(formCierre.efectivoReal) === totalEfectivoEsperado
                        ? 'text-green-600'
                        : 'text-orange-600'
                    }`}>
                      Diferencia: ${(parseFloat(formCierre.efectivoReal) - totalEfectivoEsperado).toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarjeta Real *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formCierre.tarjetaReal}
                      onChange={(e) => setFormCierre({ ...formCierre, tarjetaReal: e.target.value })}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transferencia Real *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formCierre.transferenciaReal}
                      onChange={(e) => setFormCierre({ ...formCierre, transferenciaReal: e.target.value })}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={formCierre.observaciones}
                    onChange={(e) => setFormCierre({ ...formCierre, observaciones: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    rows="3"
                    placeholder="Novedades, faltantes, sobrantes..."
                  />
                </div>
              </div>

              <div className="flex gap-3 sticky bottom-0 bg-white pt-4">
                <button
                  onClick={() => setMostrarModalCierreCaja(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCerrarCaja}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                >
                  Cerrar Caja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cierre Turno */}
      {mostrarModalCierreTurno && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-xl">
              <h2 className="text-xl font-bold">Cerrar Turno del Día</h2>
              <p className="text-red-100 text-sm mt-1">Finaliza el turno</p>
            </div>
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ Asegúrate de que todas las cajas estén cerradas antes de cerrar el turno.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones finales
                </label>
                <textarea
                  value={observacionesTurno}
                  onChange={(e) => setObservacionesTurno(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows="3"
                  placeholder="Notas sobre el turno..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setMostrarModalCierreTurno(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCerrarTurno}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  Cerrar Turno
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TurnoCajaPage;