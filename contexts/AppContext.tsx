import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Product, CartItem, Sale, StoredUser, Expense } from '../types';
import * as db from '../services/db';

// Sound effect data (base64 encoded)
const sounds = {
    addItem: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAAAAAD//w==',
    completeSale: 'data:audio/wav;base64,UklGRmAAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YYQAAADi/4r/kv+y/7z/x//V/9//6v/p/+T/5P/p/+r/8f/2//n//P8A/wD/AP8A////+f/5//r/9v/v/+f/3//U/9D/yv/G/8f/y//R/9X/2v/f/+//5f/f/9n/0//L/8T/wv/D/8f/y//Q/9T/2f/g/+T/7v/4//z/AAEAAwAFAAcACQALAA0ADwARABMAFQAXABkAGwAdAB8AIQEjAScBKwEvATMBPAFFASgBNwE/AUMBRAFAAT4BOAEuASMBHgEaARQBEAEKAAUAAf///v/6//f/8//u/+j/4v/c/9X/z//G/8D/v/+5/7f/u/+/wMHExcfJy8zOz9HT1tjZ297g4uXm5+jp6+/w8vX29/j5+vv8/f7/AA==',
    clearCart: 'data:audio/wav;base64,UklGRkQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YUBgAAAAsP+0/6z/ov+c/5j/l/+Y/5r/nP+g/6P/q/+t/7L/uv/A/8X/zP/U/9r/3v/h/+T/6v/w//b//v8BAgMEBQYHCAkKCwwNDg8=',
    error: 'data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YVgAAAAA//8CAP8A/wD9AP0A+QD3APYA8QDoAOkA7ADsAOsA6ADnAOIA3gDXANQA0gDOAMgAxQC+AKwAogCiAKIApQCqALMAugC/AMcAzwDVANYA2gDaANoA1wDXANc='
};


interface AppSettings {
    currency: string;
    lowStockThreshold: number;
    soundEffectsEnabled: boolean;
}

interface AppContextType {
    products: Product[];
    cart: CartItem[];
    sales: Sale[];
    users: StoredUser[];
    expenses: Expense[];
    settings: AppSettings;
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateCartQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    createSale: (saleData: Omit<Sale, 'id' | 'date'>) => Promise<void>;
    updateSale: (originalSale: Sale, updatedSale: Sale) => Promise<void>;
    addProduct: (product: Omit<Product, 'id'>) => void;
    updateProduct: (product: Product) => void;
    deleteProduct: (productId: string) => void;
    addExpense: (expense: Omit<Expense, 'id'>) => void;
    updateExpense: (expense: Expense) => void;
    deleteExpense: (expenseId: string) => void;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
    updateUser: (userId: number, updates: Partial<Pick<StoredUser, 'username' | 'password'>>) => void;
    playSound: (sound: keyof typeof sounds) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: AppSettings = {
    currency: 'LYD ',
    lowStockThreshold: 10,
    soundEffectsEnabled: true
};

const getInitialSettings = (): AppSettings => {
    const storedSettings = localStorage.getItem('pos-settings');
    if (storedSettings) {
        // Merge stored settings with defaults to ensure all keys are present
        return { ...defaultSettings, ...JSON.parse(storedSettings) };
    }
    return defaultSettings;
};


export const AppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [settings, setSettings] = useState<AppSettings>(getInitialSettings);
    const [users, setUsers] = useState<StoredUser[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);

    const playSound = useCallback((sound: keyof typeof sounds) => {
        if (settings.soundEffectsEnabled) {
            try {
                const audio = new Audio(sounds[sound]);
                audio.play().catch(e => console.error("Error playing sound:", e));
            } catch(e) {
                console.error("Could not play sound", e)
            }
        }
    }, [settings.soundEffectsEnabled]);
    
    const loadData = useCallback(() => {
        setProducts(db.getProducts());
        setSales(db.getSales());
        setUsers(db.getUsers());
        setExpenses(db.getExpenses());
        const storedCart = localStorage.getItem('pos-cart');
        if(storedCart) {
            setCart(JSON.parse(storedCart));
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        db.safeSetLocalStorage('pos-cart', cart);
    }, [cart]);

    useEffect(() => {
        db.safeSetLocalStorage('pos-settings', settings);
    }, [settings]);


    const addToCart = (product: Product) => {
        const cartItem = cart.find(item => item.id === product.id);
        const currentQuantity = cartItem ? cartItem.quantity : 0;

        if (product.stock <= currentQuantity) {
            playSound('error');
            return;
        }
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                playSound('addItem');
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            playSound('addItem');
            return [...prevCart, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    const updateCartQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart(prevCart => {
            return prevCart.map(item => {
                if (item.id === productId) {
                    if (quantity <= item.stock) {
                        return { ...item, quantity };
                    }
                    playSound('error');
                    return { ...item, quantity: item.stock };
                }
                return item;
            });
        });
    };

    const clearCart = () => {
        if(cart.length > 0) {
            playSound('clearCart');
        }
        setCart([]);
    };

    const createSale = async (saleData: Omit<Sale, 'id' | 'date'>) => {
        await db.addSale(saleData);
        playSound('completeSale');
        setCart([]);
        loadData(); // Reload products (for stock) and sales
    };
    
    const updateSale = async (originalSale: Sale, updatedSale: Sale) => {
        await db.updateSale(originalSale, updatedSale);
        loadData(); // Reload products and sales to reflect the update
    };

    const addProduct = (product: Omit<Product, 'id'>) => {
        db.addProduct(product);
        loadData();
    };

    const updateProduct = (product: Product) => {
        db.updateProduct(product);
        loadData();
    };

    const deleteProduct = (productId: string) => {
        db.deleteProduct(productId);
        loadData();
    };
    
    const addExpense = (expense: Omit<Expense, 'id'>) => {
        db.addExpense(expense);
        loadData();
    };

    const updateExpense = (expense: Expense) => {
        db.updateExpense(expense);
        loadData();
    };

    const deleteExpense = (expenseId: string) => {
        db.deleteExpense(expenseId);
        loadData();
    };

    const updateSettings = (newSettings: Partial<AppSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const updateUser = (userId: number, updates: Partial<Pick<StoredUser, 'username' | 'password'>>) => {
        db.updateUser(userId, updates);
        loadData(); // Reload users to reflect changes
    };

    const contextValue: AppContextType = {
        products,
        cart,
        sales,
        users,
        expenses,
        settings,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        createSale,
        updateSale,
        addProduct,
        updateProduct,
        deleteProduct,
        addExpense,
        updateExpense,
        deleteExpense,
        updateSettings,
        updateUser,
        playSound,
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppContextProvider');
    }
    return context;
};