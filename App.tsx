import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppContextProvider } from './contexts/AppContext';

import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Settings from './pages/Settings';
import SellHistory from './pages/SellHistory';
import Inventory from './pages/Inventory';
import Finance from './pages/Finance';

const ProtectedRoute: React.FC<{ children: React.ReactNode, adminOnly?: boolean }> = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (adminOnly && user.role !== 'admin') {
     return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/pos" element={<ProtectedRoute><Layout><POS /></Layout></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute adminOnly={true}><Layout><Inventory /></Layout></ProtectedRoute>} />
            <Route path="/finance" element={<ProtectedRoute adminOnly={true}><Layout><Finance /></Layout></ProtectedRoute>} />
            <Route path="/sell-history" element={<ProtectedRoute adminOnly={true}><Layout><SellHistory /></Layout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};


const App: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthProvider>
        <AppContextProvider>
            <HashRouter>
                <AppRoutes/>
            </HashRouter>
        </AppContextProvider>
      </AuthProvider>
    </Suspense>
  );
};

export default App;