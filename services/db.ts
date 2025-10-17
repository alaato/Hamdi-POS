import { User, Product, Sale, CartItem, StoredUser, Expense } from '../types';

// --- Storage Helpers ---
export const safeSetLocalStorage = (key: string, value: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Failed to save to localStorage with key "${key}"`, e);
        alert("Error: Could not save data. Your browser's storage might be full or disabled.");
    }
};

const safeSetSessionStorage = (key: string, value: any) => {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Failed to save to sessionStorage with key "${key}"`, e);
        alert("Error: Could not save session data. Your browser's storage might be full or disabled.");
    }
};

const safeRemoveSessionStorage = (key: string) => {
    try {
        sessionStorage.removeItem(key);
    } catch (e) {
        console.error(`Failed to remove from sessionStorage with key "${key}"`, e);
        alert("Error: Could not clear session data. Your browser's storage might be disabled.");
    }
};


// In a real app, you would use a more robust ID generation method.
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;


// --- Data Seeding ---
const initialProducts: Product[] = [
  { id: generateId('prod'), name: 'Laptop Pro', price: 1200, cost: 800, stock: 50, category: 'Electronics', barcode: '1234567890123', image: 'https://picsum.photos/seed/laptop/200' },
  { id: generateId('prod'), name: 'Wireless Mouse', price: 25, cost: 15, stock: 200, category: 'Accessories', barcode: '2345678901234', image: 'https://picsum.photos/seed/mouse/200' },
  { id: generateId('prod'), name: 'Coffee Mug', price: 15, cost: 7, stock: 150, category: 'Kitchenware', barcode: '3456789012345', image: 'https://picsum.photos/seed/mug/200' },
  { id: generateId('prod'), name: 'Notebook', price: 5, cost: 2, stock: 500, category: 'Stationery', barcode: '4567890123456', image: 'https://picsum.photos/seed/notebook/200' },
  { id: generateId('prod'), name: 'T-Shirt', price: 20, cost: 12, stock: 100, category: 'Apparel', barcode: '5678901234567', image: 'https://picsum.photos/seed/shirt/200' },
  { id: generateId('prod'), name: 'Water Bottle', price: 10, cost: 4, stock: 300, category: 'Accessories', barcode: '6789012345678', image: 'https://picsum.photos/seed/bottle/200' },
  { id: generateId('prod'), name: 'Backpack', price: 50, cost: 30, stock: 80, category: 'Bags', barcode: '7890123456789', image: 'https://picsum.photos/seed/backpack/200' },
  { id: generateId('prod'), name: 'Headphones', price: 150, cost: 90, stock: 60, category: 'Electronics', barcode: '8901234567890', image: 'https://picsum.photos/seed/headphones/200' },
];

const initialUsers: StoredUser[] = [
    { id: 1, username: 'admin', password: 'password', role: 'admin' },
    { id: 2, username: 'cashier', password: 'password', role: 'cashier' },
];

const initializeData = () => {
    if (!localStorage.getItem('pos-products')) {
        safeSetLocalStorage('pos-products', initialProducts);
    }
    if (!localStorage.getItem('pos-users')) {
        // In a real app, passwords should be hashed. For this offline demo, we store them as is.
        safeSetLocalStorage('pos-users', initialUsers);
    }
    if (!localStorage.getItem('pos-sales')) {
        safeSetLocalStorage('pos-sales', []);
    }
    if (!localStorage.getItem('pos-expenses')) {
        safeSetLocalStorage('pos-expenses', []);
    }
};

initializeData();

// --- Auth Functions ---
export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
    const users: StoredUser[] = JSON.parse(localStorage.getItem('pos-users') || '[]');
    const user = users.find((u) => u.username === username && u.password === password);
    if (user) {
        // Don't return the password
        const { password: _, ...userToReturn } = user;
        return Promise.resolve(userToReturn);
    }
    return Promise.resolve(null);
};

export const getLoggedInUser = (): User | null => {
    // Using sessionStorage to ensure user is logged out when tab/browser is closed.
    return JSON.parse(sessionStorage.getItem('pos-currentUser') || 'null');
};

export const storeLoggedInUser = (user: User) => {
    safeSetSessionStorage('pos-currentUser', user);
};

export const clearLoggedInUser = () => {
    safeRemoveSessionStorage('pos-currentUser');
};

// --- User Management Functions ---
export const getUsers = (): StoredUser[] => {
    return JSON.parse(localStorage.getItem('pos-users') || '[]');
};

export const updateUser = (userId: number, updates: Partial<Pick<StoredUser, 'username' | 'password'>>) => {
    let users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        if (updates.username) {
            users[userIndex].username = updates.username;
        }
        // Only update password if a non-empty string is provided
        if (updates.password && updates.password.trim() !== '') {
            users[userIndex].password = updates.password;
        }
        safeSetLocalStorage('pos-users', users);
    }
};


// --- Product Functions ---
export const getProducts = (): Product[] => {
    return JSON.parse(localStorage.getItem('pos-products') || '[]');
};

export const addProduct = (product: Omit<Product, 'id'>) => {
    const products = getProducts();
    const newProduct: Product = {
        ...product,
        id: generateId('prod'),
    };
    products.push(newProduct);
    safeSetLocalStorage('pos-products', products);
};

export const updateProduct = (updatedProduct: Product) => {
    let products = getProducts();
    products = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    safeSetLocalStorage('pos-products', products);
};

export const deleteProduct = (productId: string) => {
    let products = getProducts();
    products = products.filter(p => p.id !== productId);
    safeSetLocalStorage('pos-products', products);
};


// --- Sales Functions ---
export const getSales = (): Sale[] => {
    return JSON.parse(localStorage.getItem('pos-sales') || '[]');
};

export const addSale = async (saleData: Omit<Sale, 'id' | 'date'>): Promise<void> => {
    const sales = getSales();
    const newSale: Sale = {
        ...saleData,
        id: generateId('sale'),
        date: new Date().toISOString(),
    };
    sales.unshift(newSale); // Add to the beginning of the array
    safeSetLocalStorage('pos-sales', sales);

    // Update stock
    const products = getProducts();
    let productsUpdated = false;
    saleData.items.forEach((cartItem: CartItem) => {
        const productIndex = products.findIndex(p => p.id === cartItem.id);
        if (productIndex !== -1) {
            products[productIndex].stock -= cartItem.quantity;
            productsUpdated = true;
        }
    });

    if (productsUpdated) {
        safeSetLocalStorage('pos-products', products);
    }
    return Promise.resolve();
};

export const updateSale = async (originalSale: Sale, updatedSale: Sale): Promise<void> => {
    // 1. Update sales record
    const sales = getSales();
    const saleIndex = sales.findIndex(s => s.id === originalSale.id);
    if (saleIndex === -1) {
        console.error("Sale to update not found");
        return;
    }
    sales[saleIndex] = updatedSale;
    safeSetLocalStorage('pos-sales', sales);

    // 2. Calculate stock adjustments
    const quantityChanges: Record<string, number> = {};

    originalSale.items.forEach(item => {
        quantityChanges[item.id] = (quantityChanges[item.id] || 0) + item.quantity;
    });

    updatedSale.items.forEach(item => {
        quantityChanges[item.id] = (quantityChanges[item.id] || 0) - item.quantity;
    });

    // 3. Update product stock
    if (Object.keys(quantityChanges).length > 0) {
        const products = getProducts();
        let productsUpdated = false;
        Object.entries(quantityChanges).forEach(([productId, quantityChange]) => {
            if (quantityChange !== 0) {
                const productIndex = products.findIndex(p => p.id === productId);
                if (productIndex !== -1) {
                    products[productIndex].stock += quantityChange; // Add back returned items
                    productsUpdated = true;
                }
            }
        });

        if (productsUpdated) {
            safeSetLocalStorage('pos-products', products);
        }
    }
    
    return Promise.resolve();
};

// --- Expense Functions ---
export const getExpenses = (): Expense[] => {
    return JSON.parse(localStorage.getItem('pos-expenses') || '[]');
};

export const addExpense = (expense: Omit<Expense, 'id'>) => {
    const expenses = getExpenses();
    const newExpense: Expense = {
        ...expense,
        id: generateId('exp'),
    };
    expenses.unshift(newExpense);
    safeSetLocalStorage('pos-expenses', expenses);
};

export const updateExpense = (updatedExpense: Expense) => {
    let expenses = getExpenses();
    expenses = expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e);
    safeSetLocalStorage('pos-expenses', expenses);
};

export const deleteExpense = (expenseId: string) => {
    let expenses = getExpenses();
    expenses = expenses.filter(e => e.id !== expenseId);
    safeSetLocalStorage('pos-expenses', expenses);
};
