import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { cn } from '@/lib/utils';
import { ChefHat, Activity, CheckCircle, Percent, RefreshCw, Calculator, Loader2, AlertCircle, Truck } from 'lucide-react';
import { PizzaPowerMatrix } from '../PizzaPowerMatrix';
import { ProductionOpsTable } from './ProductionOrderTable';
import { ProductionTask } from '@/types/bi';
import { BackToHome } from '../BackToHome';
import { DistributionModal } from '../DistributionModal';
import { ProductionDetailModal } from '../ProductionDetailModal';
import { DistributionControlPanel } from './DistributionControlPanel';

// --- SUPPORTING COMPONENTS ---
interface ProductionItem {
    product_name: string;
    baked_at_factory: number;
}

const ProductionDetailView = () => {
    const { data, error, isLoading } = useSWR<ProductionItem[]>(
        '/api/pizza/production-detail',
        (url) => fetch(url).then(r => r.json()),
        { refreshInterval: 10000 }
    );

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-4 bg-[#0B0E14]">
            <div className="rounded-xl border border-white/5 bg-[#141829]/50 overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center">
                            <ChefHat size={16} className="text-[#00D4FF]" />
                        </div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Статистика Виробництва</h3>
                    </div>
                    <div className="text-[10px] text-white/40 uppercase font-black tracking-widest">Останні 24 год</div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-white/30 gap-3">
                        <Loader2 size={32} className="animate-spin text-[#00D4FF]" />
                        <span className="text-xs font-mono uppercase tracking-widest">Завантаження...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-[#E74856] gap-3">
                        <AlertCircle size={32} />
                        <span className="text-sm font-bold">Помилка завантаження</span>
                    </div>
                ) : data && data.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#1A1F3A]/50 text-[10px] uppercase font-bold tracking-widest text-white/40 border-b border-white/5">
                            <tr>
                                <th className="p-4">Піца</th>
                                <th className="p-4 text-right">Виготовлено (шт)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {data.map((item, i) => (
                                <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4 text-sm font-medium text-white/90 group-hover:text-white">
                                        {item.product_name}
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-[#00D4FF]/10 text-[#00D4FF] font-mono text-sm font-black min-w-[4rem] border border-[#00D4FF]/20">
                                            {item.baked_at_factory}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-white/30">
                        <ChefHat size={32} className="mb-3 opacity-20" />
                        <span className="text-sm">Дані відсутні</span>
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
    const [activeTab, setActiveTab] = useState<'orders' | 'matrix' | 'production' | 'logistics'>('orders');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isUpdatingStock, setIsUpdatingStock] = useState(false);
    const [showDistModal, setShowDistModal] = useState(false);
    const [showProductionModal, setShowProductionModal] = useState(false);

    // 🏭 PRODUCTION SUMMARY
    const { data: productionSummary } = useSWR('/api/pizza/summary', (url) => fetch(url).then(r => r.json()), { refreshInterval: 30000 });

    // 🔥 WEBHOOK: Update stock from n8n
    const handleUpdateStock = async () => {
        setIsUpdatingStock(true);
        try {
            const response = await fetch('/api/pizza/update-stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_stock', timestamp: new Date().toISOString() })
            });

            if (response.ok) {
                await onRefresh();
            } else {
                console.error('Stock update failed:', response.status);
            }
        } catch (error) {
            console.error('Stock update error:', error);
        } finally {
            setIsUpdatingStock(false);
        }
    };

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await onRefresh();
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

    const getIndexColor = (val: number) => {
        if (val >= 96) return "text-emerald-400";
        if (val >= 80) return "text-[#FFB800]";
        return "text-[#E74856]";
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#0B0E14] font-sans">
            {/* 1. HEADER & MONITORING BLOCK */}
            <header className="flex-shrink-0 p-3 pb-2 z-20">
                <div className="rounded-2xl p-4 border border-[#FFB800]/20 bg-[#1A1F3A]/90 backdrop-blur-xl shadow-2xl flex flex-col gap-4">

                    {/* Top Row: Navigation & Title */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <BackToHome />

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 flex items-center justify-center border border-[#FFB800]/20">
                                    <ChefHat size={20} className="text-[#FFB800]" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold uppercase tracking-wide leading-none text-white">ЦЕХ Піца</h1>
                                    <div className="text-[10px] text-white/50 uppercase tracking-widest mt-1">
                                        Менеджер розподілу
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleUpdateStock}
                                disabled={isUpdatingStock}
                                className={cn(
                                    "h-9 px-4 flex items-center gap-2 border rounded-lg text-xs uppercase font-bold tracking-wider transition-all",
                                    isUpdatingStock
                                        ? "bg-[#FFB800]/20 border-[#FFB800]/30 text-[#FFB800] cursor-not-allowed"
                                        : "bg-[#FFB800]/10 hover:bg-[#FFB800]/20 border-[#FFB800]/30 text-[#FFB800] hover:text-[#FFB800]"
                                )}
                            >
                                <RefreshCw size={14} className={cn(isUpdatingStock && "animate-spin")} />
                                <span>Оновити залишки</span>
                            </button>
                        </div>
                    </div>

                    {/* Second Row: Monitoring Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                        <div
                            onClick={() => setActiveTab('production')}
                            className="bg-[#141829]/50 rounded-xl p-4 border border-white/5 flex flex-col justify-center relative overflow-hidden cursor-pointer group hover:bg-[#141829]/80 hover:border-[#00D4FF]/30 transition-all duration-300"
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-[#00D4FF]">
                                <ChefHat size={64} />
                            </div>
                            <div className="flex items-center gap-2 text-white/40 mb-1 relative z-10">
                                <ChefHat size={14} className="text-[#00D4FF]" />
                                <span className="text-[10px] uppercase font-bold tracking-widest text-[#00D4FF]">Виробництво (Піца)</span>
                            </div>
                            <div className="flex items-baseline gap-2 relative z-10">
                                <span className="text-4xl font-mono font-bold text-[#00D4FF] leading-none">
                                    {productionSummary?.total_baked?.toLocaleString() || 0}
                                </span>
                                <span className="text-xs text-white/40 font-bold uppercase">шт.</span>
                            </div>
                        </div>

                        <div className="bg-[#141829]/50 rounded-xl p-4 border border-white/5 flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-white/40 mb-1">
                                <Activity size={14} />
                                <span className="text-[10px] uppercase font-bold tracking-widest">Факт залишок</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className={cn(
                                    "text-4xl font-mono font-bold leading-none",
                                    globalMetrics.fillIndex >= 96 ? "text-emerald-400" :
                                        globalMetrics.fillIndex >= 80 ? "text-[#FFB800]" : "text-[#E74856]"
                                )}>
                                    {globalMetrics.totalNetworkStock.toLocaleString()}
                                </span>
                                <span className="text-xs text-white/40 font-bold uppercase">шт.</span>
                            </div>
                        </div>

                        <div className="bg-[#141829]/50 rounded-xl p-4 border border-white/5 flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-white/40 mb-1">
                                <CheckCircle size={14} />
                                <span className="text-[10px] uppercase font-bold tracking-widest">Норма</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-mono font-bold text-white leading-none">
                                    {globalMetrics.totalNetworkMinStock.toLocaleString()}
                                </span>
                                <span className="text-xs text-white/40 font-bold uppercase">шт.</span>
                            </div>
                        </div>

                        <div className="bg-[#141829]/50 rounded-xl p-4 border border-white/5 flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-white/40 mb-1">
                                <Percent size={14} />
                                <span className="text-[10px] uppercase font-bold tracking-widest">Індекс заповненостей</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className={cn("text-4xl font-mono font-bold leading-none", getIndexColor(globalMetrics.fillIndex))}>
                                    {globalMetrics.fillIndex.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Third Row: Tabs Container (CONDITIONAL) */}
                    {showTabs && (
                        <div className="flex items-center gap-2 p-1.5 bg-[#0F1220]/80 rounded-2xl border border-white/5 backdrop-blur-md shadow-inner">
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={cn(
                                    "flex-1 h-12 px-6 text-xs font-black uppercase tracking-[0.15em] rounded-xl transition-all duration-500 flex items-center justify-center gap-3 relative overflow-hidden group/tab",
                                    activeTab === 'orders'
                                        ? "bg-gradient-to-r from-[#00D4FF] to-[#0088FF] text-[#0B0E14] shadow-[0_0_25px_rgba(0,212,255,0.4)]"
                                        : "text-white/30 hover:text-white/60 hover:bg-white/5"
                                )}
                            >
                                <div className={cn(
                                    "p-1.5 rounded-lg transition-colors",
                                    activeTab === 'orders' ? "bg-black/10" : "bg-white/5"
                                )}>
                                    <Calculator size={16} strokeWidth={2.5} />
                                </div>
                                <span>ЗАМОВЛЕННЯ</span>
                                {activeTab === 'orders' && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none" />
                                )}
                            </button>

                            <button
                                onClick={() => setActiveTab('matrix')}
                                className={cn(
                                    "flex-1 h-12 px-6 text-xs font-black uppercase tracking-[0.15em] rounded-xl transition-all duration-500 flex items-center justify-center gap-3 relative overflow-hidden group/tab",
                                    activeTab === 'matrix'
                                        ? "bg-gradient-to-r from-[#FFB800] to-[#FF8A00] text-[#0B0E14] shadow-[0_0_25px_rgba(255,184,0,0.4)]"
                                        : "text-white/30 hover:text-white/60 hover:bg-white/5"
                                )}
                            >
                                <div className={cn(
                                    "p-1.5 rounded-lg transition-colors",
                                    activeTab === 'matrix' ? "bg-black/10" : "bg-white/5"
                                )}>
                                    <Activity size={16} strokeWidth={2.5} />
                                </div>
                                <span>МАТРИЦЯ (OLD)</span>
                                {activeTab === 'matrix' && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none" />
                                )}
                            </button>

                            <button
                                onClick={() => setActiveTab('production')}
                                className={cn(
                                    "flex-1 h-12 px-6 text-xs font-black uppercase tracking-[0.15em] rounded-xl transition-all duration-500 flex items-center justify-center gap-3 relative overflow-hidden group/tab",
                                    activeTab === 'production'
                                        ? "bg-gradient-to-r from-[#58A6FF] to-[#1E5FCC] text-white shadow-[0_0_25px_rgba(88,166,255,0.4)]"
                                        : "text-white/30 hover:text-white/60 hover:bg-white/5"
                                )}
                            >
                                <div className={cn(
                                    "p-1.5 rounded-lg transition-colors",
                                    activeTab === 'production' ? "bg-black/20" : "bg-white/5"
                                )}>
                                    <ChefHat size={16} strokeWidth={2.5} />
                                </div>
                                <span>ВИРОБНИЦТВО</span>
                                {activeTab === 'production' && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none" />
                                )}
                            </button>

                            <button
                                onClick={() => setActiveTab('logistics')}
                                className={cn(
                                    "flex-1 h-12 px-6 text-xs font-black uppercase tracking-[0.15em] rounded-xl transition-all duration-500 flex items-center justify-center gap-3 relative overflow-hidden group/tab",
                                    activeTab === 'logistics'
                                        ? "bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                                        : "text-white/30 hover:text-white/60 hover:bg-white/5"
                                )}
                            >
                                <div className={cn(
                                    "p-1.5 rounded-lg transition-colors",
                                    activeTab === 'logistics' ? "bg-black/20" : "bg-white/5"
                                )}>
                                    <Truck size={16} strokeWidth={2.5} />
                                </div>
                                <span>ЛОГІСТИКА (NEW)</span>
                                {activeTab === 'logistics' && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none" />
                                )}
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
