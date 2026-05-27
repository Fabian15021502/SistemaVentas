// src/services/reportesService.js
import api from './apiClient';
import ventasService from './ventasService';
import productosService from './productosService';
import deudoresService from './deudoresService';

const reportesService = {

  // ==================== REPORTE DE VENTAS POR PERÍODO ====================

  async generarReporteVentas(fechaInicio, fechaFin, agrupacion = 'diario') {
    try {
      const ventas = await ventasService.obtenerVentasPorRangoFechas(fechaInicio, fechaFin);

      const reporte = {
        periodo: { fechaInicio, fechaFin, agrupacion },
        resumen: {
          totalVentas: ventas.length,
          totalIngresos: ventas.reduce((sum, v) => sum + parseFloat(v.total), 0),
          ventaPromedio: ventas.length > 0
            ? ventas.reduce((sum, v) => sum + parseFloat(v.total), 0) / ventas.length
            : 0
        },
        datos: []
      };

      if (agrupacion === 'diario') {
        const ventasPorDia = {};

        ventas.forEach(venta => {
          const fecha = new Date(venta.fecha);
          const clave = fecha.toISOString().split('T')[0];

          if (!ventasPorDia[clave]) {
            ventasPorDia[clave] = {
              fecha: clave,
              fechaFormateada: this.formatearFecha(fecha),
              ventas: 0,
              total: 0
            };
          }
          ventasPorDia[clave].ventas++;
          ventasPorDia[clave].total += parseFloat(venta.total);
        });

        reporte.datos = Object.values(ventasPorDia)
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      } else if (agrupacion === 'semanal') {
        // Agrupar por semana (número ISO de semana)
        const ventasPorSemana = {};

        ventas.forEach(venta => {
          const fecha = new Date(venta.fecha);
          const semana = this.obtenerSemanaISO(fecha);

          if (!ventasPorSemana[semana]) {
            ventasPorSemana[semana] = {
              fecha: semana,
              fechaFormateada: `Semana ${semana}`,
              ventas: 0,
              total: 0
            };
          }
          ventasPorSemana[semana].ventas++;
          ventasPorSemana[semana].total += parseFloat(venta.total);
        });

        reporte.datos = Object.values(ventasPorSemana);
      } else if (agrupacion === 'mensual') {
        const ventasPorMes = {};

        ventas.forEach(venta => {
          const fecha = new Date(venta.fecha);
          const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

          if (!ventasPorMes[clave]) {
            ventasPorMes[clave] = {
              fecha: clave,
              fechaFormateada: clave,
              ventas: 0,
              total: 0
            };
          }
          ventasPorMes[clave].ventas++;
          ventasPorMes[clave].total += parseFloat(venta.total);
        });

        reporte.datos = Object.values(ventasPorMes)
          .sort((a, b) => a.fecha.localeCompare(b.fecha));
      }

      return reporte;
    } catch (error) {
      console.error('Error al generar reporte de ventas:', error);
      throw error;
    }
  },

  // ==================== REPORTE DE PRODUCTOS MÁS VENDIDOS ====================

  async generarReporteProductos(fechaInicio, fechaFin, limite = 20) {
    try {
      const ventas = await ventasService.obtenerVentasPorRangoFechas(fechaInicio, fechaFin);
      const productos = await productosService.obtenerProductos();

      const ventasPorProducto = {};

      for (const venta of ventas) {
        const detalles = await ventasService.obtenerDetalleVenta(venta.id);

        detalles.forEach(detalle => {
          const productoId = detalle.productoId;
          const producto = productos.find(p => p.id === productoId);

          if (!ventasPorProducto[productoId]) {
            ventasPorProducto[productoId] = {
              id: productoId,
              nombre: producto?.nombre || detalle.productoNombre,
              categoriaId: producto?.categoriaId || null,
              cantidadVendida: 0,
              ingresosTotales: 0,
              porcentajeDelTotal: 0
            };
          }

          ventasPorProducto[productoId].cantidadVendida += parseInt(detalle.cantidad) || 0;
          ventasPorProducto[productoId].ingresosTotales += parseFloat(detalle.subtotal) || 0;
        });
      }

      const totalIngresos = Object.values(ventasPorProducto)
        .reduce((sum, p) => sum + p.ingresosTotales, 0);

      Object.values(ventasPorProducto).forEach(producto => {
        producto.porcentajeDelTotal = totalIngresos > 0
          ? (producto.ingresosTotales / totalIngresos) * 100
          : 0;
      });

      return {
        periodo: { fechaInicio, fechaFin },
        totalProductosVendidos: Object.keys(ventasPorProducto).length,
        totalIngresos,
        productos: Object.values(ventasPorProducto)
          .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
          .slice(0, limite)
      };
    } catch (error) {
      console.error('Error al generar reporte de productos:', error);
      throw error;
    }
  },

  // ==================== REPORTE DE DEUDORES ====================

  async generarReporteDeudores() {
    try {
      const deudores = await deudoresService.obtenerDeudores();
      const deudoresActivos = deudores.filter(d => d.saldoPendiente > 0);

      const reporte = {
        totalDeudores: deudores.length,
        deudoresActivos: deudoresActivos.length,
        deudaTotal: deudoresActivos.reduce((sum, d) => sum + (d.saldoPendiente || 0), 0),
        deudores: deudoresActivos
          .sort((a, b) => b.saldoPendiente - a.saldoPendiente)
          .map(deudor => ({
            id: deudor.id,
            nombre: deudor.nombre,
            telefono: deudor.telefono,
            deudaTotal: deudor.totalDeuda || deudor.saldoPendiente,
            saldoPendiente: deudor.saldoPendiente,
            fechaCreacion: deudor.fechaCreacion
          }))
      };

      reporte.rangosDeuda = {
        menor100k: deudoresActivos.filter(d => d.saldoPendiente < 100000).length,
        entre100k500k: deudoresActivos.filter(d => d.saldoPendiente >= 100000 && d.saldoPendiente < 500000).length,
        mayor500k: deudoresActivos.filter(d => d.saldoPendiente >= 500000).length
      };

      return reporte;
    } catch (error) {
      console.error('Error al generar reporte de deudores:', error);
      throw error;
    }
  },

  // ==================== REPORTE DE MÉTODOS DE PAGO ====================

  async generarReporteMetodosPago(fechaInicio, fechaFin) {
    try {
      const ventas = await ventasService.obtenerVentasPorRangoFechas(fechaInicio, fechaFin);

      const metodosPago = {};

      ventas.forEach(venta => {
        const metodo = venta.metodoPago || 'No especificado';

        if (!metodosPago[metodo]) {
          metodosPago[metodo] = { metodo, cantidad: 0, total: 0, porcentaje: 0 };
        }

        metodosPago[metodo].cantidad++;
        metodosPago[metodo].total += parseFloat(venta.total);
      });

      const totalVentas = ventas.length;
      const totalIngresos = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);

      Object.values(metodosPago).forEach(metodo => {
        metodo.porcentaje = totalVentas > 0 ? (metodo.cantidad / totalVentas) * 100 : 0;
        metodo.porcentajeIngresos = totalIngresos > 0 ? (metodo.total / totalIngresos) * 100 : 0;
      });

      return {
        periodo: { fechaInicio, fechaFin },
        totalVentas,
        totalIngresos,
        metodos: Object.values(metodosPago).sort((a, b) => b.total - a.total)
      };
    } catch (error) {
      console.error('Error al generar reporte de métodos de pago:', error);
      throw error;
    }
  },

  // ==================== REPORTE POR EMPLEADO ====================

  async generarReporteEmpleados(fechaInicio, fechaFin) {
    try {
      const ventas = await ventasService.obtenerVentasPorRangoFechas(fechaInicio, fechaFin);

      const ventasPorEmpleado = {};

      ventas.forEach(venta => {
        const empleadoId = venta.empleadoId || 'Sin asignar';

        if (!ventasPorEmpleado[empleadoId]) {
          ventasPorEmpleado[empleadoId] = {
            empleado: empleadoId === 'Sin asignar' ? 'Sin asignar' : empleadoId.split('@')[0],
            email: empleadoId === 'Sin asignar' ? null : empleadoId,
            ventas: 0,
            total: 0,
            ventaPromedio: 0
          };
        }

        ventasPorEmpleado[empleadoId].ventas++;
        ventasPorEmpleado[empleadoId].total += parseFloat(venta.total);
      });

      Object.values(ventasPorEmpleado).forEach(emp => {
        emp.ventaPromedio = emp.ventas > 0 ? emp.total / emp.ventas : 0;
      });

      return {
        periodo: { fechaInicio, fechaFin },
        totalEmpleados: Object.keys(ventasPorEmpleado).length,
        empleados: Object.values(ventasPorEmpleado).sort((a, b) => b.total - a.total)
      };
    } catch (error) {
      console.error('Error al generar reporte de empleados:', error);
      throw error;
    }
  },

  // ==================== REPORTE DE VENTAS POR HORA ====================

  async generarReporteVentasPorHora(fechaInicio, fechaFin) {
    try {
      const ventas = await ventasService.obtenerVentasPorRangoFechas(fechaInicio, fechaFin);

      const ventasPorHora = Array.from({ length: 24 }, (_, i) => ({
        hora: i,
        horaFormateada: `${i.toString().padStart(2, '0')}:00`,
        ventas: 0,
        total: 0
      }));

      ventas.forEach(venta => {
        const hora = new Date(venta.fecha).getHours();
        ventasPorHora[hora].ventas++;
        ventasPorHora[hora].total += parseFloat(venta.total);
      });

      return { periodo: { fechaInicio, fechaFin }, horas: ventasPorHora };
    } catch (error) {
      console.error('Error al generar reporte por hora:', error);
      throw error;
    }
  },

  // ==================== REPORTE COMPARATIVO ====================

  async generarReporteComparativo(periodoActual, periodoAnterior) {
    try {
      const [reporteActual, reporteAnterior] = await Promise.all([
        this.generarReporteVentas(periodoActual.fechaInicio, periodoActual.fechaFin),
        this.generarReporteVentas(periodoAnterior.fechaInicio, periodoAnterior.fechaFin)
      ]);

      return {
        periodos: { actual: periodoActual, anterior: periodoAnterior },
        comparacion: {
          ventas: this.calcularCambioPorcentual(
            reporteActual.resumen.totalVentas,
            reporteAnterior.resumen.totalVentas
          ),
          ingresos: this.calcularCambioPorcentual(
            reporteActual.resumen.totalIngresos,
            reporteAnterior.resumen.totalIngresos
          ),
          promedio: this.calcularCambioPorcentual(
            reporteActual.resumen.ventaPromedio,
            reporteAnterior.resumen.ventaPromedio
          )
        },
        actual: reporteActual,
        anterior: reporteAnterior
      };
    } catch (error) {
      console.error('Error al generar reporte comparativo:', error);
      throw error;
    }
  },

  // ==================== MÉTODOS SIMPLES (compatibilidad nueva versión) ====================

  async obtenerReporteVentas(filtros = {}) {
    return ventasService.obtenerVentasPorRangoFechas(
      filtros.fechaInicio || '',
      filtros.fechaFin || ''
    );
  },

  async obtenerReporteInventario() {
    try {
      const response = await api.get('/api/inventario');
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener reporte de inventario:', error);
      throw error;
    }
  },

  async obtenerReporteDeudores() {
    return deudoresService.obtenerDeudores();
  },

  async obtenerReporteMovimientos(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.productoId) params.append('productoId', filtros.productoId);
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      params.append('limit', '100');

      const response = await api.get(`/api/movimientos?${params}`);
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener reporte de movimientos:', error);
      throw error;
    }
  },

  // ==================== FUNCIONES AUXILIARES ====================

  calcularCambioPorcentual(valorActual, valorAnterior) {
    if (valorAnterior === 0) return valorActual > 0 ? 100 : 0;
    return ((valorActual - valorAnterior) / valorAnterior) * 100;
  },

  formatearFecha(fecha) {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${dias[fecha.getDay()]} ${fecha.getDate()} ${meses[fecha.getMonth()]}`;
  },

  formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  },

  obtenerSemanaISO(fecha) {
    const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return `${d.getUTCFullYear()}-W${String(Math.ceil((((d - yearStart) / 86400000) + 1) / 7)).padStart(2, '0')}`;
  },

  // ==================== EXPORTACIÓN ====================

  async exportarReporteAJSON(reporte) {
    const dataStr = JSON.stringify(reporte, null, 2);
    return 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  },

  async exportarReporteACSV(reporte, tipoReporte) {
    let csvContent = '';

    switch (tipoReporte) {
      case 'ventas':
        csvContent = 'Fecha,Ventas,Total\n';
        reporte.datos.forEach(fila => {
          csvContent += `${fila.fechaFormateada},${fila.ventas},${fila.total}\n`;
        });
        break;

      case 'productos':
        csvContent = 'Producto,Cantidad Vendida,Ingresos,Porcentaje\n';
        reporte.productos.forEach(producto => {
          csvContent += `${producto.nombre},${producto.cantidadVendida},${producto.ingresosTotales},${producto.porcentajeDelTotal.toFixed(2)}%\n`;
        });
        break;

      case 'deudores':
        csvContent = 'Deudor,Deuda Total,Saldo Pendiente,Teléfono\n';
        reporte.deudores.forEach(deudor => {
          csvContent += `${deudor.nombre},${deudor.deudaTotal},${deudor.saldoPendiente},${deudor.telefono || ''}\n`;
        });
        break;
    }

    return 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
  }
};

export default reportesService;
