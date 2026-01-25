// Servicio para manejar deudores y abonos
import ventasService from './ventasService';

class DeudoresService {
  constructor() {
    this.deudoresKey = 'deudores';
    this.deudasKey = 'deudas';
    this.abonosKey = 'abonos';
    this.initializeData();
  }

  initializeData() {
    if (!localStorage.getItem(this.abonosKey)) {
      localStorage.setItem(this.abonosKey, JSON.stringify([]));
    }
  }

  // ========== DEUDORES ==========

  getDeudores() {
    return ventasService.getDeudores();
  }

  getDeudor(id) {
    const deudores = this.getDeudores();
    return deudores.find(d => d.id === id);
  }

  getDeudoresActivos() {
    const deudores = this.getDeudores();
    return deudores.filter(d => d.activo && d.saldoPendiente > 0);
  }

  buscarDeudores(termino) {
    const deudores = this.getDeudores();
    const terminoLower = termino.toLowerCase();
    return deudores.filter(d => 
      d.nombre.toLowerCase().includes(terminoLower) ||
      d.telefono.includes(termino)
    );
  }

  // ========== DEUDAS ==========

  getDeudas() {
    return ventasService.getDeudas();
  }

  getDeudasPorDeudor(deudorId) {
    const deudas = this.getDeudas();
    return deudas.filter(d => d.deudorId === deudorId);
  }

  // ========== ABONOS ==========

  getAbonos() {
    const data = localStorage.getItem(this.abonosKey);
    return data ? JSON.parse(data) : [];
  }

  getAbonosPorDeuda(deudaId) {
    const abonos = this.getAbonos();
    return abonos.filter(a => a.deudaId === deudaId);
  }

  registrarAbono(deudaId, monto, metodoPago, nota, empleadoId) {
    const deudas = this.getDeudas();
    const deudaIndex = deudas.findIndex(d => d.id === deudaId);
    
    if (deudaIndex === -1) {
      throw new Error('Deuda no encontrada');
    }

    const deuda = deudas[deudaIndex];
    
    if (monto > deuda.saldo) {
      throw new Error('El abono no puede ser mayor al saldo pendiente');
    }

    // Registrar abono
    const abonos = this.getAbonos();
    const newId = Math.max(0, ...abonos.map(a => a.id)) + 1;
    
    const nuevoAbono = {
      id: newId,
      deudaId,
      fecha: new Date().toISOString(),
      monto,
      metodoPago,
      nota: nota || '',
      registradoPor: empleadoId
    };
    
    abonos.push(nuevoAbono);
    localStorage.setItem(this.abonosKey, JSON.stringify(abonos));

    // Actualizar saldo de la deuda
    const nuevoSaldo = deuda.saldo - monto;
    deuda.saldo = nuevoSaldo;
    deuda.estado = nuevoSaldo === 0 ? 'Pagada' : 'Pendiente';
    
    localStorage.setItem(this.deudasKey, JSON.stringify(deudas));

    // Actualizar totales del deudor
    const deudores = this.getDeudores();
    const deudorIndex = deudores.findIndex(d => d.id === deuda.deudorId);
    
    if (deudorIndex !== -1) {
      deudores[deudorIndex].saldoPendiente -= monto;
      
      // Si no tiene más deudas pendientes, marcar como inactivo
      if (deudores[deudorIndex].saldoPendiente === 0) {
        deudores[deudorIndex].activo = true; // Mantener activo para historial
      }
      
      localStorage.setItem(this.deudoresKey, JSON.stringify(deudores));
    }

    return nuevoAbono;
  }

  // ========== ESTADÍSTICAS ==========

  getTotalDeudaPendiente() {
    const deudores = this.getDeudores();
    return deudores.reduce((total, deudor) => total + deudor.saldoPendiente, 0);
  }

  getDeudoresMorosos(diasLimite = 30) {
    const deudas = this.getDeudas();
    const ahora = new Date();
    const deudoresMorosos = [];

    deudas.forEach(deuda => {
      if (deuda.estado === 'Pendiente') {
        const fechaDeuda = new Date(deuda.fecha);
        const diasTranscurridos = Math.floor((ahora - fechaDeuda) / (1000 * 60 * 60 * 24));
        
        if (diasTranscurridos > diasLimite) {
          const deudor = this.getDeudor(deuda.deudorId);
          if (deudor && !deudoresMorosos.find(d => d.id === deudor.id)) {
            deudoresMorosos.push({
              ...deudor,
              diasMorosidad: diasTranscurridos
            });
          }
        }
      }
    });

    return deudoresMorosos;
  }

  getHistorialCompleto(deudorId) {
    const deudas = this.getDeudasPorDeudor(deudorId);
    const abonos = this.getAbonos();
    
    return deudas.map(deuda => {
      const abonosDeuda = abonos.filter(a => a.deudaId === deuda.id);
      return {
        ...deuda,
        abonos: abonosDeuda
      };
    });
  }
}

// Exportar instancia única
const deudoresService = new DeudoresService();
export default deudoresService;