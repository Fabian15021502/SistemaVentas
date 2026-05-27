import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Users, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';
import deudoresService from '../../services/deudoresService';
import DeudorCard from '../../components/deudores/DeudorCard';
import HistorialDeuda from '../../components/deudores/HistorialDeuda';
import AbonoModal from './AbonoModal';

const DeudoresPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [busqueda, setBusqueda] = useState('');
  const [deudorSeleccionado, setDeudorSeleccionado] = useState(null);
  const [deudorParaAbono, setDeudorParaAbono] = useState(null);
  const [historialDeudor, setHistorialDeudor] = useState([]);
  const [mostrarAbonoModal, setMostrarAbonoModal] = useState(false);
  const [filtro, setFiltro] = useState('todos');
  const [deudores, setDeudores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDeudores();
  }, []);

  const cargarDeudores = async () => {
    try {
      setLoading(true);
      const data = await deudoresService.obtenerDeudores();
      setDeudores(data);
    } catch (error) {
      console.error('Error al cargar deudores:', error);
      alert('Error al cargar deudores: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Filtrar deudores
  const deudoresFiltrados = (() => {
    let resultado = deudores;

    // Filtrar por búsqueda
    if (busqueda.trim()) {
      const terminoLower = busqueda.toLowerCase().trim();
      resultado = resultado.filter(d => 
        d.nombre.toLowerCase().includes(terminoLower) ||
        (d.telefono && String(d.telefono).includes(busqueda)) ||
        String(d.id).includes(busqueda)
      );
    }

    // Filtrar por tipo
    switch(filtro) {
      case 'activos':
        resultado = resultado.filter(d => d.saldoPendiente > 0);
        break;
      case 'morosos': {
        // Deudores con más de 30 días
        resultado = resultado.filter(d => {
          if (d.saldoPendiente === 0) return false;
          const diasTranscurridos = Math.floor(
            (new Date() - new Date(d.fechaCreacion)) / (1000 * 60 * 60 * 24)
          );
          return diasTranscurridos > 30;
        });
        break;
      }
      default:
        break;
    }

    return resultado;
  })();

  // Estadísticas
  const stats = {
    totalDeuda: deudores.reduce((sum, d) => sum + d.saldoPendiente, 0),
    deudoresActivos: deudores.filter(d => d.saldoPendiente > 0).length,
    morosos: deudores.filter(d => {
      if (d.saldoPendiente === 0) return false;
      const dias = Math.floor((new Date() - new Date(d.fechaCreacion)) / (1000 * 60 * 60 * 24));
      return dias > 30;
    }).length,
    totalDeudores: deudores.length
  };

  const handleVerDetalle = async (deudor) => {
    try {
      setDeudorSeleccionado(deudor);
      const historial = await deudoresService.obtenerDeudasPorDeudor(deudor.id);
      setHistorialDeudor(historial);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      alert('Error al cargar historial');
    }
  };

  const handleRegistrarAbono = (deudor) => {
    setDeudorParaAbono(deudor);
    setMostrarAbonoModal(true);
  };

  const procesarAbono = async (datos) => {
  try {
    console.log("🎯 Datos recibidos en procesarAbono:", datos); // 🔍 AGREGAR ESTO
    
    // Buscar la primera deuda pendiente del deudor
    const deudasDeudor = await deudoresService.obtenerDeudasPorDeudor(datos.deudorId);
    const deudaPendiente = deudasDeudor.find(d => d.estado === 'pendiente');

    if (!deudaPendiente) {
      throw new Error('No se encontró una deuda pendiente');
    }

    console.log("🎯 Deuda pendiente encontrada:", deudaPendiente); // 🔍 AGREGAR ESTO

    await deudoresService.registrarAbono({
      deudorId: datos.deudorId,  // ✅ Asegúrate que esto esté presente
      deudaId: deudaPendiente.id,
      monto: datos.monto,
      metodoPago: datos.metodoPago,
      notas: datos.nota || '',
      registradoPor: user.uid || user.email
    });

    // Recargar datos
    await cargarDeudores();
    setMostrarAbonoModal(false);
    setDeudorParaAbono(null);
  } catch (error) {
    console.error('Error al procesar abono:', error);
    alert(error.message);
    throw error;
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Cargando deudores...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Deudores</h1>
                <p className="text-sm text-gray-600">Administra créditos y pagos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-orange-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Deuda Total</h3>
            <p className="text-2xl font-bold text-orange-600">
              ${stats.totalDeuda.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Deudores Activos</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.deudoresActivos}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Morosos (+30 días)</h3>
            <p className="text-2xl font-bold text-red-600">{stats.morosos}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Clientes</h3>
            <p className="text-2xl font-bold text-green-600">{stats.totalDeudores}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o teléfono..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filtro por tipo */}
            <div className="flex gap-2">
              <button
                onClick={() => setFiltro('todos')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  filtro === 'todos'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFiltro('activos')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  filtro === 'activos'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Activos
              </button>
              <button
                onClick={() => setFiltro('morosos')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  filtro === 'morosos'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Morosos
              </button>
            </div>
          </div>
        </div>

        {/* Grid de Deudores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deudoresFiltrados.length > 0 ? (
            deudoresFiltrados.map((deudor) => (
              <DeudorCard
                key={deudor.id}
                deudor={deudor}
                onVerDetalle={handleVerDetalle}
                onRegistrarAbono={handleRegistrarAbono}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay deudores que mostrar</p>
              {busqueda && (
                <p className="text-sm text-gray-400 mt-2">
                  Intenta con otra búsqueda
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modales */}
      {deudorSeleccionado && (
        <HistorialDeuda
          deudor={deudorSeleccionado}
          historial={historialDeudor}
          onCerrar={() => {
            setDeudorSeleccionado(null);
            setHistorialDeudor([]);
          }}
        />
      )}

      <AbonoModal
        isOpen={mostrarAbonoModal}
        deudor={deudorParaAbono}
        onClose={() => {
          setMostrarAbonoModal(false);
          setDeudorParaAbono(null);
        }}
        onRegistrarAbono={procesarAbono}
      />
    </div>
  );
};

export default DeudoresPage;