
import React, { useState, useEffect, useContext } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../AuthContext';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';


const LoginScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const URL_AUTH_SIGNUP = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyA_ok6sM1UxXjUJB2nqR9R3Q3swb4a5f-s';
  
  useEffect(() => {
    checkPreviousAuth();
    setupNetworkListener();
  }, []);

  const checkPreviousAuth = async () => {
    try {
      const uid = await AsyncStorage.getItem('uid');
      if (uid) {
        login(uid);
        navigation.navigate('Home');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Error al leer los datos de autenticación');
    }
  };

  const setupNetworkListener = () => {
    NetInfo.addEventListener(handleConnectivityChange);
  };

  const handleConnectivityChange = (state) => {
    if (state.isConnected) {
      checkPreviousAuth();
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(URL_AUTH_SIGNUP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const { localId: uid } = data;

        await AsyncStorage.setItem('uid', uid);

        login(uid);
        navigation.navigate('Home');
      } else {
        Alert.alert('Error', 'Error de autenticación');
        console.log('Error de autenticación');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Iniciar sesión" onPress={handleLogin} />
      <Button title="Registrarse" onPress={handleRegister} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
});

export default LoginScreen;
