import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Reemplaza con TU configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCcje9P8vRfuhHfan9Uiyvyb8s46bo337g",
  authDomain: "sistema-ventas-32b9c.firebaseapp.com",
  projectId: "sistema-ventas-32b9c",
  storageBucket: "sistema-ventas-32b9c.firebasestorage.app",
  messagingSenderId: "551861438924",
  appId: "1:551861438924:web:e563ab710bc8077d3a3569"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
console.log('Firebase inicializado:', app.name); // Debug