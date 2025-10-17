export interface User {
  id: number;
  username: string;
  role: 'admin' | 'cashier';
}

// This represents the user data as stored in localStorage, including password
export interface StoredUser extends User {
  password?: string;
}


export interface Product {
  id: string;
  name: string;
  price: number;
  cost?: number;
  stock: number;
  category: string;
  image?: string;
  barcode?: string;
  stockHistory?: { date: string; user: string; reason: string; change: number; newStock: number; }[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
    id: string;
    items: CartItem[];
    total: number;
    discount: number;
    finalTotal: number;
    paymentMethod: 'cash' | 'card' | 'multiple';
    date: string;
    user: string;
    modificationHistory?: { date: string; user: string; reason: string; changes: string; }[];
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}