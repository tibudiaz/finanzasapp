import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, Button, ActivityIndicator, StyleSheet } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../AuthContext';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';

const URL_API = 'https://finanzas-fe734-default-rtdb.firebaseio.com/';

const GananciasScreen = () => {
  const [allSoldProducts, setAllSoldProducts] = useState([]);
  const [filteredSoldProducts, setFilteredSoldProducts] = useState([]);
  const [totalProfit, setTotalProfit] = useState(0);
  const { user } = useContext(AuthContext);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isStartDatePickerVisible, setIsStartDatePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setIsEndDatePickerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSoldProducts();
  }, []);

  useEffect(() => {
    const filteredProducts = allSoldProducts.filter((product) => {
      const soldDate = parseISO(product.soldDate1);
      const startOfSelectedDate = startOfDay(startDate);
      const endOfSelectedDate = endOfDay(endDate);
      return soldDate >= startOfSelectedDate && soldDate <= endOfSelectedDate;
    });
    setFilteredSoldProducts(filteredProducts);
  }, [startDate, endDate]);

  useEffect(() => {
    const totalProfit = filteredSoldProducts.reduce((total, product) => total + product.profit, 0);
    setTotalProfit(totalProfit);
  }, [filteredSoldProducts]);

  const fetchSoldProducts = async () => {
    try {
      const uid = user.uid;
      const response = await axios.get(`${URL_API}/users/${uid}/products.json`);
      const data = response.data;

      if (data) {
        const soldProductArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        const filteredProducts = soldProductArray.filter((product) => product.sold);
        setAllSoldProducts(filteredProducts);
        setFilteredSoldProducts(filteredProducts);

        const totalProfit = filteredProducts.reduce((total, product) => total + product.profit, 0);
        setTotalProfit(totalProfit);
      }
    } catch (error) {
      console.error('Error al obtener los productos vendidos:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);

    await fetchSoldProducts();

    setStartDate(null);
    setEndDate(null);

    setRefreshing(false);
  };

  const handleFilterByDate = () => {
    if (startDate && endDate) {
      const filteredProducts = allSoldProducts.filter((product) => {
        const soldDate = parseISO(product.soldDate);
        const startOfSelectedDate = startOfDay(startDate);
        const endOfSelectedDate = endOfDay(endDate);
        return soldDate >= startOfSelectedDate && soldDate <= endOfSelectedDate;
      });
      setFilteredSoldProducts(filteredProducts);
    }
  };

  const showStartDatePicker = () => {
    setIsStartDatePickerVisible(true);
  };

  const hideStartDatePicker = () => {
    setIsStartDatePickerVisible(false);
  };

  const handleStartDateConfirm = (date) => {
    setStartDate(date);
    hideStartDatePicker();
  };

  const showEndDatePicker = () => {
    setIsEndDatePickerVisible(true);
  };

  const hideEndDatePicker = () => {
    setIsEndDatePickerVisible(false);
  };

  const handleEndDateConfirm = (date) => {
    setEndDate(date);
    hideEndDatePicker();
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>Nombre: {item.name}</Text>
      <Text style={styles.itemText}>Descripción: {item.description}</Text>
      <Text style={styles.itemText}>Costo: {item.costPrice}</Text>
      <Text style={styles.itemText}>Precio de Venta: {item.soldPrice}</Text>
      <Text style={styles.itemText}>Ganancia: {item.profit}</Text>
      <Text style={styles.itemText}>Fecha de Compra: {item.createdDate}</Text>
      <Text style={styles.itemText}>Fecha de Venta: {item.soldDate}</Text>
      <Text style={styles.itemText}>Proveedor: {item.provider}</Text>
      <Text style={styles.itemText}>Comprador: {item.buyerName}</Text>
      <Text style={styles.itemText}>Método de Pago: {item.paymentMethod}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.totalProfit}>Ganancia Total: USD{totalProfit || 0}</Text>
      <Text style={styles.heading}>Productos Vendidos:</Text>
      <View style={styles.filterContainer}>
        <Button title="Fecha de inicio" onPress={showStartDatePicker} />
        <Button title="Fecha de fin" onPress={showEndDatePicker} />
        <Button title="Filtrar" onPress={handleFilterByDate} />
      </View>
      <Text style={styles.resultText}>
        Cantidad de productos vendidos en el rango de fechas: {filteredSoldProducts.length}
      </Text>
      <FlatList
        data={filteredSoldProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        contentContainerStyle={styles.listContainer}
      />
      {refreshing && <ActivityIndicator size="large" color="#0000ff" />}
      <DateTimePickerModal
        isVisible={isStartDatePickerVisible}
        mode="date"
        onConfirm={handleStartDateConfirm}
        onCancel={hideStartDatePicker}
      />
      <DateTimePickerModal
        isVisible={isEndDatePickerVisible}
        mode="date"
        onConfirm={handleEndDateConfirm}
        onCancel={hideEndDatePicker}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f9ff',
    padding: 20,
  },
  totalProfit: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2a70c9',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2a70c9',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#3f8fdf',
  },
  listContainer: {
    paddingBottom: 20,
  },
  itemContainer: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemText: {
    fontSize: 16,
    color: '#000000',
  },
});

export default GananciasScreen;
