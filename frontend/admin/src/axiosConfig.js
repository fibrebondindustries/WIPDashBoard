import axios from 'axios';

// Centralized Axios instance with the base URL
const axiosInstance = axios.create({
    baseURL: 'http://wip.fibrebondindustries.com:5050', // Set your base URL here
});

export default axiosInstance;
