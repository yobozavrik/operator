'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [particles, setParticles] = useState<any[]>([]);

    useEffect(() => {
        setParticles([...Array(20)].map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            duration: 3 + Math.random() * 2,
            delay: Math.random() * 2,
        })));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError('Невірний email або пароль');
                setLoading(false);
                return;
            }

            // Successful login
            router.refresh();
            router.replace('/');
        } catch (err) {
            setError('Сталася помилка при вході');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, #05080f 0%, #0F172A 50%, #05080f 100%)', // Darker background
            }}>

            {/* Animated background particles - Reduced Visibility */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {particles.map((particle) => (
                    <motion.div
                        key={particle.id}
                        className="absolute w-1 h-1 bg-[#00D4FF]/20 rounded-full" // Reduced opacity
                        style={{
                            left: particle.left,
                            top: particle.top,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0.1, 0.4, 0.1], // Fainter animation
                        }}
                        transition={{
                            duration: particle.duration,
                            repeat: Infinity,
                            delay: particle.delay,
                        }}
                    />
                ))}
            </div>

            {/* Glow effect behind card - Reduced */}
            <div className="absolute w-[500px] h-[500px] rounded-full opacity-10"
                style={{
                    background: 'radial-gradient(circle, #00D4FF 0%, transparent 60%)',
                    filter: 'blur(120px)',
                }}
            />

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                <div
                    className="rounded-3xl p-8 border"
                    style={{
                        background: 'rgba(15, 23, 42, 0.95)', // More solid background
                        backdropFilter: 'blur(40px)',
                        WebkitBackdropFilter: 'blur(40px)',
                        borderColor: 'rgba(255, 255, 255, 0.15)', // Sharper border
                        boxShadow: '0 40px 80px -20px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    }}
                >
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, #0088FF 0%, #00D4FF 100%)',
                                boxShadow: '0 8px 32px rgba(0, 212, 255, 0.3)',
                            }}>
                            <span className="text-2xl font-black text-white">Г</span>
                        </div>
                        <h1 className="text-xl font-bold text-white tracking-tight uppercase">Аналітична система Галя</h1>
                        <p className="text-sm text-slate-400 mt-1">Production Hub</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Field */}
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#00D4FF] transition-colors" />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-xl text-white placeholder-slate-500 transition-all duration-300 focus:outline-none"
                                style={{
                                    background: 'rgba(0, 0, 0, 0.3)', // Darker input bg
                                    border: '1px solid rgba(255, 255, 255, 0.2)', // Sharper border
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#00D4FF';
                                    e.target.style.background = 'rgba(0, 0, 0, 0.5)';
                                    e.target.style.boxShadow = '0 0 0 4px rgba(0, 212, 255, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                    e.target.style.background = 'rgba(0, 0, 0, 0.3)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        {/* Password Field */}
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#00D4FF] transition-colors" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-12 py-4 rounded-xl text-white placeholder-slate-500 transition-all duration-300 focus:outline-none"
                                style={{
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#00D4FF';
                                    e.target.style.background = 'rgba(0, 0, 0, 0.5)';
                                    e.target.style.boxShadow = '0 0 0 4px rgba(0, 212, 255, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                    e.target.style.background = 'rgba(0, 0, 0, 0.3)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 text-[#FF4D4D] text-sm bg-[#FF4D4D]/10 px-4 py-3 rounded-xl border border-[#FF4D4D]/20"
                            >
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 rounded-xl font-bold text-white transition-all duration-300 disabled:opacity-50 mt-2"
                            style={{
                                background: 'linear-gradient(135deg, #0088FF 0%, #00D4FF 100%)',
                                boxShadow: '0 8px 32px rgba(0, 136, 255, 0.3)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <motion.div
                                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    />
                                    Вход...
                                </span>
                            ) : (
                                'Увійти в систему'
                            )}
                        </motion.button>
                    </form>

                    {/* Forgot Password Link */}
                    <div className="text-center mt-6">
                        <button className="text-sm text-slate-400 hover:text-[#00D4FF] transition-colors">
                            Забули пароль?
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-500 mt-6">
                    © 2026 Аналітична система Галя. All rights reserved.
                </p>
            </motion.div>
        </div>
    );
}
