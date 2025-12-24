import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (email, password, ubi = null) =>
    api.post('/auth/login', { email, password, ubi }),
  
  selectInterface: (userId, interfaceSelection, ubi = null) =>
    api.post('/auth/select-interface', { userId, interfaceSelection, ubi }),
};

// Cultivation services
export const cultivationService = {
  getPlants: (locationId) => api.get(`/cultivation/${locationId}/plants`),
  getPlant: (locationId, plantId) => api.get(`/cultivation/${locationId}/plants/${plantId}`),
  createPlant: (locationId, data) => api.post(`/cultivation/${locationId}/plants`, data),
  updatePlant: (locationId, plantId, data) => api.put(`/cultivation/${locationId}/plants/${plantId}`, data),
  deletePlant: (locationId, plantId) => api.delete(`/cultivation/${locationId}/plants/${plantId}`),
  getRooms: (locationId) => api.get(`/cultivation/${locationId}/rooms`),
  createRoom: (locationId, data) => api.post(`/cultivation/${locationId}/rooms`, data),
  harvestPlant: (locationId, plantId, data) => api.post(`/cultivation/${locationId}/plants/${plantId}/harvest`, data),
  getSourceInventory: (locationId) => api.get(`/cultivation/${locationId}/source-inventory`),
};

// Sales services
export const salesService = {
  getSales: (locationId) => api.get(`/sales/${locationId}/sales`),
  getSale: (locationId, saleId) => api.get(`/sales/${locationId}/sales/${saleId}`),
  createSale: (locationId, data) => api.post(`/sales/${locationId}/sales`, data),
  voidSale: (locationId, saleId, reason) => api.post(`/sales/${locationId}/sales/${saleId}/void`, { reason }),
  createRefund: (locationId, data) => api.post(`/sales/${locationId}/refunds`, data),
  getCustomers: (locationId) => api.get(`/sales/${locationId}/customers`),
  getCustomer: (locationId, customerId) => api.get(`/sales/${locationId}/customers/${customerId}`),
  createCustomer: (locationId, data) => api.post(`/sales/${locationId}/customers`, data),
  getAvailableInventory: (locationId) => api.get(`/sales/${locationId}/available-inventory`),
};

// User services
export const userService = {
  getUsers: () => api.get('/users'),
  getUser: (userId) => api.get(`/users/${userId}`),
  createUser: (data) => api.post('/users', data),
};

export default api;
