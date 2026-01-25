import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Escuchar cambios en el estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('AuthContext - Estado de auth cambió:', firebaseUser?.email || 'No autenticado');
      
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('AuthContext - Intentando login con:', email);
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      console.log('AuthContext - Login exitoso:', result.user.email);
      
      // No necesitamos setear user/isAuthenticated manualmente
      // onAuthStateChanged lo hará automáticamente
      
      return { success: true, user: result.user };
    } catch (error) {
      console.error('AuthContext - Error en login:', error.code, error.message);
      
      let errorMessage = 'Error al iniciar sesión';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuario no encontrado';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Contraseña incorrecta';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Email o contraseña incorrectos';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Intenta más tarde';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión. Verifica tu internet';
          break;
        default:
          errorMessage = `Error: ${error.message}`;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      console.log('AuthContext - Cerrando sesión');
      await signOut(auth);
      console.log('AuthContext - Sesión cerrada');
      return { success: true };
    } catch (error) {
      console.error('AuthContext - Error al cerrar sesión:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
