const axios = require('axios');

const registerUser = async () => {
  try {
    const response = await axios.post('http://localhost:3002/api/app/auth/register', {
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      phone: '1234567890',
      password: 'password123',
    });
    console.log('Usuario registrado exitosamente:', response.data);
  } catch (error) {
    console.error('Error al registrar usuario:', error.response ? error.response.data : error.message);
  }
};

registerUser();