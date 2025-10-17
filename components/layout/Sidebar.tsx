import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Settings, Warehouse, Landmark, History } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const Sidebar: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation();

    const navItems = [
        { to: '/', icon: <LayoutDashboard size={20} />, label: t('dashboard'), adminOnly: false },
        { to: '/pos', icon: <ShoppingCart size={20} />, label: t('pos'), adminOnly: false },
        { to: '/inventory', icon: <Warehouse size={20} />, label: t('inventory'), adminOnly: true },
        { to: '/finance', icon: <Landmark size={20} />, label: t('finance'), adminOnly: true },
        { to: '/sell-history', icon: <History size={20} />, label: t('sell_history'), adminOnly: true },
        { to: '/settings', icon: <Settings size={20} />, label: t('settings'), adminOnly: false },
    ];

    const activeLinkClass = 'bg-white/30 text-white';
    const inactiveLinkClass = 'text-gray-300 hover:bg-white/20 hover:text-white';

    return (
        <aside className="w-64 p-4 rtl:border-l-2 rtl:border-r-0 ltr:border-r-2 border-white/10">
            <div className="flex flex-col h-full">
                <div className="text-center mb-10">
                    <h1 className="text-2xl font-bold text-white">POS System</h1>
                </div>
                <nav className="flex-1 space-y-2">
                    {navItems.map(item => (
                        (!item.adminOnly || (item.adminOnly && user?.role === 'admin')) && (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg transition-colors duration-200 ${isActive ? activeLinkClass : inactiveLinkClass}`
                                }
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </NavLink>
                        )
                    ))}
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;