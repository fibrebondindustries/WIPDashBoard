import axios from 'axios';

// Centralized Axios instance with the base URL
const axiosInstance = axios.create({
    baseURL: 'http://localhost:5050', // Set your base URL here
});

export default axiosInstance;