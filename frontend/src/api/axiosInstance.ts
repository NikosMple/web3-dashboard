import axios from "axios";
import { getAccessToken } from "@/lib/auth";

// Δημιουργούμε axios instance
export const axiosInstance = axios.create({
  baseURL: "http://localhost:4000",
});

// Interceptor για tokens
axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 👇 Export ως named function για Orval
export const customInstance = async <T>(config: any): Promise<T> => {
  const response = await axiosInstance.request<T>(config);
  return response.data;
};
