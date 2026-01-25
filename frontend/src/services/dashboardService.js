import ventasService from './ventasService';
import productosService from './productosService';
import deudoresService from './deudoresService';

class DashboardService {
  // ========== VENTAS ==========

  getVentasDelDia() {
    return ventasService.getVentasDeHoy();
  }

  getTotalVentasDelDia() {
    return ventasService.getTotalVentasHoy();
  }

  getVentasPorPeriodo(dias = 7) {
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);
    
    return ventasService.getVentasPorPeriodo(fechaInicio, fechaFin);
  }

  getVentasUltimaSemana() {
    const ventas = this.getVentasPorPeriodo(7);
    const ventasPorDia = {};

    // Inicializar últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const key = fecha.toISOString().split('T')[0];
      ventasPorDia[key] = {
        fecha: key,
        dia: fecha.toLocaleDateString('es-CO', { weekday: 'short' }),
        total: 0,
        cantidad: 0
      };
    }

    // Sumar ventas por día
    ventas.forEach(venta => {
      const fecha = venta.fechaHora.split('T')[0];
      if (ventasPorDia[fecha]) {
        ventasPorDia[fecha].total += venta.total;
        ventasPorDia[fecha].cantidad += 1;
      }
    });

    return Object.values(ventasPorDia);
  }

  getVentasUltimoMes() {
    const ventas = this.getVentasPorPeriodo(30);
    const ventasPorSemana = {
      'Semana 1': { total: 0, cantidad: 0 },
      'Semana 2': { total: 0, cantidad: 0 },
      'Semana 3': { total: 0, cantidad: 0 },
      'Semana 4': { total: 0, cantidad: 0 }
    };

    const ahora = new Date();
    
    ventas.forEach(venta => {
      const fechaVenta = new Date(venta.fechaHora);
      const diasDiferencia = Math.floor((ahora - fechaVenta) / (1000 * 60 * 60 * 24));
      
      if (diasDiferencia <= 7) {
        ventasPorSemana['Semana 4'].total += venta.total;
        ventasPorSemana['Semana 4'].cantidad += 1;
      } else if (diasDiferencia <= 14) {
        ventasPorSemana['Semana 3'].total += venta.total;
        ventasPorSemana['Semana 3'].cantidad += 1;
      } else if (diasDiferencia <= 21) {
        ventasPorSemana['Semana 2'].total += venta.total;
        ventasPorSemana['Semana 2'].cantidad += 1;
      } else {
        ventasPorSemana['Semana 1'].total += venta.total;
        ventasPorSemana['Semana 1'].cantidad += 1;
      }
    });

    return Object.entries(ventasPorSemana).map(([nombre, datos]) => ({
      nombre,
      ...datos
    }));
  }

  // ========== PRODUCTOS ==========

  getTopProductos(limite = 5) {
    const detalles = ventasService.getDetalleVentas();
    const productosContador = {};

    detalles.forEach(detalle => {
      const key = detalle.productoId;
      if (!productosContador[key]) {
        productosContador[key] = {
          id: key,
          nombre: detalle.productoNombre,
          cantidadVendida: 0,
          totalVentas: 0
        };
      }
      productosContador[key].cantidadVendida += detalle.cantidad;
      productosContador[key].totalVentas += detalle.subtotal;
    });

    return Object.values(productosContador)
      .sort((a, b) => b.totalVentas - a.totalVentas)
      .slice(0, limite);
  }

  getVentasPorCategoria() {
    const detalles = ventasService.getDetalleVentas();
    const productos = productosService.getProductos();
    const categorias = productosService.getCategorias();
    const ventasPorCategoria = {};

    // Inicializar categorías
    categorias.forEach(cat => {
      ventasPorCategoria[cat.id] = {
        nombre: cat.nombre,
        total: 0,
        cantidad: 0
      };
    });

    // Sumar ventas por categoría
    detalles.forEach(detalle => {
      const producto = productos.find(p => p.id === detalle.productoId);
      if (producto && ventasPorCategoria[producto.categoriaId]) {
        ventasPorCategoria[producto.categoriaId].total += detalle.subtotal;
        ventasPorCategoria[producto.categoriaId].cantidad += detalle.cantidad;
      }
    });

    return Object.values(ventasPorCategoria)
      .filter(cat => cat.total > 0)
      .sort((a, b) => b.total - a.total);
  }

  // ========== EMPLEADOS ==========

  getVentasPorEmpleado() {
    const ventas = ventasService.getVentas();
    const ventasPorEmpleado = {};

    ventas.forEach(venta => {
      const empleadoId = venta.empleadoId;
      if (!ventasPorEmpleado[empleadoId]) {
        ventasPorEmpleado[empleadoId] = {
          empleadoId,
          total: 0,
          cantidad: 0
        };
      }
      ventasPorEmpleado[empleadoId].total += venta.total;
      ventasPorEmpleado[empleadoId].cantidad += 1;
    });

    return Object.values(ventasPorEmpleado)
      .sort((a, b) => b.total - a.total);
  }

  // ========== MÉTRICAS GENERALES ==========

  getMetricasGenerales() {
    const ventasHoy = this.getVentasDelDia();
    const totalHoy = this.getTotalVentasDelDia();
    const deudaPendiente = deudoresService.getTotalDeudaPendiente();
    const deudoresActivos = deudoresService.getDeudoresActivos().length;
    const productos = productosService.getProductos().filter(p => p.activo);

    return {
      ventasHoy: {
        total: totalHoy,
        cantidad: ventasHoy.length
      },
      deuda: {
        total: deudaPendiente,
        deudores: deudoresActivos
      },
      productos: {
        total: productos.length
      }
    };
  }

  // ========== COMPARATIVAS ==========

  getComparativaConAyer() {
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);

    const ventasHoy = ventasService.getVentasPorPeriodo(hoy, new Date());
    const ventasAyer = ventasService.getVentasPorPeriodo(ayer, hoy);

    const totalHoy = ventasHoy.reduce((sum, v) => sum + v.total, 0);
    const totalAyer = ventasAyer.reduce((sum, v) => sum + v.total, 0);

    const diferencia = totalHoy - totalAyer;
    const porcentaje = totalAyer > 0 ? ((diferencia / totalAyer) * 100).toFixed(1) : 0;

    return {
      hoy: totalHoy,
      ayer: totalAyer,
      diferencia,
      porcentaje: parseFloat(porcentaje)
    };
  }
}

// Exportar instancia única
const dashboardService = new DashboardService();
export default dashboardService;