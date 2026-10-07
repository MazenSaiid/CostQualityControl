export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  token?: string;
}

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  currentCost: number;
  supplierId?: number;
  supplierName?: string;
  lastUpdated?: string;
}

export interface ProductIngredient {
  ingredientId: number;
  ingredientName?: string;
  weight: number;
  unit?: string;
  cost?: number;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  category: string;
  sellingPrice: number;
  totalCost: number;
  totalWeight: number;
  costPerKg: number;
  profitAmount: number;
  profitPercentage: number;
  ingredients: ProductIngredient[];
  createdAt?: string;
}

export interface InvoiceItem {
  id?: number;
  ingredientId: number;
  ingredientName?: string;
  weight: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt?: string;
}

export interface InvoicePayment {
  id: number;
  amount: number;
  date: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  supplierId?: number;
  supplierName: string;
  date: string;
  items: InvoiceItem[];
  totalAmount: number;
  totalPaid: number;
  totalDue: number;
  createdAt?: string;
  isPaid?: boolean;
  payments: InvoicePayment[];
}

export interface ProductionBatch {
  id: number;
  batchNumber: string;
  productId: number;
  productName?: string;
  productionDate: string;
  expectedWeight: number;
  actualWeight: number;
  yieldPercentage: number;
  wastePercentage: number;
  status: 'pending' | 'completed' | 'failed';
  notes?: string;
  ingredientsUsed: { ingredientId: number; ingredientName?: string; expectedWeight: number; actualWeight: number }[];
  wasteWeight?: number;
  sellingValue?: number;
  costValue?: number;
  profitValue?: number;
}


export interface IngredientConsumption {
  ingredientName: string;
  unit: string;
  totalPurchasedKg: number;
  totalPurchasedValue: number;
  totalUsedKg: number;
  totalUsedValue: number;
  remainingKg: number;
  remainingValue: number;
  usagePercent: number;
}

export interface SupplierConsumption {
  supplier: string;
  ingredients: IngredientConsumption[];
  totalPurchasedKg: number;
  totalPurchasedValue: number;
  totalUsedKg: number;
  totalUsedValue: number;
  remainingKg: number;
  remainingValue: number;
  usagePercent: number;
}

export interface BatchRevenue {
  batchId: number;
  batchNumber: string;
  productName: string;
  productionDate: string;
  actualWeight: number;
  sellingPrice: number;
  revenue: number;
  ingredientCost: number;
  grossProfit: number;
  grossMarginPct: number;
}

export interface SupplierFinancial {
  supplier: string;
  totalInvoiced: number;
  totalPaid: number;
  totalOwed: number;
  revenueGenerated: number;
  netPosition: number;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalInvoiced: number;
  totalPaid: number;
  totalOwed: number;
  grossProfit: number;
  netCashPosition: number;
  batchBreakdown: BatchRevenue[];
  supplierBreakdown: SupplierFinancial[];
}

export interface DashboardStats {
  totalProducts: number;
  totalIngredients: number;
  totalBatches: number;
  avgProfitMargin: number;
  avgYield: number;
  recentBatches: ProductionBatch[];
  topProducts: { name: string; profit: number }[];
  costTrend: { month: string; cost: number }[];
}
