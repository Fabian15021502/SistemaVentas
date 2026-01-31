// src/services/facturasService.js
// REEMPLAZAR COMPLETAMENTE

import apiRequest from '../config/googleSheets';

const facturasService = {
  
  /**
   * Obtener las últimas N facturas de un empleado
   */
  async obtenerUltimasFacturas(empleadoId, limite = 3) {
    try {
      console.log('📋 Obteniendo facturas del empleado:', empleadoId);
      
      // Obtener todas las ventas
      const response = await apiRequest('getVentas');
      const ventas = response.data || [];
      
      console.log('Total ventas en sistema:', ventas.length);
      
      // Filtrar por empleado y ordenar por fecha descendente
      const ventasEmpleado = ventas
        .filter(v => {
          // Comparar empleadoId de forma flexible
          const ventaEmpleado = v.empleadoId || '';
          return ventaEmpleado === empleadoId || 
                 ventaEmpleado.includes(empleadoId) ||
                 empleadoId.includes(ventaEmpleado);
        })
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, limite);
      
      console.log('Ventas del empleado:', ventasEmpleado.length);
      
      // Obtener detalles de cada venta
      const facturasCompletas = await Promise.all(
        ventasEmpleado.map(async (venta) => {
          try {
            const detallesResponse = await apiRequest('getVentaDetalle', { id: venta.id });
            const detalles = detallesResponse.data || [];
            
            return {
              ...venta,
              items: detalles
            };
          } catch (error) {
            console.error(`Error al obtener detalle de venta ${venta.id}:`, error);
            return {
              ...venta,
              items: []
            };
          }
        })
      );
      
      console.log('✅ Facturas completas:', facturasCompletas.length);
      return facturasCompletas;
    } catch (error) {
      console.error('Error al obtener últimas facturas:', error);
      throw error;
    }
  },

  /**
   * Actualizar una venta existente
   */
  async actualizarVenta(ventaId, datosActualizados) {
    try {
      if (!ventaId) {
        throw new Error('ID de venta no válido');
      }

      console.log('📝 Actualizando venta:', ventaId);

      const response = await apiRequest('actualizarVenta', {
        ventaId: parseInt(ventaId),
        total: datosActualizados.total ? parseFloat(datosActualizados.total) : undefined,
        metodoPago: datosActualizados.metodoPago,
        clienteNombre: datosActualizados.clienteNombre,
        clienteTelefono: datosActualizados.clienteTelefono,
        modificadoPor: datosActualizados.modificadoPor || 'system'
      });

      if (!response.success) {
        throw new Error(response.error || 'Error al actualizar venta');
      }

      return response.data;
    } catch (error) {
      console.error('Error al actualizar venta:', error);
      throw error;
    }
  },

  /**
   * Actualizar items de una venta
   */
  async actualizarItemsVenta(ventaId, nuevosItems) {
    try {
      if (!ventaId) {
        throw new Error('ID de venta no válido');
      }
      if (!nuevosItems || nuevosItems.length === 0) {
        throw new Error('Debe proporcionar al menos un item');
      }

      console.log('📦 Actualizando items de venta:', ventaId);

      const response = await apiRequest('actualizarItemsVenta', {
        ventaId: parseInt(ventaId),
        items: JSON.stringify(nuevosItems),
        modificadoPor: 'system'
      });

      if (!response.success) {
        throw new Error(response.error || 'Error al actualizar items');
      }

      return response.data;
    } catch (error) {
      console.error('Error al actualizar items:', error);
      throw error;
    }
  },

  /**
   * Cancelar una venta (marcarla como anulada)
   */
  async cancelarVenta(ventaId, motivo) {
    try {
      if (!ventaId) {
        throw new Error('ID de venta no válido');
      }
      if (!motivo || motivo.trim() === '') {
        throw new Error('Debe proporcionar un motivo de cancelación');
      }

      console.log('❌ Cancelando venta:', ventaId);

      const response = await apiRequest('cancelarVenta', {
        ventaId: parseInt(ventaId),
        motivo: motivo.trim(),
        canceladoPor: 'system'
      });

      if (!response.success) {
        throw new Error(response.error || 'Error al cancelar venta');
      }

      return response.data;
    } catch (error) {
      console.error('Error al cancelar venta:', error);
      throw error;
    }
  },

  /**
   * Obtener historial de modificaciones de una venta
   */
  async obtenerHistorialModificaciones(ventaId) {
    try {
      const response = await apiRequest('getHistorialVenta', {
        ventaId: parseInt(ventaId)
      });
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener historial:', error);
      return [];
    }
  }
};

export default facturasService;