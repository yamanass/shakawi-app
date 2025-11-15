// src/services/crudInstance.js
import Crud from './crud';

// eslint-disable-next-line no-undef
const BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';


const storageService = {
  getToken: () => localStorage.getItem('token'),
  getLang: () => localStorage.getItem('lang') || 'ar',
};

const crud = new Crud({ baseURL: BASE, storageService });

export default crud;
