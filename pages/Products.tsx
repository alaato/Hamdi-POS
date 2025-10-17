import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Product } from '../types';
import GlassCard from '../components/common/GlassCard';
import NeumorphicButton from '../components/common/NeumorphicButton';
import { Plus, Edit, Trash2, AlertTriangle, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ProductModal: React.FC<{ product: Partial<Product> | null, onClose: () => void, onSave: (product: Product | Omit<Product, 'id'>) => void }> = ({ product, onClose, onSave }) => {
    const [formData, setFormData] = useState(product || { name: '', price: 0, stock: 0, category: '', barcode: '', image: '', cost: 0 });
    const { t } = useTranslation();

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
                <h3 className="text-xl font-bold mb-6 text-white">{product.id ? t('edit_product') : t('add_product')}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="product-name" className="block text-sm font-medium text-gray-300 mb-1">{t('product_name')}</label>
                        <input id="product-name" name="name" value={formData.name} onChange={handleChange} placeholder={t('product_name')} className="w-full bg-white/10 p-2 rounded border border-white/20 text-white" required/>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="product-price" className="block text-sm font-medium text-gray-300 mb-1">{t('price')}</label>
                            <input id="product-price" name="price" type="number" step="0.01" value={formData.price || ''} onChange={handleChange} placeholder={t('price')} className="w-full bg-white/10 p-2 rounded border border-white/20 text-white" required/>
                        </div>
                        <div>
                            <label htmlFor="product-cost" className="block text-sm font-medium text-gray-300 mb-1">{t('cost_price')}</label>
                            <input id="product-cost" name="cost" type="number" step="0.01" value={formData.cost || ''} onChange={handleChange} placeholder={t('cost_price')} className="w-full bg-white/10 p-2 rounded border border-white/20 text-white"/>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="product-stock" className="block text-sm font-medium text-gray-300 mb-1">{t('stock')}</label>
                            <input id="product-stock" name="stock" type="number" value={formData.stock || ''} onChange={handleChange} placeholder={t('stock')} className="w-full bg-white/10 p-2 rounded border border-white/20 text-white" required/>
                        </div>
                        <div>
                            <label htmlFor="product-category" className="block text-sm font-medium text-gray-300 mb-1">{t('category')}</label>
                            <input id="product-category" name="category" value={formData.category} onChange={handleChange} placeholder={t('category')} className="w-full bg-white/10 p-2 rounded border border-white/20 text-white"/>
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="product-barcode" className="block text-sm font-medium text-gray-300 mb-1">{t('barcode')}</label>
                        <input id="product-barcode" name="barcode" value={formData.barcode} onChange={handleChange} placeholder={t('barcode')} className="w-full bg-white/10 p-2 rounded border border-white/20 text-white"/>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('product_image')}</label>
                        <div className="flex items-center gap-4">
                            <img 
                                src={formData.image || `https://via.placeholder.com/150/283E51/FFFFFF?text=No+Image`} 
                                alt="Product preview" 
                                className="w-24 h-24 object-cover rounded-lg bg-black/20 flex-shrink-0"
                            />
                            <label htmlFor="image-upload" className="flex-grow cursor-pointer bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-dark transition-colors text-center flex items-center justify-center gap-2">
                                <Upload size={18} />
                                {t('change_image')}
                            </label>
                            <input id="image-upload" name="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden"/>
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
}

const Products: React.FC = () => {
    const { products, addProduct, updateProduct, deleteProduct, settings } = useAppContext();
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const { t } = useTranslation();
    
    const handleSave = (productData: Product | Omit<Product, 'id'>) => {
        if ('id' in productData) {
            updateProduct(productData as Product);
        } else {
            addProduct(productData);
        }
        setEditingProduct(null);
    };

    return (
        <GlassCard className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">{t('product_management')}</h2>
                <NeumorphicButton variant="accent" onClick={() => setEditingProduct({})} className="flex items-center space-x-2 px-4 py-2">
                    <Plus size={20} />
                    <span>{t('add_product')}</span>
                </NeumorphicButton>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-white">
                    <thead>
                        <tr className="border-b border-white/20">
                            <th className="p-3">{t('product_name')}</th>
                            <th className="p-3">{t('category')}</th>
                            <th className="p-3">{t('price')}</th>
                            <th className="p-3">{t('cost_price')}</th>
                            <th className="p-3">{t('stock')}</th>
                            <th className="p-3">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => {
                            const isLowStock = product.stock <= settings.lowStockThreshold;
                            return (
                                <tr key={product.id} className={`border-b border-white/30 hover:bg-white/10 ${isLowStock ? 'bg-red-500/10' : ''}`}>
                                    <td className="p-3">{product.name}</td>
                                    <td className="p-3">{product.category}</td>
                                    <td className="p-3">{settings.currency}{product.price.toFixed(2)}</td>
                                    <td className="p-3">{settings.currency}{(product.cost || 0).toFixed(2)}</td>
                                    <td className="p-3">
                                        <div className={`flex items-center space-x-2 rtl:space-x-reverse ${isLowStock ? 'text-red-400 font-semibold' : ''}`}>
                                            <span>{product.stock}</span>
                                            {isLowStock && <span title={t('low_stock')}><AlertTriangle size={16} /></span>}
                                        </div>
                                    </td>
                                    <td className="p-3 flex space-x-2 rtl:space-x-reverse">
                                        <button onClick={() => setEditingProduct(product)} className="text-blue-300 hover:text-blue-100"><Edit size={18}/></button>
                                        <button onClick={() => window.confirm(t('confirm_delete')) && deleteProduct(product.id)} className="text-red-400 hover:text-red-200"><Trash2 size={18}/></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {editingProduct && <ProductModal product={editingProduct} onClose={() => setEditingProduct(null)} onSave={handleSave} />}
        </GlassCard>
    );
};

export default Products;