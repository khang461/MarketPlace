import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8081/api",
  // baseURL: "http://14.225.207.153:8081/api",
});

// REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      // 🔥 KHÔNG bao giờ gán lại config.headers = {}
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nếu token hết hạn → xoá token → không retry để tránh loop
    if (error.response?.status === 401) {
      console.warn("Unauthorized → removing token");
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

export default api;
