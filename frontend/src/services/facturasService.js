// src/services/facturasService.js
import api from './apiClient';

const facturasService = {

  /**
   * Obtener las últimas N facturas de un empleado
   */
  async obtenerUltimasFacturas(empleadoId, limite = 3) {
    try {
      console.log('📋 Obteniendo facturas del empleado:', empleadoId);

      const params = new URLSearchParams({ empleadoId, limit: limite });
      const response = await api.get(`/api/ventas?${params}`);
      const ventas = response.data || [];

      console.log('Ventas del empleado:', ventas.length);

      // Obtener detalles (items) de cada venta
      const facturasCompletas = await Promise.all(
        ventas.map(async (venta) => {
          try {
            const detalleResponse = await api.get(`/api/ventas/${venta.id}`);
            const items = detalleResponse.data?.items || [];
            return { ...venta, items };
          } catch (error) {
            console.error(`Error al obtener detalle de venta ${venta.id}:`, error);
            return { ...venta, items: [] };
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
      if (!ventaId) throw new Error('ID de venta no válido');

      console.log('📝 Actualizando venta:', ventaId);

      const body = {
        modificadoPor: datosActualizados.modificadoPor || 'system'
      };

      if (datosActualizados.total !== undefined) body.total = parseFloat(datosActualizados.total);
      if (datosActualizados.metodoPago) body.metodoPago = datosActualizados.metodoPago;
      if (datosActualizados.clienteNombre) body.clienteNombre = datosActualizados.clienteNombre;
      if (datosActualizados.clienteTelefono !== undefined) body.clienteTelefono = datosActualizados.clienteTelefono;

      const response = await api.put(`/api/ventas/${ventaId}`, body);

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
      if (!ventaId) throw new Error('ID de venta no válido');
      if (!nuevosItems || nuevosItems.length === 0) {
        throw new Error('Debe proporcionar al menos un item');
      }

      console.log('📦 Actualizando items de venta:', ventaId);

      const response = await api.put(`/api/ventas/${ventaId}/items`, {
        items: nuevosItems,
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
      if (!ventaId) throw new Error('ID de venta no válido');
      if (!motivo || motivo.trim() === '') {
        throw new Error('Debe proporcionar un motivo de cancelación');
      }

      console.log('❌ Cancelando venta:', ventaId);

      const response = await api.post(`/api/ventas/${ventaId}/cancelar`, {
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
      const response = await api.get(`/api/ventas/${ventaId}/historial`);
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener historial:', error);
      return [];
    }
  }
};

export default facturasService;
