import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach the JWT (if present) to every outgoing request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hs_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function extractErrorMessage(error) {
  const data = error?.response?.data;
  if (data?.errors && Array.isArray(data.errors)) return data.errors.join(" · ");
  if (data?.message) return data.message;
  if (error?.code === "ECONNABORTED") return "Request timed out. Please try again.";
  if (error?.message === "Network Error") return "Can't reach the server. Is the backend running?";
  return "Something went wrong. Please try again.";
}

async function call(promise) {
  try {
    const res = await promise;
    return res.data;
  } catch (err) {
    const message = extractErrorMessage(err);
    const wrapped = new Error(message);
    wrapped.status = err?.response?.status;
    throw wrapped;
  }
}

export const authApi = {
  register: (payload) => call(api.post("/auth/register", payload)),
  login: (payload) => call(api.post("/auth/login", payload)),
  me: () => call(api.get("/auth/me")),
  forgotPassword: (payload) => call(api.post("/auth/forgot-password", payload)),
  resetPassword: (token, payload) => call(api.post(`/auth/reset-password/${token}`, payload)),
};

export const profileApi = {
  get: () => call(api.get("/profile")),
  update: (payload) => call(api.put("/profile", payload)),
};

export const trackerApi = {
  upsert: (payload) => call(api.post("/tracker", payload)),
  today: () => call(api.get("/tracker/today")),
  history: (limit = 14) => call(api.get(`/tracker/history?limit=${limit}`)),
};

export const dashboardApi = {
  summary: () => call(api.get("/dashboard/summary")),
};

export const riskApi = {
  predictDiabetes: (payload) => call(api.post("/risk/diabetes", payload)),
  history: () => call(api.get("/risk/history")),
  remove: (id) => call(api.delete(`/risk/${id}`)),
};

export const fitnessApi = {
  plan: () => call(api.get("/fitness/plan")),
};

export const mealApi = {
  plan: (preference) => call(api.get(`/meal/plan?preference=${preference}`)),
};

export default api;
