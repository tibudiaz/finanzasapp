import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../AuthContext';
import { withNavigationFocus } from 'react-navigation';
import { differenceInDays, addDays } from 'date-fns';
import { Swipeable } from 'react-native-gesture-handler';
import { FontAwesome } from '@expo/vector-icons';




const URL_API = 'https://finanzas-fe734-default-rtdb.firebaseio.com/';

const ProductScreen = () => {
  const { user } = useContext(AuthContext);
  const [productName, setProductName] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [providerName, setProviderName] = useState('');
  const [products, setProducts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [soldPrice, setSoldPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [showSoldProducts, setShowSoldProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [totalCostPrice, setTotalCostPrice] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [availableProductCount, setAvailableProductCount] = useState(0);


  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const uid = user.uid;
    try {
      const response = await axios.get(`${URL_API}/users/${uid}/products.json`);
      const data = response.data;
      if (data) {
        const productArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setProducts(productArray);
        let availableCount = 0;
        productArray.forEach((product) => {
          if (!product.sold) {
            availableCount++;
          }
        });
        setAvailableProductCount(availableCount);
  
        let costSum = 0;
        let profitSum = 0;
        productArray.forEach((product) => {
          if (!product.sold && product.costPrice) {
            costSum += parseFloat(product.costPrice);
          }
          if (product.profit) {
            profitSum += parseFloat(product.profit);
          }
        });
        setTotalCostPrice(costSum);
        setTotalProfit(profitSum);
      }
    } catch (error) {
      console.error('Error al obtener los productos:', error);
    }
  };

  const handleSaveProduct = async () => {
    const uid = user.uid;
    const product = {
      name: productName,
      costPrice: parseFloat(costPrice),
      description: productDescription,
      provider: providerName,
      createdDate: new Date().toLocaleString(),
      soldDate1: new Date().toISOString(),
    };

    try {
      await axios.post(`${URL_API}/users/${uid}/products.json`, product);
      console.log('Producto guardado correctamente');
      setProductName('');
      setCostPrice('');
      setProductDescription('');
      setProviderName('');
      fetchProducts();
    } catch (error) {
      console.error('Error al guardar el producto:', error);
    }
  };

  const handleSoldButton = (product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const handleConfirmSold = async () => {
    if (isNaN(soldPrice)) {
      console.log('Ingrese un valor válido para el precio de venta');
      return;
    }

    const profit = parseFloat(soldPrice) - selectedProduct.costPrice;

    try {
      await axios.patch(
        `${URL_API}/users/${user.uid}/products/${selectedProduct.id}.json`,
        {
          sold: true,
          profit: profit,
          soldDate: new Date().toLocaleString(),
          SoldDate1: new Date().toISOString(),
          soldPrice: parseFloat(soldPrice),
          paymentMethod: paymentMethod,
          buyerName: buyerName,
        }
      );
      console.log('Producto marcado como vendido correctamente');
      setModalVisible(false);
      setSelectedProduct(null);
      setSoldPrice('');
      setPaymentMethod('');
      setBuyerName('');
      fetchProducts();
    } catch (error) {
      console.error('Error al marcar el producto como vendido:', error);
    }
  };

  const calculateRemainingWarrantyDays = (product) => {
    const soldDate1 = new Date(product.soldDate1);
    const expirationDate = addDays(soldDate1, 30);
    const currentDate = new Date();
    const remainingDays = differenceInDays(expirationDate, currentDate);
    return Math.max(remainingDays, 0);
  };

  const renderAvailableProducts = ({ item }) => {
    if (item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return (
    <View style={styles.productItem}>
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>Precio costo: {item.costPrice}</Text>
      <Text style={styles.productDescription}>Descripción: {item.description}</Text>
      <Text style={styles.productProvider}>Proveedor: {item.provider}</Text>
      <Text style={styles.productDate}>Fecha de compra: {item.createdDate}</Text>
      {!item.sold && (
        <TouchableOpacity style={styles.soldButton} onPress={() => handleSoldButton(item)}>
          <Text style={styles.soldButtonText}>Vendido</Text>
        </TouchableOpacity>
      )}
      </View>
    );
  }
  return null;
};

const renderSoldProducts = ({ item }) => {
  if (item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
    return (
    <View style={styles.productItem}>
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>Precio costo: {item.costPrice}</Text>
      <Text style={styles.soldPrice}>Precio venta: {item.soldPrice}</Text>
      <Text style={styles.paymentMethod}>Forma de pago: {item.paymentMethod}</Text>
      <Text style={styles.buyerName}>Comprador: {item.buyerName}</Text>
      <Text style={styles.profitText}>Ganancia: {item.profit}</Text>
      <Text style={styles.remainingWarrantyText}>
        Garantía disponible: {calculateRemainingWarrantyDays(item)} días
      </Text>
      <Text style={styles.productProvider}>Proveedor: {item.provider}</Text>
      <Text style={styles.productDate}>Fecha de compra: {item.createdDate}</Text>
      <Text style={styles.soldDate}>Fecha de venta: {item.soldDate}</Text>
      </View>
    );
  }
  return null;
};

  const renderItem = ({ item }) => {
    if (showSoldProducts) {
      return renderSoldProducts({ item });
    } else {
      return renderAvailableProducts({ item });
    }
  };

  const availableProducts = products.filter((product) => !product.sold);
  const soldProducts = products.filter((product) => product.sold);

  const handleDeleteProduct = async (product) => {
    try {
      await axios.delete(`${URL_API}/users/${user.uid}/products/${product.id}.json`);
      console.log('Producto eliminado correctamente');
      fetchProducts();
    } catch (error) {
      console.error('Error al eliminar el producto:', error);
    }
  };


  const SwipeableItem = ({ item }) => (
    <Swipeable
      renderRightActions={(progress, dragX) => (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteProduct(item)}
        >
          <FontAwesome name="trash" size={24} color="white" />
        </TouchableOpacity>
      )}

      containerStyle={styles.swipeableContainer}
    >
      {renderSoldProducts({ item })}
    </Swipeable>
  );


  return (
    <View style={styles.container}>
        <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Productos: {availableProductCount}. Invertido: USD {totalCostPrice.toFixed()}</Text>
        <Text style={styles.totalText}>Ganado: $ {totalProfit.toFixed()}</Text>
      </View>
      <View style={styles.header}>
        <Text style={styles.heading}>Agregar Producto</Text>
        <TouchableOpacity
          style={styles.searchIcon}
          onPress={() => setSearchVisible(!searchVisible)}
        >
          <FontAwesome name="search" size={20} color="black" />
        </TouchableOpacity>
        {searchVisible && ( 
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar producto"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
        )}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Nombre del producto"
        value={productName}
        onChangeText={(text) => setProductName(text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Precio costo"
        value={costPrice}
        onChangeText={(text) => setCostPrice(text)}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Descripción del producto"
        value={productDescription}
        onChangeText={(text) => setProductDescription(text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Nombre del proveedor"
        value={providerName}
        onChangeText={(text) => setProviderName(text)}
      />

      <Button title="Guardar producto" onPress={handleSaveProduct} />

      <View style={styles.tabButtonsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, styles.availableProductsTab]}
          onPress={() => setShowSoldProducts(false)}
        >
          <Text style={styles.tabButtonText}>Productos Disponibles</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, styles.soldProductsTab]}
          onPress={() => setShowSoldProducts(true)}
        >
          <Text style={styles.tabButtonText}>Productos Vendidos</Text>
        </TouchableOpacity>
      </View>

      {showSoldProducts ? (
        <FlatList
          style={styles.list}
          data={soldProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SwipeableItem item={item} />}
        />
      ) : (
        <FlatList
          style={styles.list}
          data={availableProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderAvailableProducts}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeading}>Precio de Venta</Text>
            <TextInput
              style={styles.modalInput}
              value={soldPrice}
              onChangeText={(text) => setSoldPrice(text)}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Forma de pago"
              value={paymentMethod}
              onChangeText={(text) => setPaymentMethod(text)}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre del comprador"
              value={buyerName}
              onChangeText={(text) => setBuyerName(text)}
            />
            <Button title="Confirmar" onPress={handleConfirmSold} />
            <Button
              title="Cancelar"
              onPress={() => {
                setModalVisible(false);
                setSoldPrice('');
                setPaymentMethod('');
                setBuyerName('');
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F0F6FA',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#265C8C',
  },
  totalContainer: {
    marginTop: 20,
    backgroundColor: '#E0F0FF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#265C8C',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchIcon: {
    paddingHorizontal: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C2E2F9',
    borderRadius: 5,
    paddingHorizontal: 10,
    flex: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
  },
  datePicker: {
    width: 200,
    marginBottom: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
  },
  input: {
    height: 40,
    borderColor: '#265C8C',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  tabButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  availableProductsTab: {
    backgroundColor: '#74B9FF',
  },
  soldProductsTab: {
    backgroundColor: '#45A9E5',
  },
  tabButtonText: {
    fontWeight: 'bold',
    color: 'white',
  },
  list: {
    marginBottom: 20,
  },
  productItem: {
    padding: 10,
    backgroundColor: '#E0F0FF',
    borderRadius: 5,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productPrice: {
    marginBottom: 5,
  },
  productDescription: {
    marginBottom: 5,
  },
  soldButton: {
    backgroundColor: '#F4A261',
    padding: 5,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  soldButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  profitText: {
    marginBottom: 5,
  },
  remainingWarrantyText: {
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: 'black',
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  soldPrice: {
    marginBottom: 5,
  },
  paymentMethod: {
    marginBottom: 5,
  },
  buyerName: {
    marginBottom: 5,
  },
  productProvider: {
    marginBottom: 5,
  },
  productDate: {
    marginBottom: 5,
  },
  soldDate: {
    marginBottom: 5,
  },
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  swipeableContainer: {
    backgroundColor: 'red',
    marginBottom: 20,
    borderRadius: 5,
  },
});

export default withNavigationFocus(ProductScreen);
