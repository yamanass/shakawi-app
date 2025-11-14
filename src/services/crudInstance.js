// src/services/crudInstance.js
import Crud from '../path/to/Crud'; // عدّل المسار حسب مشروعك

const storageService = {
  getToken: () => localStorage.getItem('token'),
  getLang: () => localStorage.getItem('lang') || 'ar',
};

/* 
  الحل الأنسب:
  - React: REACT_APP_API_BASE متاحة أثناء البناء
  - ESLint ما رح يشتكي إذا عرفنا process كـ global
*/

// eslint-disable-next-line no-undef
const BASE = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';

const crud = new Crud({ baseURL: BASE, storageService });

export default crud;
