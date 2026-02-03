'use client';

import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { auditLog } from '@/lib/logger';

import { useStore } from '@/context/StoreContext';

const STORES_MENU = [
    { label: 'Усі', icon: '🌍' },
    { label: 'Магазин "Садгора"', icon: '🏪' },
    { label: 'Магазин "Компас"', icon: '🏙️' },
    { label: 'Магазин "Руська"', icon: '🏛️' },
    { label: 'Магазин "Хотинська"', icon: '🛣️' },
    { label: 'Магазин "Білоруська"', icon: '🌳' },
    { label: 'Магазин "Кварц"', icon: '⚛️' },
];

const storeGradients = [
    { gradient: 'linear-gradient(135deg, #00BCF2 0%, #0099FF 100%)', glow: '#00D4FF' },  // Azure - ярче
    { gradient: 'linear-gradient(135deg, #2E7CFF 0%, #1E5FCC 100%)', glow: '#4A90FF' },  // Sapphire - ярче
    { gradient: 'linear-gradient(135deg, #52E8FF 0%, #00D4FF 100%)', glow: '#7FFFD4' },  // Electric - ярче
    { gradient: 'linear-gradient(135deg, #00BCF2 0%, #0099DD 100%)', glow: '#00D4FF' },  // Cerulean - ярче
    { gradient: 'linear-gradient(135deg, #0066FF 0%, #0044BB 100%)', glow: '#0088FF' },  // Navy - ярче
    { gradient: 'linear-gradient(135deg, #A0FFFF 0%, #7FECEC 100%)', glow: '#CAFFFF' },  // Celeste - ярче
    { gradient: 'linear-gradient(135deg, #00BCF2 0%, #0099FF 100%)', glow: '#00D4FF' },  // Fallback
];

export const Sidebar = () => {
    const { selectedStore, setSelectedStore } = useStore();
    const [hoveredStore, setHoveredStore] = useState<number | null>(null);

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 border-r border-[var(--border)] bg-[#0a0e27] h-screen sticky top-0 flex-col py-6 relative overflow-hidden">

                {/* Optional: Subtle Wave Gradient/Glow to mimic the reference image vibe */}
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#4A7FA7]/10 to-transparent pointer-events-none" />

                <div className="px-6 mb-8 z-10">
                    <div className="flex items-center gap-3 text-[var(--foreground)]">
                        <div className="w-8 h-8 rounded-lg bg-[var(--status-reserve)]/80 flex items-center justify-center font-black text-sm text-[#0A1931] shadow-lg shadow-blue-900/50">G</div>
                        <span className="font-bold text-lg tracking-tight uppercase text-[var(--foreground)]">Graviton</span>
                    </div>
                </div>

                <div className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar z-10">
                    <p className="px-2 text-[11px] font-semibold text-[#00D4FF] uppercase tracking-widest mb-4 mt-4">Магазини</p>
                    {STORES_MENU.map((item, i) => {
                        const isActive = selectedStore === item.label;
                        const isHovered = hoveredStore === i;

                        return (
                            <button
                                key={i}
                                onClick={() => {
                                    setSelectedStore(item.label);
                                    auditLog('CHANGE_STORE', 'Sidebar', { store: item.label });
                                }}
                                onMouseEnter={() => setHoveredStore(i)}
                                onMouseLeave={() => setHoveredStore(null)}
                                className={cn(
                                    "w-full px-4 py-3.5 text-left rounded-xl transition-all duration-300 relative overflow-hidden group",
                                    isActive && "scale-[1.02]"
                                )}
                                style={{
                                    background: isActive
                                        ? 'rgba(0, 212, 255, 0.1)'
                                        : 'rgba(20, 27, 45, 0.7)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    border: isActive
                                        ? '1px solid rgba(0, 212, 255, 0.5)'
                                        : isHovered
                                            ? '1px solid rgba(0, 212, 255, 0.3)'
                                            : '1px solid rgba(255, 255, 255, 0.08)',
                                    boxShadow: isActive
                                        ? '0 0 30px rgba(0, 212, 255, 0.3), 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                                        : isHovered
                                            ? '0 0 20px rgba(0, 212, 255, 0.15), 0 8px 24px rgba(0, 0, 0, 0.3)'
                                            : '0 4px 16px rgba(0, 0, 0, 0.2)',
                                }}
                            >
                                {/* Shimmer effect on hover */}
                                <div
                                    className={cn(
                                        "absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full transition-transform duration-700",
                                        isHovered && "translate-x-full"
                                    )}
                                />

                                {/* Active glow indicator */}
                                {isActive && (
                                    <div
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                                        style={{
                                            background: 'linear-gradient(180deg, #00D4FF 0%, #0088FF 100%)',
                                            boxShadow: '0 0 12px rgba(0, 212, 255, 0.8)',
                                        }}
                                    />
                                )}

                                <div className="flex items-center gap-3 relative z-10">
                                    <span className="text-lg">{item.icon}</span>
                                    <span
                                        className={cn(
                                            "text-[12px] font-semibold uppercase tracking-wide transition-all duration-300",
                                            isActive
                                                ? "text-[#00D4FF]"
                                                : isHovered
                                                    ? "text-white"
                                                    : "text-gray-400"
                                        )}
                                    >
                                        {item.label}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>


                <div className="px-4 mt-6 pt-4 border-t border-[var(--border)] z-10">
                    <button
                        onClick={async () => {
                            await auditLog('LOGOUT', 'Sidebar', { timestamp: new Date().toISOString() });
                            // Clear auth cookie and redirect to login
                            document.cookie = 'auth-token=; Max-Age=0; path=/';
                            window.location.href = '/login';
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-[var(--panel)]/50 text-xs font-semibold uppercase transition-colors"
                    >
                        <LogOut size={16} />
                        Вихід
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--background)]/95 backdrop-blur-xl border-t border-[var(--border)] flex items-center justify-around px-2 z-50">
                {STORES_MENU.slice(0, 5).map((item, i) => (
                    <button
                        key={i}
                        onClick={() => setSelectedStore(item.label)}
                        className={cn(
                            "flex flex-col items-center gap-1",
                            selectedStore === item.label ? "text-[var(--status-normal)]" : "text-[var(--text-muted)]"
                        )}
                    >
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
                    </button>
                ))}
            </div>
        </>
    );
};

import { StoreProvider } from '@/context/StoreContext';

// Particle component for background animation
const ParticleGrid = () => {
    const particles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 4}s`,
        duration: `${3 + Math.random() * 3}s`,
    }));

    return (
        <div className="particle-grid">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="particle"
                    style={{
                        left: p.left,
                        top: p.top,
                        animationDelay: p.delay,
                        animationDuration: p.duration,
                    }}
                />
            ))}
        </div>
    );
};

export const DashboardLayout = ({
    children,
    currentWeight,
    maxWeight,
    fullHeight = false
}: {
    children: React.ReactNode,
    currentWeight: number,
    maxWeight: number,
    fullHeight?: boolean
}) => {
    return (
        <StoreProvider>
            <div className="flex h-screen premium-bg text-[var(--foreground)] font-sans antialiased overflow-hidden relative">
                {/* Animated particles background */}
                <ParticleGrid />

                {/* Ambient glow effects */}
                <div
                    className="fixed top-0 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none z-0"
                    style={{
                        background: 'radial-gradient(circle, rgba(0, 212, 255, 0.08) 0%, transparent 70%)',
                        filter: 'blur(80px)',
                    }}
                />
                <div
                    className="fixed bottom-0 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
                    style={{
                        background: 'radial-gradient(circle, rgba(0, 136, 255, 0.06) 0%, transparent 70%)',
                        filter: 'blur(100px)',
                    }}
                />

                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">
                    <main className={cn(
                        "flex-1 flex flex-col min-h-0",
                        !fullHeight && "overflow-y-auto p-4 md:p-6 lg:p-8"
                    )}>
                        {children}
                    </main>
                </div>
            </div>
        </StoreProvider>
    );
};

