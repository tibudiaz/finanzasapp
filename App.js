import React, { createContext, useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './AuthContext';

// Importa tus pantallas aquí
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import RegisterScreen from './screens/RegisterScreen';
import MapScreen from './screens/MapScreen';
import ProductScreen from './screens/ProductScreen';
import ScreenGanancias from './screens/GananciasScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

  const HomeTabs = () => (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
  
          if (route.name === 'Home') {
            iconName = 'person';
          } else if (route.name === 'Productos') {
            iconName = 'md-albums';
          }else if (route.name === 'Ganancias') {
            iconName = 'md-cash';
          }
  
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Productos"
        component={ProductScreen}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Ganancias"
        component={ScreenGanancias}
        options={{
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
  

const App = () => {
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
      <NavigationContainer>
        {isLoading ? null : (
          <Stack.Navigator>
            {user ? (
              <>
                <Stack.Screen name="Finanzas App" component={HomeTabs} />
                <Stack.Screen name="Mapa" component={MapScreen} />
              </>
            ) : (
              <Stack.Screen name="Login" component={AuthStack} />
            )}
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </AuthContext.Provider>
  );
};

export default App;
