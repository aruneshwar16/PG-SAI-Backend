const axios = require('axios');

const testRegistration = async () => {
  try {
    console.log('Sending registration request...');
    const response = await axios.post('http://localhost:5002/api/auth/register', {
      username: 'testuser2',
      email: 'test2@example.com',
      password: 'password123'
    });
    console.log('Registration successful:', response.data);
  } catch (error) {
    console.error('Registration failed:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Server response:', {
        data: error.response.data,
        status: error.response.status,
        headers: error.response.headers
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
  }
};

testRegistration(); 