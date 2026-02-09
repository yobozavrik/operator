'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import useSWR from 'swr';
import { ChefHat, AlertTriangle, RefreshCw, RotateCcw, ChevronDown, ChevronRight, Activity, Percent, CheckCircle, Calculator, Truck, TrendingUp, Package, Store } from 'lucide-react';
import { ProductionTask } from '@/types/bi';
import { cn } from '@/lib/utils';
import { BackToHome } from '@/components/BackToHome';
import { DistributionModal } from './DistributionModal';
import { ProductionDetailModal } from './ProductionDetailModal';

// 🟢 PIZZA LOGIC CONSTANTS
const SAFETY_BUFFER = 2; // Days

interface Props {
    data: ProductionTask[];
    onRefresh: () => void;
    initialViewMode?: 'products' | 'stores';
}

// Internal Component for Distribution Logic per Accordion Item
const ProductAccordionItem = ({
    product,
    planningDays,
    isExpanded,
    onToggle
}: {
    product: any,
    planningDays: number,
    isExpanded: boolean,
    onToggle: () => void
}) => {
    const [totalBaked, setTotalBaked] = useState<number>(0);
    const [distributionPlan, setDistributionPlan] = useState<Record<number, number>>({});
    const [isDistributing, setIsDistributing] = useState(false);

    // Distribution Algorithm
    const handleDistribute = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent accordion toggle
        setIsDistributing(true);

        setTimeout(() => { // Small fake delay for UX
            let remaining = totalBaked;
            const newPlan: Record<number, number> = {};

            const add = (storeId: number, amount: number) => {
                newPlan[storeId] = (newPlan[storeId] || 0) + amount;
                remaining -= amount;
            };

            const stores = product.stores;

            // STEP 1: CRITICAL (Stock < Min Stock)
            const totalCriticalNeed = stores.reduce((sum: number, s: any) => sum + s.computed.urgentDeficit, 0);

            if (totalCriticalNeed > 0) {
                if (remaining >= totalCriticalNeed) {
                    stores.forEach((s: any) => { if (s.computed.urgentDeficit > 0) add(s.storeId, s.computed.urgentDeficit); });
                } else {
                    stores.forEach((s: any) => {
                        if (s.computed.urgentDeficit > 0) {
                            const share = Math.floor((s.computed.urgentDeficit / totalCriticalNeed) * remaining);
                            if (share > 0) add(s.storeId, share);
                        }
                    });
                }
            }

            // STEP 2: REMAINING (Proportional to Avg Sales)
            if (remaining > 0) {
                const totalAvg = stores.reduce((sum: number, s: any) => sum + s.computed.avg, 0);
                if (totalAvg > 0) {
                    const step2Pool = remaining;
                    stores.forEach((s: any) => {
                        const rawShare = (s.computed.avg / totalAvg) * step2Pool;
                        add(s.storeId, Math.floor(rawShare));
                    });
                }
            }

            // STEP 3: ROUNDING
            while (remaining > 0) {
                const sorted = [...stores].sort((a: any, b: any) => a.computed.stock - b.computed.stock);
                for (const s of sorted) {
                    if (remaining <= 0) break;
                    add(s.storeId, 1);
                }
                if (remaining > 0) break;
            }

            setDistributionPlan(newPlan);
            setIsDistributing(false);
        }, 100);
    };

    const totalDistributed = Object.values(distributionPlan).reduce((a, b) => a + b, 0);
    const criticalStoresCount = product.stores.filter((s: any) => s.computed.isUrgent).length;

    // When used inside the new card grid, we only render the internal content (no header, no wrapper)
    // The card grid already provides the header and expansion logic
    return (
        <div className="border-t border-white/5 p-2">
            {/* STORES GRID */}
            <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2 mb-3">
                {[...product.stores].sort((a: any, b: any) => b.computed.avg - a.computed.avg).map((store: any) => {

                    const isLowStock = store.computed.stock < store.computed.minStock;
                    const planVal = distributionPlan[store.storeId] || 0;

                    // SOFT COLORS
                    const cardBg = isLowStock
                        ? "bg-red-500/10 border-red-500/20"
                        : "bg-emerald-500/10 border-emerald-500/20";

                    return (
                        <div
                            key={`${product.productCode}-${store.storeName}`}
                            className={cn(
                                "rounded-lg p-2 border flex flex-col gap-1 transition-colors",
                                cardBg
                            )}
                        >
                            {/* Store Name - Compact */}
                            <div className="text-xs font-bold uppercase tracking-wide truncate text-white/90 text-center" title={store.storeName}>
                                {store.storeName.replace('Магазин ', '').replace('"', '').replace('"', '')}
                            </div>

                            {/* Metrics Row - Compact */}
                            <div className="grid grid-cols-3 gap-1 text-[10px] font-mono leading-none mt-0.5">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] text-white/40 uppercase font-bold">Факт</span>
                                    <span className={cn("font-bold text-lg", isLowStock ? "text-[#E74856]" : "text-emerald-400")}>
                                        {store.computed.stock.toFixed(0)}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-0.5 text-center">
                                    <span className="text-[9px] text-white/40 uppercase font-bold">Мін</span>
                                    <span className="font-bold text-lg text-cyan-400">{store.computed.minStock.toFixed(0)}</span>
                                </div>
                                <div className="flex flex-col gap-0.5 text-right">
                                    <span className="text-[9px] text-white/40 uppercase font-bold">Сер</span>
                                    <span className="font-bold text-lg text-[#FFB800]">{store.computed.avg.toFixed(1)}</span>
                                </div>
                            </div>

                            {/* Input Field - Reduced */}
                            <div className="pt-1.5 border-t border-white/10 mt-0.5 flex items-center justify-between">
                                <span className="text-[9px] text-[#FFB800] font-bold uppercase">План</span>
                                <input
                                    type="number"
                                    value={planVal || ''}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setDistributionPlan(prev => ({ ...prev, [store.storeId]: val }));
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className={cn(
                                        "w-14 bg-[#FFB800]/10 border border-[#FFB800]/20 rounded h-6 text-center font-mono font-bold text-base focus:outline-none focus:border-[#FFB800]",
                                        planVal > 0 ? "text-[#FFB800]" : "text-white/40"
                                    )}
                                    placeholder="-"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* CONTROLS */}
            <div className="p-3 bg-[#141829] rounded-lg border border-white/5 flex items-center gap-4">
                <div className="flex-1 max-w-xs">
                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest block mb-1">
                        Скільки випечено (шт)
                    </label>
                    <input
                        type="number"
                        value={totalBaked || ''}
                        onChange={(e) => setTotalBaked(Number(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-white/5 border border-white/10 rounded-lg h-10 px-3 font-mono text-[#FFB800] text-xl font-bold focus:outline-none focus:border-[#FFB800]"
                        placeholder="0"
                    />
                </div>

                <button
                    onClick={handleDistribute}
                    disabled={!totalBaked || isDistributing}
                    className="h-10 px-6 bg-[#FFB800] hover:bg-[#FFB800]/90 text-black font-bold uppercase text-xs tracking-wider rounded-lg transition-all disabled:opacity-50 mt-4 flex items-center gap-2"
                >
                    <RotateCcw size={16} className={isDistributing ? "animate-spin" : ""} />
                    Розподілити
                </button>

                <div className="ml-auto mt-4 text-right">
                    <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Нерозподілено</div>
                    <div className={cn("font-mono font-bold text-xl", (totalBaked - totalDistributed) < 0 ? "text-red-500" : "text-white")}>
                        {(totalBaked - totalDistributed).toFixed(0)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PizzaPowerMatrix = ({ data, onRefresh, initialViewMode = 'products' }: Props) => {
    // STATE
    const [planningDays, setPlanningDays] = useState<number>(3);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
    const [viewMode, setViewMode] = useState<'products' | 'stores'>(initialViewMode);
    const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());
    const [isUpdatingStock, setIsUpdatingStock] = useState(false);
    const [showDistModal, setShowDistModal] = useState(false);
    const [showProductionModal, setShowProductionModal] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await onRefresh();
        setTimeout(() => setIsRefreshing(false), 500);
    };

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
                // Refresh data after stock update
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


    const toggleItem = (code: number) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(code)) {
                next.delete(code);
            } else {
                next.add(code);
            }
            return next;
        });
    };

    const expandOne = (code: number) => {
        setExpandedItems(new Set([code]));
        setTimeout(() => {
            const el = document.getElementById(`product-${code}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    // 1. CALCULATE PRODUCT LEVEL AGGREGATES
    const products = useMemo(() => {
        return data.map(product => {
            let totalAvg = 0;
            let totalStock = 0;
            let totalRecommended = 0;
            let totalUrgentDeficit = 0;
            let totalMinStock = 0;

            const storesWithStats = product.stores.map(store => {
                const avg = (Number(store.avgSales) || 0); // No Multiplier x1000
                const stock = Number(store.currentStock) || 0;

                // Formulas per store
                const minStock = Number(store.minStock) || 0;

                const urgent = Math.max(0, minStock - stock);

                const target = Math.ceil((avg * planningDays) + minStock);
                const recommended = Math.max(0, target - stock);

                totalAvg += avg;
                totalStock += stock;
                totalMinStock += minStock;
                totalRecommended += recommended;
                totalUrgentDeficit += urgent;

                return {
                    ...store,
                    computed: {
                        avg,
                        stock,
                        minStock,
                        recommended,
                        urgentDeficit: urgent,
                        isUrgent: urgent > 0
                    }
                };
            });

            return {
                ...product,
                stores: storesWithStats.sort((a, b) => b.computed.urgentDeficit - a.computed.urgentDeficit),
                computed: {
                    totalAvg,
                    totalStock,
                    totalMinStock,
                    totalRecommended,
                    totalUrgentDeficit
                }
            };
        }).sort((a, b) => {
            if (b.computed.totalUrgentDeficit !== a.computed.totalUrgentDeficit) {
                return b.computed.totalUrgentDeficit - a.computed.totalUrgentDeficit;
            }
            return b.name.localeCompare(a.name);
        });

    }, [data, planningDays]);

    // Toggle store expansion
    const toggleStore = (storeName: string) => {
        setExpandedStores(prev => {
            const next = new Set(prev);
            if (next.has(storeName)) {
                next.delete(storeName);
            } else {
                next.add(storeName);
            }
            return next;
        });
    };

    // 1.5 GROUP BY STORES (inverted view)
    const storesGrouped = useMemo(() => {
        const storeMap = new Map<string, {
            storeName: string;
            storeId: number;
            products: Array<{
                productName: string;
                productCode: number;
                stock: number;
                avg: number;
                minStock: number;
                recommended: number;
                urgentDeficit: number;
                isUrgent: boolean;
            }>;
            totalStock: number;
            totalMinStock: number;
            totalUrgentDeficit: number;
            criticalProducts: number;
            totalAvgSales: number;
        }>();

        products.forEach(product => {
            product.stores.forEach((store: any) => {
                const storeName = store.storeName || 'Unknown';

                if (!storeMap.has(storeName)) {
                    storeMap.set(storeName, {
                        storeName,
                        storeId: store.storeId,
                        products: [],
                        totalStock: 0,
                        totalMinStock: 0,
                        totalUrgentDeficit: 0,
                        criticalProducts: 0,
                        totalAvgSales: 0
                    });
                }

                const entry = storeMap.get(storeName)!;
                entry.products.push({
                    productName: product.name,
                    productCode: product.productCode,
                    stock: store.computed.stock,
                    avg: store.computed.avg,
                    minStock: store.computed.minStock,
                    recommended: store.computed.recommended,
                    urgentDeficit: store.computed.urgentDeficit,
                    isUrgent: store.computed.isUrgent
                });
                entry.totalStock += store.computed.stock;
                entry.totalMinStock += store.computed.minStock;
                entry.totalUrgentDeficit += store.computed.urgentDeficit;
                if (store.computed.isUrgent) entry.criticalProducts++;
                entry.totalAvgSales += store.computed.avg;
            });
        });

        return Array.from(storeMap.values()).sort((a, b) => b.totalAvgSales - a.totalAvgSales);
    }, [products]);

    return (
        <div className="flex flex-col h-full w-full font-sans text-white bg-[#0B0E14]">
            {/* VIEW MODE TOGGLE - COMPACT */}
            <div className="px-4 py-3 flex items-center justify-start gap-4 bg-[#141829]/50 border-b border-white/5">
                <button
                    onClick={() => setViewMode('products')}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border flex items-center gap-2",
                        viewMode === 'products'
                            ? "bg-[#FFB800] border-[#FFB800] text-black shadow-[0_0_20px_rgba(255,184,0,0.4)] scale-105"
                            : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20"
                    )}
                >
                    <Package size={16} strokeWidth={3} className={viewMode === 'products' ? "text-black" : "text-white/40"} />
                    За продуктами
                </button>
                <button
                    onClick={() => setViewMode('stores')}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border flex items-center gap-2",
                        viewMode === 'stores'
                            ? "bg-[#00D4FF] border-[#00D4FF] text-black shadow-[0_0_20px_rgba(0,212,255,0.4)] scale-105"
                            : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20"
                    )}
                >
                    <Store size={16} strokeWidth={3} className={viewMode === 'stores' ? "text-black" : "text-white/40"} />
                    За точками
                </button>
            </div>

            {/* 🔥 CARD GRID LAYOUT */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-2">
                {viewMode === 'products' ? (
                    /* PRODUCTS VIEW */
                    <div className="grid grid-cols-4 xl:grid-cols-6 gap-3 pb-20">
                        {products.map(product => {
                            const isExpanded = expandedItems.has(product.productCode);
                            const criticalStores = product.stores.filter((s: any) => s.computed.isUrgent).length;
                            const hasIssues = criticalStores > 0;

                            return (
                                <div
                                    key={product.id}
                                    id={`product-${product.productCode}`}
                                    className={cn(
                                        "rounded-2xl border-2 overflow-hidden transition-all duration-300 bg-gradient-to-br",
                                        hasIssues
                                            ? "from-[#E74856]/10 to-[#E74856]/5 border-[#E74856]/30 hover:border-[#E74856]/50"
                                            : "from-emerald-500/10 to-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50",
                                        isExpanded && "col-span-2 xl:col-span-3 border-[#FFB800]/50 shadow-xl shadow-[#FFB800]/10"
                                    )}
                                >
                                    {/* CARD HEADER */}
                                    <div
                                        onClick={() => toggleItem(product.productCode)}
                                        className={cn(
                                            "p-4 cursor-pointer transition-colors",
                                            isExpanded ? "bg-white/5" : "hover:bg-white/5"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-lg font-black text-white leading-tight truncate pr-2">
                                                🍕 {product.name}
                                            </h3>
                                            <ChevronDown
                                                size={20}
                                                className={cn(
                                                    "text-white/40 transition-transform flex-shrink-0",
                                                    isExpanded && "rotate-180 text-[#FFB800]"
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white/5 rounded-xl p-3 text-center">
                                                <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Залишок</div>
                                                <div className={cn(
                                                    "text-2xl font-mono font-black",
                                                    hasIssues ? "text-[#E74856]" : "text-emerald-400"
                                                )}>
                                                    {product.computed.totalStock.toFixed(0)}
                                                </div>
                                                <div className="text-[10px] text-white/30 font-bold">шт</div>
                                            </div>
                                            <div className={cn(
                                                "rounded-xl p-3 text-center",
                                                criticalStores > 0 ? "bg-[#E74856]/20" : "bg-emerald-500/10"
                                            )}>
                                                <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Критичні</div>
                                                <div className={cn(
                                                    "text-2xl font-mono font-black",
                                                    criticalStores > 0 ? "text-[#E74856]" : "text-emerald-400"
                                                )}>
                                                    {criticalStores}
                                                </div>
                                                <div className="text-[10px] text-white/30 font-bold">магазинів</div>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all",
                                                        hasIssues ? "bg-[#E74856]" : "bg-emerald-400"
                                                    )}
                                                    style={{
                                                        width: `${Math.min(100, (1 - criticalStores / Math.max(1, product.stores.length)) * 100)}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <ProductAccordionItem
                                            product={product}
                                            planningDays={planningDays}
                                            isExpanded={true}
                                            onToggle={() => toggleItem(product.productCode)}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* STORES VIEW */
                    <div className="grid grid-cols-4 xl:grid-cols-6 gap-3 pb-20">
                        {storesGrouped.map(store => {
                            const isExpanded = expandedStores.has(store.storeName);
                            const hasIssues = store.criticalProducts > 0;
                            const fillPercent = store.totalMinStock > 0
                                ? (store.totalStock / store.totalMinStock) * 100
                                : 100;

                            return (
                                <div
                                    key={store.storeName}
                                    id={`store-${store.storeId}`}
                                    className={cn(
                                        "rounded-2xl border-2 overflow-hidden transition-all duration-300 bg-gradient-to-br",
                                        hasIssues
                                            ? "from-[#E74856]/10 to-[#E74856]/5 border-[#E74856]/30 hover:border-[#E74856]/50"
                                            : "from-emerald-500/10 to-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50",
                                        isExpanded && "col-span-2 xl:col-span-3 border-[#FFB800]/50 shadow-xl shadow-[#FFB800]/10"
                                    )}
                                >
                                    {/* STORE CARD HEADER */}
                                    <div
                                        onClick={() => toggleStore(store.storeName)}
                                        className={cn(
                                            "p-4 cursor-pointer transition-colors",
                                            isExpanded ? "bg-white/5" : "hover:bg-white/5"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-lg font-black text-white leading-tight truncate pr-2">
                                                {store.storeName.replace('Магазин ', '').replace(/"/g, '')}
                                            </h3>
                                            <ChevronDown
                                                size={20}
                                                className={cn(
                                                    "text-white/40 transition-transform flex-shrink-0",
                                                    isExpanded && "rotate-180 text-[#FFB800]"
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-white/5 rounded-xl p-3 text-center">
                                                <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Залишок</div>
                                                <div className={cn(
                                                    "text-2xl font-mono font-black",
                                                    hasIssues ? "text-[#E74856]" : "text-emerald-400"
                                                )}>
                                                    {store.totalStock.toFixed(0)}
                                                </div>
                                                <div className="text-[10px] text-white/30 font-bold">шт</div>
                                            </div>
                                            <div className={cn(
                                                "rounded-xl p-3 text-center",
                                                store.criticalProducts > 0 ? "bg-[#E74856]/20" : "bg-emerald-500/10"
                                            )}>
                                                <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Критичні</div>
                                                <div className={cn(
                                                    "text-2xl font-mono font-black",
                                                    store.criticalProducts > 0 ? "text-[#E74856]" : "text-emerald-400"
                                                )}>
                                                    {store.criticalProducts}
                                                </div>
                                                <div className="text-[10px] text-white/30 font-bold">продуктів</div>
                                            </div>

                                            {/* NEW: AVG SALES METRIC */}
                                            <div className="bg-[#00D4FF]/10 rounded-xl p-3 text-center border border-[#00D4FF]/20 flex flex-col justify-center">
                                                <div className="flex items-center justify-center gap-1 text-[9px] text-[#00D4FF]/80 uppercase font-bold mb-1 whitespace-nowrap">
                                                    <TrendingUp size={10} />
                                                    <span>Прод/день</span>
                                                </div>
                                                <div className="text-2xl font-mono font-black text-[#00D4FF] leading-none">
                                                    {store.totalAvgSales.toFixed(0)}
                                                </div>
                                                <div className="text-[10px] text-[#00D4FF]/50 font-bold mt-1">піц</div>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all",
                                                        fillPercent >= 100 ? "bg-emerald-400" :
                                                            fillPercent < 50 ? "bg-[#E74856]" : "bg-[#FFB800]"
                                                    )}
                                                    style={{ width: `${Math.min(100, fillPercent)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* EXPANDED CONTENT - Products in this store */}
                                    {isExpanded && (
                                        <div className="border-t border-white/5 p-3">
                                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                                                {store.products.sort((a, b) => b.avg - a.avg).map(product => (
                                                    <div
                                                        key={`${store.storeName}-${product.productCode}`}
                                                        className={cn(
                                                            "rounded-lg p-3 border transition-colors",
                                                            product.isUrgent
                                                                ? "bg-red-500/10 border-red-500/20"
                                                                : "bg-emerald-500/10 border-emerald-500/20"
                                                        )}
                                                    >
                                                        <div className="text-sm font-bold text-white truncate mb-2" title={product.productName}>
                                                            🍕 {product.productName}
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-1 text-center">
                                                            <div>
                                                                <div className="text-[9px] text-white/40 uppercase font-bold">Факт</div>
                                                                <div className={cn(
                                                                    "text-lg font-mono font-black",
                                                                    product.isUrgent ? "text-[#E74856]" : "text-emerald-400"
                                                                )}>
                                                                    {product.stock.toFixed(0)}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[9px] text-white/40 uppercase font-bold">Мін</div>
                                                                <div className="text-lg font-mono font-bold text-cyan-400">
                                                                    {product.minStock.toFixed(0)}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[9px] text-white/40 uppercase font-bold">Сер</div>
                                                                <div className="text-lg font-mono font-bold text-[#FFB800]">
                                                                    {product.avg.toFixed(1)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* DISTRIBUTION MODAL */}
            <DistributionModal
                isOpen={showDistModal}
                onClose={() => setShowDistModal(false)}
                products={data}
            />

            {/* PRODUCTION MODAL */}
            <ProductionDetailModal
                isOpen={showProductionModal}
                onClose={() => setShowProductionModal(false)}
            />
        </div>
    );
};
