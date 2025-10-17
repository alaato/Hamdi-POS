import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Product, CartItem } from '../types';
import GlassCard from '../components/common/GlassCard';
import NeumorphicButton from '../components/common/NeumorphicButton';
import { Search, X, Plus, Minus, Trash2, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { exportReceiptPDF } from '../utils/export';

const POS: React.FC = () => {
    const { products, cart, addToCart, removeFromCart, updateCartQuantity, clearCart, createSale, settings } = useAppContext();
    const { user } = useAuth();
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [discount, setDiscount] = useState(0);
    const [isClearCartModalOpen, setIsClearCartModalOpen] = useState(false);
    const [paymentModalState, setPaymentModalState] = useState<{ isOpen: boolean; paymentMethod: 'cash' | 'card' | 'multiple' | null }>({ isOpen: false, paymentMethod: null });
    const [amountReceived, setAmountReceived] = useState<string>('');
    
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const amountInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (paymentModalState.isOpen) {
            setTimeout(() => amountInputRef.current?.focus(), 100);
        }
    }, [paymentModalState.isOpen]);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        return products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.barcode?.includes(searchTerm)
        );
    }, [products, searchTerm]);

    const handleBarcodeScan = (e: React.ChangeEvent<HTMLInputElement>) => {
        const barcode = e.target.value;
        const product = products.find(p => p.barcode === barcode);
        if (product) {
            addToCart(product);
            e.target.value = ''; // Clear input after scan
        }
        setSearchTerm(barcode);
    };
    
    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
    const total = useMemo(() => subtotal - discount, [subtotal, discount]);
    const totalProfit = useMemo(() => cart.reduce((sum, item) => sum + (item.price - (item.cost || 0)) * item.quantity, 0), [cart]);


    const change = useMemo(() => {
        const received = parseFloat(amountReceived);
        if (isNaN(received) || !amountReceived) return 0;
        return received - total;
    }, [amountReceived, total]);

    const openPaymentModal = (method: 'cash' | 'card' | 'multiple') => {
        if (cart.length === 0) return;
        setAmountReceived(total.toFixed(2));
        setPaymentModalState({ isOpen: true, paymentMethod: method });
    };

    const handleCompleteSale = async () => {
        if (cart.length === 0 || !paymentModalState.paymentMethod || parseFloat(amountReceived) < total) return;
        
        const newSale = {
            items: cart,
            total: subtotal,
            discount,
            finalTotal: total,
            paymentMethod: paymentModalState.paymentMethod,
            user: user!.username,
        };
        const saleForReceipt = {
            ...newSale,
            id: `SALE-${Date.now()}`,
            date: new Date().toISOString(),
        };

        await createSale(newSale);
        exportReceiptPDF(saleForReceipt, settings);
        clearCart();
        setDiscount(0);
        setPaymentModalState({ isOpen: false, paymentMethod: null });
        setAmountReceived('');
    };

    const handleConfirmClearCart = () => {
        clearCart();
        setIsClearCartModalOpen(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
            {/* Products List */}
            <div className="lg:col-span-2 h-full flex flex-col">
                <GlassCard className="p-4 mb-4">
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-300" size={20} />
                        <input
                            ref={barcodeInputRef}
                            type="text"
                            placeholder={t('search_or_scan_barcode')}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                handleBarcodeScan(e);
                            }}
                            className="w-full bg-white/10 border border-white/20 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>
                </GlassCard>
                <GlassCard className="flex-1 p-4 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredProducts.map(product => {
                            const isLowStock = product.stock <= settings.lowStockThreshold;
                            return (
                                <div 
                                    key={product.id} 
                                    onClick={() => addToCart(product)} 
                                    className="relative bg-black/20 p-4 rounded-lg text-center cursor-pointer transition-transform hover:scale-105"
                                >
                                    {isLowStock && (
                                        <div className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                                            {t('low_stock')}
                                        </div>
                                    )}
                                    <img src={product.image || 'https://picsum.photos/200'} alt={product.name} className="w-24 h-24 object-cover mx-auto rounded-md mb-2" />
                                    <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                                    <p className="text-xs text-gray-300">{settings.currency}{product.price.toFixed(2)}</p>
                                </div>
                            );
                        })}
                    </div>
                </GlassCard>
            </div>

            {/* Cart */}
            <div className="h-full flex flex-col">
                <GlassCard className="flex-1 p-4 flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-4 border-b border-white/20 pb-2">{t('cart')}</h3>
                    <div className="flex-1 overflow-y-auto -mr-2 pr-2">
                        {cart.length === 0 ? (
                            <p className="text-gray-300 text-center mt-10">{t('cart_is_empty')}</p>
                        ) : (
                            <div className="space-y-2">
                                {cart.map(item => (
                                    <div key={item.id} className="flex items-center p-2 bg-black/20 rounded-lg space-x-3 rtl:space-x-reverse">
                                        <img 
                                            src={item.image || 'https://picsum.photos/200'} 
                                            alt={item.name} 
                                            className="w-14 h-14 object-cover rounded-md flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                                            <p className="text-xs text-gray-300">{settings.currency}{item.price.toFixed(2)}</p>
                                            <p className="text-xs text-green-400">{t('profit')}: {settings.currency}{((item.price - (item.cost || 0)) * item.quantity).toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center bg-black/30 rounded-full">
                                            <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)} className="p-2 rounded-full hover:bg-white/10 transition-colors"><Minus size={14} /></button>
                                            <span className="px-2 text-sm w-8 text-center">{item.quantity}</span>
                                            <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="p-2 rounded-full hover:bg-white/10 transition-colors"><Plus size={14} /></button>
                                        </div>
                                        <div className="text-sm font-semibold text-white w-20 text-right">
                                            {settings.currency}{(item.price * item.quantity).toFixed(2)}
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)} className="p-2 rounded-full text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors flex-shrink-0"><Trash2 size={18}/></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {cart.length > 0 && (
                        <div className="border-t border-white/20 pt-4 mt-4 text-sm">
                            <div className="flex justify-between mb-1"><span>{t('subtotal')}</span><span>{settings.currency}{subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between mb-1 text-green-400 font-semibold"><span>{t('total_profit')}</span><span>{settings.currency}{totalProfit.toFixed(2)}</span></div>
                            <div className="flex justify-between items-center mb-2">
                                <span>{t('discount')}</span>
                                <input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="w-20 bg-white/10 text-right rounded-md p-1 border border-white/20" />
                            </div>
                            <div className="flex justify-between font-bold text-lg text-white mt-2 pt-2 border-t border-white/20"><span>{t('total')}</span><span>{settings.currency}{total.toFixed(2)}</span></div>
                            <div className="mt-4 grid grid-cols-3 gap-2">
                                <NeumorphicButton variant="accent" onClick={() => openPaymentModal('cash')} className="py-3">{t('cash')}</NeumorphicButton>
                                <NeumorphicButton variant="accent" onClick={() => openPaymentModal('card')} className="py-3">{t('card')}</NeumorphicButton>
                                <NeumorphicButton variant="accent" onClick={() => openPaymentModal('multiple')} className="py-3">{t('multiple')}</NeumorphicButton>
                            </div>
                            <NeumorphicButton onClick={() => setIsClearCartModalOpen(true)} className="w-full mt-2 py-2 text-red-400">{t('clear_cart')}</NeumorphicButton>
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* Payment Modal */}
            {paymentModalState.isOpen && (
                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <GlassCard className="w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4 text-white">{t('complete_sale')}</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-black/20 rounded-lg text-center">
                                <p className="text-gray-300 text-sm">{t('total_due')}</p>
                                <p className="text-3xl font-bold text-white">{settings.currency}{total.toFixed(2)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-200">{t('amount_received')}</label>
                                <input
                                    ref={amountInputRef}
                                    type="number"
                                    value={amountReceived}
                                    onChange={(e) => setAmountReceived(e.target.value)}
                                    className="w-full mt-1 p-3 text-2xl bg-white/20 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-accent text-white text-center"
                                />
                            </div>
                            <div className={`p-4 rounded-lg text-center ${change >= 0 ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
                                <p className="text-sm">{change >= 0 ? t('change_due') : t('amount_remaining')}</p>
                                <p className="text-2xl font-bold">{settings.currency}{Math.abs(change).toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4 rtl:space-x-reverse mt-6">
                            <NeumorphicButton onClick={() => setPaymentModalState({ isOpen: false, paymentMethod: null })} className="px-6 py-2">{t('cancel')}</NeumorphicButton>
                            <NeumorphicButton 
                                onClick={handleCompleteSale} 
                                variant="accent"
                                className="px-6 py-2"
                                disabled={parseFloat(amountReceived) < total || !amountReceived}
                            >
                                {t('complete_sale')}
                            </NeumorphicButton>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Clear Cart Confirmation Modal */}
            {isClearCartModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <GlassCard className="w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4 text-white">{t('confirm_clear_cart_title')}</h3>
                        <p className="text-gray-300 mb-6">{t('confirm_clear_cart_message')}</p>
                        <div className="flex justify-end space-x-4 rtl:space-x-reverse">
                            <NeumorphicButton onClick={() => setIsClearCartModalOpen(false)} className="px-6 py-2">{t('cancel')}</NeumorphicButton>
                            <NeumorphicButton 
                                onClick={handleConfirmClearCart} 
                                variant="accent"
                                className="bg-red-500/80 hover:bg-red-600/80 px-6 py-2"
                            >
                                {t('confirm')}
                            </NeumorphicButton>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

export default POS;