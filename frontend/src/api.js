import axios from "axios";

// Configuration unique d'axios
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token absent, invalide ou expiré : retour à la page de connexion
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.startsWith("/auth/login") ||
      error.config?.url?.startsWith("/auth/register");
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem("token");
      if (window.location.pathname.toLowerCase() !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
