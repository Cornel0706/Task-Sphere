import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock } from 'lucide-react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';

// --- COMPONENT LOGIN ---
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); 

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      const response = await axios.post('http://127.0.0.1:8000/token', params);
      
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Email or password is incorrect');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">TaskSphere</h1>
          <p className="text-slate-300">Manage your projects with style</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="email@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
            <LogIn className="size-5" />
            Login
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// --- APP PRINCIPAL COMPONENT ---
function App() {
  return (
    <Router>
      <Routes>
        {/* Login Page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboard - Protected */}
        <Route 
          path="/dashboard" 
          element={
            localStorage.getItem('token') ? <Dashboard /> : <Navigate to="/login" />
          } 
        />

        {/* Any other route redirects to login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;