/**
 * API Client — handles all HTTP requests to the Express backend
 */
const API = (() => {
  const BASE = (window.posConfig && window.posConfig.apiUrl) || 'http://localhost:3351';
  let token = null;

  function setToken(t) { token = t; }
  function getToken() { return token; }
  function clearToken() { token = null; }

  async function request(method, path, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE}${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  return {
    setToken,
    getToken,
    clearToken,
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    put: (path, body) => request('PUT', path, body),
    delete: (path) => request('DELETE', path),

    // Auth
    login: (username, password) => request('POST', '/api/auth/login', { username, password }),

    // Products
    getProducts: (search) => request('GET', `/api/products${search ? '?search=' + encodeURIComponent(search) : '?active=true'}`),
    getCategories: () => request('GET', '/api/products/categories'),
    getProduct: (id) => request('GET', `/api/products/${id}`),
    createProduct: (data) => request('POST', '/api/products', data),
    updateProduct: (id, data) => request('PUT', `/api/products/${id}`, data),

    // Shifts
    getCurrentShift: () => request('GET', '/api/shifts/current'),
    openShift: (data) => request('POST', '/api/shifts/open', data),
    closeShift: (id, data) => request('POST', `/api/shifts/${id}/close`, data),
    getShiftSummary: (id) => request('GET', `/api/shifts/${id}/summary`),

    // Transactions
    createTransaction: (data) => request('POST', '/api/transactions', data),
    voidTransaction: (id) => request('POST', `/api/transactions/${id}/void`),
    getTransactions: (params) => {
      const qs = new URLSearchParams(params).toString();
      return request('GET', `/api/transactions${qs ? '?' + qs : ''}`);
    },
    getTransaction: (id) => request('GET', `/api/transactions/${id}`),

    // Receivings
    createReceiving: (data) => request('POST', '/api/receivings', data),
    getReceivings: () => request('GET', '/api/receivings'),

    // Reports
    getShiftReport: (id) => request('GET', `/api/reports/shift/${id}`),
    getDailyReport: (date) => request('GET', `/api/reports/daily${date ? '?date=' + date : ''}`),
    getCredits: () => request('GET', '/api/reports/credits'),

    // Users
    getUsers: () => request('GET', '/api/users'),
    createUser: (data) => request('POST', '/api/users', data),
    updateUser: (id, data) => request('PUT', `/api/users/${id}`, data),
  };
})();
