'use client';

import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

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

                <div className="flex-1 px-4 space-y-0.5 overflow-y-auto custom-scrollbar z-10">
                    <p className="px-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3 mt-4 opacity-80">Магазини</p>
                    {STORES_MENU.map((item, i) => {
                        const isActive = selectedStore === item.label;
                        const isHovered = hoveredStore === i;
                        const gradientConfig = storeGradients[i] || storeGradients[0];

                        return (
                            <button
                                key={i}
                                onClick={() => setSelectedStore(item.label)}
                                onMouseEnter={() => setHoveredStore(i)}
                                onMouseLeave={() => setHoveredStore(null)}
                                className={cn(
                                    "w-[calc(100%-16px)] px-5 py-4 mx-2 mb-3 text-left rounded-xl transition-all duration-300 relative overflow-hidden group",
                                    isActive ? "translate-x-[4px]" : "hover:translate-x-[2px]"
                                )}
                                style={{
                                    background: 'rgba(37, 45, 69, 0.6)',
                                    backdropFilter: 'blur(10px)',
                                    WebkitBackdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    boxShadow: (isActive || isHovered)
                                        ? `0 8px 24px rgba(0, 0, 0, 0.6), 0 0 20px ${gradientConfig.glow}40`
                                        : '0 4px 12px rgba(0, 0, 0, 0.4)',
                                    opacity: isActive || isHovered ? 1 : 0.7
                                }}
                            >
                                <div
                                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl z-20"
                                    style={{
                                        background: gradientConfig.gradient
                                    }}
                                />
                                <div
                                    className={cn(
                                        "text-[11px] font-semibold uppercase tracking-wide transition-colors relative z-10",
                                        isActive || isHovered ? "text-[#E6EDF3]" : "text-[var(--text-muted)]"
                                    )}
                                >
                                    {item.label}
                                </div>

                                {/* Background glow for active state */}
                                {isActive && (
                                    <div
                                        className="absolute inset-0 opacity-10"
                                        style={{ background: gradientConfig.gradient }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="px-4 mt-6 pt-4 border-t border-[var(--border)] z-10">
                    <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-[var(--panel)]/50 text-xs font-semibold uppercase transition-colors">
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
            <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)] font-sans antialiased overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0 h-full">
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
