import SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

const db = SQLite.openDatabase('./my_database.db');

db.transaction((tx) => {
  // Create a table
  tx.executeSql(
    'CREATE TABLE IF NOT EXISTS images (id INTEGER PRIMARY KEY AUTOINCREMENT, uri TEXT, name TEXT, location TEXT)'

  );

  // Convert image to binary data
  const imagePath = 'path_to_your_image.jpg'; // Ruta de la imagen que deseas guardar
  const imageUri = FileSystem.readAsStringAsync(imagePath, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Insert a user with the image data
  tx.executeSql(
    'INSERT INTO users (id, name, email, image) VALUES (?, ?, ?, ?)',
    [1, 'John Doe', 'johndoe@example.com', imageUri],
    (_, { rowsAffected }) => {
      if (rowsAffected > 0) {
        console.log('User created successfully');
      } else {
        console.log('Failed to create user');
      }
    },
    (_, error) => {
      console.error(error);
    }
  );

  // Read all users
  tx.executeSql('SELECT * FROM users', [], (_, { rows }) => {
    const users = rows._array;
    console.log(users);
  });
});
