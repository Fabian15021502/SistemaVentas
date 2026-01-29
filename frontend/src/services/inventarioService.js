// src/services/inventarioService.js
import apiRequest from '../config/googleSheets';

const inventarioService = {
  
  // ==================== INVENTARIO ====================
  
  async obtenerInventario() {
    try {
      console.log('📦 Obteniendo inventario...');
      const response = await apiRequest('getInventario');
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener inventario:', error);
      throw new Error('No se pudo cargar el inventario.');
    }
  },

  async obtenerInventarioPorProducto(productoId) {
    try {
      const inventario = await this.obtenerInventario();
      return inventario.filter(item => item.productoId === parseInt(productoId));
    } catch (error) {
      console.error('Error al obtener inventario del producto:', error);
      throw error;
    }
  },

  async crearInventarioInicial(datos) {
    try {
      if (!datos.productoId) {
        throw new Error('El ID del producto es obligatorio');
      }
      if (!datos.cantidad || datos.cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a 0');
      }

      console.log('📝 Creando inventario inicial:', datos);

      const response = await apiRequest('crearInventario', {
        productoId: parseInt(datos.productoId),
        variacionId: datos.variacionId ? parseInt(datos.variacionId) : '',
        cantidad: parseInt(datos.cantidad),
        stockMinimo: parseInt(datos.stockMinimo) || 0,
        stockMaximo: parseInt(datos.stockMaximo) || 0,
        ubicacion: datos.ubicacion?.trim() || '',
        notas: datos.notas?.trim() || ''
      });

      console.log('✅ Inventario creado');
      return response.data;
    } catch (error) {
      console.error('Error al crear inventario:', error);
      throw error;
    }
  },

  async actualizarInventario(productoId, variacionId, datos) {
    try {
      if (!productoId) {
        throw new Error('ID de producto no válido');
      }

      const response = await apiRequest('actualizarInventario', {
        productoId: parseInt(productoId),
        variacionId: variacionId ? parseInt(variacionId) : '',
        stockMinimo: datos.stockMinimo !== undefined ? parseInt(datos.stockMinimo) : undefined,
        stockMaximo: datos.stockMaximo !== undefined ? parseInt(datos.stockMaximo) : undefined,
        ubicacion: datos.ubicacion?.trim(),
        notas: datos.notas?.trim()
      });

      return response.data;
    } catch (error) {
      console.error('Error al actualizar inventario:', error);
      throw error;
    }
  },

  // ==================== MOVIMIENTOS ====================

  async registrarMovimiento(movimiento) {
    try {
      if (!movimiento.productoId) {
        throw new Error('Debe seleccionar un producto');
      }
      if (!movimiento.tipo || !['entrada', 'salida', 'ajuste'].includes(movimiento.tipo)) {
        throw new Error('Tipo de movimiento inválido');
      }
      if (!movimiento.cantidad || movimiento.cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a 0');
      }

      console.log('📋 Registrando movimiento:', movimiento);

      // 🔧 CORRECCIÓN: Asegurar que variacionId se envíe correctamente
      const params = {
        productoId: parseInt(movimiento.productoId),
        tipo: movimiento.tipo,
        cantidad: parseInt(movimiento.cantidad),
        motivo: movimiento.motivo?.trim() || '',
        referencia: movimiento.referencia?.trim() || '',
        costo: movimiento.costo ? parseFloat(movimiento.costo) : 0,
        usuario: movimiento.usuario || 'system'
      };

      // Solo agregar variacionId si existe
      if (movimiento.variacionId) {
        params.variacionId = parseInt(movimiento.variacionId);
      }

      const response = await apiRequest('registrarMovimiento', params);

      console.log('✅ Movimiento registrado');
      return response.data;
    } catch (error) {
      console.error('Error al registrar movimiento:', error);
      throw error;
    }
  },

  async obtenerMovimientos(filtros = {}) {
    try {
      const response = await apiRequest('getMovimientos', filtros);
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener movimientos:', error);
      throw error;
    }
  },

  async obtenerMovimientosPorProducto(productoId, variacionId = null) {
    try {
      const params = {
        productoId: parseInt(productoId)
      };

      // Solo agregar variacionId si existe
      if (variacionId) {
        params.variacionId = parseInt(variacionId);
      }

      const response = await apiRequest('getMovimientosPorProducto', params);
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener movimientos del producto:', error);
      throw error;
    }
  },

  // ==================== ALERTAS Y ESTADÍSTICAS ====================

  async obtenerProductosStockBajo() {
    try {
      const inventario = await this.obtenerInventario();
      return inventario.filter(item => 
        item.stockMinimo > 0 && item.cantidad <= item.stockMinimo
      );
    } catch (error) {
      console.error('Error al obtener productos con stock bajo:', error);
      throw error;
    }
  },

  async obtenerEstadisticasInventario() {
    try {
      const inventario = await this.obtenerInventario();
      
      const stats = {
        totalProductos: inventario.length,
        productosConStock: inventario.filter(i => i.cantidad > 0).length,
        productosSinStock: inventario.filter(i => i.cantidad === 0).length,
        productosStockBajo: inventario.filter(i => 
          i.stockMinimo > 0 && i.cantidad <= i.stockMinimo
        ).length,
        valorTotalInventario: inventario.reduce((sum, i) => 
          sum + (i.cantidad * (i.costoPromedio || 0)), 0
        )
      };

      return stats;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  },

  async obtenerMovimientosPorFecha(fechaInicio, fechaFin) {
    try {
      const movimientos = await this.obtenerMovimientos();
      
      const inicio = new Date(fechaInicio);
      inicio.setHours(0, 0, 0, 0);
      
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59, 999);
      
      return movimientos.filter(mov => {
        const fechaMov = new Date(mov.fecha);
        return fechaMov >= inicio && fechaMov <= fin;
      });
    } catch (error) {
      console.error('Error al filtrar movimientos:', error);
      throw error;
    }
  },

  // ==================== VALORACIÓN ====================

  async calcularValorInventario(productoId = null, variacionId = null) {
    try {
      const inventario = productoId 
        ? await this.obtenerInventarioPorProducto(productoId)
        : await this.obtenerInventario();
      
      // Filtrar por variación si se especifica
      const inventarioFiltrado = variacionId
        ? inventario.filter(i => i.variacionId === parseInt(variacionId))
        : inventario;
      
      return inventarioFiltrado.reduce((total, item) => {
        const valor = item.cantidad * (item.costoPromedio || 0);
        return total + valor;
      }, 0);
    } catch (error) {
      console.error('Error al calcular valor de inventario:', error);
      throw error;
    }
  },

  async obtenerRotacionInventario(productoId, variacionId = null, dias = 30) {
    try {
      const fechaFin = new Date();
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - dias);
      
      const movimientos = await this.obtenerMovimientosPorProducto(productoId, variacionId);
      const movimientosPeriodo = movimientos.filter(mov => {
        const fechaMov = new Date(mov.fecha);
        return fechaMov >= fechaInicio && fechaMov <= fechaFin;
      });
      
      const salidas = movimientosPeriodo
        .filter(m => m.tipo === 'salida')
        .reduce((sum, m) => sum + m.cantidad, 0);
      
      const inventarioActual = await this.obtenerInventarioPorProducto(productoId);
      
      // Filtrar por variación si se especifica
      const inventarioFiltrado = variacionId
        ? inventarioActual.filter(i => i.variacionId === parseInt(variacionId))
        : inventarioActual;
      
      const stockPromedio = inventarioFiltrado.length > 0 
        ? inventarioFiltrado.reduce((sum, i) => sum + i.cantidad, 0) / inventarioFiltrado.length
        : 0;
      
      const rotacion = stockPromedio > 0 ? salidas / stockPromedio : 0;
      
      return {
        salidas,
        stockPromedio,
        rotacion: rotacion.toFixed(2),
        dias
      };
    } catch (error) {
      console.error('Error al calcular rotación:', error);
      throw error;
    }
  }
};

export default inventarioService;