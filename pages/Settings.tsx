import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import NeumorphicButton from '../components/common/NeumorphicButton';
import { useAppContext } from '../contexts/AppContext';
import { useTranslation } from 'react-i18next';
import { StoredUser } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Save } from 'lucide-react';

const UserEditorRow: React.FC<{userAccount: StoredUser}> = ({ userAccount }) => {
    const { t } = useTranslation();
    const { updateUser } = useAppContext();

    const [username, setUsername] = useState(userAccount.username);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSaveUser = () => {
        if (!username.trim()) {
            alert("Username cannot be empty.");
            return;
        }

        const updates: Partial<Pick<StoredUser, 'username' | 'password'>> = { username };
        if (password) {
            updates.password = password;
        }
        updateUser(userAccount.id, updates);
        setPassword('');
        alert(t('user_updated_success'));
    };

    return (
        <div className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-black/20 rounded-lg">
            <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full sm:w-auto flex-1 bg-white/10 p-2 rounded border border-white/20 text-white"
                placeholder={t('username')}
                aria-label="Username"
            />
            <div className="relative w-full sm:w-auto flex-1">
                 <input 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/10 p-2 rounded border border-white/20 text-white pr-10"
                    placeholder={t('new_password_placeholder')}
                    aria-label="New password"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-300 hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
            <NeumorphicButton onClick={handleSaveUser} variant="accent" className="px-3 py-2 flex items-center gap-2 w-full sm:w-auto justify-center">
                <Save size={16} /> <span>{t('update')}</span>
            </NeumorphicButton>
        </div>
    );
}


const Settings: React.FC = () => {
    const { settings, updateSettings, users } = useAppContext();
    const { user: currentUser } = useAuth();
    const { t } = useTranslation();
    const [localSettings, setLocalSettings] = useState(settings);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleSave = () => {
        updateSettings(localSettings);
        alert(t('settings_saved'));
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setLocalSettings(prev => ({ ...prev, [name]: checked }));
        } else {
             setLocalSettings(prev => ({...prev, [name]: ['lowStockThreshold'].includes(name) ? parseFloat(value) : value }));
        }
    }

    return (
        <div className="space-y-8">
            <GlassCard className="p-6 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-white mb-6">{t('settings')}</h2>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">{t('currency_symbol')}</label>
                        <input
                            type="text"
                            name="currency"
                            value={localSettings.currency}
                            onChange={handleChange}
                            className="w-full bg-white/10 p-2 rounded border border-white/20 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">{t('low_stock_threshold')}</label>
                        <input
                            type="number"
                            name="lowStockThreshold"
                            value={localSettings.lowStockThreshold}
                            onChange={handleChange}
                            className="w-full bg-white/10 p-2 rounded border border-white/20 text-white"
                        />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        <label className="block text-sm font-medium text-gray-300">{t('sound_effects')}</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                name="soundEffectsEnabled"
                                checked={localSettings.soundEffectsEnabled} 
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-500 rounded-full peer peer-focus:ring-4 peer-focus:ring-accent/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] rtl:after:right-[2px] rtl:after:left-auto after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                        </label>
                    </div>
                    <div className="pt-4">
                        <NeumorphicButton variant="accent" onClick={handleSave} className="px-6 py-2">
                            {t('save_settings')}
                        </NeumorphicButton>
                    </div>
                </div>
            </GlassCard>

            {currentUser?.role === 'admin' && (
                <GlassCard className="p-6 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-white mb-6">{t('user_management')}</h2>
                <div className="space-y-3">
                    {users.map(u => <UserEditorRow key={u.id} userAccount={u} />)}
                </div>
                </GlassCard>
            )}
        </div>
    );
};

export default Settings;