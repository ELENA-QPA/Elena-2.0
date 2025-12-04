import { ReactNode } from "react";

// Métricas del Dashboard
export interface DashboardMetric {
  value: number;
  label: string;
  percentage: number;
  trend: "up" | "down";
  icon?: ReactNode;
  chartData?: number[];
  chartColor?: string;
}

// Ventas por día
export interface SalesByDay {
  date: string;
  amount: number;
  itemsSold?: number;
}

// Órdenes por hora
export interface OrdersByHour {
  hour: string;
  current: number;
  previous: number;
}

// Producto
export interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  category?: string;
  image: string;
  stock?: number;
  sku?: string;
  brand?: string;
}

// Producto con estadísticas de ventas
export interface TopProduct extends Product {
  unitsSold: number;
  revenue?: number;
  rank?: number;
  previousRank?: number;
  percentageGrowth?: number;
}

// Transacción
export interface RecentTransaction {
  id: number;
  name: string;
  date: string;
  amount: number;
  status: "paid" | "pending";
  productId?: number;
  quantity?: number;
  paymentMethod?: string;
}

// Estadísticas de productos
export interface ProductStats {
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
  topCategories: {
    name: string;
    count: number;
    percentage: number;
  }[];
}

// Datos completos del Dashboard
export interface DashboardData {
  metrics: {
    revenue: {
      value: number;
      label: string;
      percentage: number;
      trend: string;
    };
    orders: {
      value: number;
      label: string;
      percentage: number;
      trend: string;
    };
    visits: {
      value: number;
      label: string;
      percentage: number;
      trend: string;
    };
    newUsers: {
      value: number;
      label: string;
      percentage: number;
      trend: string;
    };
    existingUsers: {
      value: number;
      label: string;
      percentage: number;
      trend: string;
    };
  };
  salesByDay: { date: string; amount: number }[];
  ordersByHour: { hour: string; current: number; previous: number }[];
  solicitudSurtido: {
    id: number;
    nombre: string;
    fecha: string;
    productos: number;
    estado: "surtido" | "no-surtido" | "pagado" | "pendiente";
  }[];
  ventas: {
    id: number;
    nombre: string;
    fecha: string;
    monto: number;
    estado:  "pagado" | "pendiente";
  }[];
  products: {
    id: number;
    name: string;
    price: number;
    unitsSold: number;
    image: string;
  }[];
  topProducts: any[];
}
// Respuesta de la API de productos
export interface ProductsApiResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filtros para productos
export interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: "price" | "name" | "unitsSold" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Parámetros para obtener productos top
export interface TopProductsParams {
  timeframe?: "day" | "week" | "month" | "year";
  limit?: number;
  category?: string;
  minUnitsSold?: number;
}

// Estado del inventario
export interface ProductInventory {
  productId: number;
  quantity: number;
  lastUpdated: Date;
  lowStockThreshold?: number;
  reorderPoint?: number;
}

// Historial de precios
export interface PriceHistory {
  productId: number;
  price: number;
  date: Date;
  type: "regular" | "sale" | "promotion";
}

// Categoría de producto
export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  image?: string;
  productsCount?: number;
}

// Marca de producto
export interface ProductBrand {
  id: number;
  name: string;
  description?: string;
  logo?: string;
  productsCount?: number;
}
