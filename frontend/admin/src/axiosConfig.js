import axios from 'axios';

// Centralized Axios instance with the base URL
const axiosInstance = axios.create({
    baseURL: 'https//wip.fibrebondindustries.com:5050', // Set your base URL here
    // baseURL: 'https://localhost:5050', // Set your base URL here
});

export default axiosInstance;
