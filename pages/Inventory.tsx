import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Product } from '../types';
import GlassCard from '../components/common/GlassCard';
import NeumorphicButton from '../components/common/NeumorphicButton';
import { useTranslation } from 'react-i18next';
import { Warehouse, DollarSign, Package, AlertTriangle, Edit, Plus, Upload, History } from 'lucide-react';

const ProductModal: React.FC<{ product: Partial<Product> | null, onClose: () => void, onSave: (product: Product | Omit<Product, 'id'>) => void }> = ({ product, onClose, onSave }) => {
    const [formData, setFormData] = useState(product || { name: '', price: 0, stock: 0, category: '', barcode: '', image: '', cost: 0 });
    const { t } = useTranslation();

    useEffect(() => {
        if (product) {
            setFormData(product);
        }
    }, [product]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: ['price', 'stock', 'cost'].includes(name) ? parseFloat(value) || 0 : value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Product);
    };

    if (!product) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="w-full max-w-lg p-6">
                <h3 className="text-xl font-bold mb-6 text-white">{('id' in formData && formData.id) ? t('edit_product') : t('add_product')}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">{t('product_name')}</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-white/10 p-2 rounded border border-white/20 text-white" required/>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{t('price')}</label>
                            <input name="price" type="number" step="0.01" value={formData.price || ''} onChange={handleChange} className="w-full bg-white/10 p-2 rounded border border-white/20 text-white" required/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{t('cost_price')}</label>
                            <input name="cost" type="number" step="0.01" value={formData.cost || ''} onChange={handleChange} className="w-full bg-white/10 p-2 rounded border border-white/20 text-white"/>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{t('stock')}</label>
                            <input name="stock" type="number" value={formData.stock || ''} onChange={handleChange} className="w-full bg-white/10 p-2 rounded border border-white/20 text-white" required/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{t('category')}</label>
                            <input name="category" value={formData.category} onChange={handleChange} className="w-full bg-white/10 p-2 rounded border border-white/20 text-white"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">{t('barcode')}</label>
                        <input name="barcode" value={formData.barcode} onChange={handleChange} className="w-full bg-white/10 p-2 rounded border border-white/20 text-white"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('product_image')}</label>
                        <div className="flex items-center gap-4">
                            <img src={formData.image || `https://via.placeholder.com/150/283E51/FFFFFF?text=No+Image`} alt="Preview" className="w-24 h-24 object-cover rounded-lg bg-black/20"/>
                            <label htmlFor="image-upload" className="flex-grow cursor-pointer bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-dark transition-colors text-center flex items-center justify-center gap-2">
                                <Upload size={18} /> {t('change_image')}
                            </label>
                            <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden"/>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <NeumorphicButton type="button" onClick={onClose} className="px-4 py-2">{t('cancel')}</NeumorphicButton>
                        <NeumorphicButton type="submit" variant="accent" className="px-4 py-2">{t('save')}</NeumorphicButton>
                    </div>
                </form>
            </GlassCard>
        </div>
    );
};


const StockAdjustmentModal: React.FC<{ product: Product | null; onClose: () => void; onSave: (product: Product, newStock: number, reason: string) => void; }> = ({ product, onClose, onSave }) => {
    const { t } = useTranslation();
    const [newStock, setNewStock] = useState(product?.stock || 0);
    const [reason, setReason] = useState('stocktake');

    useEffect(() => { if (product) setNewStock(product.stock); }, [product]);

    if (!product) return null;

    const handleSave = () => onSave(product, newStock, reason);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="w-full max-w-md p-6">
                <h3 className="text-xl font-bold mb-2 text-white">{t('stock_adjustment_for')}</h3>
                <p className="text-gray-300 mb-6">{product.name}</p>
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                     <div className="p-3 bg-black/20 rounded-lg text-center">
                        <p className="text-gray-300 text-sm">{t('current_stock')}</p>
                        <p className="text-2xl font-bold text-white">{product.stock}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">{t('new_stock_count')}</label>
                        <input type="number" value={newStock} onChange={(e) => setNewStock(parseInt(e.target.value, 10) || 0)} className="w-full bg-white/10 p-2 rounded border border-white/20 text-white text-center text-lg" required autoFocus />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">{t('adjustment_reason')}</label>
                        <select value={reason} onChange={e => setReason(e.target.value)} className="w-full bg-accent-dark p-2 rounded border border-white/20 text-white">
                            <option className="bg-accent-dark text-white" value="stocktake">{t('stocktake')}</option>
                            <option className="bg-accent-dark text-white" value="damaged_goods">{t('damaged_goods')}</option>
                            <option className="bg-accent-dark text-white" value="broken_item">{t('broken_item')}</option>
                            <option className="bg-accent-dark text-white" value="other">{t('other')}</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <NeumorphicButton type="button" onClick={onClose} className="px-4 py-2">{t('cancel')}</NeumorphicButton>
                        <NeumorphicButton type="submit" variant="accent" className="px-4 py-2">{t('save')}</NeumorphicButton>
                    </div>
                </form>
            </GlassCard>
        </div>
    );
};

const StockHistoryModal: React.FC<{ product: Product | null, onClose: () => void }> = ({ product, onClose }) => {
    const { t } = useTranslation();
    if (!product) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="w-full max-w-2xl p-6">
                <h3 className="text-xl font-bold mb-6 text-white">{t('stock_history')} for {product.name}</h3>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {product.stockHistory && product.stockHistory.length > 0 ? (
                       [...product.stockHistory].reverse().map((entry, index) => (
                            <div key={index} className="p-3 bg-black/20 rounded-lg text-sm">
                                <p><span className="font-semibold">{t('date')}:</span> {new Date(entry.date).toLocaleString()}</p>
                                <p><span className="font-semibold">{t('user')}:</span> {entry.user}</p>
                                <p><span className="font-semibold">{t('reason')}:</span> {entry.reason}</p>
                                <p><span className="font-semibold">{t('changes')}:</span> Quantity changed by <span className={entry.change > 0 ? 'text-green-400' : 'text-red-400'}>{entry.change}</span>, new stock is {entry.newStock}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400 text-center">{t('no_history')}</p>
                    )}
                </div>
                <div className="flex justify-end pt-4 mt-4">
                    <NeumorphicButton type="button" onClick={onClose} className="px-4 py-2">{t('cancel')}</NeumorphicButton>
                </div>
            </GlassCard>
        </div>
    );
};

const SummaryCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <GlassCard className="p-6 flex items-center space-x-4 rtl:space-x-reverse">
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
        <div><p className="text-gray-300 text-sm">{title}</p><p className="text-2xl font-bold text-white">{value}</p></div>
    </GlassCard>
);

const Inventory: React.FC = () => {
    const { products, settings, updateProduct, addProduct } = useAppContext();
    const { user: currentUser } = useAuth();
    const { t } = useTranslation();
    const [adjustStockProduct, setAdjustStockProduct] = useState<Product | null>(null);
    const [editProduct, setEditProduct] = useState<Partial<Product> | null>(null);
    const [viewHistoryProduct, setViewHistoryProduct] = useState<Product | null>(null);

    const inventoryStats = useMemo(() => products.reduce((acc, p) => {
        acc.totalCostValue += (p.cost || 0) * p.stock;
        acc.totalRetailValue += p.price * p.stock;
        acc.totalUnits += p.stock;
        if (p.stock <= settings.lowStockThreshold) acc.lowStockCount++;
        return acc;
    }, { totalCostValue: 0, totalRetailValue: 0, lowStockCount: 0, totalUnits: 0 }), [products, settings.lowStockThreshold]);

    const handleSaveStock = (product: Product, newStock: number, reason: string) => {
        if (newStock >= 0 && currentUser) {
            const change = newStock - product.stock;
            const historyEntry = { date: new Date().toISOString(), user: currentUser.username, reason: t(reason), change, newStock };
            const updatedProduct = { ...product, stock: newStock, stockHistory: [...(product.stockHistory || []), historyEntry] };
            updateProduct(updatedProduct);
        }
        setAdjustStockProduct(null);
    };

     const handleSaveProductDetails = (productData: Product | Omit<Product, 'id'>) => {
        if ('id' in productData) {
            updateProduct(productData as Product);
        } else {
            addProduct(productData);
        }
        setEditProduct(null);
    };

    const getStatus = (product: Product) => {
        if (product.stock <= 0) return { text: t('out_of_stock'), color: 'bg-red-500/80 text-white' };
        if (product.stock <= settings.lowStockThreshold) return { text: t('low_stock'), color: 'bg-yellow-500/80 text-black' };
        return { text: t('in_stock'), color: 'bg-green-500/80 text-white' };
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <SummaryCard title={t('total_inventory_value_cost')} value={`${settings.currency}${inventoryStats.totalCostValue.toFixed(2)}`} icon={<DollarSign />} color="bg-blue-500/30"/>
                 <SummaryCard title={t('total_inventory_value_retail')} value={`${settings.currency}${inventoryStats.totalRetailValue.toFixed(2)}`} icon={<DollarSign />} color="bg-green-500/30"/>
                 <SummaryCard title={t('low_stock_products')} value={inventoryStats.lowStockCount.toString()} icon={<AlertTriangle />} color="bg-yellow-500/30"/>
                 <SummaryCard title={t('total_units')} value={inventoryStats.totalUnits.toString()} icon={<Package />} color="bg-purple-500/30"/>
            </div>
            
            <GlassCard className="p-6">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">{t('inventory_management')}</h2>
                    <NeumorphicButton variant="accent" onClick={() => setEditProduct({name: '', price: 0, stock: 0})} className="flex items-center space-x-2 px-4 py-2">
                        <Plus size={20} /><span>{t('add_product')}</span>
                    </NeumorphicButton>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-white">
                        <thead className="border-b-2 border-white/20"><tr>
                            <th className="p-3">{t('product')}</th><th className="p-3">{t('category')}</th><th className="p-3 text-right">{t('price')}</th>
                            <th className="p-3 text-center">{t('current_stock')}</th><th className="p-3 text-right">{t('stock_value_retail')}</th>
                            <th className="p-3 text-center">{t('status')}</th><th className="p-3 text-center">{t('actions')}</th>
                        </tr></thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id} className="border-b border-white/30 hover:bg-white/10">
                                    <td className="p-3"><div className="flex items-center gap-3"><img src={product.image || 'https://picsum.photos/200'} alt={product.name} className="w-12 h-12 object-cover rounded-md" /><span>{product.name}</span></div></td>
                                    <td className="p-3">{product.category}</td>
                                    <td className="p-3 text-right">{settings.currency}{product.price.toFixed(2)}</td>
                                    <td className="p-3 text-center font-bold">{product.stock}</td>
                                    <td className="p-3 text-right">{settings.currency}{(product.price * product.stock).toFixed(2)}</td>
                                    <td className="p-3 text-center"><span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatus(product).color}`}>{getStatus(product).text}</span></td>
                                    <td className="p-3 text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <button onClick={() => setEditProduct(product)} className="text-blue-300 hover:text-blue-100 p-1" title={t('edit_details')}><Edit size={16}/></button>
                                            <button onClick={() => setAdjustStockProduct(product)} className="text-yellow-300 hover:text-yellow-100 p-1" title={t('adjust_stock')}><Package size={16}/></button>
                                            <button onClick={() => setViewHistoryProduct(product)} className="text-gray-300 hover:text-white p-1" title={t('stock_history')}><History size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            <ProductModal product={editProduct} onClose={() => setEditProduct(null)} onSave={handleSaveProductDetails} />
            <StockAdjustmentModal product={adjustStockProduct} onClose={() => setAdjustStockProduct(null)} onSave={handleSaveStock} />
            <StockHistoryModal product={viewHistoryProduct} onClose={() => setViewHistoryProduct(null)} />
        </div>
    );
};

export default Inventory;