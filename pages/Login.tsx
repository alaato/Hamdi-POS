import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/common/GlassCard';
import NeumorphicButton from '../components/common/NeumorphicButton';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Lock, ShoppingCart } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(username, password);
    if (success) {
      navigate('/');
    } else {
      setError('Invalid username or password');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full"
      >
        <GlassCard className="w-full max-w-4xl mx-auto p-8 md:p-12 grid md:grid-cols-2 gap-12 items-center">
          {/* Left Panel: Branding */}
          <motion.div variants={itemVariants} className="hidden md:flex flex-col items-center text-center">
            <ShoppingCart size={80} className="text-white/80 mb-6" />
            <h1 className="text-4xl font-bold text-white mb-2">POS Glass</h1>
            <p className="text-gray-300">Modern Point of Sale. Simplified.</p>
          </motion.div>

          {/* Right Panel: Login Form */}
          <div className="flex flex-col">
            <motion.h2 variants={itemVariants} className="text-3xl font-bold text-center text-white mb-8">
              Welcome Back
            </motion.h2>
            <form onSubmit={handleLogin} className="space-y-6">
              <motion.div variants={itemVariants}>
                <label className="text-sm font-medium text-gray-200">Username</label>
                <div className="relative mt-1">
                  <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3 pl-10 bg-white/20 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-accent text-white"
                    placeholder="admin"
                  />
                </div>
              </motion.div>
              <motion.div variants={itemVariants}>
                <label className="text-sm font-medium text-gray-200">Password</label>
                <div className="relative mt-1">
                  <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 pl-10 pr-10 bg-white/20 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-accent text-white"
                    placeholder="password"
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
              </motion.div>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <motion.div variants={itemVariants}>
                <NeumorphicButton
                  type="submit"
                  variant="accent"
                  className="w-full py-3 text-lg"
                >
                  Login
                </NeumorphicButton>
              </motion.div>
            </form>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default Login;
