import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Expense, Sale } from '../types';
import GlassCard from '../components/common/GlassCard';
import NeumorphicButton from '../components/common/NeumorphicButton';
import { useTranslation } from 'react-i18next';
import { DollarSign, TrendingUp, TrendingDown, Plus, Edit, Trash2 } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const expenseCategories = [
    'rent', 'utilities', 'salaries', 'marketing', 'cogs', 
    'shipping', 'maintenance', 'supplies', 'taxes_fees', 'other'
];

const ExpenseModal: React.FC<{
    expense: Partial<Expense> | null;
    onClose: () => void;
    onSave: (expense: Expense | Omit<Expense, 'id'>) => void;
}> = ({ expense, onClose, onSave }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState(() => {
        const defaults = {
            category: 'other',
            description: '',
            amount: 0,
            date: new Date().toISOString().split('T')[0],
        };
        return expense && expense.id
            ? expense
            : { ...defaults, ...expense };
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Expense);
    };

    if (!expense) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="w-full max-w-lg p-6">
                <h3 className="text-xl font-bold mb-6 text-white">{expense.id ? t('edit_expense') : t('add_expense')}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="expense-amount" className="block text-sm font-medium text-gray-300 mb-1">{t('amount')}</label>
                            <input id="expense-amount" name="amount" type="number" step="0.01" value={formData.amount || ''} onChange={handleChange} placeholder={t('amount')} className="w-full bg-white/10 p-2 rounded border border-white/20 text-white" required />
                        </div>
                        <div>
                            <label htmlFor="expense-date" className="block text-sm font-medium text-gray-300 mb-1">{t('date')}</label>
                            <input id="expense-date" name="date" type="date" value={formData.date} onChange={handleChange} className="w-full bg-white/10 p-2 rounded border border-white/20 text-white" required />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="expense-category" className="block text-sm font-medium text-gray-300 mb-1">{t('expense_category')}</label>
                        <select id="expense-category" name="category" value={formData.category} onChange={handleChange} className="w-full bg-accent-dark p-2 rounded border border-white/20 text-white">
                            {expenseCategories.map(cat => <option key={cat} value={cat} className="bg-accent-dark text-white">{t(cat)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="expense-description" className="block text-sm font-medium text-gray-300 mb-1">{t('description')}</label>
                        <input id="expense-description" name="description" value={formData.description} onChange={handleChange} placeholder={t('description')} className="w-full bg-white/10 p-2 rounded border border-white/20 text-white" required />
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

const SummaryCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <GlassCard className="p-6 flex items-center space-x-4 rtl:space-x-reverse">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-gray-300 text-sm">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </GlassCard>
);

const Finance: React.FC = () => {
    const { sales, expenses, settings, addExpense, updateExpense, deleteExpense } = useAppContext();
    const { t } = useTranslation();
    const [editingExpense, setEditingExpense] = useState<Partial<Expense> | null>(null);

    const getSaleProfit = (sale: Sale): number => {
        const totalCost = sale.items.reduce((sum, item) => sum + (item.cost || 0) * item.quantity, 0);
        return sale.finalTotal - totalCost;
    };

    const financialSummary = useMemo(() => {
        const grossProfit = sales.reduce((sum, sale) => sum + getSaleProfit(sale), 0);
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const netProfit = grossProfit - totalExpenses;
        return { grossProfit, totalExpenses, netProfit };
    }, [sales, expenses]);

    const timeSeriesData = useMemo(() => {
        const dataMap: Record<string, { revenue: number; profit: number; expenses: number; }> = {};
        
        sales.forEach(sale => {
            const day = sale.date.split('T')[0];
            dataMap[day] = dataMap[day] || { revenue: 0, profit: 0, expenses: 0 };
            dataMap[day].revenue += sale.finalTotal;
            dataMap[day].profit += getSaleProfit(sale);
        });

        expenses.forEach(expense => {
            const day = expense.date.split('T')[0];
            dataMap[day] = dataMap[day] || { revenue: 0, profit: 0, expenses: 0 };
            dataMap[day].expenses += expense.amount;
        });

        return Object.keys(dataMap).map(day => ({
            name: day,
            [t('revenue')]: dataMap[day].revenue,
            [t('gross_profit')]: dataMap[day].profit,
            [t('total_expenses')]: dataMap[day].expenses,
        })).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime()).slice(-30);
    }, [sales, expenses, t]);

    const expensesByCategory = useMemo(() => {
        const categoryMap: Record<string, number> = {};
        expenses.forEach(expense => {
            const categoryKey = expense.category?.toLowerCase().replace(/\s/g, '_') || 'other';
            const translatedCategory = t(categoryKey, { defaultValue: expense.category });
            categoryMap[translatedCategory] = (categoryMap[translatedCategory] || 0) + expense.amount;
        });
        return Object.keys(categoryMap).map(name => ({ name, value: categoryMap[name] }));
    }, [expenses, t]);

    const handleSaveExpense = (expenseData: Expense | Omit<Expense, 'id'>) => {
        if ('id' in expenseData) {
            updateExpense(expenseData as Expense);
        } else {
            addExpense(expenseData);
        }
        setEditingExpense(null);
    };

    const handleDeleteExpense = (expenseId: string) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            deleteExpense(expenseId);
        }
    };
    
    const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1967', '#19D4FF'];

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">{t('financial_overview')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard title={t('gross_profit')} value={`${settings.currency}${financialSummary.grossProfit.toFixed(2)}`} icon={<TrendingUp />} color="bg-green-500/30" />
                <SummaryCard title={t('total_expenses')} value={`${settings.currency}${financialSummary.totalExpenses.toFixed(2)}`} icon={<TrendingDown />} color="bg-red-500/30" />
                <SummaryCard title={t('net_profit')} value={`${settings.currency}${financialSummary.netProfit.toFixed(2)}`} icon={<DollarSign />} color="bg-blue-500/30" />
            </div>

            <GlassCard className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">{t('revenue_vs_profit_vs_expenses')}</h3>
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <BarChart data={timeSeriesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
                            <YAxis stroke="rgba(255,255,255,0.7)" />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.7)', border: 'none' }} />
                            <Legend wrapperStyle={{ color: 'white' }} />
                            <Bar dataKey={t('revenue')} fill="#4B79A1" />
                            <Bar dataKey={t('gross_profit')} fill="#2ca02c" />
                            <Bar dataKey={t('total_expenses')} fill="#d9534f" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <GlassCard className="lg:col-span-2 p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">{t('expenses_by_category')}</h3>
                    <div style={{ width: '100%', height: 300 }}>
                         <ResponsiveContainer>
                            <PieChart>
                                <Pie data={expensesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                    {expensesByCategory.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.7)', border: 'none' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
                <GlassCard className="lg:col-span-3 p-6">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-white">{t('expense_management')}</h3>
                         <NeumorphicButton variant="accent" onClick={() => setEditingExpense({})} className="flex items-center space-x-2 px-4 py-2">
                            <Plus size={20} />
                            <span>{t('add_expense')}</span>
                        </NeumorphicButton>
                    </div>
                     <div className="overflow-x-auto max-h-[270px]">
                        <table className="w-full text-left text-white">
                            <thead>
                                <tr className="border-b border-white/20">
                                    <th className="p-3">{t('date')}</th>
                                    <th className="p-3">{t('description')}</th>
                                    <th className="p-3">{t('category')}</th>
                                    <th className="p-3 text-right">{t('amount')}</th>
                                    <th className="p-3">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map(expense => (
                                    <tr key={expense.id} className="border-b border-white/30 hover:bg-white/10">
                                        <td className="p-3">{expense.date}</td>
                                        <td className="p-3">{expense.description}</td>
                                        <td className="p-3">{t(expense.category, { defaultValue: expense.category })}</td>
                                        <td className="p-3 text-right">{settings.currency}{expense.amount.toFixed(2)}</td>
                                        <td className="p-3 flex space-x-2 rtl:space-x-reverse">
                                            <button onClick={() => setEditingExpense(expense)} className="text-blue-300 hover:text-blue-100"><Edit size={18}/></button>
                                            <button onClick={() => handleDeleteExpense(expense.id)} className="text-red-400 hover:text-red-200"><Trash2 size={18}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </div>
            {editingExpense && <ExpenseModal expense={editingExpense} onClose={() => setEditingExpense(null)} onSave={handleSaveExpense} />}
        </div>
    );
};

export default Finance;