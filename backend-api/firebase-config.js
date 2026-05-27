// =====================================================
// CONFIGURACIÓN DE FIREBASE
// =====================================================
const admin = require('firebase-admin');
require('dotenv').config();

// Inicializar Firebase Admin
let db;

function initializeFirebase() {
  try {
    // Opción 1: Usando archivo de credenciales (desarrollo local)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } 
    // Opción 2: Usando credenciales de entorno (producción)
    else if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }
    // Opción 3: Cloud Functions (auto-detecta)
    else {
      admin.initializeApp();
    }

    db = admin.firestore();
    
    // Configuraciones de Firestore
    db.settings({
      ignoreUndefinedProperties: true,
      timestampsInSnapshots: true
    });

    console.log('✅ Firebase inicializado correctamente');
    return db;
  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
    throw error;
  }
}

// Obtener referencia a Firestore
function getDB() {
  if (!db) {
    db = initializeFirebase();
  }
  return db;
}

// Utilidades para timestamps
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

module.exports = {
  admin,
  getDB,
  FieldValue,
  Timestamp,
  initializeFirebase
};