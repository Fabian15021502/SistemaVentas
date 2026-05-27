// =====================================================
// SCRIPT DE MIGRACIÓN: GOOGLE SHEETS → FIRESTORE
// Ejecutar: node migracion/migrate-sheets-to-firestore.js
// =====================================================
const { google } = require('googleapis');
const { initializeFirebase, getDB } = require('../firebase-config');
require('dotenv').config();

// Configuración
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '1X8lG8Zwy4hrNpk20rEZMoFug9XWoispQfaFVx2XJJvU';

// Inicializar
initializeFirebase();
const db = getDB();

// =====================================================
// CONFIGURAR AUTENTICACIÓN DE GOOGLE SHEETS
// =====================================================
async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY, // Ruta al JSON de credenciales
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  
  return sheets;
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================
function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === 'TRUE';
  }
  return false;
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  
  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    return null;
  }
}

// =====================================================
// MIGRAR CATEGORÍAS
// =====================================================
async function migrarCategorias(sheets) {
  try {
    console.log('📦 Migrando Categorías...');
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Categorias!A2:E',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('  ⚠️  No hay categorías para migrar');
      return;
    }

    const batch = db.batch();
    let count = 0;

    for (const row of rows) {
      if (!row[0]) continue; // Saltar filas vacías

      const docRef = db.collection('categorias').doc();
      batch.set(docRef, {
        legacyId: parseInt(row[0]) || null,
        nombre: row[1] || '',
        descripcion: row[2] || '',
        activo: parseBoolean(row[3]),
        fechaCreacion: parseDate(row[4]) || new Date()
      });
      count++;
    }

    await batch.commit();
    console.log(`  ✅ ${count} categorías migradas`);
  } catch (error) {
    console.error('  ❌ Error migrando categorías:', error.message);
  }
}

// =====================================================
// MIGRAR PRODUCTOS Y VARIACIONES
// =====================================================
async function migrarProductos(sheets) {
  try {
    console.log('📦 Migrando Productos...');
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Productos!A2:F',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('  ⚠️  No hay productos para migrar');
      return;
    }

    // Obtener variaciones
    let variaciones = [];
    try {
      const varResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Variaciones_Productos!A2:E',
      });
      variaciones = varResponse.data.values || [];
    } catch (error) {
      console.log('  ⚠️  No se encontró la hoja de variaciones');
    }

    let count = 0;
    const productosMap = new Map(); // Para mapear IDs antiguos a nuevos

    for (const row of rows) {
      if (!row[0]) continue;

      const productoId = parseInt(row[0]);
      const docRef = db.collection('productos').doc();
      
      await docRef.set({
        legacyId: productoId,
        nombre: row[1] || '',
        categoriaId: row[2] || null,
        precioBase: parseFloat(row[3]) || 0,
        activo: parseBoolean(row[4]),
        fechaCreacion: parseDate(row[5]) || new Date()
      });

      productosMap.set(productoId, docRef.id);

      // Migrar variaciones del producto
      const variacionesProducto = variaciones.filter(v => parseInt(v[1]) === productoId);
      
      for (const varRow of variacionesProducto) {
        const varRef = docRef.collection('variaciones').doc();
        await varRef.set({
          legacyId: parseInt(varRow[0]) || null,
          tipo: varRow[2] || '',
          valor: varRow[3] || '',
          precioAdicional: parseFloat(varRow[4]) || 0
        });
      }

      count++;
    }

    console.log(`  ✅ ${count} productos migrados`);
    return productosMap;
  } catch (error) {
    console.error('  ❌ Error migrando productos:', error.message);
    return new Map();
  }
}

// =====================================================
// MIGRAR INVENTARIO
// =====================================================
async function migrarInventario(sheets) {
  try {
    console.log('📦 Migrando Inventario...');
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Inventario!A2:K',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('  ⚠️  No hay inventario para migrar');
      return;
    }

    const batch = db.batch();
    let count = 0;

    for (const row of rows) {
      if (!row[0]) continue;

      const docRef = db.collection('inventario').doc();
      batch.set(docRef, {
        legacyId: parseInt(row[0]) || null,
        productoId: row[1] || null,
        variacionId: row[2] || null,
        cantidad: parseFloat(row[3]) || 0,
        stockMinimo: parseFloat(row[4]) || 0,
        stockMaximo: parseFloat(row[5]) || 0,
        ubicacion: row[6] || '',
        costoPromedio: parseFloat(row[7]) || 0,
        fechaCreacion: parseDate(row[8]) || new Date(),
        fechaActualizacion: parseDate(row[9]) || new Date(),
        notas: row[10] || ''
      });
      count++;

      if (count % 500 === 0) {
        await batch.commit();
        console.log(`  📝 ${count} registros procesados...`);
      }
    }

    await batch.commit();
    console.log(`  ✅ ${count} registros de inventario migrados`);
  } catch (error) {
    console.error('  ❌ Error migrando inventario:', error.message);
  }
}

// =====================================================
// MIGRAR VENTAS
// =====================================================
async function migrarVentas(sheets) {
  try {
    console.log('📦 Migrando Ventas...');
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Ventas!A2:I',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('  ⚠️  No hay ventas para migrar');
      return;
    }

    // Obtener detalles de ventas
    let detalles = [];
    try {
      const detResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Detalle_Ventas!A2:I',
      });
      detalles = detResponse.data.values || [];
    } catch (error) {
      console.log('  ⚠️  No se encontró la hoja de detalles');
    }

    let count = 0;

    for (const row of rows) {
      if (!row[0]) continue;

      const ventaId = parseInt(row[0]);
      const docRef = db.collection('ventas').doc();
      
      await docRef.set({
        legacyId: ventaId,
        fecha: parseDate(row[1]) || new Date(),
        empleadoId: row[2] || 'system',
        total: parseFloat(row[3]) || 0,
        metodoPago: row[4] || '',
        clienteNombre: row[5] || 'Cliente General',
        clienteTelefono: row[6] || '',
        cajaId: row[7] || null,
        turnoId: row[8] || null,
        estado: 'completada'
      });

      // Migrar items de la venta
      const itemsVenta = detalles.filter(d => parseInt(d[1]) === ventaId);
      
      const batch = db.batch();
      for (const itemRow of itemsVenta) {
        const itemRef = docRef.collection('items').doc();
        batch.set(itemRef, {
          legacyId: parseInt(itemRow[0]) || null,
          productoId: itemRow[2] || null,
          productoNombre: itemRow[3] || '',
          variacionId: itemRow[4] || null,
          variacion: itemRow[5] || '',
          cantidad: parseInt(itemRow[6]) || 0,
          precioUnitario: parseFloat(itemRow[7]) || 0,
          subtotal: parseFloat(itemRow[8]) || 0
        });
      }
      await batch.commit();

      count++;
      if (count % 100 === 0) {
        console.log(`  📝 ${count} ventas procesadas...`);
      }
    }

    console.log(`  ✅ ${count} ventas migradas`);
  } catch (error) {
    console.error('  ❌ Error migrando ventas:', error.message);
  }
}

// =====================================================
// MIGRAR DEUDORES Y DEUDAS
// =====================================================
async function migrarDeudores(sheets) {
  try {
    console.log('📦 Migrando Deudores...');
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Deudores!A2:G',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('  ⚠️  No hay deudores para migrar');
      return;
    }

    const batch = db.batch();
    let count = 0;

    for (const row of rows) {
      if (!row[0]) continue;

      const docRef = db.collection('deudores').doc();
      batch.set(docRef, {
        legacyId: parseInt(row[0]) || null,
        nombre: row[1] || '',
        telefono: row[2] || '',
        totalDeuda: parseFloat(row[3]) || 0,
        saldoPendiente: parseFloat(row[4]) || 0,
        activo: parseBoolean(row[5]),
        fechaCreacion: parseDate(row[6]) || new Date()
      });
      count++;
    }

    await batch.commit();
    console.log(`  ✅ ${count} deudores migrados`);
  } catch (error) {
    console.error('  ❌ Error migrando deudores:', error.message);
  }
}

async function migrarDeudas(sheets) {
  try {
    console.log('📦 Migrando Deudas...');
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Deudas!A2:G',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('  ⚠️  No hay deudas para migrar');
      return;
    }

    const batch = db.batch();
    let count = 0;

    for (const row of rows) {
      if (!row[0]) continue;

      const docRef = db.collection('deudas').doc();
      batch.set(docRef, {
        legacyId: parseInt(row[0]) || null,
        deudorId: row[1] || null,
        ventaId: row[2] || null,
        fecha: parseDate(row[3]) || new Date(),
        monto: parseFloat(row[4]) || 0,
        saldo: parseFloat(row[5]) || 0,
        estado: row[6] || 'pendiente'
      });
      count++;
    }

    await batch.commit();
    console.log(`  ✅ ${count} deudas migradas`);
  } catch (error) {
    console.error('  ❌ Error migrando deudas:', error.message);
  }
}

async function migrarAbonos(sheets) {
  try {
    console.log('📦 Migrando Abonos...');
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Abonos!A2:H',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('  ⚠️  No hay abonos para migrar');
      return;
    }

    const batch = db.batch();
    let count = 0;

    for (const row of rows) {
      if (!row[0]) continue;

      const docRef = db.collection('abonos').doc();
      batch.set(docRef, {
        legacyId: parseInt(row[0]) || null,
        deudorId: row[1] || null,
        deudaId: row[2] || null,
        fecha: parseDate(row[3]) || new Date(),
        monto: parseFloat(row[4]) || 0,
        metodoPago: row[5] || 'efectivo',
        notas: row[6] || '',
        registradoPor: row[7] || 'system'
      });
      count++;
    }

    await batch.commit();
    console.log(`  ✅ ${count} abonos migrados`);
  } catch (error) {
    console.error('  ❌ Error migrando abonos:', error.message);
  }
}

// =====================================================
// MIGRAR TURNOS Y CAJAS
// =====================================================
async function migrarTurnos(sheets) {
  try {
    console.log('📦 Migrando Turnos...');
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Turnos!A2:I',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('  ⚠️  No hay turnos para migrar');
      return;
    }

    const batch = db.batch();
    let count = 0;

    for (const row of rows) {
      if (!row[0]) continue;

      const docRef = db.collection('turnos').doc();
      batch.set(docRef, {
        legacyId: parseInt(row[0]) || null,
        fechaInicio: parseDate(row[1]) || new Date(),
        fechaFin: parseDate(row[2]) || null,
        estado: row[3] || 'abierto',
        totalVentas: parseFloat(row[4]) || 0,
        totalEfectivo: parseFloat(row[5]) || 0,
        totalTarjeta: parseFloat(row[6]) || 0,
        totalTransferencia: parseFloat(row[7]) || 0,
        totalFiado: parseFloat(row[8]) || 0
      });
      count++;
    }

    await batch.commit();
    console.log(`  ✅ ${count} turnos migrados`);
  } catch (error) {
    console.error('  ❌ Error migrando turnos:', error.message);
  }
}

async function migrarCajas(sheets) {
  try {
    console.log('📦 Migrando Cajas...');
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Cajas!A2:G',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('  ⚠️  No hay cajas para migrar');
      return;
    }

    const batch = db.batch();
    let count = 0;

    for (const row of rows) {
      if (!row[0]) continue;

      const docRef = db.collection('cajas').doc();
      batch.set(docRef, {
        legacyId: parseInt(row[0]) || null,
        turnoId: row[1] || null,
        empleado: row[2] || '',
        fechaApertura: parseDate(row[3]) || new Date(),
        baseInicial: parseFloat(row[4]) || 0,
        estado: row[5] || 'abierta',
        fechaCierre: parseDate(row[6]) || null
      });
      count++;
    }

    await batch.commit();
    console.log(`  ✅ ${count} cajas migradas`);
  } catch (error) {
    console.error('  ❌ Error migrando cajas:', error.message);
  }
}

// =====================================================
// EJECUTAR MIGRACIÓN COMPLETA
// =====================================================
async function ejecutarMigracion() {
  console.log(`
╔═══════════════════════════════════════╗
║  🔄 MIGRACIÓN DE DATOS                ║
║  Google Sheets → Firestore            ║
╚═══════════════════════════════════════╝
  `);

  try {
    const sheets = await getGoogleSheetsClient();
    console.log('✅ Conectado a Google Sheets\n');

    // Ejecutar migraciones en orden
    await migrarCategorias(sheets);
    await migrarProductos(sheets);
    await migrarInventario(sheets);
    await migrarDeudores(sheets);
    await migrarDeudas(sheets);
    await migrarAbonos(sheets);
    await migrarTurnos(sheets);
    await migrarCajas(sheets);
    await migrarVentas(sheets);

    console.log(`
╔═══════════════════════════════════════╗
║  ✅ MIGRACIÓN COMPLETADA              ║
╚═══════════════════════════════════════╝

📊 Siguiente paso: Verificar los datos en Firebase Console
🔗 https://console.firebase.google.com/
    `);

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  ejecutarMigracion()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { ejecutarMigracion };