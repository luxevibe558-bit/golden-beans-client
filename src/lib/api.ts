import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || "Network error";
    console.error("[API Error]", message);
    return Promise.reject(new Error(message));
  }
);

// ── Menu ──
export const menuApi = {
  getMenu: () => api.get("/menu"),
  getItems: () => api.get("/menu/items"),
  getCategories: () => api.get("/menu/categories"),
  createItem: (data: unknown) => api.post("/menu/items", data),
  updateItem: (id: string, data: unknown) => api.put(`/menu/items/${id}`, data),
  toggleItem: (id: string) => api.patch(`/menu/items/${id}/toggle`),
  deleteItem: (id: string) => api.delete(`/menu/items/${id}`),
  createCategory: (data: unknown) => api.post("/menu/categories", data),
};

// ── Orders ──
export const orderApi = {
  getOrders: (params?: Record<string, string>) => api.get("/orders", { params }),
  getKdsOrders: () => api.get("/orders/kds"),
  getPendingApproval: () => api.get("/orders/pending-approval"),
  getOrderByTable: (tableId: string) => api.get(`/orders/table/${tableId}`),
  getOrder: (id: string) => api.get(`/orders/${id}`),
  createOrder: (data: unknown) => api.post("/orders", data),
  sendKot: (id: string) => api.patch(`/orders/${id}/send-kot`),
  approveOrder: (id: string) => api.patch(`/orders/${id}/approve`),
  rejectOrder: (id: string, reason: string) => api.patch(`/orders/${id}/reject`, { reason }),
  updateItemStatus: (id: string, data: { itemId: string; status: string }) =>
    api.patch(`/orders/${id}/item-status`, data),
  settleOrder: (id: string, data: { amountPaid: number; paymentMethod: string; discount?: number; resolvedBy?: string }) =>
    api.patch(`/orders/${id}/settle`, data),
  cancelOrder: (id: string) => api.patch(`/orders/${id}/cancel`),
};

// ── Tables ──
export const tableApi = {
  getTables: () => api.get("/tables"),
  getTable: (id: string) => api.get(`/tables/${id}`),
  createTable: (data: unknown) => api.post("/tables", data),
  updateTableStatus: (id: string, status: string) =>
    api.patch(`/tables/${id}/status`, { status }),
};

// ── Inventory ──
export const inventoryApi = {
  getAll: () => api.get("/inventory"),
  getLowStock: () => api.get("/inventory/low-stock"),
  create: (data: unknown) => api.post("/inventory", data),
  update: (id: string, data: unknown) => api.put(`/inventory/${id}`, data),
  restock: (id: string, quantity: number) => api.patch(`/inventory/${id}/restock`, { quantity }),
  delete: (id: string) => api.delete(`/inventory/${id}`),
};

// ── Analytics ──
export const analyticsApi = {
  getToday: () => api.get("/analytics/today"),
  getAdjustments: () => api.get("/analytics/adjustments"),
  getRange: (from: string, to: string) => api.get("/analytics/range", { params: { from, to } }),
};

export default api;

// ===== WAITER REQUESTS =====
export const waiterApi = {
  createRequest: (data: {
    tableId: string;
    tableNumber: string;
    type: string;
    note?: string;
  }) =>
    fetch(`${API_BASE}/waiter/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  getAllRequests: () =>
    fetch(`${API_BASE}/waiter/all-requests`).then((r) => r.json()),

  getRushMode: () =>
    fetch(`${API_BASE}/waiter/rush-mode`).then((r) => r.json()),
};

// ===== CRM CAPTURE =====
export const crmCaptureApi = {
  getMessage: () =>
    fetch(`${API_BASE}/crm-capture/message`).then((r) => r.json()),

  submit: (data: { name: string; phone: string; tableId: string; offer: string }) =>
    fetch(`${API_BASE}/crm-capture/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  getConfig: () =>
    fetch(`${API_BASE}/crm-capture/config`).then((r) => r.json()),

  saveConfig: (data: any) =>
    fetch(`${API_BASE}/crm-capture/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
};

// ===== FEEDBACK =====
export const feedbackApi = {
  getAll: () =>
    fetch(`${API_BASE}/feedback/all`).then((r) => r.json()),

  getAnalytics: () =>
    fetch(`${API_BASE}/feedback/analytics`).then((r) => r.json()),
};