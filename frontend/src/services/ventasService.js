// src/services/ventasService.js
import api from './apiClient';

const ventasService = {

  /**
   * Validar stock disponible antes de registrar venta
   */
  async validarStockDisponible(items) {
    try {
      const inventarioService = (await import('./inventarioService')).default;
      const inventario = await inventarioService.obtenerInventario();

      const erroresStock = [];

      for (const item of items) {
        const productoId = item.productoId;
        const variacionId = item.variacionId || null;
        const cantidadSolicitada = parseInt(item.cantidad);

        const itemInventario = inventario.find(inv =>
          inv.productoId === productoId &&
          (variacionId ? inv.variacionId === variacionId : !inv.variacionId)
        );

        if (!itemInventario) {
          erroresStock.push({
            producto: item.productoNombre,
            variacion: item.variacion || item.variacionValor,
            error: 'No hay inventario registrado'
          });
          continue;
        }

        const stockDisponible = parseFloat(itemInventario.cantidad) || 0;

        if (stockDisponible < cantidadSolicitada) {
          erroresStock.push({
            producto: item.productoNombre,
            variacion: item.variacion || item.variacionValor,
            solicitado: cantidadSolicitada,
            disponible: stockDisponible,
            error: `Stock insuficiente (disponible: ${stockDisponible})`
          });
        }
      }

      return {
        valido: erroresStock.length === 0,
        errores: erroresStock
      };
    } catch (error) {
      console.error('Error al validar stock:', error);
      throw error;
    }
  },

  /**
   * Registrar nueva venta con validación de stock
   */
  async registrarVenta(venta) {
    try {
      if (!venta.items || venta.items.length === 0) {
        throw new Error('Debe agregar al menos un producto a la venta');
      }
      if (!venta.total || venta.total <= 0) {
        throw new Error('El total de la venta debe ser mayor a 0');
      }
      if (!venta.metodoPago) {
        throw new Error('Debe seleccionar un método de pago');
      }

      console.log('📝 Validando stock antes de registrar venta...');

      const validacion = await this.validarStockDisponible(venta.items);

      if (!validacion.valido) {
        const erroresTexto = validacion.errores
          .map(e => `${e.producto} ${e.variacion || ''}: ${e.error}`)
          .join('\n');
        throw new Error(`Stock insuficiente:\n${erroresTexto}`);
      }

      console.log('✅ Stock validado correctamente');
      console.log('📝 Registrando venta:', {
        total: venta.total,
        metodoPago: venta.metodoPago,
        itemsCount: venta.items.length
      });

      const datosVenta = {
        empleadoId: venta.empleadoId || 'system',
        clienteNombre: venta.clienteNombre?.trim() || 'Cliente General',
        clienteTelefono: venta.clienteTelefono ? String(venta.clienteTelefono).trim() : '',
        metodoPago: venta.metodoPago.toLowerCase(),
        total: parseFloat(venta.total),
        items: venta.items.map(item => ({
          productoId: item.productoId,
          productoNombre: item.productoNombre,
          variacionId: item.variacionId || '',
          variacion: item.variacion || '',
          cantidad: parseInt(item.cantidad),
          precioUnitario: parseFloat(item.precioUnitario),
          subtotal: parseFloat(item.subtotal || item.cantidad * item.precioUnitario)
        }))
      };

      const response = await api.post('/api/ventas', datosVenta);

      if (!response.success) {
        throw new Error(response.error || 'Error al registrar venta');
      }

      console.log('✅ Venta registrada exitosamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error al registrar venta:', error);
      throw error;
    }
  },

  async obtenerVentas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.limit) params.append('limit', filtros.limit);
      if (filtros.empleadoId) params.append('empleadoId', filtros.empleadoId);

      const response = await api.get(`/api/ventas?${params}`);
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener ventas:', error);
      throw new Error('No se pudieron cargar las ventas.');
    }
  },

  async obtenerDetalleVenta(ventaId) {
    try {
      if (!ventaId) throw new Error('ID de venta no válido');

      const response = await api.get(`/api/ventas/${ventaId}`);
      return response.data?.items || response.data || [];
    } catch (error) {
      console.error('Error al obtener detalle de venta:', error);
      throw error;
    }
  },

  async obtenerVentaPorId(ventaId) {
    try {
      const response = await api.get(`/api/ventas/${ventaId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener venta completa:', error);
      throw new Error('Venta no encontrada');
    }
  },

  // Alias para compatibilidad con reportesService
  async obtenerVentaDetalle(ventaId) {
    return this.obtenerDetalleVenta(ventaId);
  },

  async obtenerVentasPorRangoFechas(fechaInicio, fechaFin) {
    try {
      const params = new URLSearchParams({
        desde: fechaInicio,
        hasta: fechaFin
      });

      const response = await api.get(`/api/ventas?${params}`);
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener ventas por rango:', error);
      throw error;
    }
  },

  async obtenerVentasDelDia(fecha = null) {
    try {
      const fechaConsulta = fecha
        ? new Date(fecha).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const params = new URLSearchParams({ desde: fechaConsulta, hasta: fechaConsulta });
      const response = await api.get(`/api/ventas?${params}`);
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener ventas del día:', error);
      throw error;
    }
  },

  calcularTotal(items) {
    return items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
  },

  async calcularTotalVentas(ventas) {
    return ventas.reduce((total, venta) => total + parseFloat(venta.total), 0);
  },

  async calcularPromedioVentas(ventas) {
    if (ventas.length === 0) return 0;
    const total = await this.calcularTotalVentas(ventas);
    return total / ventas.length;
  },

  async obtenerProductosMasVendidos(limite = 10) {
    try {
      const response = await api.get(`/api/dashboard/stats?limit=${limite}`);
      return response.data?.productosMasVendidos || [];
    } catch (error) {
      console.error('Error al obtener productos más vendidos:', error);
      throw error;
    }
  }
};

export default ventasService;
