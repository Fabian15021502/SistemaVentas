// src/services/turnoService.js
import api from './apiClient';

const turnoService = {

  // ==================== TURNOS ====================

  async obtenerTurnoActivo() {
    try {
      const response = await api.get('/api/turnos/activo');
      return response.data || null;
    } catch (error) {
      console.error('Error al obtener turno activo:', error);
      return null;
    }
  },

  async abrirTurno(turno = {}) {
    try {
      const response = await api.post('/api/turnos/abrir', {
        empleadoId: turno.empleadoId || turno.empleado || '',
        capitalInicial: parseFloat(turno.capitalInicial || turno.baseInicial) || 0,
        observaciones: turno.observaciones || ''
      });
      return response.data;
    } catch (error) {
      console.error('Error al abrir turno:', error);
      throw error;
    }
  },

  async cerrarTurno(turnoId, datos = {}) {
    try {
      const response = await api.post(`/api/turnos/${turnoId}/cerrar`, {
        capitalFinal: parseFloat(datos.capitalFinal) || 0,
        observaciones: datos.observaciones || ''
      });
      return response.data;
    } catch (error) {
      console.error('Error al cerrar turno:', error);
      throw error;
    }
  },

  async obtenerVentasDelTurno(turnoId) {
    try {
      const response = await api.get(`/api/turnos/${turnoId}/ventas`);
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener ventas del turno:', error);
      return [];
    }
  },

  // ==================== CAJAS ====================

  async obtenerCajaActiva(turnoId = null, empleado = null) {
    try {
      const params = new URLSearchParams();
      if (turnoId) params.append('turnoId', turnoId);
      if (empleado) params.append('empleado', empleado);

      const response = await api.get(`/api/cajas/activa?${params}`);
      return response.data || null;
    } catch (error) {
      console.error('Error al obtener caja activa:', error);
      return null;
    }
  },

  async abrirCaja(caja) {
    try {
      if (!caja.turnoId && !caja.empleado) {
        throw new Error('turnoId o empleado son requeridos');
      }
      if (caja.baseInicial !== undefined && caja.baseInicial < 0) {
        throw new Error('La base inicial debe ser mayor o igual a 0');
      }

      const response = await api.post('/api/cajas/abrir', {
        turnoId: caja.turnoId || '',
        empleado: caja.empleado || '',
        baseInicial: parseFloat(caja.baseInicial || caja.capitalInicial) || 0,
        denominaciones: caja.denominaciones || {},
        observaciones: caja.observaciones || ''
      });

      return response.data;
    } catch (error) {
      console.error('Error al abrir caja:', error);
      throw error;
    }
  },

  async cerrarCaja(cajaId, datos) {
    try {
      if (!cajaId) throw new Error('ID de caja no válido');

      const response = await api.post(`/api/cajas/${cajaId}/cerrar`, {
        totalEfectivo: parseFloat(datos.totalEfectivo || datos.efectivoReal) || 0,
        totalTransferencias: parseFloat(datos.totalTransferencias || datos.transferenciaReal) || 0,
        totalTarjeta: parseFloat(datos.totalTarjeta || datos.tarjetaReal) || 0,
        observaciones: datos.observaciones || ''
      });

      return response.data;
    } catch (error) {
      console.error('Error al cerrar caja:', error);
      throw error;
    }
  },

  async obtenerVentasDeCaja(cajaId) {
    try {
      const response = await api.get(`/api/cajas/${cajaId}/ventas`);
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener ventas de la caja:', error);
      return [];
    }
  },

  async obtenerCierresCaja(turnoId, empleado = null) {
    try {
      const params = new URLSearchParams({ turnoId });
      if (empleado) params.append('empleado', empleado);

      const response = await api.get(`/api/cajas/cierres?${params}`);
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener cierres de caja:', error);
      return [];
    }
  }
};

export default turnoService;
