'use client';

import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import { cn } from '@/lib/utils';
import { Loader2, Save, Activity, AlertCircle, Percent, TrendingUp } from 'lucide-react';
import { ProductionTask } from '@/types/bi';

interface Props {
    data: ProductionTask[]; // From v_pizza_distribution_stats
    onRefresh: () => void;
}

interface FactoryStockItem {
    product_name: string;
    baked_at_factory: number;
}

interface AnalyticsData {
    kpi: {
        currentStock: number;
        totalNeed: number;
        totalTarget: number;
        criticalPositions: number;
        fillLevel: string;
    };
    top5: {
        pizza_name: string;
        shop_stock: number;
        risk_index: number;
    }[];
}

export const OrderFormTable = ({ data, onRefresh }: Props) => {
    // 1. Fetch Factory Stock
    const { data: factoryStockData, isLoading: isStockLoading } = useSWR<FactoryStockItem[]>(
        '/api/pizza/production-detail',
        (url) => fetch(url).then(r => r.json()),
        { refreshInterval: 10000 }
    );

    // 1.1 Fetch Analytics Data
    const { data: analytics } = useSWR<AnalyticsData>(
        '/api/pizza/analytics',
        (url) => fetch(url).then(r => r.json()),
        { refreshInterval: 30000 }
    );

    // 2. Local State
    const [productionPlan, setProductionPlan] = useState<Record<string, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 3. Aggregate Data
    const tableRows = useMemo(() => {
        return data.map(product => {
            // Calculate Network Deficit (Sum of need_net from all stores)
            // Assuming product.stores contains all store entries for this product
            // deficitKg mapped from need_net in transformer
            const networkDeficit = product.stores.reduce((sum, s) => sum + (s.deficitKg || 0), 0);

            // Find Factory Stock
            const stockItem = factoryStockData?.find(
                item => item.product_name?.trim().toLowerCase() === product.name.trim().toLowerCase()
            );
            const factoryStock = stockItem?.baked_at_factory || 0;

            return {
                id: product.id,
                name: product.name,
                networkDeficit,
                factoryStock,
                currentPlan: productionPlan[product.id] || 0
            };
        })
            .filter(row => row.networkDeficit > 0 || row.factoryStock > 0) // Optional: Hide irrelevant rows? User asked for "Summary table", implying all relevant.
            .sort((a, b) => b.networkDeficit - a.networkDeficit);
    }, [data, factoryStockData, productionPlan]);


    // 4. Submit Handler
    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Filter only items with input > 0
            const itemsToOrder = tableRows
                .filter(r => (productionPlan[r.id] || 0) > 0)
                .map(r => ({
                    product_id: r.id,
                    product_name: r.name,
                    quantity: productionPlan[r.id]
                }));

            if (itemsToOrder.length === 0) {
                alert('Будь ласка, введіть кількість.');
                setIsSubmitting(false);
                return;
            }

            const res = await fetch('/api/pizza/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orders: itemsToOrder })
            });

            if (res.ok) {
                alert('Замовлення сформовано!');
                setProductionPlan({});
                onRefresh();
            } else {
                throw new Error('Failed to create order');
            }
        } catch (error) {
            console.error(error);
            alert('Помилка відправки');
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalDeficit = tableRows.reduce((sum, r) => sum + r.networkDeficit, 0);
    const totalOrdered = Object.values(productionPlan).reduce((sum, v) => sum + v, 0);

    return (
        <div className="flex flex-col h-full bg-[#141829] rounded-xl border border-white/5 overflow-hidden">
            {/* ANALYTICS BLOCK */}
            <div className="p-4 grid gap-4 shrink-0 bg-[#0B0E14] border-b border-white/5">
                {/* KPI ROW */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {/* KPI 1 */}
                    <div className="bg-[#141829]/50 border border-white/5 rounded-xl p-3 flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-white/40 mb-1 text-[10px] uppercase font-bold tracking-widest">
                            <Activity size={12} />
                            <span>Залишки в мережі</span>
                        </div>
                        <div className="text-2xl font-mono font-bold text-white">
                            {analytics?.kpi?.currentStock?.toLocaleString() ?? '-'}
                            <span className="text-[10px] text-white/30 ml-1">шт</span>
                        </div>
                    </div>
                    {/* KPI 2 */}
                    <div className="bg-[#141829]/50 border border-white/5 rounded-xl p-3 flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-white/40 mb-1 text-[10px] uppercase font-bold tracking-widest">
                            <TrendingUp size={12} />
                            <span>Загальна потреба</span>
                        </div>
                        <div className="text-2xl font-mono font-bold text-[#FFB800]">
                            {analytics?.kpi?.totalNeed?.toLocaleString() ?? '-'}
                            <span className="text-[10px] text-white/30 ml-1">шт</span>
                        </div>
                    </div>
                    {/* KPI 3 */}
                    {/* KPI 3: Target Stock (Replaces Critical) */}
                    <div className="bg-[#141829]/50 border border-white/5 rounded-xl p-3 flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-white/40 mb-1 text-[10px] uppercase font-bold tracking-widest">
                            <Activity size={12} />
                            <span>Цільовий запас</span>
                        </div>
                        <div className="text-2xl font-mono font-bold text-[#00D4FF]">
                            {analytics?.kpi?.totalTarget?.toLocaleString() ?? '-'}
                            <span className="text-[10px] text-white/30 ml-1">шт</span>
                        </div>
                    </div>
                    {/* KPI 4 */}
                    <div className="bg-[#141829]/50 border border-white/5 rounded-xl p-3 flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-white/40 mb-1 text-[10px] uppercase font-bold tracking-widest">
                            <Percent size={12} />
                            <span>Рівень наповнення</span>
                        </div>
                        <div className={cn(
                            "text-2xl font-mono font-bold",
                            Number(analytics?.kpi?.fillLevel) >= 80 ? "text-emerald-400" : "text-[#FFB800]"
                        )}>
                            {analytics?.kpi?.fillLevel ?? '-'}%
                        </div>
                    </div>
                </div>

                {/* TOP 5 TABLE */}
                {analytics?.top5 && analytics.top5.length > 0 && (
                    <div className="bg-[#141829]/30 border border-white/5 rounded-xl p-3">
                        <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                            <TrendingUp size={12} className="text-[#E74856]" />
                            ТОП-5 Гарячих позицій
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {analytics.top5.map((item, idx) => (
                                <div key={idx} className="bg-[#141829] rounded p-2 border border-white/5 flex items-center justify-between">
                                    <div className="text-xs font-bold text-white truncate max-w-[100px]" title={item.pizza_name}>
                                        {item.pizza_name}
                                    </div>
                                    <div className="text-right leading-none">
                                        <div className={cn("font-mono font-bold", item.shop_stock <= 0 ? "text-[#E74856]" : "text-white")}>
                                            {item.shop_stock} шт
                                        </div>
                                        <div className="text-[9px] text-white/30 mt-0.5">Risk: {item.risk_index}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Header */}
            <div className="grid grid-cols-[3fr_1fr_1fr_1.5fr] gap-4 px-6 py-4 bg-[#1A1F3A] border-b border-white/5 text-[10px] uppercase font-bold tracking-widest text-white/40">
                <div>Назва піци</div>
                <div className="text-right text-[#E74856]">Дефіцит мережі</div>
                <div className="text-right text-[#00D4FF]">В цеху</div>
                <div className="text-center text-[#FFB800]">Заявка</div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {isStockLoading && !factoryStockData && (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-[#00D4FF]" /></div>
                )}

                {tableRows.map(row => (
                    <div key={row.id} className="grid grid-cols-[3fr_1fr_1fr_1.5fr] gap-4 items-center px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <div className="font-medium text-white/90">{row.name}</div>

                        <div className="text-right font-mono font-bold text-lg text-[#E74856]">
                            {row.networkDeficit > 0 ? row.networkDeficit : <span className="text-white/10">-</span>}
                        </div>

                        <div className="text-right font-mono font-bold text-lg text-[#00D4FF]">
                            {row.factoryStock > 0 ? row.factoryStock : <span className="text-white/10">-</span>}
                        </div>

                        <div className="flex justify-center">
                            <input
                                type="number"
                                value={productionPlan[row.id] || ''}
                                onChange={(e) => {
                                    const val = Math.max(0, Number(e.target.value));
                                    setProductionPlan(prev => ({ ...prev, [row.id]: val }));
                                }}
                                className={cn(
                                    "w-24 h-10 bg-[#0F1220] border border-white/10 rounded-lg text-center font-mono font-bold text-xl text-white focus:outline-none focus:border-[#FFB800] transition-all",
                                    (productionPlan[row.id] || 0) > 0 && "text-[#FFB800] border-[#FFB800]/50 bg-[#FFB800]/10"
                                )}
                                placeholder="-"
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#1A1F3A] border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div>
                        <div className="text-[10px] text-white/40 uppercase font-bold">Всього дефіцит</div>
                        <div className="text-xl font-mono font-bold text-[#E74856]">{totalDeficit}</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-white/40 uppercase font-bold">Всього в заявці</div>
                        <div className="text-xl font-mono font-bold text-[#FFB800]">{totalOrdered}</div>
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || totalOrdered === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-[#FFB800] hover:bg-[#FFB800]/90 text-black font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                    Сформувати
                </button>
            </div>
        </div>
    );
};
