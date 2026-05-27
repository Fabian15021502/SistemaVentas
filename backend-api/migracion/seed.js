// =====================================================
// SEED SCRIPT - Datos de prueba para Firebase
// Uso: node seed.js
// ⚠️  ELIMINA todos los datos existentes antes de insertar
// =====================================================

const { initializeFirebase, getDB } = require('../firebase-config');

initializeFirebase();
const db = getDB();

// ─── Colecciones a limpiar ────────────────────────────
const COLECCIONES = [
  'categorias',
  'productos',
  'inventario',
  'movimientos',
  'ventas',
  'deudores',
  'deudas',
  'abonos',
  'turnos',
  'cajas',
  'cierresCaja'
];

// ─── Helper: fecha hace N días ────────────────────────
function hace(dias, horas = 10) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(horas, 0, 0, 0);
  return d;
}

// ─── Helper: eliminar colección entera ───────────────
async function limpiarColeccion(nombre) {
  const snap = await db.collection(nombre).get();
  if (snap.empty) return;

  // Borrar en lotes de 400 (límite Firestore = 500)
  const chunks = [];
  for (let i = 0; i < snap.docs.length; i += 400) {
    chunks.push(snap.docs.slice(i, i + 400));
  }

  for (const chunk of chunks) {
    const batch = db.batch();
    chunk.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }

  console.log(`  🗑  ${nombre}: ${snap.docs.length} documentos eliminados`);
}

// ─── Helper: eliminar subcolección items de ventas ───
async function limpiarItemsVentas() {
  const ventas = await db.collection('ventas').get();
  for (const venta of ventas.docs) {
    const items = await venta.ref.collection('items').get();
    if (items.empty) continue;
    const batch = db.batch();
    items.forEach(item => batch.delete(item.ref));
    await batch.commit();
  }
}

// =====================================================
// DATOS DE PRUEBA
// =====================================================

async function seed() {
  console.log('\n🚀 Iniciando seed de datos de prueba...\n');

  // ── 1. LIMPIAR ──────────────────────────────────────
  console.log('⚠️  Limpiando colecciones existentes...');
  await limpiarItemsVentas();
  for (const col of COLECCIONES) {
    await limpiarColeccion(col);
  }
  console.log('✅ Base de datos limpia\n');

  // ── 2. CATEGORÍAS ───────────────────────────────────
  console.log('📦 Insertando categorías...');
  const categoriasData = [
    { nombre: 'Bebidas',    descripcion: 'Jugos, gaseosas y agua' },
    { nombre: 'Comidas',    descripcion: 'Platos del día y snacks' },
    { nombre: 'Lácteos',    descripcion: 'Leche, queso y yogur' },
    { nombre: 'Panadería',  descripcion: 'Pan, pasteles y galletas' },
    { nombre: 'Limpieza',   descripcion: 'Productos de aseo' },
  ];

  const categoriasRef = {};
  for (const cat of categoriasData) {
    const ref = await db.collection('categorias').add({
      ...cat,
      activo: true,
      fechaCreacion: new Date()
    });
    categoriasRef[cat.nombre] = ref.id;
    console.log(`  ✔ ${cat.nombre} (${ref.id})`);
  }

  // ── 3. PRODUCTOS + INVENTARIO ───────────────────────
  console.log('\n🛍  Insertando productos e inventario...');

  const productosData = [
    // Bebidas
    { nombre: 'Coca-Cola 400ml',    categoriaId: categoriasRef['Bebidas'],   precioBase: 2500,  stock: 80  },
    { nombre: 'Agua Cristal 600ml', categoriaId: categoriasRef['Bebidas'],   precioBase: 1500,  stock: 120 },
    { nombre: 'Jugo Hit Mango',     categoriaId: categoriasRef['Bebidas'],   precioBase: 2000,  stock: 60  },
    { nombre: 'Gatorade 500ml',     categoriaId: categoriasRef['Bebidas'],   precioBase: 3500,  stock: 45  },
    // Comidas
    { nombre: 'Almuerzo del Día',   categoriaId: categoriasRef['Comidas'],   precioBase: 12000, stock: 30  },
    { nombre: 'Empanada de Pipián', categoriaId: categoriasRef['Comidas'],   precioBase: 1800,  stock: 50  },
    { nombre: 'Arepa con Queso',    categoriaId: categoriasRef['Comidas'],   precioBase: 3000,  stock: 40  },
    // Lácteos
    { nombre: 'Leche Entera 1L',    categoriaId: categoriasRef['Lácteos'],   precioBase: 4200,  stock: 35  },
    { nombre: 'Yogur Alpina 200g',  categoriaId: categoriasRef['Lácteos'],   precioBase: 2800,  stock: 25  },
    // Panadería
    { nombre: 'Pan Tajado',         categoriaId: categoriasRef['Panadería'], precioBase: 5500,  stock: 20  },
    { nombre: 'Croissant',          categoriaId: categoriasRef['Panadería'], precioBase: 2200,  stock: 30  },
    // Limpieza
    { nombre: 'Jabón Rey 300g',     categoriaId: categoriasRef['Limpieza'],  precioBase: 3800,  stock: 15  },
    { nombre: 'Detergente Ariel 1kg',categoriaId: categoriasRef['Limpieza'], precioBase: 14500, stock: 10  },
  ];

  const productosRef = {}; // nombre → { id, precioBase, categoriaId, stock }
  for (const prod of productosData) {
    const ref = await db.collection('productos').add({
      nombre:       prod.nombre,
      categoriaId:  prod.categoriaId,
      precioBase:   prod.precioBase,
      activo:       true,
      fechaCreacion: new Date()
    });

    // Inventario base
    await db.collection('inventario').add({
      productoId:        ref.id,
      variacionId:       null,
      cantidad:          prod.stock,
      stockMinimo:       5,
      stockMaximo:       200,
      costoPromedio:     Math.round(prod.precioBase * 0.6),
      ubicacion:         'Estante principal',
      fechaCreacion:     new Date(),
      fechaActualizacion: new Date(),
      notas:             'Stock inicial seed'
    });

    productosRef[prod.nombre] = { id: ref.id, ...prod };
    console.log(`  ✔ ${prod.nombre} — stock: ${prod.stock}`);
  }

  // ── 4. DEUDORES ─────────────────────────────────────
  console.log('\n👤 Insertando deudores...');
  const deudoresData = [
    { nombre: 'Carlos Pérez',    telefono: '3101234567' },
    { nombre: 'Ana Martínez',    telefono: '3209876543' },
    { nombre: 'Luis Rodríguez',  telefono: '3154567890' },
  ];

  const deudoresRef = {};
  for (const d of deudoresData) {
    const ref = await db.collection('deudores').add({
      ...d,
      totalDeuda:     0,
      saldoPendiente: 0,
      activo:         true,
      fechaCreacion:  new Date()
    });
    deudoresRef[d.nombre] = ref.id;
    console.log(`  ✔ ${d.nombre}`);
  }

  // ── 5. TURNO ────────────────────────────────────────
  console.log('\n⏰ Creando turno activo...');
  const turnoRef = await db.collection('turnos').add({
    fechaInicio:      hace(0, 8),
    estado:           'abierto',
    totalVentas:      0,
    totalEfectivo:    0,
    totalTarjeta:     0,
    totalTransferencia: 0,
    totalFiado:       0
  });
  console.log(`  ✔ Turno abierto (${turnoRef.id})`);

  // ── 6. CAJAS ────────────────────────────────────────
  console.log('\n💰 Creando cajas...');
  const empleados = ['cajero1@tienda.com', 'cajero2@tienda.com'];
  const cajasRef = {};

  for (const emp of empleados) {
    const ref = await db.collection('cajas').add({
      turnoId:       turnoRef.id,
      empleado:      emp,
      fechaApertura: hace(0, 8),
      baseInicial:   100000,
      estado:        'abierta'
    });
    cajasRef[emp] = ref.id;
    console.log(`  ✔ Caja de ${emp} (${ref.id})`);
  }

  // ── 7. VENTAS (últimos 7 días) ───────────────────────
  console.log('\n🧾 Insertando ventas de los últimos 7 días...');

  const metodosPago = ['efectivo', 'tarjeta', 'transferencia'];
  const productosLista = Object.values(productosRef);

  // Ventas pasadas (días 1-6, cerradas)
  const ventasPasadas = [
    // hace 6 días
    { dia: 6, hora: 9,  emp: empleados[0], items: [
      { prod: 'Coca-Cola 400ml', cant: 3 },
      { prod: 'Empanada de Pipián', cant: 2 }
    ], metodo: 'efectivo' },
    { dia: 6, hora: 11, emp: empleados[1], items: [
      { prod: 'Almuerzo del Día', cant: 1 },
      { prod: 'Jugo Hit Mango', cant: 1 }
    ], metodo: 'tarjeta' },
    // hace 5 días
    { dia: 5, hora: 10, emp: empleados[0], items: [
      { prod: 'Pan Tajado', cant: 1 },
      { prod: 'Leche Entera 1L', cant: 2 }
    ], metodo: 'efectivo' },
    { dia: 5, hora: 14, emp: empleados[1], items: [
      { prod: 'Gatorade 500ml', cant: 4 },
      { prod: 'Arepa con Queso', cant: 2 }
    ], metodo: 'transferencia' },
    // hace 4 días
    { dia: 4, hora: 8,  emp: empleados[0], items: [
      { prod: 'Detergente Ariel 1kg', cant: 1 },
      { prod: 'Jabón Rey 300g', cant: 2 }
    ], metodo: 'efectivo' },
    { dia: 4, hora: 16, emp: empleados[1], items: [
      { prod: 'Almuerzo del Día', cant: 3 },
      { prod: 'Agua Cristal 600ml', cant: 3 }
    ], metodo: 'tarjeta' },
    // hace 3 días
    { dia: 3, hora: 9,  emp: empleados[0], items: [
      { prod: 'Yogur Alpina 200g', cant: 3 },
      { prod: 'Croissant', cant: 4 }
    ], metodo: 'efectivo' },
    { dia: 3, hora: 13, emp: empleados[1], items: [
      { prod: 'Coca-Cola 400ml', cant: 6 },
      { prod: 'Empanada de Pipián', cant: 5 }
    ], metodo: 'efectivo' },
    // hace 2 días
    { dia: 2, hora: 10, emp: empleados[0], items: [
      { prod: 'Almuerzo del Día', cant: 2 },
      { prod: 'Jugo Hit Mango', cant: 2 }
    ], metodo: 'tarjeta' },
    { dia: 2, hora: 15, emp: empleados[1], items: [
      { prod: 'Pan Tajado', cant: 2 },
      { prod: 'Leche Entera 1L', cant: 1 }
    ], metodo: 'transferencia' },
    // hace 1 día
    { dia: 1, hora: 9,  emp: empleados[0], items: [
      { prod: 'Gatorade 500ml', cant: 2 },
      { prod: 'Arepa con Queso', cant: 3 }
    ], metodo: 'efectivo' },
    { dia: 1, hora: 12, emp: empleados[1], items: [
      { prod: 'Detergente Ariel 1kg', cant: 2 },
      { prod: 'Coca-Cola 400ml', cant: 4 }
    ], metodo: 'tarjeta' },
    // hoy
    { dia: 0, hora: 9,  emp: empleados[0], items: [
      { prod: 'Almuerzo del Día', cant: 4 },
      { prod: 'Jugo Hit Mango', cant: 3 }
    ], metodo: 'efectivo' },
    { dia: 0, hora: 11, emp: empleados[1], items: [
      { prod: 'Croissant', cant: 5 },
      { prod: 'Yogur Alpina 200g', cant: 2 }
    ], metodo: 'tarjeta' },
    { dia: 0, hora: 13, emp: empleados[0], items: [
      { prod: 'Coca-Cola 400ml', cant: 8 },
      { prod: 'Empanada de Pipián', cant: 4 }
    ], metodo: 'efectivo' },
  ];

  for (const v of ventasPasadas) {
    const fecha = hace(v.dia, v.hora);
    const cajaId = cajasRef[v.emp];

    // Calcular total
    let total = 0;
    const itemsConDatos = v.items.map(i => {
      const prod = productosRef[i.prod];
      const subtotal = prod.precioBase * i.cant;
      total += subtotal;
      return { ...i, prod };
    });

    // Registrar venta
    const ventaRef = db.collection('ventas').doc();
    await ventaRef.set({
      fecha,
      empleadoId:     v.emp,
      total,
      metodoPago:     v.metodo,
      clienteNombre:  'Cliente General',
      clienteTelefono: '',
      cajaId,
      turnoId:        turnoRef.id,
      estado:         'completada'
    });

    // Items de la venta
    const batch = db.batch();
    for (const i of itemsConDatos) {
      const itemRef = ventaRef.collection('items').doc();
      batch.set(itemRef, {
        productoId:     i.prod.id,
        productoNombre: i.prod.nombre,
        categoriaId:    i.prod.categoriaId,
        variacionId:    null,
        variacion:      '',
        cantidad:       i.cant,
        precioUnitario: i.prod.precioBase,
        subtotal:       i.prod.precioBase * i.cant
      });
    }
    await batch.commit();

    console.log(`  ✔ Venta hace ${v.dia}d — $${total.toLocaleString()} (${v.metodo})`);
  }

  // ── 8. DEUDAS ───────────────────────────────────────
  console.log('\n💳 Insertando deudas...');

  const deudasData = [
    { deudor: 'Carlos Pérez',   monto: 25000, diasAtras: 5, estado: 'pendiente', abonoMonto: 10000 },
    { deudor: 'Ana Martínez',   monto: 42000, diasAtras: 3, estado: 'pendiente', abonoMonto: 0 },
    { deudor: 'Luis Rodríguez', monto: 18000, diasAtras: 7, estado: 'pagado',    abonoMonto: 18000 },
  ];

  for (const d of deudasData) {
    const deudorId = deudoresRef[d.deudor];

    // Crear deuda
    const deudaRef = await db.collection('deudas').add({
      deudorId,
      ventaId: null,
      fecha:   hace(d.diasAtras),
      monto:   d.monto,
      saldo:   d.monto - d.abonoMonto,
      estado:  d.estado
    });

    // Crear abono si aplica
    if (d.abonoMonto > 0) {
      await db.collection('abonos').add({
        deudorId,
        deudaId:       deudaRef.id,
        fecha:         hace(d.diasAtras - 1),
        monto:         d.abonoMonto,
        metodoPago:    'efectivo',
        notas:         'Abono parcial',
        registradoPor: empleados[0]
      });
    }

    // Actualizar totales del deudor
    const saldoPendiente = d.monto - d.abonoMonto;
    await db.collection('deudores').doc(deudorId).update({
      totalDeuda:     d.monto,
      saldoPendiente: saldoPendiente
    });

    console.log(`  ✔ ${d.deudor} — $${d.monto.toLocaleString()} (saldo: $${saldoPendiente.toLocaleString()})`);
  }

  // ── 9. RESUMEN ──────────────────────────────────────
  console.log('\n✅ Seed completado exitosamente!\n');
  console.log('📊 Resumen:');
  console.log(`  • ${categoriasData.length} categorías`);
  console.log(`  • ${productosData.length} productos con inventario`);
  console.log(`  • ${empleados.length} cajas abiertas`);
  console.log(`  • ${ventasPasadas.length} ventas (últimos 7 días)`);
  console.log(`  • ${deudasData.length} deudores con historial`);
  console.log('\n🔑 Empleados disponibles:');
  empleados.forEach(e => console.log(`  • ${e}`));
  console.log('\n⚠️  Recuerda: el turno está ABIERTO. Abre sesión con uno de los empleados para vender.\n');

  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌ Error en seed:', err);
  process.exit(1);
});