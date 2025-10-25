import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8081/api/",
  //  baseURL: "http://14.225.207.153:8081/api/", 
});

api.interceptors.request.use(
  function (config) {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);



export default api;
