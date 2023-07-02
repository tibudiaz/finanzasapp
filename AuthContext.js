import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUserAuthentication();
  }, []);

  // Verificar si el usuario está autenticado al cargar la aplicación
  const checkUserAuthentication = async () => {
    try {
      const uid = await AsyncStorage.getItem('uid');
      if (uid) {
        setUser({ uid });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Iniciar sesión
  const login = (uid) => {
    setUser({ uid });
    AsyncStorage.setItem('uid', uid);
  };

  // Cerrar sesión
  const logout = () => {
    setUser(null);
    AsyncStorage.removeItem('uid');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
