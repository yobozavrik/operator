'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { ProductionTask, BI_Metrics, SupabaseDeficitRow } from '@/types/bi';
import { transformDeficitData } from '@/lib/transformers';
import { DashboardLayout } from '@/components/layout';
import { SyncOverlay } from '@/components/SyncOverlay';
import { cn } from '@/lib/utils';
import { BackToHome } from '@/components/BackToHome';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BIPowerMatrix } from '@/components/BIPowerMatrix';
import { BIInsights } from '@/components/BIInsights';
import { PersonnelView } from '@/components/PersonnelView';
import { UI_TOKENS } from '@/lib/design-tokens';
import { BarChart2, RefreshCw, Activity, AlertTriangle, Users, Truck } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useToast, AlertBanner, CriticalCounter, SkeletonKPI, SkeletonTable } from '@/components/ui';

import { authedFetcher } from '@/lib/authed-fetcher';
const fetcher = authedFetcher;

export const BIDashboard = () => {
    // Get store context
    const { selectedStore, setSelectedStore, currentCapacity } = useStore();
    const router = useRouter();
    const toast = useToast();
    const [realtimeEnabled, setRealtimeEnabled] = React.useState(true);
    const refreshInterval = realtimeEnabled ? 0 : 30000;

    const { data: deficitData, error: deficitError, mutate: mutateDeficit } = useSWR<SupabaseDeficitRow[]>(
        '/api/graviton/deficit',
        fetcher,
        { refreshInterval }
    );

    const { data: metrics, error: metricsError, mutate: mutateMetrics } = useSWR<BI_Metrics>(
        '/api/graviton/metrics',
        fetcher,
        { refreshInterval }
    );

    const { data: allProductsData, error: allProductsError, mutate: mutateAllProducts } = useSWR<SupabaseDeficitRow[]>(
        '/api/graviton/all-products',
        fetcher,
        { refreshInterval }
    );

    React.useEffect(() => {
        const channel = supabase
            .channel('dashboard-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'dashboard_deficit' },
                (payload) => {
                    mutateDeficit();
                    mutateMetrics();
                    mutateAllProducts();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [mutateDeficit, mutateMetrics, mutateAllProducts]);

    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [currentTime, setCurrentTime] = React.useState<Date | null>(null);
    const [showBreakdownModal, setShowBreakdownModal] = React.useState(false);
    const [showReserveModal, setShowReserveModal] = React.useState(false);
    const [reserveItems, setReserveItems] = React.useState<any[]>([]);
    const [dynamicMetrics, setDynamicMetrics] = React.useState<{
        totalKg: number;
        criticalWeight: number;
        reserveWeight: number;
        criticalSKU: number;
        reserveSKU: number;
    } | null>(null);

    const [planningDays, setPlanningDays] = React.useState(1);
    const [lastManualRefresh, setLastManualRefresh] = React.useState<number | null>(null);

    React.useEffect(() => {
        const saved = localStorage.getItem('lastManualRefresh');
        if (saved) setLastManualRefresh(parseInt(saved, 10));
    }, []);

    const minutesSinceLastRefresh = useMemo(() => {
        if (!currentTime || !lastManualRefresh) return 0;
        return Math.floor((currentTime.getTime() - lastManualRefresh) / 60000);
    }, [currentTime, lastManualRefresh]);

    const refreshUrgency = useMemo(() => {
        if (!lastManualRefresh || minutesSinceLastRefresh < 45) return 'normal';
        if (minutesSinceLastRefresh < 60) return 'warning';
        return 'critical';
    }, [lastManualRefresh, minutesSinceLastRefresh]);

    React.useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedDate = useMemo(() => {
        if (!currentTime) return '';
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const parts = new Intl.DateTimeFormat('uk-UA', options).formatToParts(currentTime);
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
            const results = await Promise.allSettled([
                fetch('http://localhost:5678/webhook-test/operator', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'refresh_stock', timestamp: new Date().toISOString() })
                }),
                fetch('https://n8n.dmytrotovstytskyi.online/webhook/operator', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'refresh_stock', timestamp: new Date().toISOString() })
                })
            ]);
            const hasSuccess = results.some(r => r.status === 'fulfilled' && r.value.ok);
            if (hasSuccess) {
                await new Promise(resolve => setTimeout(resolve, 4000));
                const now = Date.now();
                setLastManualRefresh(now);
                localStorage.setItem('lastManualRefresh', now.toString());
                await Promise.all([mutateDeficit(), mutateMetrics(), mutateAllProducts()]);
                toast.success('Дані оновлено', 'Залишки синхронізовано з Poster');
            } else {
                toast.warning('Часткове оновлення', 'Не вдалося підключитися до всіх серверів');
            }
        } catch (err) {
            console.error('Refresh error:', err);
            toast.error('Помилка оновлення', 'Перевірте підключення до мережі');
        } finally {
            setIsRefreshing(false);
        }
    };

    const deficitQueue = useMemo((): ProductionTask[] => {
        if (!deficitData || !Array.isArray(deficitData)) return [];
        return transformDeficitData(deficitData);
    }, [deficitData]);

    const allProductsQueue = useMemo((): ProductionTask[] => {
        if (!allProductsData || !Array.isArray(allProductsData)) return [];
        return transformDeficitData(allProductsData);
    }, [allProductsData]);

    const loadReserveItems = async () => {
        try {
            const response = await fetch('/api/graviton/deficit/reserve');
            const data = await response.json();
            setReserveItems(data);
            setShowReserveModal(true);
        } catch (err) {
            console.error('Failed to load reserve items:', err);
        }
    };

    if (deficitError || metricsError || allProductsError) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--background)] text-[var(--status-critical)] font-bold uppercase tracking-widest" role="alert">
                Помилка даних | Supabase Offline
            </div>
        );
    }

    if (!deficitData || !metrics || !allProductsData) {
        return (
            <div className="min-h-screen bg-[var(--background)] p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header skeleton */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/5 animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-6 w-48 bg-white/5 rounded animate-pulse" />
                                <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
                            </div>
                        </div>
                        <div className="text-right space-y-2">
                            <div className="h-4 w-40 bg-white/5 rounded animate-pulse" />
                            <div className="h-6 w-24 bg-white/5 rounded animate-pulse" />
                        </div>
                    </div>
                    {/* KPI skeleton */}
                    <div className="grid grid-cols-4 gap-4">
                        <SkeletonKPI />
                        <SkeletonKPI />
                        <SkeletonKPI />
                        <SkeletonKPI />
                    </div>
                    {/* Table skeleton */}
                    <SkeletonTable rows={8} columns={5} />
                </div>
            </div>
        );
    }

    const displayTotalKg = dynamicMetrics ? dynamicMetrics.totalKg : Math.round(metrics.shopLoad);
    const displayCriticalSKU = dynamicMetrics ? dynamicMetrics.criticalSKU : metrics.criticalSKU;

    return (
        <DashboardLayout
            currentWeight={displayTotalKg}
            maxWeight={currentCapacity || 0}
            fullHeight={true}
        >
            <SyncOverlay isVisible={isRefreshing} />
            <div className="flex flex-col h-full overflow-hidden relative z-10">
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
                        <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-6 z-10"
                            style={{
                                background: 'rgba(26, 31, 58, 0.7)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                                borderRadius: '12px'
                            }}>
                            <div className="flex flex-col gap-2">
                                <BackToHome />
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[var(--status-normal)]/10 flex items-center justify-center border border-[var(--status-normal)]/20 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                                        <BarChart2 size={24} className="text-[var(--status-normal)]" />
                                    </div>
                                    <div>
                                        <h1 className="text-[24px] font-bold text-white tracking-wide uppercase">ГАЛЯ БАЛУВАНА</h1>
                                        <p className="text-[11px] text-white/60 uppercase tracking-wider mt-1">Виробничий контроль • Graviton</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <div className="text-[13px] font-semibold text-white/80">{formattedDate}</div>
                                <div className="text-[20px] font-mono font-bold text-[#52E8FF] mt-1 drop-shadow-[0_0_8px_rgba(82,232,255,0.5)]">{formattedTime}</div>
                            </div>
                        </div>
                        <div className="px-6 py-3 flex flex-wrap gap-4 items-center justify-between z-10 border-t border-white/5 mt-1">
                            <div className="flex gap-4">
                                <button
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    className={cn(
                                        "group relative flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300 hover:scale-[1.03] overflow-hidden border active:scale-95 disabled:opacity-50",
                                        refreshUrgency === 'critical' ? "border-[#E74856]/40 shadow-[0_0_30px_rgba(231,72,86,0.25)]" :
                                            refreshUrgency === 'warning' ? "border-yellow-500/40 shadow-[0_0_25px_rgba(234,179,8,0.2)]" :
                                                "border-[#00D4FF]/20 hover:border-[#00D4FF]/50 hover:shadow-[0_0_30px_rgba(0,212,255,0.2)]"
                                    )}
                                    style={{
                                        background: refreshUrgency === 'critical'
                                            ? 'radial-gradient(circle at top left, rgba(231, 72, 86, 0.35), transparent 60%), linear-gradient(135deg, rgba(231, 72, 86, 0.15) 0%, rgba(196, 30, 58, 0.1) 100%)'
                                            : refreshUrgency === 'warning'
                                                ? 'radial-gradient(circle at top left, rgba(234, 179, 8, 0.35), transparent 60%), linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(202, 138, 4, 0.1) 100%)'
                                                : 'radial-gradient(circle at top left, rgba(0, 212, 255, 0.35), transparent 60%), linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 136, 255, 0.05) 100%)',
                                        backdropFilter: 'blur(15px)',
                                        WebkitBackdropFilter: 'blur(15px)',
                                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 12px 24px rgba(0, 0, 0, 0.35)',
                                    }}
                                >
                                    <div className="p-2.5 rounded-lg transition-all duration-500 flex items-center justify-center">
                                        <RefreshCw size={18} className={cn(isRefreshing ? "animate-spin" : "group-hover:rotate-180", refreshUrgency === 'critical' ? "text-[#E74856]" : refreshUrgency === 'warning' ? "text-yellow-400" : "text-[#00D4FF]")} />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className={cn("text-[9px] font-black uppercase tracking-widest leading-none mb-1.5", refreshUrgency === 'critical' ? "text-[#E74856]" : refreshUrgency === 'warning' ? "text-yellow-400" : "text-[#00D4FF]")}>
                                            {refreshUrgency === 'critical' ? 'КРИТИЧНО' : refreshUrgency === 'warning' ? 'УВАГА' : 'СИНХРОНІЗАЦІЯ'}
                                        </span>
                                        <span className="text-[13px] font-black text-white leading-none uppercase tracking-wider">
                                            {isRefreshing ? 'ОНОВЛЕННЯ...' : refreshUrgency === 'critical' ? 'ТЕРМІНОВО ОНОВИТИ!' : 'Оновити залишки'}
                                        </span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setSelectedStore('Персонал')}
                                    className={cn(
                                        "group relative flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-500 hover:scale-[1.03] overflow-hidden border active:scale-95",
                                        selectedStore === 'Персонал' ? "border-[#00D4FF]/40 shadow-[0_0_30px_rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.12)]" : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                                    )}
                                >
                                    <div className="p-2.5 rounded-lg transition-all duration-500 flex items-center justify-center">
                                        <Users size={18} className={cn(selectedStore === 'Персонал' ? "text-[#00D4FF] scale-110" : "text-white/40 group-hover:text-white/80")} />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className={cn("text-[10px] font-black uppercase tracking-[0.25em] leading-none mb-1.5", selectedStore === 'Персонал' ? "text-[#00D4FF]" : "text-white/40 group-hover:text-white/60")}>УПРАВЛІННЯ</span>
                                        <span className={cn("text-[14px] font-black leading-none uppercase tracking-tight", selectedStore === 'Персонал' ? "text-white" : "text-white/80 group-hover:text-white")}>Персонал</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => router.push('/graviton/delivery')}
                                    className={cn(
                                        "group relative flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-500 hover:scale-[1.03] overflow-hidden border active:scale-95",
                                        "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                                    )}
                                >
                                    <div className="p-2.5 rounded-lg transition-all duration-500 flex items-center justify-center">
                                        <Truck size={18} className="text-white/40 group-hover:text-white/80" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[10px] font-black uppercase tracking-[0.25em] leading-none mb-1.5 text-white/40 group-hover:text-white/60">ЛОГІСТИКА</span>
                                        <span className="text-[14px] font-black leading-none uppercase tracking-tight text-white/80 group-hover:text-white">Розподіл</span>
                                    </div>
                                </button>
                                <button onClick={() => setShowBreakdownModal(true)} className="transition-transform hover:scale-[1.03] active:scale-95">
                                    <SmallKPI label="Загалом кг" value={displayTotalKg} icon={Activity} color={UI_TOKENS.colors.priority.normal} />
                                </button>
                                <SmallKPI label="Критичні SKU" value={displayCriticalSKU} icon={AlertTriangle} color={UI_TOKENS.colors.priority.critical} />
                                <CapacityProgress current={displayTotalKg} total={currentCapacity || 0} />
                            </div>
                            <div className="flex gap-4 items-center pl-4 border-l border-white/10 ml-auto">
                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Останнє оновлення: {lastManualRefresh ? new Date(lastManualRefresh).toLocaleTimeString('uk-UA') : '---'}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Critical Alert Banner */}
                {displayCriticalSKU > 0 && (
                    <div className="px-4 lg:px-6 pt-2">
                        <AlertBanner
                            type="critical"
                            title={`КРИТИЧНИЙ ДЕФІЦИТ: ${displayCriticalSKU} позицій`}
                            description="Потрібне термінове виробництво для запобігання втраті продажів"
                            pulse
                            action={{
                                label: 'Переглянути список',
                                onClick: () => setSelectedStore('Усі'),
                            }}
                        />
                    </div>
                )}

                <main className="flex-1 min-h-0 p-4 lg:p-6 pt-2 lg:pt-2">
                    <div className="grid grid-cols-12 gap-6 h-full">
                        <div className="col-span-12 lg:col-span-9 h-full flex flex-col overflow-hidden rounded-2xl p-1">
                            <ErrorBoundary>
                                {selectedStore === 'Персонал' ? (
                                    <PersonnelView />
                                ) : (
                                    <BIPowerMatrix
                                        deficitQueue={deficitQueue}
                                        allProductsQueue={allProductsQueue}
                                        refreshUrgency={refreshUrgency}
                                        onMetricsUpdate={setDynamicMetrics}
                                        onManualRefresh={handleRefresh}
                                        planningDays={planningDays}
                                        onPlanningDaysChange={setPlanningDays}
                                    />
                                )}
                            </ErrorBoundary>
                        </div>
                        <div className="hidden lg:flex lg:col-span-3 h-full flex-col overflow-hidden">
                            <div className="rounded-2xl p-4 flex flex-col h-full"
                                style={{
                                    background: 'rgba(20, 27, 45, 0.8)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    border: '1px solid rgba(0, 212, 255, 0.15)',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 30px rgba(0, 212, 255, 0.08)',
                                }}>
                                <h3 className="text-[11px] font-bold text-[#00D4FF] uppercase tracking-widest mb-4">Оперативна Аналітика</h3>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <ErrorBoundary><BIInsights queue={deficitQueue} /></ErrorBoundary>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {showBreakdownModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setShowBreakdownModal(false)}>
                        <div className="relative w-full max-w-[500px] max-h-[90vh] flex flex-col rounded-2xl p-6 overflow-y-auto custom-scrollbar bg-[rgba(26,31,58,0.95)] border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <h2 className="text-[18px] font-bold text-white mb-6">📊 Розбивка по пріоритетам</h2>
                            <div className="mb-4 p-4 rounded-xl bg-[rgba(231,72,86,0.1)] border border-[rgba(231,72,86,0.3)]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[14px] font-semibold text-[#E74856]">🔴 КРИТИЧНО</span>
                                    <span className="text-[16px] font-bold text-[#E74856]">{Math.round(dynamicMetrics ? dynamicMetrics.criticalWeight : metrics.criticalWeight)} кг</span>
                                </div>
                                <div className="text-[11px] text-white/60">товару немає — {dynamicMetrics ? dynamicMetrics.criticalSKU : metrics.criticalSKU} SKU</div>
                            </div>
                            <div className="mb-4 p-4 rounded-xl bg-[rgba(255,192,0,0.1)] border border-[rgba(255,192,0,0.3)]">
                                <div className="flex items-center justify-between mb-2"><span className="text-[14px] font-semibold text-[#FFC000]">🟠 ВИСОКИЙ</span><span className="text-[16px] font-bold text-[#FFC000]">{Math.round(dynamicMetrics ? 0 : metrics.highWeight)} кг</span></div>
                                <div className="text-[11px] text-white/60">майже закінчилось — {dynamicMetrics ? 0 : metrics.highSKU} SKU</div>
                            </div>
                            <button onClick={loadReserveItems} className="w-full text-left mb-6 p-4 rounded-xl bg-[rgba(0,188,242,0.1)] border border-[rgba(0,188,242,0.3)]">
                                <div className="flex items-center justify-between mb-2"><span className="text-[14px] font-semibold text-[#00BCF2]">🔵 РЕЗЕРВ</span><span className="text-[16px] font-bold text-[#00BCF2]">{Math.round(dynamicMetrics ? dynamicMetrics.reserveWeight : metrics.reserveWeight)} кг</span></div>
                                <div className="text-[11px] text-white/60">товару нижче мінімального — {dynamicMetrics ? dynamicMetrics.reserveSKU : metrics.reserveSKU} SKU</div>
                            </button>
                            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                <span className="text-[14px] font-bold text-white">ВСЬОГО:</span>
                                <span className="text-[20px] font-bold text-[#52E8FF]">{Math.round(dynamicMetrics ? dynamicMetrics.totalKg : metrics.shopLoad)} кг</span>
                            </div>
                            <button onClick={() => setShowBreakdownModal(false)} className="mt-6 w-full px-6 py-3 rounded-xl font-semibold bg-white/5 border border-white/20 text-white hover:bg-white/10 transition-all">Закрити</button>
                        </div>
                    </div>
                )}

                {showReserveModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setShowReserveModal(false)}>
                        <div className="relative w-full max-w-[800px] max-h-[80vh] flex flex-col rounded-2xl p-6 overflow-hidden bg-[rgba(26,31,58,0.95)] border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <div><h2 className="text-[18px] font-bold text-white">🔵 РЕЗЕРВ — товари нижче мінімального</h2><div className="text-[12px] text-white/60 mt-1">{reserveItems.length} SKU — загалом {Math.round(metrics.reserveWeight)} кг</div></div>
                                <button onClick={() => setShowReserveModal(false)} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white">✕</button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar mb-6 pr-2">
                                <table className="w-full text-[11px] border-collapse">
                                    <thead className="sticky top-0 bg-[rgba(26,31,58,0.95)] z-10 border-b border-white/10">
                                        <tr className="text-left font-medium text-white/60">
                                            <th className="py-3 px-2">Категорія</th><th className="py-3 px-2">Товар</th><th className="py-3 px-2">Магазин</th><th className="py-3 px-2 text-right">Факт</th><th className="py-3 px-2 text-right">Мін</th><th className="py-3 px-2 text-right">Треба</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {reserveItems.map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                <td className="py-3 px-2 text-white/70">{item.category_name}</td>
                                                <td className="py-3 px-2 text-white font-medium">{item.назва_продукту}</td>
                                                <td className="py-3 px-2 text-white/50 text-[10px]">{item.назва_магазину?.replace('Магазин "', '').replace('"', '') || '—'}</td>
                                                <td className="py-3 px-2 text-right text-[#52E8FF] font-mono">{parseFloat(item.current_stock || 0).toFixed(1)}</td>
                                                <td className="py-3 px-2 text-right text-[#FFB84D] font-mono">{parseFloat(item.min_stock || 0).toFixed(1)}</td>
                                                <td className="py-3 px-2 text-right text-[#00BCF2] font-black text-[13px]">{Math.max(0, Math.ceil((parseFloat(item.avg_sales_day || 0) * planningDays) + (parseFloat(item.avg_sales_day || 0) * 4) - parseFloat(item.current_stock || 0)))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <button onClick={() => setShowReserveModal(false)} className="w-full px-6 py-3 rounded-xl font-bold bg-white/5 border border-white/20 text-white hover:bg-white/10 transition-all">Закрити</button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

const CapacityProgress = ({ current, total }: { current: number; total: number }) => {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    const isOverload = percentage > 100;
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(100, percentage) / 100) * circumference;
    const color = percentage > 100 ? '#E74856' : percentage > 85 ? '#FFC000' : '#00D4FF';

    return (
        <div className="group relative flex items-center gap-4 px-5 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-lg">
            <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                    <circle cx="24" cy="24" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" fill="transparent" />
                    <circle cx="24" cy="24" r={radius} stroke={color} strokeWidth="3.5" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <span className="absolute text-[10px] font-black" style={{ color }}>{percentage}%</span>
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{isOverload ? 'ПЕРЕВАНТАЖЕННЯ' : 'ЗАВАНТАЖЕННЯ'}</span>
                <div className="flex items-baseline gap-1.5"><span className="text-[16px] font-black text-white">{Math.round(current)}</span><span className="text-[10px] text-white/40">/ {total} кг</span></div>
            </div>
        </div>
    );
};

const SmallKPI = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) => (
    <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/5 border border-white/10">
        <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${color}10` }}><Icon size={16} style={{ color }} /></div>
        <div className="flex flex-col">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1.5">{label}</span>
            <span className="text-[16px] font-black text-white leading-none tabular-nums">{value}</span>
        </div>
    </div>
);
