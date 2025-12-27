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
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
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

// Inventory services
export const inventoryService = {
  getInventoryItems: (locationId) => api.get(`/inventory/${locationId}/items`),
  getInventoryItem: (locationId, itemId) => api.get(`/inventory/${locationId}/items/${itemId}`),
  moveItemToRoom: (locationId, itemId, data) => api.post(`/inventory/${locationId}/items/${itemId}/move-room`, data),
  adjustInventory: (locationId, itemId, data) => api.post(`/inventory/${locationId}/items/${itemId}/adjust`, data),
  splitInventory: (locationId, itemId, data) => api.post(`/inventory/${locationId}/items/${itemId}/split`, data),
  combineInventory: (locationId, data) => api.post(`/inventory/${locationId}/items/combine`, data),
  createLot: (locationId, data) => api.post(`/inventory/${locationId}/lots/create`, data),
  destroyInventory: (locationId, itemId, data) => api.post(`/inventory/${locationId}/items/${itemId}/destroy`, data),
  getAdjustments: (locationId) => api.get(`/inventory/${locationId}/adjustments`),
  getSplits: (locationId) => api.get(`/inventory/${locationId}/splits`),
  getCombinations: (locationId) => api.get(`/inventory/${locationId}/combinations`),
};

// Transfer services
export const transferService = {
  getTransfers: (locationId, filters) => api.get(`/transfer/${locationId}/transfers`, { params: filters }),
  getTransfer: (locationId, transferId) => api.get(`/transfer/${locationId}/transfers/${transferId}`),
  createTransfer: (locationId, data) => api.post(`/transfer/${locationId}/transfers`, data),
  getPendingTransfers: (locationId) => api.get(`/transfer/${locationId}/transfers/pending`),
  receiveTransfer: (locationId, transferId, data) => api.post(`/transfer/${locationId}/transfers/${transferId}/receive`, data),
  voidTransfer: (locationId, transferId, reason) => api.post(`/transfer/${locationId}/transfers/${transferId}/void`, { reason }),
};

// Room services
export const roomService = {
  getRooms: (locationId) => api.get(`/cultivation/${locationId}/rooms`),
  getRoom: (locationId, roomId) => api.get(`/cultivation/${locationId}/rooms/${roomId}`),
  createRoom: (locationId, data) => api.post(`/cultivation/${locationId}/rooms`, data),
  updateRoom: (locationId, roomId, data) => api.put(`/cultivation/${locationId}/rooms/${roomId}`, data),
  deleteRoom: (locationId, roomId) => api.delete(`/cultivation/${locationId}/rooms/${roomId}`),
};

// Conversion services
export const conversionService = {
  convertWetToDry: (locationId, data) => api.post(`/conversion/${locationId}/convert/wet-to-dry`, data),
  convertDryToExtraction: (locationId, data) => api.post(`/conversion/${locationId}/convert/dry-to-extraction`, data),
  convertExtractionToFinished: (locationId, data) => api.post(`/conversion/${locationId}/convert/extraction-to-finished`, data),
  getConversions: (locationId, filters) => api.get(`/conversion/${locationId}/conversions`, { params: filters }),
  getConversion: (locationId, conversionId) => api.get(`/conversion/${locationId}/conversions/${conversionId}`),
};

// Testing services
export const testingService = {
  generateSample: (locationId, data) => api.post(`/testing/${locationId}/samples`, data),
  assignLab: (locationId, data) => api.post(`/testing/${locationId}/samples/assign`, data),
  remediate: (locationId, data) => api.post(`/testing/${locationId}/samples/remediate`, data),
  getSample: (locationId, sampleId) => api.get(`/testing/${locationId}/samples/${sampleId}`),
  listSamples: (locationId, filters) => api.get(`/testing/${locationId}/samples`, { params: filters }),
};

export default api;
