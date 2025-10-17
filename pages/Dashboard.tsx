import React from 'react';
import GlassCard from '../components/common/GlassCard';
import { useAppContext } from '../contexts/AppContext';
import { DollarSign, Package, Warehouse, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { Product, Sale } from '../types';

const Dashboard: React.FC = () => {
    const { sales, products, settings } = useAppContext();
    const { t } = useTranslation();

    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);

    const getSaleProfit = (sale: Sale): number => {
        const totalCost = sale.items.reduce((sum, item) => sum + (item.cost || 0) * item.quantity, 0);
        return sale.finalTotal - totalCost;
    };

    const dailySales = sales.filter(sale => sale.date.startsWith(today));
    const monthlySales = sales.filter(sale => sale.date.startsWith(thisMonth));

    const dailyRevenue = dailySales.reduce((sum, sale) => sum + sale.finalTotal, 0);
    const dailyProfit = dailySales.reduce((sum, sale) => sum + getSaleProfit(sale), 0);

    const monthlyRevenue = monthlySales.reduce((sum, sale) => sum + sale.finalTotal, 0);
    const monthlyProfit = monthlySales.reduce((sum, sale) => sum + getSaleProfit(sale), 0);

    const totalStockValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);

    // Top selling product (daily)
    const dailyProductSales: Record<string, number> = {};
    dailySales.forEach(sale => {
        sale.items.forEach(item => {
            dailyProductSales[item.id] = (dailyProductSales[item.id] || 0) + item.quantity;
        });
    });
    const topDailyProductId = Object.keys(dailyProductSales).reduce((a, b) => dailyProductSales[a] > dailyProductSales[b] ? a : b, '');
    const topDailyProduct = products.find(p => p.id === topDailyProductId);
    const topDailyProductCount = topDailyProductId ? dailyProductSales[topDailyProductId] : 0;

    // Top selling product (monthly)
    const monthlyProductSales: Record<string, number> = {};
    monthlySales.forEach(sale => {
        sale.items.forEach(item => {
            monthlyProductSales[item.id] = (monthlyProductSales[item.id] || 0) + item.quantity;
        });
    });
    const topMonthlyProductId = Object.keys(monthlyProductSales).reduce((a, b) => monthlyProductSales[a] > monthlyProductSales[b] ? a : b, '');
    const topMonthlyProduct = products.find(p => p.id === topMonthlyProductId);
    const topMonthlyProductCount = topMonthlyProductId ? monthlyProductSales[topMonthlyProductId] : 0;


    const salesByDay = sales.reduce((acc, sale) => {
        const day = sale.date.split('T')[0];
        acc[day] = acc[day] || { revenue: 0, profit: 0 };
        acc[day].revenue += sale.finalTotal;
        acc[day].profit += getSaleProfit(sale);
        return acc;
    }, {} as Record<string, { revenue: number; profit: number; }>);

    const chartData = Object.keys(salesByDay).map(day => ({
        name: day,
        [t('revenue')]: salesByDay[day].revenue,
        [t('profit')]: salesByDay[day].profit,
    })).slice(-30); // Last 30 days

    const SummaryCard = ({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) => (
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

    const TopProductCard = ({ title, product, count }: { title: string, product?: Product, count: number }) => (
        <GlassCard className="p-4 flex flex-col justify-between min-h-[110px]">
            <p className="text-gray-300 text-sm mb-2">{title}</p>
            {product && count > 0 ? (
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <img src={product.image || 'https://picsum.photos/200'} alt={product.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate" title={product.name}>{product.name}</p>
                        <p className="text-gray-300 text-sm">{`${count} ${t('sold')}`}</p>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">{t('no_sales_yet')}</p>
                </div>
            )}
        </GlassCard>
    );

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard 
                    title={t('daily_revenue')} 
                    value={`${settings.currency}${dailyRevenue.toFixed(2)}`} 
                    icon={<DollarSign />} 
                    color="bg-blue-500/30"
                />
                 <SummaryCard 
                    title={t('daily_profit')} 
                    value={`${settings.currency}${dailyProfit.toFixed(2)}`} 
                    icon={<TrendingUp />} 
                    color="bg-green-500/30"
                />
                <SummaryCard 
                    title={t('monthly_revenue')} 
                    value={`${settings.currency}${monthlyRevenue.toFixed(2)}`} 
                    icon={<DollarSign />}
                    color="bg-blue-500/30"
                />
                 <SummaryCard 
                    title={t('monthly_profit')} 
                    value={`${settings.currency}${monthlyProfit.toFixed(2)}`} 
                    icon={<TrendingUp />}
                    color="bg-green-500/30"
                />
                 <SummaryCard 
                    title={t('total_stock_value')} 
                    value={`${settings.currency}${totalStockValue.toFixed(2)}`} 
                    icon={<Warehouse />} 
                    color="bg-purple-500/30"
                />
                 <SummaryCard 
                    title={t('total_products')} 
                    value={products.length.toString()} 
                    icon={<Package />} 
                    color="bg-yellow-500/30"
                />
                <TopProductCard 
                    title={t('top_selling_product_daily')}
                    product={topDailyProduct}
                    count={topDailyProductCount}
                />
                <TopProductCard 
                    title={t('top_selling_product_monthly')}
                    product={topMonthlyProduct}
                    count={topMonthlyProductCount}
                />
            </div>
            
            <GlassCard className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">{t('sales_overview')}</h3>
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
                            <YAxis stroke="rgba(255,255,255,0.7)" />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.7)', border: 'none' }}/>
                            <Legend wrapperStyle={{ color: 'white' }}/>
                            <Bar dataKey={t('revenue')} fill="#4B79A1" />
                            <Bar dataKey={t('profit')} fill="#2ca02c" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>
        </div>
    );
};

export default Dashboard;