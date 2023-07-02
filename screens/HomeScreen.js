import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { AuthContext } from '../AuthContext';
import { withNavigationFocus } from 'react-navigation';
import axios from 'axios';
import * as Location from 'expo-location';

import MapScreen from './MapScreen';


const URL_API = 'https://finanzas-fe734-default-rtdb.firebaseio.com/';

const HomeScreen = ({ navigation, isFocused }) => {
  const { user, logout } = useContext(AuthContext);
  const [money, setMoney] = useState('');
  const [name, setName] = useState('');
  const [showTransactionCard, setShowTransactionCard] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [movements, setMovements] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  useEffect(() => {
    if (user && isFocused) {
      const uid = user.uid;

      const fetchUserData = async () => {
        try {
          setIsLoading(true);
          const response = await axios.get(`${URL_API}/users/${uid}.json`);
          const moneyValue = response.data.money || 0;
          setMoney(moneyValue);
          setName(response.data.firstName || '');

          // Transformar el objeto de movimientos en un array con identificadores únicos
          const movementsArray = Object.entries(response.data.movements || {}).map(([id, movement]) => ({
            id,
            ...movement,
          }));
          setMovements(movementsArray);
          setIsLoading(false);
        } catch (error) {
          console.error(error);
          setIsLoading(false);
        }
      };

      fetchUserData();
    }
  }, [user, isFocused]);

  useEffect(() => {
    const getLocationPermission = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Se requiere permiso de ubicación para ver la ubicación en el mapa.');
      } else {
        setHasLocationPermission(true);
      }
    };

    getLocationPermission();
  }, []);

  const handleLogout = () => {
    logout();
    navigation.navigate('Login');
  };

  const handleTransaction = async (isIncrement) => {
    const transactionAmountValue = parseFloat(transactionAmount);
    const updatedMoney = isIncrement ? parseFloat(money) + transactionAmountValue : parseFloat(money) - transactionAmountValue;

    let currentLocation = null;
    if (hasLocationPermission) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          currentLocation = location.coords;
          setErrorMsg('');
        } else {
          setErrorMsg('Se requiere permiso de ubicación para guardar la ubicación del dispositivo.');
        }
      } catch (error) {
        console.error(error);
        setErrorMsg('Hubo un error al obtener la ubicación.');
      }
    }

    const movement = {
      type: isIncrement ? 'ingreso' : 'egreso',
      amount: transactionAmountValue,
      description: transactionDescription,
      timestamp: new Date().toISOString(),
      location: currentLocation,
    };
    await saveMovement(movement);

    await updateMoney(updatedMoney);
    const response = await axios.get(`${URL_API}/users/${user.uid}.json`);
    const movementsArray = Object.entries(response.data.movements || {}).map(([id, movement]) => ({
      id,
      ...movement,
    }));
    setMovements(movementsArray);
    resetTransactionForm();
  };

  const saveMovement = async (movement) => {
    if (user) {
      const uid = user.uid;

      try {
        await axios.post(`${URL_API}/users/${uid}/movements.json`, movement);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const updateMoney = async (newMoney) => {
    if (user) {
      const uid = user.uid;

      try {
        await axios.patch(`${URL_API}/users/${uid}.json`, { money: newMoney });
        setMoney(newMoney);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const resetTransactionForm = () => {
    setTransactionAmount('');
    setTransactionDescription('');
    setShowTransactionCard(false);
  };

  const handleViewOnMap = (latitude, longitude) => {
    navigation.navigate('Mapa', { latitude, longitude });
  };
  

  const formatTimestamp = (timestamp) => {
    const dateObj = new Date(timestamp);
    const date = dateObj.toLocaleDateString();
    const time = dateObj.toLocaleTimeString();
    return `${date} - ${time}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Hola, {name}!</Text>
        <Text style={styles.balance}>Saldo actual: ${money}</Text>
      </View>
  
      <TouchableOpacity
        style={styles.transactionButton}
        onPress={() => setShowTransactionCard(!showTransactionCard)}
      >
        <Text style={styles.transactionButtonText}>
          {showTransactionCard ? 'Ocultar formulario de transacción' : 'Registrar nueva transacción'}
        </Text>
      </TouchableOpacity>
  
      {showTransactionCard && (
        <View style={styles.transactionCard}>
          <Text style={styles.transactionCardTitle}>Nueva transacción:</Text>
          <TextInput
            style={styles.input}
            placeholder="Monto"
            keyboardType="numeric"
            value={transactionAmount}
            onChangeText={(text) => setTransactionAmount(text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Descripción"
            value={transactionDescription}
            onChangeText={(text) => setTransactionDescription(text)}
          />
          <View style={styles.transactionButtonContainer}>
            <TouchableOpacity
              style={[styles.transactionButton, { backgroundColor: '#32CD32' }]}
              onPress={() => handleTransaction(true)}
            >
              <Text style={styles.transactionButtonText}>Ingreso</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.transactionButton, { backgroundColor: '#FF4500' }]}
              onPress={() => handleTransaction(false)}
            >
              <Text style={styles.transactionButtonText}>Egreso</Text>
            </TouchableOpacity>
            </View>
        </View>
      )}
  
      <ScrollView style={styles.movementsContainer}>
        <Text style={styles.title}>Movimientos:</Text>
        {isLoading ? (
          <Text>Cargando movimientos...</Text>
        ) : movements !== null && movements.length > 0 ? (
          movements.map((movement) => (
            <View
              key={movement.id}
              style={[
                styles.movementCard,
                { backgroundColor: movement.type === 'ingreso' ? '#32CD32' : '#FF4500' },
              ]}
            >
              <View style={styles.movementInfo}>
                <Text style={styles.movementType}>
                  {movement.type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                </Text>
                <Text style={styles.movementDate}>{formatTimestamp(movement.timestamp)}</Text>
              </View>
              <View style={styles.movementDateTime}>
              <Text style={styles.movementDate}>{movement.description}:      </Text>
                <Text style={styles.movementAmount}>${movement.amount}</Text>
              </View>
              {movement.location && (
                <Button
                  title="Ver en el mapa"
                  onPress={() => handleViewOnMap(movement.location.latitude, movement.location.longitude)}
                />
              )}
            </View>
          ))
        ) : (
          <Text>No hay movimientos registrados.</Text>
        )}
      </ScrollView>
  
      {errorMsg !== '' && <Text style={styles.errorText}>{errorMsg}</Text>}
  
      <Button title="Cerrar sesión" onPress={handleLogout} />
    </View>
  );
};  

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  headerContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  balance: {
    fontSize: 18,
  },
  transactionButton: {
    backgroundColor: '#4682B4',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  transactionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  transactionCard: {
    backgroundColor: '#F5F8FF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  transactionCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  movementsContainer: {
    flex: 1,
  },
  movementCard: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  movementInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  movementType: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  movementAmount: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
    marginLeft: 'auto',
  },
  
  movementDateTime: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 5,
  },
  movementDate: {
    color: '#FFFFFF',
    marginRight: 5,
  },
  movementTime: {
    color: '#FFFFFF',
  },
  movementDescription: {
    color: '#FFFFFF',
    marginBottom: 5,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
});

export default withNavigationFocus(HomeScreen);
