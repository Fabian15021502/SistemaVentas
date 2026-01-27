// src/services/dashboardService.js
import apiRequest from '../config/googleSheets';

const dashboardService = {
  // Cache simple para evitar llamadas repetidas
  cache: {
    data: null,
    timestamp: null,
    maxAge: 60000 // 1 minuto
  },

  async obtenerEstadisticas() {
    try {
      // Usar cache si está disponible
      const now = Date.now();
      if (this.cache.data && this.cache.timestamp && (now - this.cache.timestamp) < this.cache.maxAge) {
        console.log('📦 Usando datos en cache');
        return this.cache.data;
      }

      console.log('🔄 Obteniendo estadísticas frescas...');
      const response = await apiRequest('getDashboardStats');
      
      // Obtener productos para contar total
      let totalProductos = 0;
      try {
        const productosResponse = await apiRequest('getProductos');
        totalProductos = (productosResponse.data || []).length;
      } catch (error) {
        console.warn('Error al contar productos:', error);
      }
      
      const stats = {
        ventasHoy: response.data?.ventasHoy || 0,
        ventasMes: response.data?.ventasMes || 0,
        totalDiario: response.data?.totalDiario || 0,
        totalMensual: response.data?.totalMensual || 0,
        deudaTotal: response.data?.deudaTotal || 0,
        totalProductos: totalProductos
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
        totalProductos: 0
      };
    }
  },

  async obtenerVentasSemana() {
    try {
      // Obtener ventas de los últimos 7 días
      const hoy = new Date();
      const hace7dias = new Date();
      hace7dias.setDate(hace7dias.getDate() - 7);

      const response = await apiRequest('getVentas', {
        fechaDesde: hace7dias.toISOString().split('T')[0],
        fechaHasta: hoy.toISOString().split('T')[0]
      });

      const ventas = response.data || [];
      
      // Agrupar por día
      const ventasPorDia = {};
      const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      
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

      // Sumar ventas
      ventas.forEach(venta => {
        const fecha = new Date(venta.fecha);
        const key = fecha.toISOString().split('T')[0];
        
        if (ventasPorDia[key]) {
          ventasPorDia[key].total += parseFloat(venta.total) || 0;
          ventasPorDia[key].cantidad++;
        }
      });

      return Object.values(ventasPorDia);
    } catch (error) {
      console.error('Error al obtener ventas de la semana:', error);
      return [];
    }
  },

  async obtenerTopProductos(limite = 5) {
    try {
      const response = await apiRequest('getVentas');
      const ventas = response.data || [];
      
      const productosMap = {};

      // Procesar cada venta
      for (const venta of ventas) {
        try {
          const detalleResponse = await apiRequest('getVentaDetalle', { 
            id: venta.id 
          });
          
          const detalles = detalleResponse.data || [];
          
          detalles.forEach(detalle => {
            const key = detalle.productoId;
            
            if (!productosMap[key]) {
              productosMap[key] = {
                id: detalle.productoId,
                nombre: detalle.productoNombre,
                cantidadVendida: 0,
                totalVentas: 0
              };
            }
            
            productosMap[key].cantidadVendida += parseInt(detalle.cantidad) || 0;
            productosMap[key].totalVentas += parseFloat(detalle.subtotal) || 0;
          });
        } catch (error) {
          console.warn('Error procesando venta', venta.id, error);
        }
      }

      return Object.values(productosMap)
        .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
        .slice(0, limite);
    } catch (error) {
      console.error('Error al obtener top productos:', error);
      return [];
    }
  },

  async obtenerVentasPorCategoria() {
    try {
      const [ventasRes, productosRes, categoriasRes] = await Promise.all([
        apiRequest('getVentas'),
        apiRequest('getProductos'),
        apiRequest('getCategorias')
      ]);

      const ventas = ventasRes.data || [];
      const productos = productosRes.data || [];
      const categorias = categoriasRes.data || [];

      const categoriaMap = {};
      
      // Inicializar categorías
      categorias.forEach(cat => {
        categoriaMap[cat.id] = {
          nombre: cat.nombre,
          total: 0
        };
      });

      // Procesar ventas
      for (const venta of ventas) {
        try {
          const detalleRes = await apiRequest('getVentaDetalle', { id: venta.id });
          const detalles = detalleRes.data || [];
          
          detalles.forEach(detalle => {
            const producto = productos.find(p => p.id === detalle.productoId);
            if (producto && categoriaMap[producto.categoriaId]) {
              categoriaMap[producto.categoriaId].total += parseFloat(detalle.subtotal) || 0;
            }
          });
        } catch {
          console.warn('Error procesando venta', venta.id);
        }
      }

      return Object.values(categoriaMap)
        .filter(cat => cat.total > 0)
        .sort((a, b) => b.total - a.total);
    } catch (error) {
      console.error('Error al obtener ventas por categoría:', error);
      return [];
    }
  },

  // FUNCIÓN AGREGADA: Obtener ventas por empleado
  async obtenerVentasPorEmpleado(limite = 30) {
    try {
      const response = await apiRequest('getVentas');
      const ventas = response.data || [];
      
      // Filtrar últimos N días
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - limite);
      
      const ventasRecientes = ventas.filter(venta => {
        const fechaVenta = new Date(venta.fecha);
        return fechaVenta >= fechaLimite;
      });
      
      // Agrupar por empleado
      const ventasPorEmpleado = {};
      
      ventasRecientes.forEach(venta => {
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

      return Object.values(ventasPorEmpleado)
        .sort((a, b) => b.total - a.total);
    } catch (error) {
      console.error('Error al obtener ventas por empleado:', error);
      return [];
    }
  },

  limpiarCache() {
    this.cache.data = null;
    this.cache.timestamp = null;
  }
};

export default dashboardService;