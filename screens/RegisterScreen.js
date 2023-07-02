import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const URL_AUTH_SIGNUP = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyA_ok6sM1UxXjUJB2nqR9R3Q3swb4a5f-s';
const URL_API = 'https://finanzas-fe734-default-rtdb.firebaseio.com/';


const RegisterScreen = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [age, setAge] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
  
    const handleRegister = async () => {
      try {
        if (password !== confirmPassword) {
          Alert.alert('Error', 'Las contraseñas no coinciden');
          return;
        }
  
        // Registrar usuario en Firebase Authentication
        const authResponse = await fetch(URL_AUTH_SIGNUP, {
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
  
        if (authResponse.ok) {
          const authData = await authResponse.json();
          const { localId } = authData;
  
          if (localId) {
            // Guardar uid en el almacenamiento del dispositivo
            await AsyncStorage.setItem('uid', localId);
  
            // Guardar datos adicionales en Firebase Realtime Database
            const userData = {
              firstName,
              lastName,
              age,
              phoneNumber,
            };
  
            const databaseResponse = await fetch(`${URL_API}/users/${localId}.json`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(userData),
            });
  
            if (databaseResponse.ok) {
              Alert.alert('Éxito', 'Registro exitoso');
              // Reiniciar los campos del formulario
              setFirstName('');
              setLastName('');
              setAge('');
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              setPhoneNumber('');
            } else {
              Alert.alert('Error', 'Ha ocurrido un error al guardar los datos');
            }
          } else {
            Alert.alert('Error', 'Ha ocurrido un error en el registro');
          }
        } else {
          Alert.alert('Error', 'Ha ocurrido un error en el registro');
        }
      } catch (error) {
        console.log(error);
        Alert.alert('Error', 'Ha ocurrido un error en el registro');
      }
    };
  
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Apellido"
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={styles.input}
          placeholder="Edad"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />
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
        <TextInput
          style={styles.input}
          placeholder="Confirmar contraseña"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Número de celular"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
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
  
  export default RegisterScreen;