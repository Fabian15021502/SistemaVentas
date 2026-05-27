// src/services/dashboardService.js
import api from './apiClient';

const dashboardService = {
  // Cache simple para evitar llamadas repetidas
  cache: {
    data: null,
    timestamp: null,
    maxAge: 60000 // 1 minuto
  },

  /**
   * Obtener estadísticas del dashboard
   */
  async obtenerEstadisticas() {
    try {
      // Usar cache si está disponible
      const now = Date.now();
      if (this.cache.data && this.cache.timestamp && (now - this.cache.timestamp) < this.cache.maxAge) {
        console.log('📦 Usando datos en cache');
        return this.cache.data;
      }

      console.log('🔄 Obteniendo estadísticas frescas...');
      const response = await api.get('/api/dashboard/stats');

      // Obtener total de productos
      let totalProductos = 0;
      try {
        const productosResponse = await api.get('/api/productos');
        totalProductos = (productosResponse.data || []).length;
      } catch (error) {
        console.warn('Error al counting productos:', error);
      }

      const stats = {
        ventasHoy: response.data?.ventasHoy || 0,
        ventasMes: response.data?.ventasMes || 0,
        totalDiario: response.data?.totalDiario || 0,
        totalMensual: response.data?.totalMensual || 0,
        deudaTotal: response.data?.deudaTotal || 0,
        productosBajoStock: response.data?.productosBajoStock || [],
        ventasPorMetodo: response.data?.ventasPorMetodo || {},
        ultimasVentas: response.data?.ultimasVentas || [],
        totalProductos
      };

      // Guardar en cache
      this.cache.data = stats;
      this.cache.timestamp = now;

      return stats;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {
        ventasHoy: 0,
        ventasMes: 0,
        totalDiario: 0,
        totalMensual: 0,
        deudaTotal: 0,
        productosBajoStock: [],
        ventasPorMetodo: {},
        ultimasVentas: [],
        totalProductos: 0
      };
    }
  },

  /**
   * Obtener ventas de los últimos 7 días agrupadas por día
   */
  async obtenerVentasSemana() {
    try {
      const hoy = new Date();
      const hace7dias = new Date();
      hace7dias.setDate(hace7dias.getDate() - 7);

      const params = new URLSearchParams({
        desde: hace7dias.toISOString().split('T')[0],
        hasta: hoy.toISOString().split('T')[0]
      });

      const response = await api.get(`/api/ventas?${params}`);
      const ventas = response.data || [];

      const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const ventasPorDia = {};

      // Inicializar últimos 7 días
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const key = fecha.toISOString().split('T')[0];

        ventasPorDia[key] = {
          dia: dias[fecha.getDay()],
          total: 0,
          cantidad: 0
        };
      }

      // Sumar ventas por día
      ventas.forEach(venta => {
        if (!venta.fecha) return;

        let fechaObjeto = null;

        // 1. Si viene como un objeto que contiene los segundos (Estructura JSON de un Timestamp)
        if (typeof venta.fecha === 'object') {
          // Soporta tanto venta.fecha.seconds como venta.fecha._seconds
          const segundos = venta.fecha.seconds || venta.fecha._seconds;
          if (segundos !== undefined) {
            fechaObjeto = new Date(segundos * 1000);
          } else if (typeof venta.fecha.toDate === 'function') {
            fechaObjeto = venta.fecha.toDate();
          }
        }

        // 2. Si viene como un String ISO o una fecha estándar
        if (!fechaObjeto) {
          fechaObjeto = new Date(venta.fecha);
        }

        // Evitar el RangeError controlando que sea un valor de tiempo válido
        if (fechaObjeto && !isNaN(fechaObjeto.getTime())) {
          const key = fechaObjeto.toISOString().split('T')[0];

          if (ventasPorDia[key]) {
            ventasPorDia[key].total += parseFloat(venta.total) || 0;
            ventasPorDia[key].cantidad++;
          }
        } else {
          console.warn("No se pudo parsear la fecha de la venta:", venta);
        }
      });

      return Object.values(ventasPorDia);
    } catch (error) {
      console.error('Error al obtener ventas de la semana:', error);
      return [];
    }
  },

  /**
   * Obtener top productos más vendidos
   */
  async obtenerTopProductos(limite = 5) {
    try {
      const response = await api.get(`/api/dashboard/stats?limit=${limite}`);
      return response.data?.productosMasVendidos || [];
    } catch (error) {
      console.error('Error al obtener top productos:', error);
      return [];
    }
  },

  /**
   * Obtener ventas por método de pago
   */
  async obtenerVentasPorMetodoPago() {
    try {
      const response = await api.get('/api/dashboard/stats');
      return response.data?.ventasPorMetodo || {};
    } catch (error) {
      console.error('Error al obtener ventas por método:', error);
      return {};
    }
  },

  /**
   * Obtener ventas por categoría
   */
  async obtenerVentasPorCategoria() {
    try {
      const response = await api.get('/api/dashboard/stats');
      return response.data?.ventasPorCategoria || [];
    } catch (error) {
      console.error('Error al obtener ventas por categoría:', error);
      return [];
    }
  },

  /**
   * Obtener ventas agrupadas por empleado (últimos N días)
   */
  async obtenerVentasPorEmpleado(limite = 30) {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - limite);

      const params = new URLSearchParams({
        desde: fechaLimite.toISOString().split('T')[0]
      });

      const response = await api.get(`/api/ventas?${params}`);
      const ventas = response.data || [];

      const ventasPorEmpleado = {};

      ventas.forEach(venta => {
        const empleadoId = venta.empleadoId || 'Sin asignar';

        if (!ventasPorEmpleado[empleadoId]) {
          ventasPorEmpleado[empleadoId] = {
            empleadoId: empleadoId === 'Sin asignar' ? 'Sin asignar' : empleadoId.split('@')[0],
            email: empleadoId === 'Sin asignar' ? null : empleadoId,
            total: 0,
            cantidad: 0
          };
        }

        ventasPorEmpleado[empleadoId].total += parseFloat(venta.total) || 0;
        ventasPorEmpleado[empleadoId].cantidad++;
      });

      return Object.values(ventasPorEmpleado).sort((a, b) => b.total - a.total);
    } catch (error) {
      console.error('Error al obtener ventas por empleado:', error);
      return [];
    }
  },

  /**
   * Obtener resumen de ventas por período
   */
  async obtenerResumenVentas(fechaInicio, fechaFin) {
    try {
      const params = new URLSearchParams({
        desde: fechaInicio,
        hasta: fechaFin
      });

      const response = await api.get(`/api/dashboard/stats?${params}`);
      return response.data || {};
    } catch (error) {
      console.error('Error al obtener resumen de ventas:', error);
      throw error;
    }
  },

  limpiarCache() {
    this.cache.data = null;
    this.cache.timestamp = null;
  }
};

export default dashboardService;