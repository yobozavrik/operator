'use client';

import React, { useMemo } from 'react';
import useSWR from 'swr';
import { DashboardLayout } from '@/components/layout';
import { BIGauge, BIStatCard } from '@/components/BIPanels';
import { BIPowerMatrix } from '@/components/BIPowerMatrix';
import { BIInsights } from '@/components/BIInsights';
import { PersonnelView } from '@/components/PersonnelView';
import { ProductionTask, BI_Metrics, SupabaseDeficitRow } from '@/types/bi';
import { transformDeficitData } from '@/lib/transformers';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Users, AlertTriangle, TrendingUp, RotateCw, Activity, RefreshCw, BarChart2 } from 'lucide-react';
import { UI_TOKENS } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { useStore } from '@/context/StoreContext';

import { supabase } from '@/lib/supabase';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function BIDashboard() {
    // Get store context
    const { selectedStore, currentCapacity } = useStore();

    // ⚡ REALTIME ARCHITECTURE: No more polling!
    // We fetch initially, then listen for DB events to re-fetch.
    const { data: deficitData, error: deficitError, mutate: mutateDeficit } = useSWR<SupabaseDeficitRow[]>(
        '/api/graviton/deficit',
        fetcher
    );

    const { data: metrics, error: metricsError, mutate: mutateMetrics } = useSWR<BI_Metrics>(
        '/api/graviton/metrics',
        fetcher
    );

    // Для режиму "Конкретний магазин" потрібні ВСІ товари
    const { data: allProductsData, error: allProductsError, mutate: mutateAllProducts } = useSWR<SupabaseDeficitRow[]>(
        '/api/graviton/all-products',
        fetcher
    );

    // 🔄 EVENT-DRIVEN UPDATES
    React.useEffect(() => {
        console.log('🔌 Connecting to Supabase Realtime...');

        const channel = supabase
            .channel('dashboard-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'dashboard_deficit' },
                (payload) => {
                    console.log('⚡ Realtime update received:', payload.eventType);
                    // Trigger re-fetch when data changes
                    mutateDeficit();
                    mutateMetrics();
                    mutateAllProducts();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Connected to Realtime stream');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [mutateDeficit, mutateMetrics, mutateAllProducts]);

    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [currentTime, setCurrentTime] = React.useState<Date | null>(null);
    const [showBreakdownModal, setShowBreakdownModal] = React.useState(false);

    React.useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Format Date: "П'ятниця, 3 Лютого 2026"
    const formattedDate = useMemo(() => {
        if (!currentTime) return '';
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const parts = new Intl.DateTimeFormat('uk-UA', options).formatToParts(currentTime);

        // Manual capitalization because CSS capitalize works on all words
        const weekday = parts.find(p => p.type === 'weekday')?.value || '';
        const day = parts.find(p => p.type === 'day')?.value || '';
        const month = parts.find(p => p.type === 'month')?.value || '';
        const year = parts.find(p => p.type === 'year')?.value || '';

        const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

        return `${capitalize(weekday)}, ${day} ${capitalize(month)} ${year}`;
    }, [currentTime]);

    const formattedTime = currentTime?.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) || '00:00:00';

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch('http://localhost:5678/webhook-test/operator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'refresh_stock', timestamp: new Date().toISOString() })
            });

            if (response.ok) {
                // Ждем немного, чтобы n8n успел обработать (опционально)
                await new Promise(resolve => setTimeout(resolve, 2000));
                await Promise.all([mutateDeficit(), mutateMetrics()]);
            } else {
                console.error('Webhook failed:', response.statusText);
            }
        } catch (err) {
            console.error('Refresh error:', err);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Для режиму "Усі магазини" (тільки товари з дефіцитом)
    const deficitQueue = useMemo((): ProductionTask[] => {
        if (!deficitData || !Array.isArray(deficitData)) return [];
        return transformDeficitData(deficitData);
    }, [deficitData]);

    // Для режиму "Конкретний магазин" (всі товари)
    const allProductsQueue = useMemo((): ProductionTask[] => {
        if (!allProductsData || !Array.isArray(allProductsData)) return [];
        return transformDeficitData(allProductsData);
    }, [allProductsData]);

    if (deficitError || metricsError || allProductsError) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--background)] text-[var(--status-critical)] font-bold uppercase tracking-widest" role="alert">
                Помилка даних | Supabase Offline
            </div>
        );
    }

    if (!deficitData || !metrics || !allProductsData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--background)] text-[var(--text-muted)] font-bold uppercase tracking-widest animate-pulse">
                Ініціалізація двигуна BI...
            </div>
        );
    }

    return (
        <DashboardLayout
            currentWeight={metrics.shopLoad}
            maxWeight={currentCapacity}
            fullHeight={true}
        >
            {/* ========== SUPER DRAMATIC VISUAL EFFECTS ========== */}

            {/* MAIN CENTER GLOW - PULSATING */}
            <div
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full pointer-events-none z-0 animate-pulse"
                style={{
                    background: 'radial-gradient(circle, rgba(0, 212, 255, 0.25) 0%, rgba(0, 136, 255, 0.15) 30%, rgba(0, 100, 200, 0.05) 50%, transparent 70%)',
                    filter: 'blur(40px)',
                }}
            />

            {/* SECONDARY GLOW - TOP RIGHT */}
            <div
                className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none z-0"
                style={{
                    background: 'radial-gradient(circle, rgba(0, 212, 255, 0.2) 0%, transparent 60%)',
                    filter: 'blur(60px)',
                }}
            />

            {/* ACCENT GLOW - BOTTOM LEFT */}
            <div
                className="fixed bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
                style={{
                    background: 'radial-gradient(circle, rgba(0, 188, 242, 0.15) 0%, transparent 60%)',
                    filter: 'blur(80px)',
                }}
            />

            {/* ANIMATED FLOATING PARTICLES */}
            <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
                {Array.from({ length: 40 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: `${2 + Math.random() * 4}px`,
                            height: `${2 + Math.random() * 4}px`,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            background: `rgba(0, 212, 255, ${0.3 + Math.random() * 0.5})`,
                            boxShadow: '0 0 6px rgba(0, 212, 255, 0.8)',
                            animation: `float-particle ${4 + Math.random() * 4}s ease-in-out infinite`,
                            animationDelay: `${Math.random() * 4}s`,
                        }}
                    />
                ))}
            </div>

            {/* SCAN LINE EFFECT */}
            <div
                className="fixed inset-0 pointer-events-none z-[2] opacity-30"
                style={{
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 212, 255, 0.03) 2px, rgba(0, 212, 255, 0.03) 4px)',
                }}
            />

            {/* FULL SCREEN FLEX CONTAINER */}
            <div className="flex flex-col h-full overflow-hidden relative z-10">

                {/* 1. HEADER (Fixed) */}
                <header className="flex-shrink-0 p-4 lg:p-6 pb-2 lg:pb-3">
                    <div
                        className="rounded-2xl p-1 relative overflow-hidden group/spotlight"
                        style={{
                            background: 'rgba(20, 27, 45, 0.8)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(0, 212, 255, 0.2)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 40px rgba(0, 212, 255, 0.1)',
                        }}
                    >
                        {/* Spotlight Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/spotlight:animate-shimmer pointer-events-none" />

                        {/* Branding + Clock */}
                        <div
                            className="px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-6 z-10"
                            style={{
                                background: 'rgba(26, 31, 58, 0.7)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                                borderRadius: '12px'
                            }}
                        >
                            {/* Left: Branding */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[var(--status-normal)]/10 flex items-center justify-center border border-[var(--status-normal)]/20 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                                    <BarChart2 size={24} className="text-[var(--status-normal)]" />
                                </div>
                                <div>
                                    <h1 className="text-[24px] font-bold text-white tracking-wide uppercase">
                                        ГАЛЯ БАЛУВАНА
                                    </h1>
                                    <p className="text-[11px] text-white/60 uppercase tracking-wider mt-1">
                                        Виробничий контроль • Graviton
                                    </p>
                                </div>
                            </div>

                            {/* Right: Date/Time */}
                            <div className="text-right flex flex-col items-end">
                                <div className="text-[13px] font-semibold text-white/80">
                                    {formattedDate}
                                </div>
                                <div className="text-[20px] font-mono font-bold text-[#52E8FF] mt-1 drop-shadow-[0_0_8px_rgba(82,232,255,0.5)]">
                                    {formattedTime}
                                </div>
                            </div>
                        </div>

                        {/* Small KPI Strip */}
                        <div className="px-6 py-3 flex flex-wrap gap-4 items-center justify-between z-10 border-t border-white/5 mt-1">
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowBreakdownModal(true)}
                                    className="transition-transform hover:scale-105 active:scale-95"
                                >
                                    <SmallKPI label="Загалом кг" value={Math.round(metrics.shopLoad)} icon={Activity} color={UI_TOKENS.colors.priority.normal} />
                                </button>
                                <SmallKPI label="Критичні SKU" value={metrics.criticalSKU} icon={AlertTriangle} color={UI_TOKENS.colors.priority.critical} />
                                <SmallKPI label="Потужність зміні" value={`${currentCapacity} кг`} icon={Users} color="#00D4FF" />
                            </div>

                            <div className="flex gap-4 items-center">
                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                                    Оновлено: {new Date(metrics.lastUpdate).toLocaleTimeString('uk-UA')}
                                </p>
                                <button
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    className="p-2 bg-[var(--panel)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--status-normal)] rounded-lg border border-[var(--border)] transition-all disabled:opacity-50 active:scale-95"
                                >
                                    <RotateCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* 2. MAIN CONTENT (Flexible) */}
                <main className="flex-1 min-h-0 p-4 lg:p-6 pt-0 lg:pt-0">
                    <div className="grid grid-cols-12 gap-6 h-full">
                        {/* Main Matrix (Takes most space) */}
                        <div
                            className="col-span-12 lg:col-span-9 h-full flex flex-col overflow-hidden rounded-2xl p-1"
                            style={{
                                background: 'rgba(20, 27, 45, 0.8)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                border: '1px solid rgba(0, 212, 255, 0.15)',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 30px rgba(0, 212, 255, 0.08)',
                            }}
                        >
                            <ErrorBoundary>
                                {selectedStore === 'Персонал' ? (
                                    <PersonnelView />
                                ) : (
                                    <BIPowerMatrix deficitQueue={deficitQueue} allProductsQueue={allProductsQueue} />
                                )}
                            </ErrorBoundary>
                        </div>

                        {/* Insights (Side panel if there's room) */}
                        <div className="hidden lg:flex lg:col-span-3 h-full flex-col overflow-hidden">
                            <div
                                className="rounded-2xl p-4 flex flex-col h-full"
                                style={{
                                    background: 'rgba(20, 27, 45, 0.8)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    border: '1px solid rgba(0, 212, 255, 0.15)',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 30px rgba(0, 212, 255, 0.08)',
                                }}
                            >
                                <h3 className="text-[11px] font-bold text-[#00D4FF] uppercase tracking-widest mb-4">Оперативна Аналітика</h3>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <ErrorBoundary>
                                        <BIInsights queue={deficitQueue} />
                                    </ErrorBoundary>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Breakdown Modal */}
                {showBreakdownModal && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        style={{
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)'
                        }}
                        onClick={() => setShowBreakdownModal(false)}
                    >
                        <div
                            className="relative w-full max-w-[500px] max-h-[90vh] flex flex-col rounded-2xl p-6 overflow-y-auto custom-scrollbar"
                            style={{
                                background: 'rgba(26, 31, 58, 0.95)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-[18px] font-bold text-white mb-6">
                                📊 Розбивка по пріоритетам
                            </h2>

                            <div className="mb-4 p-4 rounded-xl" style={{
                                background: 'rgba(231, 72, 86, 0.1)',
                                border: '1px solid rgba(231, 72, 86, 0.3)'
                            }}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[14px] font-semibold text-[#E74856]">
                                        🔴 КРИТИЧНО
                                    </span>
                                    <span className="text-[16px] font-bold text-[#E74856]">
                                        {Math.round(metrics.criticalWeight)} кг
                                    </span>
                                </div>
                                <div className="text-[11px] text-white/60">
                                    товару немає — {metrics.criticalSKU} SKU
                                </div>
                            </div>

                            <div className="mb-4 p-4 rounded-xl" style={{
                                background: 'rgba(255, 192, 0, 0.1)',
                                border: '1px solid rgba(255, 192, 0, 0.3)'
                            }}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[14px] font-semibold text-[#FFC000]">
                                        🟠 ВИСОКИЙ
                                    </span>
                                    <span className="text-[16px] font-bold text-[#FFC000]">
                                        {Math.round(metrics.highWeight)} кг
                                    </span>
                                </div>
                                <div className="text-[11px] text-white/60">
                                    майже закінчилось — {metrics.highSKU} SKU
                                </div>
                            </div>

                            <div className="mb-6 p-4 rounded-xl" style={{
                                background: 'rgba(0, 188, 242, 0.1)',
                                border: '1px solid rgba(0, 188, 242, 0.3)'
                            }}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[14px] font-semibold text-[#00BCF2]">
                                        🔵 РЕЗЕРВ
                                    </span>
                                    <span className="text-[16px] font-bold text-[#00BCF2]">
                                        {Math.round(metrics.reserveWeight)} кг
                                    </span>
                                </div>
                                <div className="text-[11px] text-white/60">
                                    нижче мінімального — {metrics.reserveSKU} SKU
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-[14px] font-bold text-white">
                                        ВСЬОГО:
                                    </span>
                                    <span className="text-[20px] font-bold text-[#52E8FF]">
                                        {Math.round(metrics.shopLoad)} кг
                                    </span>
                                </div>
                                <div className="text-[11px] text-white/50 text-right mt-1">
                                    {metrics.totalSKU} SKU
                                </div>
                            </div>

                            <button
                                onClick={() => setShowBreakdownModal(false)}
                                className="mt-6 w-full px-6 py-3 rounded-xl font-semibold bg-white/5 border border-white/20 text-white hover:bg-white/10 transition-all"
                            >
                                Закрити
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

const SmallKPI = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) => (
    <div
        className="group relative flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,0,0,0.3)] overflow-hidden"
        style={{
            background: 'rgba(26, 31, 58, 0.6)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}
    >
        {/* Shimmer on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />

        <div className="p-2.5 rounded-lg transition-colors group-hover:bg-white/5" style={{ backgroundColor: `${color}10` }}>
            <Icon size={16} style={{ color: color }} className="transition-transform group-hover:scale-110" />
        </div>
        <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1.5">{label}</span>
            <span className="text-[16px] font-black text-[var(--foreground)] leading-none tabular-nums tracking-tight">{value}</span>
        </div>
    </div>
);
