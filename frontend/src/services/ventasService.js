import apiRequest from '../config/googleSheets';

const ventasService = {
  async registrarVenta(venta) {
    try {
      // Validaciones
      if (!venta.items || venta.items.length === 0) {
        throw new Error('Debe agregar al menos un producto a la venta');
      }
      if (!venta.total || venta.total <= 0) {
        throw new Error('El total de la venta debe ser mayor a 0');
      }
      if (!venta.metodoPago) {
        throw new Error('Debe seleccionar un método de pago');
      }

      console.log('📝 Registrando venta:', {
        total: venta.total,
        metodoPago: venta.metodoPago,
        itemsCount: venta.items.length
      });

      // Preparar items como JSON string
      const itemsJson = JSON.stringify(venta.items.map(item => ({
        productoId: parseInt(item.productoId),
        productoNombre: item.productoNombre,
        variacionId: item.variacionId || '',
        variacion: item.variacion || '',
        cantidad: parseInt(item.cantidad),
        precioUnitario: parseFloat(item.precioUnitario),
        subtotal: parseFloat(item.subtotal)
      })));

      // CORRECCIÓN: Convertir teléfono a string antes de usar trim()
      const response = await apiRequest('registrarVenta', {
        empleadoId: venta.empleadoId || 'system',
        total: parseFloat(venta.total),
        metodoPago: venta.metodoPago,
        clienteNombre: venta.clienteNombre?.trim() || 'Cliente General',
        clienteTelefono: venta.clienteTelefono ? String(venta.clienteTelefono).trim() : '',
        items: itemsJson
      });

      console.log('✅ Venta registrada exitosamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error al registrar venta:', error);
      throw error;
    }
  },

  async obtenerVentas(filtros = {}) {
    try {
      const response = await apiRequest('getVentas', filtros);
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener ventas:', error);
      throw new Error('No se pudieron cargar las ventas.');
    }
  },

  async obtenerDetalleVenta(ventaId) {
    try {
      if (!ventaId) {
        throw new Error('ID de venta no válido');
      }

      const response = await apiRequest('getVentaDetalle', {
        id: ventaId
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener detalle de venta:', error);
      throw error;
    }
  },

  async obtenerVentaPorId(ventaId) {
    try {
      const ventas = await this.obtenerVentas();
      const venta = ventas.find(v => v.id === parseInt(ventaId));
      
      if (!venta) {
        throw new Error('Venta no encontrada');
      }

      const detalles = await this.obtenerDetalleVenta(ventaId);
      
      return {
        ...venta,
        items: detalles
      };
    } catch (error) {
      console.error('Error al obtener venta completa:', error);
      throw error;
    }
  },

  async obtenerVentasPorRangoFechas(fechaInicio, fechaFin) {
    try {
      const ventas = await this.obtenerVentas();
      
      const inicio = new Date(fechaInicio);
      inicio.setHours(0, 0, 0, 0);
      
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59, 999);
      
      return ventas.filter(venta => {
        const fechaVenta = new Date(venta.fecha);
        return fechaVenta >= inicio && fechaVenta <= fin;
      });
    } catch (error) {
      console.error('Error al obtener ventas por rango:', error);
      throw error;
    }
  },

  async obtenerVentasDelDia(fecha = null) {
    try {
      const fechaConsulta = fecha ? new Date(fecha) : new Date();
      fechaConsulta.setHours(0, 0, 0, 0);
      
      const ventas = await this.obtenerVentas();
      
      return ventas.filter(venta => {
        const fechaVenta = new Date(venta.fecha);
        fechaVenta.setHours(0, 0, 0, 0);
        return fechaVenta.getTime() === fechaConsulta.getTime();
      });
    } catch (error) {
      console.error('Error al obtener ventas del día:', error);
      throw error;
    }
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
      const ventas = await this.obtenerVentas();
      const productosVendidos = {};

      for (const venta of ventas) {
        const detalles = await this.obtenerDetalleVenta(venta.id);
        
        detalles.forEach(detalle => {
          const key = detalle.productoId;
          if (!productosVendidos[key]) {
            productosVendidos[key] = {
              productoId: detalle.productoId,
              nombre: detalle.productoNombre,
              cantidad: 0,
              total: 0
            };
          }
          productosVendidos[key].cantidad += detalle.cantidad;
          productosVendidos[key].total += detalle.subtotal;
        });
      }

      return Object.values(productosVendidos)
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, limite);
    } catch (error) {
      console.error('Error al obtener productos más vendidos:', error);
      throw error;
    }
  }
};

export default ventasService;