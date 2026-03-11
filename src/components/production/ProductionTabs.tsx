import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { cn } from '@/lib/utils';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ChefHat, Activity, CheckCircle, Percent, RefreshCw, Calculator, Loader2, AlertCircle, Truck, Settings2, ClipboardList } from 'lucide-react';
import { PizzaPowerMatrix } from '../PizzaPowerMatrix';
import { ProductionOpsTable } from './ProductionOrderTable';
import { ProductionTask } from '@/types/bi';
import { BackToHome } from '../BackToHome';
import { DistributionModal } from '../DistributionModal';
import { ProductionDetailModal } from '../ProductionDetailModal';
import { DistributionControlPanel } from './DistributionControlPanel';
import ProductionSimulator from './ProductionSimulator';
import { ThemeToggle } from '../theme-toggle';

// --- SUPPORTING COMPONENTS ---
interface ProductionItem {
    product_name: string;
    baked_at_factory: number;
}

const ProductionDetailView = () => {
    const { data, error, isLoading } = useSWR<ProductionItem[]>(
        '/api/pizza/production-detail',
        (url) => fetch(url, { credentials: 'include' }).then(r => r.json()),
        { refreshInterval: 10000 }
    );

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-6 bg-bg-primary">
            <div className="bg-panel-bg rounded-xl border border-panel-border shadow-[var(--panel-shadow)] overflow-hidden">
                <div className="p-4 border-b border-panel-border bg-panel-bg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center">
                            <ChefHat size={16} className="text-accent-primary" />
                        </div>
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Статистика Виробництва</h3>
                    </div>
                    <div className="text-[10px] text-text-secondary uppercase font-black tracking-widest">Останні 24 год</div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-secondary gap-3">
                        <Loader2 size={32} className="animate-spin text-accent-primary" />
                        <span className="text-xs font-mono uppercase tracking-widest">Завантаження...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-red-500 gap-3">
                        <AlertCircle size={32} />
                        <span className="text-sm font-bold">Помилка завантаження</span>
                    </div>
                ) : data && data.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-bg-primary text-[10px] uppercase font-bold tracking-widest text-text-secondary border-b border-panel-border">
                            <tr>
                                <th className="p-4">Піца</th>
                                <th className="p-4 text-right">Виготовлено (шт)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-panel-border">
                            {data.map((item, i) => (
                                <tr key={i} className="group hover:bg-bg-primary transition-colors">
                                    <td className="p-4 text-sm font-medium text-text-primary group-hover:text-accent-primary">
                                        {item.product_name}
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-accent-primary/10 text-accent-primary font-mono text-sm font-black min-w-[4rem] border border-accent-primary/20">
                                            {item.baked_at_factory}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                        <ChefHat size={32} className="mb-3 opacity-20" />
                        <span className="text-sm font-medium">Дані відсутні</span>
                    </div>
                )}
            </div>
        </div>
    );
};

interface Props {
    data: ProductionTask[];
    onRefresh: () => void;
    showTabs?: boolean;
}

export const ProductionTabs = ({ data, onRefresh, showTabs = true }: Props) => {
    // UPDATED TABS: 'matrix' replaces old 'distribution', 'logistics' is NEW
    const [activeTab, setActiveTab] = useState<'orders' | 'matrix' | 'production' | 'logistics' | 'simulator'>('matrix');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isUpdatingStock, setIsUpdatingStock] = useState(false);
    const [showDistModal, setShowDistModal] = useState(false);
    const [showProductionModal, setShowProductionModal] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [isStale, setIsStale] = useState(false);

    React.useEffect(() => {
        const checkStaleness = () => {
            const now = new Date();
            const diff = now.getTime() - lastUpdated.getTime();
            setIsStale(diff > 30 * 60 * 1000); // 30 minutes in milliseconds
        };
        checkStaleness(); // Initial check
        const interval = setInterval(checkStaleness, 60000); // Re-check every minute
        return () => clearInterval(interval);
    }, [lastUpdated]);

    // 🏭 PRODUCTION SUMMARY
    const { data: productionSummary } = useSWR('/api/pizza/summary', (url) => fetch(url, { credentials: 'include' }).then(r => r.json()), { refreshInterval: 30000 });

    // 🔥 WEBHOOK: Update stock from n8n
    const handleUpdateStock = async () => {
        setIsUpdatingStock(true);
        try {
            const response = await fetch('/api/pizza/sync-stocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            // Оновлюємо внутрішній таймер незалежно від статусу бекенду, 
            // щоб кнопка ставала зеленою (якщо дані локально "оновилися")
            setLastUpdated(new Date());

            if (response.ok) {
                await onRefresh();
            } else {
                console.warn(`[Stock Update] Backend reported an issue (Status: ${response.status}), but UI timer was reset.`);
                alert('Помилка синхронізації з Poster: ' + response.status);
            }
        } catch (error) {
            console.warn('[Stock Update] Network/Fetch error:', error);
            alert('Помилка мережі при синхронізації');
        } finally {
            setIsUpdatingStock(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await onRefresh();
        setLastUpdated(new Date());
        setTimeout(() => setIsRefreshing(false), 500);
    };

    // 📊 GLOBAL METRICS CALCULATION
    const globalMetrics = useMemo(() => {
        const totalNetworkStock = data.reduce((sum, p) => {
            const prodStock = p.stores?.reduce((sSum, s) => sSum + (Number(s.currentStock) || 0), 0) || 0;
            return sum + prodStock;
        }, 0);

        const totalNetworkMinStock = productionSummary?.total_norm || 0;

        const fillIndex = totalNetworkMinStock > 0
            ? (totalNetworkStock / totalNetworkMinStock) * 100
            : 0;

        return {
            totalNetworkStock,
            totalNetworkMinStock,
            fillIndex
        };
    }, [data, productionSummary]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const getIndexColor = (val: number) => {
        if (val >= 96) return "text-emerald-400";
        if (val >= 80) return "text-[#FFB800]";
        return "text-[#E74856]";
    };

    return (
        <div className="flex flex-col h-full w-full font-sans">
            {/* 1. HEADER & MONITORING BLOCK */}
            <header className="flex-shrink-0 p-3 lg:p-4 pb-1 lg:pb-2 z-20">
                <div className="bg-panel-bg rounded-xl border border-panel-border shadow-[var(--panel-shadow)] p-3 flex flex-col gap-3">

                    {/* Top Row: Navigation & Title */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BackToHome />

                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                    <ChefHat size={22} className="text-orange-500" />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h1 className="text-2xl font-bold uppercase tracking-wide leading-none text-text-primary font-[family-name:var(--font-chakra)]">ЦЕХ ПІЦА</h1>
                                    <div className="text-[10px] text-text-secondary uppercase tracking-[0.2em] mt-1 font-[family-name:var(--font-jetbrains)] leading-none">
                                        Менеджер розподілу
                                    </div>
                                </div>
                            </div>

                            <div className="w-px h-8 bg-panel-border mx-2 hidden sm:block"></div>

                            <button
                                onClick={handleUpdateStock}
                                disabled={isUpdatingStock}
                                className={cn(
                                    "h-12 px-6 flex items-center justify-center gap-3 border rounded-xl transition-all shadow-md group",
                                    isUpdatingStock
                                        ? "bg-bg-primary border-panel-border text-text-muted cursor-not-allowed"
                                        : isStale
                                            ? "bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20 hover:border-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                            : "bg-emerald-500/10 border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/20 hover:border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:-rotate-1"
                                )}
                            >
                                <RefreshCw size={24} className={cn(
                                    isUpdatingStock ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500",
                                    !isUpdatingStock && (isStale ? "drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]")
                                )} />
                                <span className={cn(
                                    "hidden sm:inline text-2xl font-bold uppercase tracking-wide leading-none font-[family-name:var(--font-chakra)] pt-[3px]",
                                    isStale ? "drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                                )}>
                                    Оновити залишки
                                </span>
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                        </div>
                    </div>

                    {/* Second Row: Monitoring Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 my-1">
                        <div
                            onClick={() => setActiveTab('production')}
                            className="glass-panel p-4 rounded-2xl relative overflow-hidden cursor-pointer group hover:shadow-[0_0_20px_rgba(0,224,255,0.15)] hover:border-[#00E0FF]/30 transition-all duration-300 bg-[#131B2C]/50"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-b from-transparent via-[#00E0FF]/50 to-transparent opacity-0 group-hover:opacity-100 animate-scan pointer-events-none"></div>
                            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                <ChefHat size={48} className="text-white" />
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 mb-1.5 relative z-10">
                                <ChefHat size={14} className="text-[#00E0FF]" />
                                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#00E0FF] font-[family-name:var(--font-jetbrains)]">Виробництво (Піца)</span>
                            </div>
                            <div className="flex items-baseline gap-2 relative z-10">
                                <span className="text-3xl font-bold text-white tracking-tight font-[family-name:var(--font-jetbrains)]">
                                    {productionSummary?.total_baked?.toLocaleString() || 0}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">шт.</span>
                            </div>
                        </div>

                        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group hover:shadow-[0_0_20px_rgba(0,224,255,0.15)] hover:border-[#00E0FF]/30 transition-all duration-300 bg-[#131B2C]/50">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-b from-transparent via-[#00E0FF]/50 to-transparent opacity-0 group-hover:opacity-100 animate-scan pointer-events-none"></div>
                            <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                                <Activity size={14} />
                                <span className="text-[10px] uppercase font-bold tracking-[0.2em] font-[family-name:var(--font-jetbrains)]">Факт залишок</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className={cn(
                                    "text-3xl font-bold tracking-tight font-[family-name:var(--font-jetbrains)]",
                                    globalMetrics.fillIndex >= 96 ? "text-status-success drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" :
                                        globalMetrics.fillIndex >= 80 ? "text-status-warning drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" : "text-status-critical drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                                )}>
                                    {globalMetrics.totalNetworkStock.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">шт.</span>
                            </div>
                        </div>

                        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group hover:shadow-[0_0_20px_rgba(0,224,255,0.15)] hover:border-[#00E0FF]/30 transition-all duration-300 bg-[#131B2C]/50">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-b from-transparent via-[#00E0FF]/50 to-transparent opacity-0 group-hover:opacity-100 animate-scan pointer-events-none"></div>
                            <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                                <CheckCircle size={14} />
                                <span className="text-[10px] uppercase font-bold tracking-[0.2em] font-[family-name:var(--font-jetbrains)]">Норма</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-white tracking-tight font-[family-name:var(--font-jetbrains)]">
                                    {globalMetrics.totalNetworkMinStock.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">шт.</span>
                            </div>
                        </div>

                        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden group hover:shadow-[0_0_20px_rgba(0,224,255,0.15)] hover:border-[#00E0FF]/30 transition-all duration-300 bg-[#131B2C]/50">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-b from-transparent via-[#00E0FF]/50 to-transparent opacity-0 group-hover:opacity-100 animate-scan pointer-events-none"></div>
                            <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                                <Percent size={14} />
                                <span className="text-[10px] uppercase font-bold tracking-[0.2em] font-[family-name:var(--font-jetbrains)]">Індекс заповненостей</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className={cn(
                                    "text-3xl font-bold tracking-tight text-[#00E0FF] drop-shadow-[0_0_8px_rgba(0,224,255,0.4)] font-[family-name:var(--font-jetbrains)]"
                                )}>
                                    {globalMetrics.fillIndex.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Third Row: Tabs Container (CONDITIONAL) */}
                    {showTabs && (
                        <div className="flex items-center gap-1 p-1 bg-bg-primary rounded-xl border border-panel-border">
                            <button
                                onClick={() => setActiveTab('matrix')}
                                className={cn(
                                    "flex-1 h-11 px-4 text-[13px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group/tab",
                                    activeTab === 'matrix'
                                        ? "bg-panel-bg text-orange-500 shadow-sm border border-panel-border"
                                        : "text-text-secondary hover:text-text-primary hover:bg-panel-bg/50"
                                )}
                            >
                                <div className={cn(
                                    "p-1.5 rounded-md transition-colors",
                                    activeTab === 'matrix' ? "bg-orange-500/10" : "bg-transparent"
                                )}>
                                    <Activity size={16} strokeWidth={2.5} />
                                </div>
                                <span className="hidden xl:inline">ПОТОЧНИЙ СТАН</span>
                                <span className="xl:hidden">СТАН</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('production')}
                                className={cn(
                                    "flex-1 h-11 px-4 text-[13px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group/tab",
                                    activeTab === 'production'
                                        ? "bg-panel-bg text-accent-primary shadow-sm border border-panel-border"
                                        : "text-text-secondary hover:text-text-primary hover:bg-panel-bg/50"
                                )}
                            >
                                <div className={cn(
                                    "p-1.5 rounded-md transition-colors",
                                    activeTab === 'production' ? "bg-accent-primary/10" : "bg-transparent"
                                )}>
                                    <ChefHat size={16} strokeWidth={2.5} />
                                </div>
                                <span className="hidden xl:inline">ВИРОБНИЦТВО</span>
                                <span className="xl:hidden">ВИР</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('logistics')}
                                className={cn(
                                    "flex-1 h-11 px-4 text-[13px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group/tab",
                                    activeTab === 'logistics'
                                        ? "bg-panel-bg text-status-success shadow-sm border border-panel-border"
                                        : "text-text-secondary hover:text-text-primary hover:bg-panel-bg/50"
                                )}
                            >
                                <div className={cn(
                                    "p-1.5 rounded-md transition-colors",
                                    activeTab === 'logistics' ? "bg-status-success/10 text-status-success" : "bg-transparent"
                                )}>
                                    <Truck size={16} strokeWidth={2.5} />
                                </div>
                                <span className="hidden xl:inline">ЛОГІСТИКА</span>
                                <span className="xl:hidden">ЛОГ</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('simulator')}
                                className={cn(
                                    "flex-1 h-11 px-4 text-[13px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group/tab",
                                    activeTab === 'simulator'
                                        ? "bg-panel-bg text-rose-500 shadow-sm border border-panel-border"
                                        : "text-text-secondary hover:text-text-primary hover:bg-panel-bg/50"
                                )}
                            >
                                <div className={cn(
                                    "p-1.5 rounded-md transition-colors",
                                    activeTab === 'simulator' ? "bg-rose-500/10 text-rose-500" : "bg-transparent"
                                )}>
                                    <Settings2 size={16} strokeWidth={2.5} />
                                </div>
                                <span className="hidden xl:inline">СИМУЛЯТОР</span>
                                <span className="xl:hidden">СИМ</span>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* 2. CONTENT BLOCK */}
            <div className="flex-1 overflow-hidden relative">
                {(!showTabs || activeTab === 'orders') && (
                    <ProductionOpsTable data={data} onRefresh={onRefresh} />
                )}
                {(showTabs && activeTab === 'matrix') && (
                    <PizzaPowerMatrix data={data} onRefresh={onRefresh} />
                )}
                {(showTabs && activeTab === 'production') && (
                    <ProductionDetailView />
                )}
                {(showTabs && activeTab === 'logistics') && (
                    <DistributionControlPanel />
                )}
                {(showTabs && activeTab === 'simulator') && (
                    <ProductionSimulator />
                )}
            </div>

            {/* MODALS */}
            <DistributionModal
                isOpen={showDistModal}
                onClose={() => setShowDistModal(false)}
                products={data}
            />
            <ProductionDetailModal
                isOpen={showProductionModal}
                onClose={() => setShowProductionModal(false)}
            />
        </div>
    );
};
