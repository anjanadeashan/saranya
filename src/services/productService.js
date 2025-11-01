import api from './api';

export const productService = {
  // Get all products
  getAll: () => api.get('/products'),
  
  // Get product by ID
  getById: (id) => api.get(`/products/${id}`),
  
  // Search products
  search: (query) => api.get(`/products/search?q=${encodeURIComponent(query)}`),
  
  // Create product
  create: (productData) => api.post('/products', productData),
  
  // Update product
  update: (id, productData) => api.put(`/products/${id}`, productData),
  
  // Delete product
  delete: (id) => api.delete(`/products/${id}`),
  
  // Get low stock products
  getLowStock: () => api.get('/products/low-stock')
};

export default productService;