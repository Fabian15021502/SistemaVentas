// =====================================================
// SISTEMA DE VENTAS - API REST CON EXPRESS + FIRESTORE
// Versión: 3.0.0 - MIGRADO DE APPS SCRIPT
// =====================================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { initializeFirebase, getDB } = require('./firebase-config');

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// MIDDLEWARES
// =====================================================
app.use(helmet()); // Seguridad
app.use(cors()); // CORS
app.use(express.json()); // Body parser
app.use(morgan('dev')); // Logs

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000 // límite de 1000 requests por IP
});
app.use(limiter);

// Inicializar Firebase
initializeFirebase();
const db = getDB();

// =====================================================
// HEALTH CHECK
// =====================================================
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    message: 'API Sistema de Ventas - Firestore',
    version: '3.0.0',
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// CATEGORÍAS
// =====================================================
app.get('/api/categorias', async (req, res) => {
  try {
    const snapshot = await db.collection('categorias')
      .where('activo', '==', true)
      .orderBy('nombre')
      .get();

    const categorias = [];
    snapshot.forEach(doc => {
      categorias.push({ id: doc.id, ...doc.data() });
    });

    res.json({ success: true, data: categorias });
  } catch (error) {
    console.error('Error en getCategorias:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/categorias', async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    
    const docRef = await db.collection('categorias').add({
      nombre,
      descripcion: descripcion || '',
      activo: true,
      fechaCreacion: new Date()
    });

    res.json({ 
      success: true, 
      data: { id: docRef.id, nombre, descripcion, activo: true }
    });
  } catch (error) {
    console.error('Error en crearCategoria:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/categorias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    await db.collection('categorias').doc(id).update({
      nombre,
      descripcion
    });

    res.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Error en actualizarCategoria:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/categorias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete - marcar como inactivo
    await db.collection('categorias').doc(id).update({
      activo: false
    });

    res.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Error en eliminarCategoria:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// PRODUCTOS
// =====================================================
app.get('/api/productos', async (req, res) => {
  try {
    const productosSnapshot = await db.collection('productos')
      .where('activo', '==', true)
      .orderBy('nombre')
      .get();

    const productos = [];
    
    for (const doc of productosSnapshot.docs) {
      const producto = { id: doc.id, ...doc.data() };
      
      // Obtener variaciones del producto
      const variacionesSnapshot = await db.collection('productos')
        .doc(doc.id)
        .collection('variaciones')
        .get();
      
      producto.variaciones = [];
      variacionesSnapshot.forEach(varDoc => {
        producto.variaciones.push({ id: varDoc.id, ...varDoc.data() });
      });
      
      productos.push(producto);
    }

    res.json({ success: true, data: productos });
  } catch (error) {
    console.error('Error en getProductos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/productos', async (req, res) => {
  try {
    const { nombre, categoriaId, precioBase, variaciones } = req.body;
    
    const docRef = await db.collection('productos').add({
      nombre,
      categoriaId,
      precioBase: parseFloat(precioBase),
      activo: true,
      fechaCreacion: new Date()
    });

    // Crear variaciones si existen
    if (variaciones && variaciones.length > 0) {
      const batch = db.batch();
      
      variaciones.forEach(variacion => {
        const varRef = db.collection('productos')
          .doc(docRef.id)
          .collection('variaciones')
          .doc();
        
        batch.set(varRef, {
          tipo: variacion.tipo || '',
          valor: variacion.valor || '',
          precioAdicional: parseFloat(variacion.precioAdicional) || 0
        });

        // Crear inventario para cada variación
        const invRef = db.collection('inventario').doc();
        batch.set(invRef, {
          productoId: docRef.id,
          variacionId: varRef.id,
          cantidad: 0,
          stockMinimo: 5,
          stockMaximo: 100,
          ubicacion: '',
          costoPromedio: 0,
          fechaCreacion: new Date(),
          fechaActualizacion: new Date(),
          notas: `Auto-creado: ${variacion.valor || variacion.tipo}`
        });
      });

      await batch.commit();
    } else {
      // Producto sin variaciones - crear inventario general
      await db.collection('inventario').add({
        productoId: docRef.id,
        variacionId: null,
        cantidad: 0,
        stockMinimo: 5,
        stockMaximo: 100,
        ubicacion: '',
        costoPromedio: 0,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        notas: 'Producto sin variaciones'
      });
    }

    res.json({ 
      success: true, 
      data: { id: docRef.id, nombre, categoriaId, precioBase }
    });
  } catch (error) {
    console.error('Error en crearProducto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// INVENTARIO
// =====================================================
app.get('/api/inventario', async (req, res) => {
  try {
    const snapshot = await db.collection('inventario').get();

    const inventario = [];
    snapshot.forEach(doc => {
      inventario.push({ id: doc.id, ...doc.data() });
    });

    res.json({ success: true, data: inventario });
  } catch (error) {
    console.error('Error en getInventario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/inventario', async (req, res) => {
  try {
    const { productoId, variacionId, cantidad, stockMinimo, stockMaximo, ubicacion, notas } = req.body;
    
    const docRef = await db.collection('inventario').add({
      productoId,
      variacionId: variacionId || null,
      cantidad: parseFloat(cantidad) || 0,
      stockMinimo: parseFloat(stockMinimo) || 0,
      stockMaximo: parseFloat(stockMaximo) || 0,
      ubicacion: ubicacion || '',
      costoPromedio: 0,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
      notas: notas || ''
    });

    res.json({ success: true, data: { id: docRef.id } });
  } catch (error) {
    console.error('Error en crearInventario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/inventario', async (req, res) => {
  try {
    const { productoId, variacionId, cantidad, stockMinimo, stockMaximo, ubicacion, notas } = req.body;
    
    // Buscar el registro de inventario
    const querySnapshot = await db.collection('inventario')
      .where('productoId', '==', productoId)
      .where('variacionId', '==', variacionId || null)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return res.status(404).json({ 
        success: false, 
        error: 'Inventario no encontrado' 
      });
    }

    const doc = querySnapshot.docs[0];
    const updateData = {
      fechaActualizacion: new Date()
    };

    if (cantidad !== undefined) updateData.cantidad = parseFloat(cantidad);
    if (stockMinimo !== undefined) updateData.stockMinimo = parseFloat(stockMinimo);
    if (stockMaximo !== undefined) updateData.stockMaximo = parseFloat(stockMaximo);
    if (ubicacion !== undefined) updateData.ubicacion = ubicacion;
    if (notas !== undefined) updateData.notas = notas;

    await doc.ref.update(updateData);

    res.json({ success: true, data: { productoId, variacionId } });
  } catch (error) {
    console.error('Error en actualizarInventario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// MOVIMIENTOS DE INVENTARIO
// =====================================================
app.get('/api/movimientos', async (req, res) => {
  try {
    const snapshot = await db.collection('movimientos')
      .orderBy('fecha', 'desc')
      .limit(100)
      .get();

    const movimientos = [];
    snapshot.forEach(doc => {
      movimientos.push({ id: doc.id, ...doc.data() });
    });

    res.json({ success: true, data: movimientos });
  } catch (error) {
    console.error('Error en getMovimientos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/movimientos', async (req, res) => {
  try {
    const { productoId, variacionId, tipo, cantidad, motivo, referencia, costo, usuario } = req.body;
    
    const batch = db.batch();

    // 1. Registrar el movimiento
    const movRef = db.collection('movimientos').doc();
    batch.set(movRef, {
      productoId,
      variacionId: variacionId || null,
      tipo, // 'entrada', 'salida', 'ajuste'
      cantidad: parseInt(cantidad),
      motivo: motivo || '',
      referencia: referencia || '',
      costo: parseFloat(costo) || 0,
      fecha: new Date(),
      usuario: usuario || 'system'
    });

    // 2. Actualizar inventario
    const invQuery = await db.collection('inventario')
      .where('productoId', '==', productoId)
      .where('variacionId', '==', variacionId || null)
      .limit(1)
      .get();

    if (!invQuery.empty) {
      const invDoc = invQuery.docs[0];
      const stockActual = invDoc.data().cantidad || 0;
      let nuevoStock = stockActual;

      switch(tipo) {
        case 'entrada':
          nuevoStock = stockActual + parseInt(cantidad);
          break;
        case 'salida':
          nuevoStock = Math.max(0, stockActual - parseInt(cantidad));
          break;
        case 'ajuste':
          nuevoStock = stockActual + parseInt(cantidad);
          break;
      }

      const updateData = {
        cantidad: nuevoStock,
        fechaActualizacion: new Date()
      };

      // Actualizar costo promedio si es entrada con costo
      if (tipo === 'entrada' && costo > 0 && nuevoStock > 0) {
        const costoActual = invDoc.data().costoPromedio || 0;
        const costoTotal = (costoActual * stockActual) + (costo * cantidad);
        updateData.costoPromedio = costoTotal / nuevoStock;
      }

      batch.update(invDoc.ref, updateData);
    } else {
      // Crear inventario si no existe
      const invRef = db.collection('inventario').doc();
      batch.set(invRef, {
        productoId,
        variacionId: variacionId || null,
        cantidad: tipo === 'entrada' ? parseInt(cantidad) : 0,
        stockMinimo: 0,
        stockMaximo: 0,
        ubicacion: '',
        costoPromedio: parseFloat(costo) || 0,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        notas: 'Auto-creado por movimiento'
      });
    }

    await batch.commit();

    res.json({ success: true, data: { id: movRef.id } });
  } catch (error) {
    console.error('Error en registrarMovimiento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// VENTAS
// =====================================================
app.get('/api/ventas', async (req, res) => {
  try {
    let query = db.collection('ventas').orderBy('fecha', 'desc');

    // Filtros opcionales
    if (req.query.turnoId) {
      query = query.where('turnoId', '==', req.query.turnoId);
    }
    if (req.query.cajaId) {
      query = query.where('cajaId', '==', req.query.cajaId);
    }
    if (req.query.limit) {
      query = query.limit(parseInt(req.query.limit));
    }

    const snapshot = await query.get();

    const ventas = [];
    snapshot.forEach(doc => {
      ventas.push({ id: doc.id, ...doc.data() });
    });

    res.json({ success: true, data: ventas });
  } catch (error) {
    console.error('Error en getVentas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/ventas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const doc = await db.collection('ventas').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Venta no encontrada' });
    }

    // Obtener items de la venta
    const itemsSnapshot = await db.collection('ventas')
      .doc(id)
      .collection('items')
      .get();

    const items = [];
    itemsSnapshot.forEach(itemDoc => {
      items.push({ id: itemDoc.id, ...itemDoc.data() });
    });

    res.json({ 
      success: true, 
      data: {
        ...doc.data(),
        id: doc.id,
        items
      }
    });
  } catch (error) {
    console.error('Error en getVentaDetalle:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/ventas', async (req, res) => {
  try {
    const { empleadoId, total, metodoPago, clienteNombre, clienteTelefono, items } = req.body;

    // 1. Validar turno activo
    const turnoSnapshot = await db.collection('turnos')
      .where('estado', '==', 'abierto')
      .limit(1)
      .get();

    if (turnoSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'No hay un turno activo. Por favor, abre el turno antes de realizar ventas.'
      });
    }

    const turnoActivo = turnoSnapshot.docs[0];

    // 2. Validar caja activa del empleado
    const cajaSnapshot = await db.collection('cajas')
      .where('turnoId', '==', turnoActivo.id)
      .where('empleado', '==', empleadoId)
      .where('estado', '==', 'abierta')
      .limit(1)
      .get();

    if (cajaSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'No tienes una caja abierta. Por favor, abre tu caja antes de realizar ventas.'
      });
    }

    const cajaActiva = cajaSnapshot.docs[0];

    // 3. Validar stock ANTES de registrar
    for (const item of items) {
      const invQuery = await db.collection('inventario')
        .where('productoId', '==', item.productoId)
        .where('variacionId', '==', item.variacionId || null)
        .limit(1)
        .get();

      if (invQuery.empty) {
        return res.status(400).json({
          success: false,
          error: `No hay inventario registrado para: ${item.productoNombre} ${item.variacion || ''}`
        });
      }

      const stockDisponible = invQuery.docs[0].data().cantidad || 0;
      
      if (stockDisponible < item.cantidad) {
        return res.status(400).json({
          success: false,
          error: `Stock insuficiente para ${item.productoNombre} ${item.variacion || ''}. Disponible: ${stockDisponible}, Solicitado: ${item.cantidad}`
        });
      }
    }

    // 4. Registrar venta con transacción
    const batch = db.batch();

    const ventaRef = db.collection('ventas').doc();
    batch.set(ventaRef, {
      fecha: new Date(),
      empleadoId,
      total: parseFloat(total),
      metodoPago,
      clienteNombre: clienteNombre || 'Cliente General',
      clienteTelefono: clienteTelefono || '',
      cajaId: cajaActiva.id,
      turnoId: turnoActivo.id,
      estado: 'completada'
    });

    // 5. Registrar items y descontar inventario
    for (const item of items) {
      // Agregar item
      const itemRef = ventaRef.collection('items').doc();
      batch.set(itemRef, {
        productoId: item.productoId,
        productoNombre: item.productoNombre,
        variacionId: item.variacionId || null,
        variacion: item.variacion || '',
        cantidad: parseInt(item.cantidad),
        precioUnitario: parseFloat(item.precioUnitario),
        subtotal: parseFloat(item.subtotal)
      });

      // Descontar inventario
      const invQuery = await db.collection('inventario')
        .where('productoId', '==', item.productoId)
        .where('variacionId', '==', item.variacionId || null)
        .limit(1)
        .get();

      const invDoc = invQuery.docs[0];
      const stockActual = invDoc.data().cantidad || 0;
      const nuevoStock = Math.max(0, stockActual - item.cantidad);

      batch.update(invDoc.ref, {
        cantidad: nuevoStock,
        fechaActualizacion: new Date()
      });
    }

    await batch.commit();

    res.json({
      success: true,
      data: {
        id: ventaRef.id,
        fecha: new Date(),
        total: parseFloat(total),
        cajaId: cajaActiva.id,
        turnoId: turnoActivo.id
      }
    });
  } catch (error) {
    console.error('Error en registrarVenta:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// DEUDORES Y DEUDAS
// =====================================================
app.get('/api/deudores', async (req, res) => {
  try {
    const snapshot = await db.collection('deudores')
      .where('activo', '==', true)
      .orderBy('nombre')
      .get();

    const deudores = [];
    snapshot.forEach(doc => {
      deudores.push({ id: doc.id, ...doc.data() });
    });

    res.json({ success: true, data: deudores });
  } catch (error) {
    console.error('Error en getDeudores:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/deudores', async (req, res) => {
  try {
    const { nombre, telefono } = req.body;
    
    const docRef = await db.collection('deudores').add({
      nombre,
      telefono: telefono || '',
      totalDeuda: 0,
      saldoPendiente: 0,
      activo: true,
      fechaCreacion: new Date()
    });

    res.json({ success: true, data: { id: docRef.id, nombre, telefono } });
  } catch (error) {
    console.error('Error en crearDeudor:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/deudores/:id/deudas', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deudasSnapshot = await db.collection('deudas')
      .where('deudorId', '==', id)
      .orderBy('fecha', 'desc')
      .get();

    const deudas = [];
    
    for (const doc of deudasSnapshot.docs) {
      const deuda = { id: doc.id, ...doc.data() };
      
      // Obtener abonos de cada deuda
      const abonosSnapshot = await db.collection('abonos')
        .where('deudaId', '==', doc.id)
        .orderBy('fecha', 'desc')
        .get();
      
      deuda.abonos = [];
      abonosSnapshot.forEach(abonoDoc => {
        deuda.abonos.push({ id: abonoDoc.id, ...abonoDoc.data() });
      });
      
      deudas.push(deuda);
    }

    res.json({ success: true, data: deudas });
  } catch (error) {
    console.error('Error en getDeudasPorDeudor:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/deudas', async (req, res) => {
  try {
    const { deudorId, ventaId, monto } = req.body;
    
    const batch = db.batch();

    // Crear deuda
    const deudaRef = db.collection('deudas').doc();
    batch.set(deudaRef, {
      deudorId,
      ventaId: ventaId || null,
      fecha: new Date(),
      monto: parseFloat(monto),
      saldo: parseFloat(monto),
      estado: 'pendiente'
    });

    // Actualizar totales del deudor
    const deudorRef = db.collection('deudores').doc(deudorId);
    const deudorDoc = await deudorRef.get();
    const deudorData = deudorDoc.data();
    
    batch.update(deudorRef, {
      totalDeuda: (deudorData.totalDeuda || 0) + parseFloat(monto),
      saldoPendiente: (deudorData.saldoPendiente || 0) + parseFloat(monto)
    });

    await batch.commit();

    res.json({ success: true, data: { id: deudaRef.id } });
  } catch (error) {
    console.error('Error en crearDeuda:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/abonos', async (req, res) => {
  try {
    const { deudorId, deudaId, monto, metodoPago, notas, registradoPor } = req.body;
    
    const batch = db.batch();

    // 1. Registrar abono
    const abonoRef = db.collection('abonos').doc();
    batch.set(abonoRef, {
      deudorId,
      deudaId: deudaId || null,
      fecha: new Date(),
      monto: parseFloat(monto),
      metodoPago: metodoPago || 'efectivo',
      notas: notas || '',
      registradoPor: registradoPor || 'system'
    });

    // 2. Si hay deudaId específico, actualizar esa deuda
    if (deudaId) {
      const deudaRef = db.collection('deudas').doc(deudaId);
      const deudaDoc = await deudaRef.get();
      const deudaData = deudaDoc.data();
      
      const nuevoSaldo = Math.max(0, deudaData.saldo - parseFloat(monto));
      const nuevoEstado = nuevoSaldo === 0 ? 'pagado' : 'pendiente';
      
      batch.update(deudaRef, {
        saldo: nuevoSaldo,
        estado: nuevoEstado
      });
    }

    // 3. Recalcular totales del deudor
    const deudasSnapshot = await db.collection('deudas')
      .where('deudorId', '==', deudorId)
      .where('estado', '==', 'pendiente')
      .get();

    let totalDeudaPendiente = 0;
    deudasSnapshot.forEach(doc => {
      totalDeudaPendiente += doc.data().monto || 0;
    });

    // Calcular total de abonos
    const abonosSnapshot = await db.collection('abonos')
      .where('deudorId', '==', deudorId)
      .get();

    let totalAbonos = 0;
    abonosSnapshot.forEach(doc => {
      totalAbonos += doc.data().monto || 0;
    });
    
    totalAbonos += parseFloat(monto); // Incluir el abono actual

    const saldoPendiente = Math.max(0, totalDeudaPendiente - totalAbonos);

    batch.update(db.collection('deudores').doc(deudorId), {
      totalDeuda: totalDeudaPendiente,
      saldoPendiente: saldoPendiente
    });

    await batch.commit();

    res.json({ success: true, data: { id: abonoRef.id } });
  } catch (error) {
    console.error('Error en registrarAbono:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// TURNOS Y CAJAS
// =====================================================
app.get('/api/turnos/activo', async (req, res) => {
  try {
    const snapshot = await db.collection('turnos')
      .where('estado', '==', 'abierto')
      .orderBy('fechaInicio', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({ success: true, data: null });
    }

    const doc = snapshot.docs[0];
    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Error en getTurnoActivo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/turnos/abrir', async (req, res) => {
  try {
    // Verificar que no haya turno activo
    const turnoActivo = await db.collection('turnos')
      .where('estado', '==', 'abierto')
      .limit(1)
      .get();

    if (!turnoActivo.empty) {
      return res.status(400).json({
        success: false,
        error: 'Ya hay un turno abierto hoy'
      });
    }

    const docRef = await db.collection('turnos').add({
      fechaInicio: new Date(),
      estado: 'abierto',
      totalVentas: 0,
      totalEfectivo: 0,
      totalTarjeta: 0,
      totalTransferencia: 0,
      totalFiado: 0
    });

    res.json({ success: true, data: { id: docRef.id } });
  } catch (error) {
    console.error('Error en abrirTurno:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/turnos/:id/cerrar', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que no haya cajas abiertas
    const cajasAbiertas = await db.collection('cajas')
      .where('turnoId', '==', id)
      .where('estado', '==', 'abierta')
      .get();

    if (!cajasAbiertas.empty) {
      return res.status(400).json({
        success: false,
        error: 'Hay cajas abiertas. Cierra todas las cajas antes de cerrar el turno'
      });
    }

    // Calcular totales del turno
    const ventasSnapshot = await db.collection('ventas')
      .where('turnoId', '==', id)
      .get();

    let totales = {
      totalVentas: 0,
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
      fiado: 0
    };

    ventasSnapshot.forEach(doc => {
      const venta = doc.data();
      const total = venta.total || 0;
      totales.totalVentas += total;

      switch(venta.metodoPago?.toLowerCase()) {
        case 'efectivo':
          totales.efectivo += total;
          break;
        case 'tarjeta':
          totales.tarjeta += total;
          break;
        case 'transferencia':
          totales.transferencia += total;
          break;
        case 'fiado':
          totales.fiado += total;
          break;
      }
    });

    await db.collection('turnos').doc(id).update({
      fechaFin: new Date(),
      estado: 'cerrado',
      ...totales
    });

    res.json({ success: true, data: { id, totales } });
  } catch (error) {
    console.error('Error en cerrarTurno:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/cajas/activa', async (req, res) => {
  try {
    const { empleado } = req.query;

    if (!empleado) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere el parámetro empleado'
      });
    }

    // Obtener turno activo
    const turnoSnapshot = await db.collection('turnos')
      .where('estado', '==', 'abierto')
      .limit(1)
      .get();

    if (turnoSnapshot.empty) {
      return res.json({ success: true, data: null });
    }

    const turnoId = turnoSnapshot.docs[0].id;

    // Buscar caja activa del empleado
    const cajaSnapshot = await db.collection('cajas')
      .where('turnoId', '==', turnoId)
      .where('empleado', '==', empleado)
      .where('estado', '==', 'abierta')
      .limit(1)
      .get();

    if (cajaSnapshot.empty) {
      return res.json({ success: true, data: null });
    }

    const doc = cajaSnapshot.docs[0];
    res.json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Error en getCajaActiva:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/cajas/abrir', async (req, res) => {
  try {
    const { empleado, baseInicial } = req.body;

    // Verificar turno activo
    const turnoSnapshot = await db.collection('turnos')
      .where('estado', '==', 'abierto')
      .limit(1)
      .get();

    if (turnoSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'No hay un turno activo. Abre el turno primero'
      });
    }

    const turnoId = turnoSnapshot.docs[0].id;

    // Verificar que el empleado no tenga caja abierta
    const cajaExistente = await db.collection('cajas')
      .where('turnoId', '==', turnoId)
      .where('empleado', '==', empleado)
      .where('estado', '==', 'abierta')
      .limit(1)
      .get();

    if (!cajaExistente.empty) {
      return res.status(400).json({
        success: false,
        error: 'Ya tienes una caja abierta'
      });
    }

    const docRef = await db.collection('cajas').add({
      turnoId,
      empleado,
      fechaApertura: new Date(),
      baseInicial: parseFloat(baseInicial) || 0,
      estado: 'abierta'
    });

    res.json({ success: true, data: { id: docRef.id, turnoId } });
  } catch (error) {
    console.error('Error en abrirCaja:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/cajas/:id/cerrar', async (req, res) => {
  try {
    const { id } = req.params;
    const { efectivoReal, tarjetaReal, transferenciaReal, observaciones } = req.body;

    const cajaDoc = await db.collection('cajas').doc(id).get();
    
    if (!cajaDoc.exists) {
      return res.status(404).json({ success: false, error: 'Caja no encontrada' });
    }

    const cajaData = cajaDoc.data();
    const baseInicial = cajaData.baseInicial || 0;
    const turnoId = cajaData.turnoId;
    const empleado = cajaData.empleado;

    // Calcular totales esperados
    const ventasSnapshot = await db.collection('ventas')
      .where('cajaId', '==', id)
      .get();

    let efectivoVentas = 0;
    let tarjetaVentas = 0;
    let transferenciaVentas = 0;

    ventasSnapshot.forEach(doc => {
      const venta = doc.data();
      const total = venta.total || 0;

      switch(venta.metodoPago?.toLowerCase()) {
        case 'efectivo':
          efectivoVentas += total;
          break;
        case 'tarjeta':
          tarjetaVentas += total;
          break;
        case 'transferencia':
          transferenciaVentas += total;
          break;
      }
    });

    const efectivoEsperado = baseInicial + efectivoVentas;
    const tarjetaEsperado = tarjetaVentas;
    const transferenciaEsperado = transferenciaVentas;
    const totalEsperado = efectivoEsperado + tarjetaEsperado + transferenciaEsperado;

    const totalReal = parseFloat(efectivoReal) + parseFloat(tarjetaReal) + parseFloat(transferenciaReal);

    const diferencias = {
      efectivo: parseFloat(efectivoReal) - efectivoEsperado,
      tarjeta: parseFloat(tarjetaReal) - tarjetaEsperado,
      transferencia: parseFloat(transferenciaReal) - transferenciaEsperado,
      total: totalReal - totalEsperado
    };

    const batch = db.batch();

    // Registrar cierre
    const cierreRef = db.collection('cierresCaja').doc();
    batch.set(cierreRef, {
      cajaId: id,
      turnoId,
      empleado,
      fechaCierre: new Date(),
      efectivoEsperado,
      efectivoReal: parseFloat(efectivoReal),
      diferenciaEfectivo: diferencias.efectivo,
      tarjetaEsperado,
      tarjetaReal: parseFloat(tarjetaReal),
      diferenciaTarjeta: diferencias.tarjeta,
      transferenciaEsperado,
      transferenciaReal: parseFloat(transferenciaReal),
      diferenciaTransferencia: diferencias.transferencia,
      totalEsperado,
      totalReal,
      diferencia: diferencias.total,
      observaciones: observaciones || ''
    });

    // Cerrar caja
    batch.update(db.collection('cajas').doc(id), {
      estado: 'cerrada',
      fechaCierre: new Date()
    });

    await batch.commit();

    res.json({
      success: true,
      data: {
        id: cierreRef.id,
        cajaId: id,
        totalEsperado,
        totalReal,
        diferencia: diferencias.total
      }
    });
  } catch (error) {
    console.error('Error en cerrarCaja:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// DASHBOARD STATS
// =====================================================
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    // Ventas de hoy
    const ventasHoySnapshot = await db.collection('ventas')
      .where('fecha', '>=', hoy)
      .select('total')
      .get();

    let ventasHoy = 0;
    let totalDiario = 0;
    ventasHoySnapshot.forEach(doc => {
      ventasHoy++;
      totalDiario += doc.data().total || 0;
    });

    // Ventas del mes
    const ventasMesSnapshot = await db.collection('ventas')
      .where('fecha', '>=', primerDiaMes)
      .select('total')
      .get();

    let ventasMes = 0;
    let totalMensual = 0;
    ventasMesSnapshot.forEach(doc => {
      ventasMes++;
      totalMensual += doc.data().total || 0;
    });

    // Deuda total pendiente
    const deudasSnapshot = await db.collection('deudas')
      .where('estado', '==', 'pendiente')
      .select('saldo')
      .get();

    let deudaTotal = 0;
    deudasSnapshot.forEach(doc => {
      deudaTotal += doc.data().saldo || 0;
    });

    res.json({
      success: true,
      data: {
        ventasHoy,
        ventasMes,
        totalDiario,
        totalMensual,
        deudaTotal
      }
    });
  } catch (error) {
    console.error('Error en getDashboardStats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// MANEJO DE ERRORES
// =====================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: err.message
  });
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║  🚀 API Sistema de Ventas v3.0.0     ║
║  📡 Puerto: ${PORT}                     ║
║  🔥 Firestore: Conectado              ║
║  ⚡ Estado: Activo                    ║
╚═══════════════════════════════════════╝
  `);
});

module.exports = app;