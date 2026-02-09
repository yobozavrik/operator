'use client';

import React, { useState, useEffect } from 'react';
import { LogOut, Factory, Truck, Users, ClipboardList, LayoutDashboard, BarChart3 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { auditLog } from '@/lib/logger';

import { useStore } from '@/context/StoreContext';

const STORES_MENU = [
    { label: 'Усі', slug: 'all' },
    { label: 'Магазин "Садгора"', slug: 'sadova' },
    { label: 'Магазин "Компас"', slug: 'kompas' },
    { label: 'Магазин "Руська"', slug: 'ruska' },
    { label: 'Магазин "Хотинська"', slug: 'hotynska' },
    { label: 'Магазин "Білоруська"', slug: 'biloruska' },
    { label: 'Магазин "Кварц"', slug: 'kvarc' },
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
    const pathname = usePathname();
    const router = useRouter();

    const isPizzaMode = pathname?.startsWith('/pizza');

    const PIZZA_MENU = [
        { label: 'Дашборд', icon: LayoutDashboard, path: '/pizza' },
        { label: 'Аналітика', icon: BarChart3, path: '/pizza/production' },
        { label: 'Персонал', icon: Users, path: '/pizza/personnel' },
        { label: 'Замовлення', icon: ClipboardList, path: '/pizza/order-form' }
    ];

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className="hidden lg:flex border-r border-[var(--border)] bg-[#0a0e27] h-screen sticky top-0 flex-col py-6 relative overflow-hidden"
                style={{ width: 'var(--sidebar-width)' }}
            >

                {/* Optional: Subtle Wave Gradient/Glow to mimic the reference image vibe */}
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#4A7FA7]/10 to-transparent pointer-events-none" />

                <div className="px-6 mb-8 z-10">
                    <div
                        className="flex items-center gap-4 p-4 rounded-xl"
                        style={{
                            background: 'rgba(20, 27, 45, 0.8)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(0, 212, 255, 0.2)',
                            boxShadow: '0 0 30px rgba(0, 212, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                        }}
                    >
                        {/* Premium Logo Icon */}
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, #00D4FF 0%, #0088FF 100%)',
                                boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
                            }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2C8 2 6 6 6 10C6 14 8 18 12 22C16 18 18 14 18 10C18 6 16 2 12 2Z" fill="white" opacity="0.9" />
                                <path d="M12 6C10 6 9 8 9 10C9 12 10 14 12 16C14 14 15 12 15 10C15 8 14 6 12 6Z" fill="rgba(0,136,255,0.5)" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-[10px] font-bold text-[#00D4FF] tracking-wide uppercase">АНАЛІТИЧНА СИСТЕМА</h1>
                            <p className="text-[16px] text-white font-black uppercase tracking-widest">ГАЛЯ</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar z-10">
                    <p className="px-2 text-[11px] font-semibold text-[#00D4FF] uppercase tracking-widest mb-4 mt-4">
                        {isPizzaMode ? 'Навігація' : 'Магазини'}
                    </p>

                    {isPizzaMode ? (
                        /* ---- PIZZA MENU ---- */
                        PIZZA_MENU.map((item, i) => {
                            const isActive = pathname === item.path;
                            const Icon = item.icon;

                            return (
                                <button
                                    key={i}
                                    onClick={() => router.push(item.path)}
                                    className={cn(
                                        "w-full px-4 py-3.5 text-left rounded-xl transition-all duration-300 relative overflow-hidden group flex items-center gap-3",
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
                                            : '1px solid rgba(255, 255, 255, 0.08)',
                                        boxShadow: isActive
                                            ? '0 0 30px rgba(0, 212, 255, 0.3), 0 8px 32px rgba(0, 0, 0, 0.4)'
                                            : 'none',
                                    }}
                                >
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

                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                        isActive ? "bg-[#00D4FF]/20 text-[#00D4FF]" : "bg-white/5 text-white/40 group-hover:text-white"
                                    )}>
                                        <Icon size={18} />
                                    </div>

                                    <span className={cn(
                                        "text-[12px] font-bold uppercase tracking-wide",
                                        isActive ? "text-white" : "text-white/60 group-hover:text-white"
                                    )}>
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })
                    ) : (
                        /* ---- STORE MENU ---- */
                        <div className="flex flex-col gap-1">
                            {STORES_MENU.map((item, i) => {
                                const isActive = selectedStore === item.label;
                                const isHovered = hoveredStore === i;

                                return (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setSelectedStore(item.label);
                                            auditLog('CHANGE_STORE', 'Sidebar', { store: item.label });
                                            router.push(item.slug === 'all' ? '/graviton' : `/graviton/${item.slug}`);
                                        }}
                                        onMouseEnter={() => setHoveredStore(i)}
                                        onMouseLeave={() => setHoveredStore(null)}
                                        className={cn(
                                            "w-full px-4 py-3.5 text-center rounded-xl transition-all duration-300 relative overflow-hidden group",
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

                                        <div className="relative z-10">
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
                    )}
                </div>



                <div className="px-4 mt-6 pt-4 border-t border-[var(--border)] z-10">
                    <button
                        onClick={async () => {
                            await auditLog('LOGOUT', 'Sidebar', { timestamp: new Date().toISOString() });
                            // Clear auth cookie and redirect to login
                            document.cookie = 'auth-token=; Max-Age=0; path=/';
                            window.location.href = '/login';
                        }}
                        className="w-full flex items-center justify-center gap-3 px-4 py-2 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-[var(--panel)]/50 text-xs font-semibold uppercase transition-colors"
                    >
                        <LogOut size={16} />
                        Вихід
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--background)]/95 backdrop-blur-xl border-t border-[var(--border)] flex items-center justify-around px-2 z-50">
                {isPizzaMode ? (
                    // 1. PIZZA MODE: Show Pizza Menu Icons
                    PIZZA_MENU.map((item, i) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path;
                        return (
                            <button
                                key={i}
                                onClick={() => router.push(item.path)}
                                className={cn(
                                    "flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all",
                                    isActive
                                        ? "text-[#00D4FF] bg-[#00D4FF]/10 scale-105"
                                        : "text-[var(--text-muted)] hover:text-white"
                                )}
                            >
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[9px] font-bold uppercase tracking-tight text-center leading-tight">
                                    {item.label}
                                </span>
                            </button>
                        );
                    })
                ) : (
                    // 2. DEFAULT MODE: Show Stores (Fallback)
                    STORES_MENU.slice(0, 5).map((item, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedStore(item.label)}
                            className={cn(
                                "flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all",
                                selectedStore === item.label
                                    ? "text-[#00D4FF] bg-[#00D4FF]/10"
                                    : "text-[var(--text-muted)]"
                            )}
                        >
                            <span className="text-[9px] font-bold uppercase tracking-tight text-center leading-tight">
                                {item.label.replace('Магазин ', '')}
                            </span>
                        </button>
                    ))
                )}
            </div>
        </>
    );
};

import { StoreProvider } from '@/context/StoreContext';

// Particle component for background animation
// Particle component for background animation
const ParticleGrid = () => {
    const [particles, setParticles] = useState<Array<{ id: number; left: string; top: string; delay: string; duration: string }>>([]);

    useEffect(() => {
        const newParticles = Array.from({ length: 30 }, (_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            delay: `${Math.random() * 4}s`,
            duration: `${3 + Math.random() * 3}s`,
        }));
        setParticles(newParticles);
    }, []);

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
    currentWeight?: number,
    maxWeight?: number | null,
    fullHeight?: boolean
}) => {
    return (
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
    );
};
