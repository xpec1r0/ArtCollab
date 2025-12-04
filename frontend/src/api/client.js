// src/api/client.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
// Si usas proxy de Vite, puedes dejar "/api", pero esto te da un fallback directo al backend.

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // permite cookies si algún día usamos httpOnly
});

// 🔐 Interceptor: adjunta el JWT en Authorization si existe en localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");

    if (token) {
      config.headers = config.headers || {};
      // No pisamos Authorization si ya viene seteado manualmente
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Extra util si quieres ver la URL base en consola
export const logApiBaseUrl = () => {
  console.log("API baseURL =>", API_BASE_URL);
};
