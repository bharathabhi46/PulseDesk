import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const http = axios.create({
  baseURL: API_URL
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("pulsedesk_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("pulsedesk_token");
    }
    return Promise.reject(error);
  }
);
