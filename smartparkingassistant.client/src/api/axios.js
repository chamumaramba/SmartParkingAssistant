import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5073/api",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json"
    },
    withCredentials: true
});

// Optional error logging
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API Error:", {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url
        });
        return Promise.reject(error);
    }
);

export default api;
