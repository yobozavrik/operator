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
import { StoreSpecificView } from '@/components/StoreSpecificView';
import { PersonnelView } from '@/components/PersonnelView';
import { CraftBreadAnalytics } from '@/components/analytics/CraftBreadAnalytics';
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
        } else if (id === 'Планування') {
            router.push('/production/graviton/plan');
        } else {
            setSelectedStore(id);
        }
    };

    // Aggregate Product Deficits
    const aggregatedProducts = useMemo(() => {
        return deficitQueue
            .map(task => {
                const totalDeficit = task.stores.reduce((sum, store) => sum + (store.deficitKg || 0), 0);
                return { name: task.name, deficit: totalDeficit };
            })
            .filter(p => p.deficit > 0)
            .sort((a, b) => b.deficit - a.deficit);
    }, [deficitQueue]);

    const isSpecificStore = selectedStore !== 'Усі' && selectedStore !== 'Персонал' && selectedStore !== 'Планування';
    const storeSpecificQueue = useMemo(() => {
        if (!isSpecificStore) return [];
        return deficitQueue
            .map(task => {
                const storeData = task.stores.find(s => s.storeName === selectedStore);
                if (!storeData || (!storeData.deficitKg && !storeData.recommendedKg)) return null;
                return {
                    ...task,
                    stores: [storeData],
                    recommendedQtyKg: storeData.deficitKg > 0 ? storeData.deficitKg : storeData.recommendedKg, // Prioritize urgent deficit explicitly
                } as ProductionTask;
            })
            .filter((item): item is ProductionTask => item !== null);
    }, [deficitQueue, selectedStore, isSpecificStore]);

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
        <div className="bg-bg-primary text-text-primary antialiased overflow-hidden h-screen flex font-sans">
            {/* Fonts Injection */}
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet" />

            <SyncOverlay isVisible={isRefreshing} />

            {/* Sidebar */}
            <aside className="w-64 h-full flex flex-col border-r border-panel-border bg-panel-bg z-20 relative flex-shrink-0 shadow-[var(--panel-shadow)]">
                <div className="p-6 mb-4">
                    <div className="bg-bg-primary/50 border border-panel-border p-4 rounded-2xl relative overflow-hidden group">
                        <div className="flex items-center space-x-3 relative z-10">
                            <div className="p-2 bg-accent-primary/20 rounded-xl">
                                <MapPin className="text-accent-primary" size={20} />
                            </div>
                            <div>
                                <div className="text-[10px] text-accent-primary tracking-widest font-display font-medium">АНАЛІТИЧНА СИСТЕМА</div>
                                <div className="text-xl font-bold text-text-primary font-display tracking-wide">ГАЛЯ</div>
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
                            <li>
                                <button
                                    onClick={() => router.push('/graviton/stores/sadgora')}
                                    className="w-full flex items-center px-4 py-3 rounded-lg transition-colors border-l-4 text-left group relative overflow-hidden text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
                                >
                                    <div className="relative z-10 flex items-center space-x-3">
                                        <div className="w-6 h-6 rounded flex items-center justify-center bg-[#00D4FF]/10 text-[#00D4FF] group-hover:bg-[#00D4FF]/20 transition-colors">
                                            <MapPin size={16} />
                                        </div>
                                        <span className="text-sm font-medium tracking-wide font-display text-slate-400 group-hover:text-white transition-colors">
                                            СадгораТест
                                        </span>
                                    </div>
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => handleStoreClick('Планування')}
                                    className={cn(
                                        "w-full flex items-center px-4 py-3 rounded-lg transition-colors border-l-4 text-left group relative overflow-hidden",
                                        selectedStore === 'Планування'
                                            ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border-[#00D4FF] text-white shadow-neon-cyan"
                                            : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
                                    )}
                                >
                                    {selectedStore === 'Планування' && <span className="absolute inset-0 bg-[#00D4FF]/10 animate-pulse pointer-events-none"></span>}
                                    <div className="relative z-10 flex items-center space-x-3">
                                        <div className={cn("w-6 h-6 rounded flex items-center justify-center transition-colors", selectedStore === 'Планування' ? "bg-[#00D4FF]/20 text-[#00D4FF]" : "bg-white/5 text-slate-400 group-hover:text-white")}>
                                            <ClipboardList size={16} />
                                        </div>
                                        <span className={cn("text-sm font-medium tracking-wide font-display transition-colors", selectedStore === 'Планування' ? "text-white" : "group-hover:text-white")}>
                                            Планування
                                        </span>
                                    </div>
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => handleStoreClick('Аналітика: Крафтовий Хліб')}
                                    className={cn(
                                        "w-full flex items-center px-4 py-3 rounded-lg transition-colors border-l-4 text-left group relative overflow-hidden",
                                        selectedStore === 'Аналітика: Крафтовий Хліб'
                                            ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border-[#00D4FF] text-white shadow-neon-cyan"
                                            : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
                                    )}
                                >
                                    {selectedStore === 'Аналітика: Крафтовий Хліб' && <span className="absolute inset-0 bg-[#00D4FF]/10 animate-pulse pointer-events-none"></span>}
                                    <div className="relative z-10 flex items-center space-x-3">
                                        <div className={cn("w-6 h-6 rounded flex items-center justify-center transition-colors", selectedStore === 'Аналітика: Крафтовий Хліб' ? "bg-[#00D4FF]/20 text-[#00D4FF]" : "bg-white/5 text-slate-400 group-hover:text-white")}>
                                            <Activity size={16} />
                                        </div>
                                        <span className={cn("text-sm font-medium tracking-wide font-display transition-colors", selectedStore === 'Аналітика: Крафтовий Хліб' ? "text-white" : "group-hover:text-white")}>
                                            Аналітика: Хліб
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
            <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10 bg-transparent">
                <div className="flex-1 flex flex-col p-6 space-y-6 relative z-10 overflow-y-auto custom-scrollbar">

                    {/* Header Panel */}
                    <div className="bg-panel-bg shadow-[var(--panel-shadow)] border border-panel-border p-6 flex justify-between items-center shrink-0 rounded-2xl">
                        <div className="flex items-center space-x-6">
                            <button onClick={() => router.push('/')} className="text-text-muted hover:text-text-primary transition-colors">
                                <ArrowLeft size={24} />
                            </button>
                            <div className="h-8 w-[1px] bg-panel-border"></div>
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-accent-primary/10 rounded-xl border border-accent-primary/20">
                                    <BarChart2 className="text-accent-primary" size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-text-primary tracking-wider font-display">ГАЛЯ БАЛУВАНА</h1>
                                    <p className="text-xs text-text-secondary uppercase tracking-widest font-display">ВИРОБНИЧИЙ КОНТРОЛЬ • GRAVITON</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-text-muted font-medium mb-1 font-display">{formattedDate}</div>
                            <div className="text-3xl font-bold text-accent-primary font-display tabular-nums">
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
                                className="bg-panel-bg shadow-[var(--panel-shadow)] flex-1 py-4 px-6 flex items-center space-x-4 group border border-panel-border border-l-4 border-l-accent-primary/50 hover:border-l-accent-primary relative overflow-hidden transition-all hover:bg-bg-primary/50 active:scale-[0.98] rounded-2xl"
                            >
                                <RefreshCw className={cn("text-accent-primary", isRefreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500")} size={24} />
                                <div className="text-left">
                                    <div className="text-[10px] text-accent-primary uppercase font-bold tracking-widest font-display">{isRefreshing ? 'СИНХРОНІЗАЦІЯ...' : 'СИНХРОНІЗАЦІЯ'}</div>
                                    <div className="text-text-primary font-bold font-display text-lg leading-none">ОНОВИТИ<br />ЗАЛИШКИ</div>
                                </div>
                            </button>

                            <button
                                onClick={() => setSelectedStore('Персонал')}
                                className={cn(
                                    "bg-panel-bg shadow-[var(--panel-shadow)] border border-panel-border rounded-2xl flex-1 py-4 px-6 flex items-center space-x-4 group active:scale-[0.98] transition-all hover:bg-bg-primary/50",
                                    selectedStore === 'Персонал' ? "border-accent-primary bg-accent-primary/5" : ""
                                )}
                            >
                                <Users size={24} className={cn("group-hover:text-accent-primary transition-colors", selectedStore === 'Персонал' ? "text-accent-primary" : "text-text-muted")} />
                                <div className="text-left">
                                    <div className="text-[10px] text-text-secondary uppercase font-bold tracking-widest group-hover:text-text-muted font-display">УПРАВЛІННЯ</div>
                                    <div className={cn("font-bold font-display text-lg", selectedStore === 'Персонал' ? "text-accent-primary" : "text-text-primary")}>ПЕРСОНАЛ</div>
                                </div>
                            </button>

                            <button
                                onClick={() => router.push('/graviton/delivery')}
                                className="bg-panel-bg shadow-[var(--panel-shadow)] border border-panel-border rounded-2xl flex-1 py-4 px-6 flex items-center space-x-4 group active:scale-[0.98] transition-all hover:bg-bg-primary/50"
                            >
                                <Truck size={24} className="text-text-muted group-hover:text-accent-primary transition-colors" />
                                <div className="text-left">
                                    <div className="text-[10px] text-text-secondary uppercase font-bold tracking-widest group-hover:text-text-muted font-display">ЛОГІСТИКА</div>
                                    <div className="text-text-primary font-bold font-display text-lg">РОЗПОДІЛ</div>
                                </div>
                            </button>
                        </div>

                        <div className="col-span-12 lg:col-span-4 grid grid-cols-3 gap-4">
                            <div className="bg-panel-bg shadow-[var(--panel-shadow)] border border-panel-border rounded-2xl p-3 flex flex-col justify-center items-center">
                                <Activity size={24} className="text-status-success mb-1" />
                                <div className="text-[9px] text-text-secondary uppercase text-center font-display tracking-wider">ЗАГАЛОМ КГ</div>
                                <div className="text-2xl font-bold text-text-primary font-display">{Math.round(displayTotalKg)}</div>
                            </div>
                            <div className="bg-panel-bg shadow-[var(--panel-shadow)] border border-status-critical/30 rounded-2xl p-3 flex flex-col justify-center items-center">
                                <AlertTriangle size={24} className="text-status-critical mb-1" />
                                <div className="text-[9px] text-status-critical uppercase text-center font-display tracking-wider">КРИТИЧНІ SKU</div>
                                <div className="text-2xl font-bold text-status-critical font-display">{displayCriticalSKU}</div>
                            </div>
                            <div className="bg-panel-bg shadow-[var(--panel-shadow)] border border-panel-border rounded-2xl p-3 flex flex-col justify-center items-center relative overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                    <div className={cn("w-12 h-12 border-4 border-accent-primary rounded-full border-t-transparent", isRefreshing ? "animate-spin" : "")}></div>
                                </div>
                                <div className="w-8 h-8 rounded-full border border-panel-border flex items-center justify-center mb-1 text-[10px] text-accent-primary font-bold font-display">
                                    {loadPercent}%
                                </div>
                                <div className="text-[9px] text-text-secondary uppercase text-center leading-tight font-display tracking-wider">
                                    ЗАВАНТАЖЕННЯ<br /><span className="text-text-primary font-bold">{Math.round(displayTotalKg)}</span> / {recommendedLoad} кг
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Critical Alert Banner */}
                    {displayCriticalSKU > 0 && selectedStore !== 'Персонал' && (
                        <div className="bg-panel-bg shadow-[var(--panel-shadow)] border border-status-critical/50 p-4 rounded-2xl flex items-center justify-between relative overflow-hidden shrink-0">
                            <div className="flex items-center space-x-4 relative z-10">
                                <div className="p-2 rounded-full bg-status-critical/20 text-status-critical animate-pulse">
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-status-critical font-bold font-display text-lg tracking-wide uppercase">КРИТИЧНИЙ ДЕФІЦИТ: {displayCriticalSKU} позицій</h3>
                                    <p className="text-text-secondary text-sm font-sans">Потрібне термінове виробництво для запобігання втраті продажів</p>
                                </div>
                            </div>
                            <button onClick={() => setShowBreakdownModal(true)} className="relative z-10 bg-bg-primary hover:bg-bg-primary/80 border border-panel-border text-text-primary shadow-sm text-sm py-2 px-4 rounded-xl flex items-center transition-colors font-display tracking-wider">
                                Переглянути список
                                <ChevronRight size={16} className="ml-1" />
                            </button>
                        </div>
                    )}

                    {/* Content Columns */}
                    <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                        {/* Main Interaction Area */}
                        <div className="col-span-12 xl:col-span-8 flex flex-col h-full min-h-[400px] bg-panel-bg shadow-[var(--panel-shadow)] border border-panel-border rounded-2xl overflow-hidden">
                            <ErrorBoundary>
                                {selectedStore === 'Персонал' ? (
                                    <PersonnelView />
                                ) : selectedStore === 'Аналітика: Крафтовий Хліб' ? (
                                    <CraftBreadAnalytics />
                                ) : isSpecificStore ? (
                                    <StoreSpecificView queue={storeSpecificQueue} storeName={selectedStore} />
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
                            <h2 className="text-accent-primary font-display font-bold text-sm tracking-widest uppercase pl-1 border-l-2 border-accent-primary shrink-0">Оперативна Аналітика</h2>

                            <div className="bg-panel-bg shadow-[var(--panel-shadow)] border border-panel-border rounded-2xl p-1 shrink-0">
                                <button onClick={() => toast.info("Сповіщення надіслано", "Менеджери отримали повідомлення")} className="w-full bg-status-critical/10 hover:bg-status-critical/20 border border-status-critical/30 text-status-critical rounded-xl p-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors font-display">
                                    <AlertTriangle size={16} />
                                    <span>Звернути Увагу</span>
                                </button>
                            </div>

                            <div className="bg-panel-bg shadow-[var(--panel-shadow)] border border-panel-border rounded-2xl p-4 relative overflow-hidden group shrink-0">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-status-critical/10 to-transparent rounded-bl-full"></div>
                                <div className="flex items-start space-x-3 mb-4">
                                    <div className="p-2 bg-status-critical/10 rounded-xl border border-status-critical/20 text-status-critical">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-text-primary font-bold text-sm uppercase font-display">Топ-5 Дефіцитів</h3>
                                        <p className="text-xs text-text-secondary font-sans">Сумарна нестача по мережі</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {aggregatedProducts.slice(0, 5).map((prod, i) => (
                                        <div key={i} className="bg-bg-primary/50 p-3 rounded-xl border border-panel-border flex justify-between items-center group/item hover:border-status-critical/50 transition-colors">
                                            <div className="flex-1 min-w-0 pr-2">
                                                <div className="text-text-primary text-xs font-bold uppercase font-sans truncate" title={prod.name}>{prod.name}</div>
                                                <div className="text-[10px] text-text-secondary">Пріоритет {i + 1}</div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-status-critical font-bold font-mono text-sm">{Math.round(prod.deficit)}</div>
                                                <div className="text-[8px] text-status-critical uppercase tracking-widest font-display">КГ</div>
                                            </div>
                                        </div>
                                    ))}
                                    {aggregatedProducts.length === 0 && (
                                        <div className="text-center text-xs text-text-muted py-2">Дефіцитів немає</div>
                                    )}
                                </div>
                            </div>

                            {/* AI Chart Widget */}
                            <div className="bg-panel-bg shadow-[var(--panel-shadow)] border border-panel-border rounded-2xl p-4 flex-1 relative overflow-hidden flex flex-col min-h-[200px]">
                                <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/5 to-transparent pointer-events-none"></div>
                                <div className="flex items-start space-x-3 mb-4 relative z-10 shrink-0">
                                    <div className="p-2 bg-accent-primary/10 rounded-xl border border-accent-primary/20 text-accent-primary">
                                        <TrendingUp size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-text-primary font-bold text-sm uppercase font-display">Прогноз</h3>
                                        <p className="text-xs text-text-secondary font-sans">AI Моделювання</p>
                                    </div>
                                </div>
                                <div className="flex-1 w-full bg-bg-primary/50 rounded-xl border border-panel-border relative overflow-hidden flex items-end justify-center mb-4 min-h-[100px]">
                                    <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
                                    <svg className="w-full h-24 absolute bottom-0" preserveAspectRatio="none" viewBox="0 0 100 50">
                                        <path d="M0,50 C20,40 30,10 50,25 C70,40 80,0 100,20 L100,50 L0,50 Z" fill="url(#grad2)" stroke="#00D4FF" strokeWidth="0.8" opacity="0.5"></path>
                                        <defs>
                                            <linearGradient id="grad2" x1="0%" x2="0%" y1="0%" y2="100%">
                                                <stop offset="0%" style={{ stopColor: "#00D4FF", stopOpacity: 0.1 }}></stop>
                                                <stop offset="100%" style={{ stopColor: "#00D4FF", stopOpacity: 0 }}></stop>
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center bg-panel-bg/80 p-2 rounded-xl backdrop-blur border border-panel-border shadow-[var(--panel-shadow)]">
                                        <div className="text-[10px] text-accent-primary font-display tracking-widest uppercase">AI АНАЛІЗ</div>
                                        <div className="text-[8px] text-text-secondary animate-pulse">ОЧІКУВАННЯ ДАНИХ...</div>
                                    </div>
                                </div>

                                <div className="bg-bg-primary/50 rounded-xl p-3 border border-panel-border flex items-center justify-between shrink-0 relative z-10">
                                    <div className="flex items-center space-x-2">
                                        <Info className="text-accent-primary" size={16} />
                                        <div className="text-[9px] leading-tight text-text-primary font-bold uppercase font-display">Смарт-<br />Асистент</div>
                                    </div>
                                    <button onClick={() => toast.success("AI Асистент активовоано")} className="bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary border border-accent-primary/50 text-[10px] font-bold uppercase py-2 px-3 rounded-lg transition-colors shadow-[0_0_10px_rgba(var(--color-accent-primary),0.3)] font-display">
                                        ЗГЕНЕРУВАТИ
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx global>{`
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
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 0, 0, 0.2);
                }
                .font-display {
                    font-family: 'Rajdhani', sans-serif;
                }
                .font-body {
                    font-family: 'Inter', sans-serif;
                }
            `}</style>
        </div>
    );
};
