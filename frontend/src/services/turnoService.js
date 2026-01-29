// src/services/turnoService.js
import apiRequest from '../config/googleSheets';

const turnoService = {
  
  // ==================== TURNOS ====================
  
  async obtenerTurnoActivo() {
    try {
      const response = await apiRequest('getTurnoActivo');
      return response.data;
    } catch (error) {
      console.error('Error al obtener turno activo:', error);
      return null;
    }
  },

  async abrirTurno() {
    try {
      const response = await apiRequest('abrirTurno');
      return response.data;
    } catch (error) {
      console.error('Error al abrir turno:', error);
      throw error;
    }
  },

  async cerrarTurno(turnoId, datos = {}) {
    try {
      const response = await apiRequest('cerrarTurno', {
        turnoId: parseInt(turnoId),
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
      const response = await apiRequest('getVentasDelTurno', {
        turnoId: parseInt(turnoId)
      });
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener ventas del turno:', error);
      return [];
    }
  },

  // ==================== CAJAS ====================

  async obtenerCajaActiva(turnoId, empleado) {
    try {
      const response = await apiRequest('getCajaActiva', {
        turnoId: parseInt(turnoId),
        empleado: empleado
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener caja activa:', error);
      return null;
    }
  },

  async abrirCaja(datos) {
    try {
      if (!datos.empleado) {
        throw new Error('Empleado es obligatorio');
      }
      if (!datos.baseInicial || datos.baseInicial < 0) {
        throw new Error('La base inicial debe ser mayor o igual a 0');
      }

      const response = await apiRequest('abrirCaja', {
        empleado: datos.empleado,
        baseInicial: parseFloat(datos.baseInicial)
      });

      return response.data;
    } catch (error) {
      console.error('Error al abrir caja:', error);
      throw error;
    }
  },

  async cerrarCaja(cajaId, datos) {
    try {
      if (!cajaId) {
        throw new Error('ID de caja no válido');
      }

      const response = await apiRequest('cerrarCaja', {
        cajaId: parseInt(cajaId),
        efectivoReal: parseFloat(datos.efectivoReal) || 0,
        tarjetaReal: parseFloat(datos.tarjetaReal) || 0,
        transferenciaReal: parseFloat(datos.transferenciaReal) || 0,
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
      const response = await apiRequest('getVentasDeCaja', {
        cajaId: parseInt(cajaId)
      });
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener ventas de la caja:', error);
      return [];
    }
  },

  async obtenerCierresCaja(turnoId, empleado = null) {
    try {
      const params = {
        turnoId: parseInt(turnoId)
      };
      
      if (empleado) {
        params.empleado = empleado;
      }

      const response = await apiRequest('getCierresCaja', params);
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener cierres de caja:', error);
      return [];
    }
  }
};

export default turnoService;