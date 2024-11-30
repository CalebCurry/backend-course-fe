// src/Axios.ts
import axios from 'axios';
import { backendUrl } from './shared';
import { createBrowserHistory } from 'history';

// Create a custom axios instance to be shared 
const axiosInstance = axios.create({
  baseURL: backendUrl,
});

export default axiosInstance;
