import axios from "axios";

// 🔥 Use environment variable for backend URL
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://ultra-vault.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

// ================================
// 🔐 Attach Token Automatically
// ================================
API.interceptors.request.use(
  (req) => {
    const token = localStorage.getItem("token");
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
  },
  (error) => Promise.reject(error)
);


// ================================
// 🚨 Auto Logout if Token Expired
// ================================
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/"; // redirect to login
    }
    return Promise.reject(error);
  }
);

export default API;