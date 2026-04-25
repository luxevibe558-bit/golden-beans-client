// ─────────────────────────────────────────────
// SHARED TYPES for Golden Beans Cafe Frontend
// ─────────────────────────────────────────────

export interface Category {
  _id: string;
  name: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

export interface RecipeItem {
  ingredient: string;
  quantityUsed: number;
}

export interface VariantOption {
  name: string;
  priceModifier: number;
  isDefault?: boolean;
}

export interface VariantGroup {
  name: string;
  required: boolean;
  multiSelect: boolean;
  options: VariantOption[];
}

export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: Category | string;
  imageUrl: string;
  imagePublicId?: string;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTime: number;
  tags: string[];
  recipe: RecipeItem[];
  variantGroups?: VariantGroup[];
  rating?: number;
  reviewCount?: number;
  sortOrder: number;
}

export interface MenuCategory {
  _id: string;
  name: string;
  icon: string;
  items: MenuItem[];
}

export interface Table {
  _id: string;
  tableNumber: string;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "cleaning";
  currentOrderId: string | null;
  qrCode: string;
}

export type OrderItemStatus = "pending" | "preparing" | "ready" | "served";

export interface OrderItem {
  _id: string;
  menuItem: string;
  name: string;
  price: number;
  quantity: number;
  notes: string;
  status: OrderItemStatus;
  kotPrinted: boolean;
}

export type OrderStatus =
  | "open"
  | "kotSent"
  | "partially_ready"
  | "ready"
  | "settled"
  | "cancelled";

export interface Order {
  _id: string;
  orderNumber: string;
  table: string;
  tableNumber: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  amountPaid: number;
  paymentMethod: "cash" | "upi" | "card" | "wallet" | "";
  customerName: string;
  customerPhone: string;
  guestCount: number;
  notes: string;
  settledAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  _id: string;
  name: string;
  unit: string;
  stockQuantity: number;
  lowStockThreshold: number;
  costPerUnit: number;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes: string;
  isVeg: boolean;
}

export interface DailySales {
  _id: string;
  date: string;
  totalOrders: number;
  totalRevenue: number;
  totalTax: number;
  totalDiscount: number;
  cashRevenue: number;
  upiRevenue: number;
  cardRevenue: number;
  totalAdjustments: number;
}

export interface AdjustmentWallet {
  _id: string;
  order: string;
  orderNumber: string;
  tableNumber: string;
  totalAmount: number;
  amountPaid: number;
  shortfall: number;
  reason: string;
  resolvedBy: string;
  isResolved: boolean;
  createdAt: string;
}
