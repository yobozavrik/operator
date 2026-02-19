'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { ProductionTask, BI_Metrics, SupabaseDeficitRow } from '@/types/bi';
import { transformDeficitData, GRAVITON_SHOPS } from '@/lib/transformers';
import { SyncOverlay } from '@/components/SyncOverlay';
import { cn } from '@/lib/utils';
import { BackToHome } from '@/components/BackToHome';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BIPowerMatrix } from '@/components/BIPowerMatrix';
import { PersonnelView } from '@/components/PersonnelView';
import { useStore } from '@/context/StoreContext';
import { useToast, AlertBanner } from '@/components/ui';

import { authedFetcher } from '@/lib/authed-fetcher';
const fetcher = authedFetcher;

// Lucide Icons mapping for Material Icons
import {
    MapPin,
    ArrowLeft,
    BarChart2,
    RefreshCw,
    Users,
    Truck,
    Activity,
    AlertTriangle,
    Info,
    TrendingUp,
    ChevronRight,
    Package,
    ClipboardList,
    LogOut,
    AlertCircle
} from 'lucide-react';

const STORES = [
    { id: 'Усі', name: 'УСІ', icon: MapPin },
    ...GRAVITON_SHOPS.map(shop => ({
        id: `Магазин "${shop.name}"`,
        name: `МАГАЗИН "${shop.name.toUpperCase()}"`,
        icon: null
    }))
];

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
    const [dynamicMetrics, setDynamicMetrics] = React.useState<{
        totalKg: number;
        criticalWeight: number;
        reserveWeight: number;
        criticalSKU: number;
        reserveSKU: number;
    } | null>(null);

    const [planningDays, setPlanningDays] = React.useState(1);
    const [lastManualRefresh, setLastManualRefresh] = React.useState<number | null>(null);
    const [showBreakdownModal, setShowBreakdownModal] = React.useState(false); // Legacy modal state kept for backward compat if needed

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
        const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1); // Saturday, 14 February 2026
        return `${capitalize(weekday)}, ${day} ${capitalize(month)} ${year}`;
    }, [currentTime]);

    const formattedTime = currentTime?.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) || '00:00:00';

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const results = await Promise.allSettled([
                fetch('/api/proxy/webhook', {
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

    const handleStoreClick = (id: string) => {
        if (id === 'logistics') {
            router.push('/graviton/delivery');
        } else {
            setSelectedStore(id);
        }
    };

    if (deficitError || metricsError || allProductsError) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0B0F19] text-[#E74856] font-bold uppercase tracking-widest font-display" role="alert">
                <AlertCircle size={48} className="mb-4 animate-pulse" />
                <span className="block text-center">Помилка даних | Supabase Offline</span>
            </div>
        );
    }

    if (!deficitData || !metrics || !allProductsData) {
        return (
            <div className="min-h-screen bg-[#0B0F19] p-8 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-[#00D4FF] border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-[#00D4FF] font-display tracking-widest animate-pulse">ЗАВАНТАЖЕННЯ СИСТЕМИ...</div>
                </div>
            </div>
        );
    }

    const displayTotalKg = dynamicMetrics ? dynamicMetrics.totalKg : Math.round(metrics.shopLoad);
    const displayCriticalSKU = dynamicMetrics ? dynamicMetrics.criticalSKU : metrics.criticalSKU;
    const recommendedLoad = currentCapacity || 0;
    const loadPercent = recommendedLoad > 0 ? Math.round((displayTotalKg / recommendedLoad) * 100) : 0;

    return (
        <div className="bg-[#F0F4F8] dark:bg-[#0B0F19] text-slate-300 antialiased overflow-hidden h-screen flex font-body">
            {/* Fonts Injection */}
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet" />

            <SyncOverlay isVisible={isRefreshing} />
            <div className="scanlines dark:opacity-30 opacity-0"></div>

            {/* Sidebar */}
            <aside className="w-64 h-full flex flex-col border-r border-slate-800 bg-[#080B12] z-20 relative flex-shrink-0">
                <div className="p-6 mb-4">
                    <div className="glass-panel p-4 rounded-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#00D4FF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="flex items-center space-x-3 relative z-10">
                            <div className="p-2 bg-gradient-to-br from-[#00D4FF] to-blue-600 rounded-lg shadow-neon-cyan">
                                <MapPin className="text-white" size={20} />
                            </div>
                            <div>
                                <div className="text-[10px] text-[#00D4FF] tracking-widest font-display">АНАЛІТИЧНА СИСТЕМА</div>
                                <div className="text-xl font-bold text-white font-display tracking-wide">ГАЛЯ</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 space-y-6 custom-scrollbar">
                    {/* Navigation Section */}
                    <div>
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 pl-2">Навігація</h3>
                        <ul className="space-y-2">
                            <li>
                                <button
                                    onClick={() => router.push('/production/graviton')}
                                    className="w-full flex items-center px-4 py-3 rounded-lg transition-colors border-l-4 text-left group relative overflow-hidden bg-gradient-to-r from-[#00D4FF]/20 to-transparent border-[#00D4FF] text-white shadow-neon-cyan"
                                >
                                    <span className="absolute inset-0 bg-[#00D4FF]/10 animate-pulse pointer-events-none"></span>
                                    <div className="relative z-10 flex items-center space-x-3">
                                        <div className="w-6 h-6 rounded flex items-center justify-center bg-[#00D4FF]/20 text-[#00D4FF]">
                                            <BarChart2 size={16} />
                                        </div>
                                        <span className="text-sm font-medium tracking-wide font-display text-white">
                                            Дашборд
                                        </span>
                                    </div>
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => router.push('/graviton/delivery')}
                                    className="w-full flex items-center px-4 py-3 rounded-lg transition-colors border-l-4 text-left group relative overflow-hidden text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
                                >
                                    <div className="relative z-10 flex items-center space-x-3">
                                        <div className="w-6 h-6 rounded flex items-center justify-center bg-white/5 text-slate-400 group-hover:text-white transition-colors">
                                            <Truck size={16} />
                                        </div>
                                        <span className="text-sm font-medium tracking-wide font-display group-hover:text-white transition-colors">
                                            Логістика
                                        </span>
                                    </div>
                                </button>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 pl-2">Магазини</h3>
                        <ul className="space-y-2">
                            {STORES.map((store) => {
                                const isActive = selectedStore === store.id;
                                return (
                                    <li key={store.id}>
                                        <button
                                            onClick={() => handleStoreClick(store.id)}
                                            className={cn(
                                                "w-full flex items-center px-4 py-3 rounded-lg transition-colors border-l-4 text-left group relative overflow-hidden",
                                                isActive
                                                    ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border-[#00D4FF] text-white shadow-neon-cyan"
                                                    : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
                                            )}
                                        >
                                            {isActive && (
                                                <span className="absolute inset-0 bg-[#00D4FF]/10 animate-pulse pointer-events-none"></span>
                                            )}
                                            <span className={cn("relative z-10 text-sm font-medium tracking-wide font-display", isActive ? "text-white" : "")}>
                                                {store.name}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-800 space-y-2">
                    <button
                        onClick={() => router.push('/')}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 group-hover:border-[#00D4FF] transition-colors">
                            <ArrowLeft size={16} className="text-white" />
                        </div>
                        <div className="flex items-center text-slate-400 group-hover:text-[#00D4FF] transition-colors">
                            <span className="text-sm font-medium uppercase tracking-wider font-display">ГОЛОВНЕ МЕНЮ</span>
                        </div>
                    </button>

                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            window.location.href = '/login';
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-500/10 transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 group-hover:border-red-500 transition-colors">
                            <LogOut size={16} className="text-slate-400 group-hover:text-red-500" />
                        </div>
                        <div className="flex items-center text-slate-400 group-hover:text-red-500 transition-colors">
                            <span className="text-sm font-medium uppercase tracking-wider font-display">ВИХІД</span>
                        </div>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10 bg-[url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&auto=format&fit=crop&w=2342&q=80')] bg-cover bg-center">
                <div className="absolute inset-0 bg-[#0B0F19]/90 backdrop-blur-sm z-0"></div>

                <div className="flex-1 flex flex-col p-6 space-y-6 relative z-10 overflow-y-auto custom-scrollbar">

                    {/* Header Panel */}
                    <div className="glass-panel rounded-2xl p-6 flex justify-between items-center bracket-corner shrink-0">
                        <div className="flex items-center space-x-6">
                            <button onClick={() => router.push('/')} className="text-slate-400 hover:text-white transition-colors">
                                <ArrowLeft size={24} />
                            </button>
                            <div className="h-8 w-[1px] bg-slate-700"></div>
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <BarChart2 className="text-[#00D4FF]" size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white tracking-wider font-display">ГАЛЯ БАЛУВАНА</h1>
                                    <p className="text-xs text-slate-400 uppercase tracking-widest font-display">ВИРОБНИЧИЙ КОНТРОЛЬ • GRAVITON</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-slate-400 font-medium mb-1 font-display">{formattedDate}</div>
                            <div className="text-3xl font-bold text-[#00D4FF] font-display shadow-cyan-500 drop-shadow-[0_0_8px_rgba(0,212,255,0.8)] tabular-nums">
                                {formattedTime}
                            </div>
                        </div>
                    </div>

                    {/* Stats & Actions Grid */}
                    <div className="grid grid-cols-12 gap-6 shrink-0">
                        <div className="col-span-12 lg:col-span-8 flex space-x-4">
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="glass-button flex-1 py-4 px-6 rounded-xl flex items-center space-x-4 group border-l-4 border-l-[#00D4FF]/50 hover:border-l-[#00D4FF] relative overflow-hidden bg-[#00D4FF]/10 transition-all hover:bg-[#00D4FF]/15 active:scale-[0.98]"
                            >
                                <div className="absolute inset-0 bg-[#00D4FF]/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                <RefreshCw className={cn("text-[#00D4FF]", isRefreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500")} size={24} />
                                <div className="text-left">
                                    <div className="text-[10px] text-[#00D4FF] uppercase font-bold tracking-widest font-display">{isRefreshing ? 'СИНХРОНІЗАЦІЯ...' : 'СИНХРОНІЗАЦІЯ'}</div>
                                    <div className="text-white font-bold font-display text-lg leading-none">ОНОВИТИ<br />ЗАЛИШКИ</div>
                                </div>
                            </button>

                            <button
                                onClick={() => setSelectedStore('Персонал')}
                                className={cn(
                                    "glass-button flex-1 py-4 px-6 rounded-xl flex items-center space-x-4 group active:scale-[0.98]",
                                    selectedStore === 'Персонал' ? "border-[#00D4FF] bg-[#00D4FF]/10" : ""
                                )}
                            >
                                <Users size={24} className={cn("group-hover:text-white transition-colors", selectedStore === 'Персонал' ? "text-[#00D4FF]" : "text-slate-400")} />
                                <div className="text-left">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest group-hover:text-slate-300 font-display">УПРАВЛІННЯ</div>
                                    <div className={cn("font-bold font-display text-lg group-hover:text-white", selectedStore === 'Персонал' ? "text-white" : "text-slate-200")}>ПЕРСОНАЛ</div>
                                </div>
                            </button>

                            <button
                                onClick={() => router.push('/graviton/delivery')}
                                className="glass-button flex-1 py-4 px-6 rounded-xl flex items-center space-x-4 group active:scale-[0.98]"
                            >
                                <Truck size={24} className="text-slate-400 group-hover:text-white transition-colors" />
                                <div className="text-left">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest group-hover:text-slate-300 font-display">ЛОГІСТИКА</div>
                                    <div className="text-slate-200 font-bold font-display text-lg group-hover:text-white">РОЗПОДІЛ</div>
                                </div>
                            </button>
                        </div>

                        <div className="col-span-12 lg:col-span-4 grid grid-cols-3 gap-4">
                            <div className="glass-panel p-3 rounded-xl flex flex-col justify-center items-center border-t border-t-emerald-500/30 shadow-glass">
                                <Activity size={24} className="text-emerald-400 mb-1" />
                                <div className="text-[9px] text-slate-400 uppercase text-center font-display tracking-wider">ЗАГАЛОМ КГ</div>
                                <div className="text-2xl font-bold text-white font-display">{Math.round(displayTotalKg)}</div>
                            </div>
                            <div className="glass-panel p-3 rounded-xl flex flex-col justify-center items-center border-t border-t-red-500/30 bg-red-500/5 shadow-glass">
                                <AlertTriangle size={24} className="text-[#E74856] mb-1" />
                                <div className="text-[9px] text-slate-400 uppercase text-center font-display tracking-wider">КРИТИЧНІ SKU</div>
                                <div className="text-2xl font-bold text-white font-display">{displayCriticalSKU}</div>
                            </div>
                            <div className="glass-panel p-3 rounded-xl flex flex-col justify-center items-center relative overflow-hidden shadow-glass">
                                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                    <div className={cn("w-12 h-12 border-4 border-[#00D4FF] rounded-full border-t-transparent", isRefreshing ? "animate-spin" : "")}></div>
                                </div>
                                <div className="w-8 h-8 rounded-full border-2 border-slate-700 flex items-center justify-center mb-1 text-[10px] text-[#00D4FF] font-bold font-display">
                                    {loadPercent}%
                                </div>
                                <div className="text-[9px] text-slate-400 uppercase text-center leading-tight font-display tracking-wider">
                                    ЗАВАНТАЖЕННЯ<br /><span className="text-white font-bold">{Math.round(displayTotalKg)}</span> / {recommendedLoad} кг
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Critical Alert Banner */}
                    {displayCriticalSKU > 0 && selectedStore !== 'Персонал' && (
                        <div className="glass-panel rounded-xl p-4 border border-[#E74856]/30 bg-[#E74856]/5 pulse-red-border flex items-center justify-between relative overflow-hidden shrink-0">
                            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(45deg, #E74856 0, #E74856 10px, transparent 10px, transparent 20px)" }}></div>
                            <div className="flex items-center space-x-4 relative z-10">
                                <div className="p-2 rounded-full bg-[#E74856]/20 border border-[#E74856] text-[#E74856] animate-pulse">
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-[#E74856] font-bold font-display text-lg tracking-wide uppercase">КРИТИЧНИЙ ДЕФІЦИТ: {displayCriticalSKU} позицій</h3>
                                    <p className="text-slate-400 text-sm font-body">Потрібне термінове виробництво для запобігання втраті продажів</p>
                                </div>
                            </div>
                            <button onClick={() => setShowBreakdownModal(true)} className="relative z-10 bg-slate-800 hover:bg-slate-700 text-white text-sm py-2 px-4 rounded border border-slate-600 flex items-center transition-colors font-display tracking-wider">
                                Переглянути список
                                <ChevronRight size={16} className="ml-1" />
                            </button>
                        </div>
                    )}

                    {/* Content Columns */}
                    <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                        {/* Main Interaction Area */}
                        <div className="col-span-12 xl:col-span-8 flex flex-col h-full min-h-[400px] bg-[#0B0F19]/40 rounded-xl border border-white/5 backdrop-blur-sm overflow-hidden shadow-2xl">
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

                        {/* Right Analytics Panel */}
                        <div className="col-span-12 xl:col-span-4 flex flex-col space-y-4 h-full min-h-[400px] overflow-hidden">
                            <h2 className="text-[#00D4FF] font-display font-bold text-sm tracking-widest uppercase pl-1 border-l-2 border-[#00D4FF] shrink-0">Оперативна Аналітика</h2>

                            <div className="glass-panel p-1 rounded-lg border border-[#E74856]/20 shrink-0">
                                <button onClick={() => toast.info("Сповіщення надіслано", "Менеджери отримали повідомлення")} className="w-full bg-[#E74856]/10 hover:bg-[#E74856]/20 border border-[#E74856]/30 text-[#E74856] rounded p-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors font-display">
                                    <AlertTriangle size={16} />
                                    <span>Звернути Увагу</span>
                                </button>
                            </div>

                            <div className="glass-panel rounded-xl p-4 relative overflow-hidden group shrink-0 shadow-glass">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#E74856]/20 to-transparent rounded-bl-full"></div>
                                <div className="flex items-start space-x-3 mb-4">
                                    <div className="p-2 bg-slate-800 rounded-lg border border-slate-700 text-[#E74856]">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-sm uppercase font-display">Ризики Дефіциту</h3>
                                        <p className="text-xs text-slate-500 font-body">Топ-3 критичних локацій</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {Array.from(new Set(deficitQueue.flatMap(t => t.stores).filter(s => s.deficitKg > 0).map(s => s.storeName)))
                                        .slice(0, 3)
                                        .map((storeName, i) => {
                                            const storeDeficitCount = deficitQueue.filter(t => t.stores.some(s => s.storeName === storeName && s.deficitKg > 0)).length;
                                            return (
                                                <div key={i} className="bg-slate-900/80 p-3 rounded border border-slate-800 flex justify-between items-center group/item hover:border-[#E74856]/30 transition-colors">
                                                    <div>
                                                        <div className="text-white text-xs font-bold uppercase font-body">{storeName.replace('Магазин ', '').replace(/"/g, '')}</div>
                                                        <div className="text-[10px] text-slate-500">{storeDeficitCount} позицій</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[#E74856] font-bold font-mono text-sm">{storeDeficitCount}</div>
                                                        <div className="text-[8px] text-[#E74856] uppercase tracking-widest font-display">ДЕФІЦИТ</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    {deficitQueue.length === 0 && (
                                        <div className="text-center text-xs text-slate-500 py-2">Немає критичних ризиків</div>
                                    )}
                                </div>
                            </div>

                            {/* AI Chart Widget */}
                            <div className="glass-panel rounded-xl p-4 flex-1 border border-[#00D4FF]/20 relative overflow-hidden shadow-glass flex flex-col min-h-[200px]">
                                <div className="absolute inset-0 bg-gradient-to-b from-[#00D4FF]/5 to-transparent pointer-events-none"></div>
                                <div className="flex items-start space-x-3 mb-4 relative z-10 shrink-0">
                                    <div className="p-2 bg-slate-800 rounded-lg border border-slate-700 text-[#00D4FF] shadow-[0_0_10px_rgba(0,212,255,0.2)]">
                                        <TrendingUp size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-sm uppercase font-display">Прогноз</h3>
                                        <p className="text-xs text-slate-500 font-body">AI Моделювання</p>
                                    </div>
                                </div>
                                <div className="flex-1 w-full bg-slate-900/50 rounded-lg border border-slate-800 relative overflow-hidden flex items-end justify-center mb-4 min-h-[100px]">
                                    <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
                                    <svg className="w-full h-24 absolute bottom-0" preserveAspectRatio="none" viewBox="0 0 100 50">
                                        <path d="M0,50 C20,40 30,10 50,25 C70,40 80,0 100,20 L100,50 L0,50 Z" fill="url(#grad1)" stroke="rgba(0,212,255,0.5)" strokeWidth="0.5"></path>
                                        <defs>
                                            <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                                                <stop offset="0%" style={{ stopColor: "rgba(0,212,255,0.2)", stopOpacity: 1 }}></stop>
                                                <stop offset="100%" style={{ stopColor: "rgba(0,212,255,0)", stopOpacity: 1 }}></stop>
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                                        <div className="text-[10px] text-slate-400 font-display tracking-widest uppercase">AI АНАЛІЗ</div>
                                        <div className="text-[8px] text-slate-600 animate-pulse">LIVE STREAM...</div>
                                    </div>
                                </div>

                                <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800 flex items-center justify-between shrink-0">
                                    <div className="flex items-center space-x-2">
                                        <Info className="text-yellow-500" size={16} />
                                        <div className="text-[9px] leading-tight text-slate-300 font-bold uppercase font-display">Смарт-<br />Асистент</div>
                                    </div>
                                    <button onClick={() => toast.success("AI Асистент активовоано")} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase py-2 px-3 rounded transition-colors shadow-lg shadow-emerald-900/50 font-display">
                                        ЗГЕНЕРУВАТИ
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                .glass-panel {
                    background: rgba(19, 27, 45, 0.5);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
                .glass-button {
                    background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(4px);
                    transition: all 0.3s ease;
                }
                .glass-button:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(0, 212, 255, 0.5);
                    box-shadow: 0 0 15px rgba(0, 212, 255, 0.2);
                }
                .scanlines {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: repeating-linear-gradient(
                        0deg,
                        rgba(0, 0, 0, 0.15),
                        rgba(0, 0, 0, 0.15) 1px,
                        transparent 1px,
                        transparent 2px
                    );
                    pointer-events: none;
                    z-index: 50;
                }
                .pulse-red-border {
                    animation: pulse-red 2s infinite;
                }
                @keyframes pulse-red {
                    0% { box-shadow: 0 0 0 0 rgba(231, 72, 86, 0.4); border-color: rgba(231, 72, 86, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(231, 72, 86, 0); border-color: rgba(231, 72, 86, 0.8); }
                    100% { box-shadow: 0 0 0 0 rgba(231, 72, 86, 0); border-color: rgba(231, 72, 86, 0.4); }
                }
                .bracket-corner {
                    position: relative;
                }
                .bracket-corner::before, .bracket-corner::after {
                    content: '';
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    border-color: rgba(0, 212, 255, 0.3);
                    border-style: solid;
                    transition: all 0.3s ease;
                }
                .bracket-corner::before {
                    top: 0;
                    left: 0;
                    border-width: 1px 0 0 1px;
                }
                .bracket-corner::after {
                    bottom: 0;
                    right: 0;
                    border-width: 0 1px 1px 0;
                }
                .bracket-corner:hover::before, .bracket-corner:hover::after {
                    width: 100%;
                    height: 100%;
                    border-color: rgba(0, 212, 255, 0.6);
                }
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                .font-display {
                    font-family: 'Rajdhani', sans-serif;
                }
                .font-body {
                    font-family: 'Inter', sans-serif;
                }
                .shadow-neon-cyan {
                    box-shadow: 0 0 10px rgba(0, 212, 255, 0.5), 0 0 20px rgba(0, 212, 255, 0.3);
                }
                .shadow-glass {
                    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
                }
            `}</style>
        </div>
    );
};
