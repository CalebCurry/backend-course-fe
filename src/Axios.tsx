import axios from 'axios';
import { backendUrl } from './shared';

// Create a custom axios instance to be shared 
const axiosInstance = axios.create({
  baseURL: backendUrl,
});

export default axiosInstance;
