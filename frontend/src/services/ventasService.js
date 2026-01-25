// Servicio para manejar ventas
class VentasService {
  constructor() {
    this.ventasKey = 'ventas';
    this.detalleVentasKey = 'detalle_ventas';
    this.deudoresKey = 'deudores';
    this.deudasKey = 'deudas';
    this.initializeData();
  }

  initializeData() {
    if (!localStorage.getItem(this.ventasKey)) {
      localStorage.setItem(this.ventasKey, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.detalleVentasKey)) {
      localStorage.setItem(this.detalleVentasKey, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.deudoresKey)) {
      localStorage.setItem(this.deudoresKey, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.deudasKey)) {
      localStorage.setItem(this.deudasKey, JSON.stringify([]));
    }
  }

  // ========== VENTAS ==========

  getVentas() {
    const data = localStorage.getItem(this.ventasKey);
    return data ? JSON.parse(data) : [];
  }

  getVenta(id) {
    const ventas = this.getVentas();
    return ventas.find(v => v.id === id);
  }

  registrarVenta(venta, detalles, empleadoId) {
    const ventas = this.getVentas();
    const detalleVentas = this.getDetalleVentas();
    
    const newId = Math.max(0, ...ventas.map(v => v.id)) + 1;
    const fechaHora = new Date().toISOString();
    
    // Crear venta principal
    const nuevaVenta = {
      id: newId,
      fechaHora,
      empleadoId,
      total: venta.total,
      metodoPago: venta.metodoPago,
      cliente: venta.cliente || null,
      esCredito: venta.metodoPago === 'fiado'
    };
    
    ventas.push(nuevaVenta);
    localStorage.setItem(this.ventasKey, JSON.stringify(ventas));
    
    // Guardar detalles
    detalles.forEach((detalle, index) => {
      const detalleId = Date.now() + index;
      detalleVentas.push({
        id: detalleId,
        ventaId: newId,
        productoId: detalle.productoId,
        productoNombre: detalle.productoNombre,
        variacionId: detalle.variacionId || null,
        variacionValor: detalle.variacionValor || null,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
        subtotal: detalle.subtotal
      });
    });
    
    localStorage.setItem(this.detalleVentasKey, JSON.stringify(detalleVentas));
    
    // Si es fiado, crear deuda
    if (venta.metodoPago === 'fiado' && venta.cliente) {
      this.crearDeuda(venta.cliente, newId, venta.total);
    }
    
    return nuevaVenta;
  }

  getDetalleVentas() {
    const data = localStorage.getItem(this.detalleVentasKey);
    return data ? JSON.parse(data) : [];
  }

  getDetallesPorVenta(ventaId) {
    const detalles = this.getDetalleVentas();
    return detalles.filter(d => d.ventaId === ventaId);
  }

  // ========== DEUDORES ==========

  getDeudores() {
    const data = localStorage.getItem(this.deudoresKey);
    return data ? JSON.parse(data) : [];
  }

  buscarDeudor(telefono) {
    const deudores = this.getDeudores();
    return deudores.find(d => d.telefono === telefono);
  }

  crearDeudor(datos) {
    const deudores = this.getDeudores();
    const newId = Math.max(0, ...deudores.map(d => d.id)) + 1;
    
    const nuevoDeudor = {
      id: newId,
      nombre: datos.nombre,
      telefono: datos.telefono,
      totalDeuda: 0,
      saldoPendiente: 0,
      activo: true,
      fechaCreacion: new Date().toISOString()
    };
    
    deudores.push(nuevoDeudor);
    localStorage.setItem(this.deudoresKey, JSON.stringify(deudores));
    return nuevoDeudor;
  }

  actualizarDeudor(id, monto) {
    const deudores = this.getDeudores();
    const index = deudores.findIndex(d => d.id === id);
    
    if (index !== -1) {
      deudores[index].totalDeuda += monto;
      deudores[index].saldoPendiente += monto;
      localStorage.setItem(this.deudoresKey, JSON.stringify(deudores));
    }
  }

  // ========== DEUDAS ==========

  getDeudas() {
    const data = localStorage.getItem(this.deudasKey);
    return data ? JSON.parse(data) : [];
  }

  crearDeuda(clienteInfo, ventaId, monto) {
    // Buscar o crear deudor
    let deudor = this.buscarDeudor(clienteInfo.telefono);
    
    if (!deudor) {
      deudor = this.crearDeudor(clienteInfo);
    }
    
    // Crear deuda
    const deudas = this.getDeudas();
    const newId = Math.max(0, ...deudas.map(d => d.id)) + 1;
    
    const nuevaDeuda = {
      id: newId,
      deudorId: deudor.id,
      ventaId,
      fecha: new Date().toISOString(),
      montoOriginal: monto,
      saldo: monto,
      estado: 'Pendiente'
    };
    
    deudas.push(nuevaDeuda);
    localStorage.setItem(this.deudasKey, JSON.stringify(deudas));
    
    // Actualizar totales del deudor
    this.actualizarDeudor(deudor.id, monto);
    
    return nuevaDeuda;
  }

  // ========== ESTADÍSTICAS ==========

  getVentasDeHoy() {
    const ventas = this.getVentas();
    const hoy = new Date().toISOString().split('T')[0];
    
    return ventas.filter(v => {
      const fechaVenta = v.fechaHora.split('T')[0];
      return fechaVenta === hoy;
    });
  }

  getTotalVentasHoy() {
    const ventasHoy = this.getVentasDeHoy();
    return ventasHoy.reduce((total, venta) => total + venta.total, 0);
  }

  getVentasPorPeriodo(fechaInicio, fechaFin) {
    const ventas = this.getVentas();
    
    return ventas.filter(v => {
      const fechaVenta = new Date(v.fechaHora);
      return fechaVenta >= fechaInicio && fechaVenta <= fechaFin;
    });
  }
}

// Exportar instancia única
const ventasService = new VentasService();
export default ventasService;