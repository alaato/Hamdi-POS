import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import GlassCard from '../components/common/GlassCard';
import NeumorphicButton from '../components/common/NeumorphicButton';
import { exportSalesToPDF, exportSalesToExcel } from '../utils/export';
import { useTranslation } from 'react-i18next';
import { Loader2, Edit, Trash2 } from 'lucide-react';
import { Sale, CartItem } from '../types';

const SaleEditModal: React.FC<{ 
    sale: Sale;
    onClose: () => void; 
    onSave: (originalSale: Sale, updatedSale: Sale) => void; 
}> = ({ sale, onClose, onSave }) => {
    const { t } = useTranslation();
    const { settings } = useAppContext();
    const [editedSale, setEditedSale] = useState<Sale>(() => JSON.parse(JSON.stringify(sale)));

    const recalculateTotals = useCallback((items: CartItem[], discount: number) => {
        const newSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const newFinalTotal = newSubtotal - discount;
        
        setEditedSale(prev => ({
            ...prev,
            total: newSubtotal,
            finalTotal: newFinalTotal,
            items: items,
        }));
    }, []);

    const handleQuantityChange = (productId: string, newQuantityStr: string) => {
        const originalItem = sale.items.find(item => item.id === productId);
        if (!originalItem) return;

        const newQuantity = parseInt(newQuantityStr, 10);

        if (isNaN(newQuantity) || newQuantity < 0 || newQuantity > originalItem.quantity) {
            // Invalid input, maybe show an error, for now, we just ignore
            return;
        }

        const newItems = editedSale.items.map(item =>
            item.id === productId ? { ...item, quantity: newQuantity } : item
        );

        recalculateTotals(newItems, editedSale.discount);
    };

    const handleSave = () => {
        const finalSale = { ...editedSale, items: editedSale.items.filter(item => item.quantity > 0) };
        onSave(sale, finalSale);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="w-full max-w-2xl p-6">
                <h3 className="text-xl font-bold mb-6 text-white">{t('edit_sale')} - {sale.id}</h3>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {sale.items.map(originalItem => {
                        const editedItem = editedSale.items.find(i => i.id === originalItem.id);
                        return (
                            <div key={originalItem.id} className="grid grid-cols-5 gap-4 items-center p-2 bg-black/20 rounded-lg">
                                <div className="col-span-2">
                                    <p className="font-semibold truncate">{originalItem.name}</p>
                                    <p className="text-sm text-gray-400">{settings.currency}{originalItem.price.toFixed(2)}</p>
                                </div>
                                <div className="text-center">{originalItem.quantity}</div>
                                <div>
                                    <input
                                        type="number"
                                        value={editedItem?.quantity ?? 0}
                                        onChange={(e) => handleQuantityChange(originalItem.id, e.target.value)}
                                        min="0"
                                        max={originalItem.quantity}
                                        className="w-full bg-white/10 p-2 rounded border border-white/20 text-white text-center"
                                    />
                                </div>
                                <div className="text-right font-semibold">{settings.currency}{((editedItem?.quantity || 0) * originalItem.price).toFixed(2)}</div>
                            </div>
                        );
                    })}
                </div>
                <div className="border-t border-white/20 mt-4 pt-4 text-sm">
                    <div className="flex justify-between font-bold text-lg text-white mt-2 pt-2">
                        <span>{t('total')}</span>
                        <span>{settings.currency}{editedSale.finalTotal.toFixed(2)}</span>
                    </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4 mt-4">
                    <NeumorphicButton type="button" onClick={onClose} className="px-4 py-2">{t('cancel')}</NeumorphicButton>
                    <NeumorphicButton type="button" onClick={handleSave} variant="accent" className="px-4 py-2">{t('update_sale')}</NeumorphicButton>
                </div>
            </GlassCard>
        </div>
    );
};


const Reports: React.FC = () => {
    const { sales, settings, updateSale } = useAppContext();
    const { t } = useTranslation();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [editingSale, setEditingSale] = useState<Sale | null>(null);

    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            const saleDate = new Date(sale.date);
            if (startDate && saleDate < new Date(startDate)) return false;
            if (endDate) {
                 const end = new Date(endDate);
                 end.setHours(23, 59, 59, 999); // Include the whole end day
                 if (saleDate > end) return false;
            }
            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sales, startDate, endDate]);

    const handleExportPDF = async () => {
        setIsExportingPDF(true);
        try {
            await exportSalesToPDF(filteredSales, settings, { start: startDate, end: endDate });
        } catch (error) {
            console.error("Failed to export PDF:", error);
            alert("Failed to export PDF. Please check the console for more details.");
        } finally {
            setIsExportingPDF(false);
        }
    };
    
    const handleSaveSale = async (originalSale: Sale, updatedSale: Sale) => {
        await updateSale(originalSale, updatedSale);
    };

    const getSaleProfit = (sale: Sale) => {
        const totalCost = sale.items.reduce((sum, item) => sum + (item.cost || 0) * item.quantity, 0);
        return sale.finalTotal - totalCost;
    };


    return (
        <GlassCard className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">{t('sales_reports')}</h2>
            
            <div className="flex flex-wrap gap-4 items-center mb-6 p-4 bg-black/20 rounded-lg">
                <div className="flex-1 min-w-[200px]">
                    <label className="text-sm text-gray-300">{t('start_date')}</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white/10 p-2 rounded border border-white/20 text-white mt-1" />
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="text-sm text-gray-300">{t('end_date')}</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white/10 p-2 rounded border border-white/20 text-white mt-1" />
                </div>
                <div className="flex items-end space-x-2">
                     <NeumorphicButton 
                        onClick={handleExportPDF} 
                        disabled={isExportingPDF}
                        variant="accent" 
                        className="px-4 py-2 flex items-center justify-center w-36"
                     >
                        {isExportingPDF ? (
                            <>
                                <Loader2 className="animate-spin mr-2 rtl:ml-2 rtl:mr-0" size={16} />
                                {t('exporting')}...
                            </>
                        ) : (
                            t('export_pdf')
                        )}
                     </NeumorphicButton>
                     <NeumorphicButton onClick={() => exportSalesToExcel(filteredSales, settings)} variant="accent" className="px-4 py-2">{t('export_excel')}</NeumorphicButton>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-white">
                    <thead>
                        <tr className="border-b border-white/20">
                            <th className="p-3">{t('sale_id')}</th>
                            <th className="p-3">{t('date')}</th>
                            <th className="p-3">{t('user')}</th>
                            <th className="p-3">{t('items_count')}</th>
                            <th className="p-3">{t('total')}</th>
                            <th className="p-3">{t('profit')}</th>
                            <th className="p-3">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSales.map(sale => (
                            <tr key={sale.id} className="border-b border-white/30 hover:bg-white/10">
                                <td className="p-3 font-mono text-sm">{sale.id.substring(0, 18)}...</td>
                                <td className="p-3">{new Date(sale.date).toLocaleString()}</td>
                                <td className="p-3">{sale.user}</td>
                                <td className="p-3 text-center">{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                                <td className="p-3">{settings.currency}{sale.finalTotal.toFixed(2)}</td>
                                <td className="p-3">{settings.currency}{getSaleProfit(sale).toFixed(2)}</td>
                                <td className="p-3">
                                    <button onClick={() => setEditingSale(sale)} className="text-blue-300 hover:text-blue-100 p-1">
                                        <Edit size={18}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {editingSale && <SaleEditModal sale={editingSale} onClose={() => setEditingSale(null)} onSave={handleSaveSale} />}
        </GlassCard>
    );
};

export default Reports;