import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Sun, Moon, LogOut, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlassCard from '../common/GlassCard';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { i18n } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = i18n.dir();
  };
  
  const currentLanguage = i18n.language;

  return (
    <header className="p-4">
      <GlassCard className="flex items-center justify-between p-4">
        <div>
          <h1 className="text-xl font-bold text-white">
            {i18n.t('welcome')}, {user?.username}
          </h1>
          <div className="flex items-center divide-x divide-gray-400 rtl:divide-x-reverse space-x-2 rtl:space-x-reverse mt-1">
             <p className="text-sm text-gray-300 pr-2 rtl:pl-2 rtl:pr-0">{user?.role}</p>
             <p className="text-sm text-gray-300 font-mono pl-2 rtl:pr-2 rtl:pl-0">
                {currentTime.toLocaleTimeString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
             </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-black/20 rounded-full p-1">
            <button 
              onClick={() => changeLanguage('en')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${currentLanguage === 'en' ? 'bg-accent' : ''}`}
            >
              EN
            </button>
            <button 
              onClick={() => changeLanguage('ar')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${currentLanguage === 'ar' ? 'bg-accent' : ''}`}
            >
              AR
            </button>
          </div>

          <button onClick={logout} className="p-2 rounded-full bg-red-500/50 hover:bg-red-500/80 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </GlassCard>
    </header>
  );
};

export default Header;