'use client';

import React, { useMemo } from 'react';
import useSWR from 'swr';
import { SidebarBI } from '@/components/SidebarBI';
import { BIGauge, BIStatCard } from '@/components/BIPanels';
import { BIPowerMatrix } from '@/components/BIPowerMatrix';
import { BIInsights } from '@/components/BIInsights';
import { ProductionTask, SKUCategory } from '@/lib/data';
import { Users, AlertTriangle, Cpu, TrendingUp, Clock } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Функция определения приоритета на основе данных
function calculatePriority(row: any): 'critical' | 'high' | 'reserve' | 'normal' {
    const currentStock = Number(row.current_stock);
    const minStock = Number(row.min_stock);
    const avgSalesDay = Number(row.avg_sales_day);

    // 🔴 КРИТИЧНО: нет товара или ниже минимума
    if (currentStock === 0 || currentStock < minStock) {
        return 'critical';
    }

    // 🟠 ВАЖЛИВО: близко к минимуму (< 30% запаса) + ходовой товар (продажи > 3 кг/день)
    if (currentStock < minStock * 1.3 && avgSalesDay > 3) {
        return 'high';
    }

    // 🔵 РЕЗЕРВ: есть запас, но не слишком много (от 30% до 100% запаса)
    if (currentStock < minStock * 2.0) {
        return 'reserve';
    }

    // 🟢 НОРМА: большой запас (> 100% от минимума)
    return 'normal';
}

export default function BIDashboard() {
    const { data: deficitData, error: deficitError } = useSWR(
        '/api/graviton/deficit',
        fetcher,
        { refreshInterval: 30000 }
    );

    const { data: metrics, error: metricsError } = useSWR(
        '/api/graviton/metrics',
        fetcher,
        { refreshInterval: 30000 }
    );

    const queue = useMemo(() => {
        if (!deficitData || !Array.isArray(deficitData)) return [];
        return deficitData.map((row: any) => {
            const calculatedPriority = calculatePriority(row);

            return {
                id: `${row.код_продукту}-${row.код_магазину}`,
                name: row.назва_продукту,
                category: row.category_name as SKUCategory,
                totalStockKg: Number(row.current_stock),
                dailyForecastKg: Number(row.avg_sales_day),
                minStockThresholdKg: Number(row.min_stock),
                outOfStockStores: Number(row.current_stock) === 0 ? 1 : 0,
                salesTrendKg: [row.avg_sales_day],
                storeStocks: { [row.назва_магазину]: Number(row.current_stock) },
                recommendedQtyKg: Number(row.deficit_kg),
                priority: calculatedPriority,
                storeName: row.назва_магазину,
                priorityReason: `Store: ${row.назва_магазину}`,
                status: 'pending' as const,
                deficitPercent: Number(row.deficit_percent)
            } as ProductionTask & { deficitPercent: number };
        });
    }, [deficitData]);

    if (deficitError || metricsError) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#1e1e1e] text-[#e74856] font-bold uppercase tracking-widest">
                Data Fetch Error | Supabase Offline
            </div>
        );
    }

    if (!deficitData || !metrics) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#1e1e1e] text-slate-600 font-bold uppercase tracking-widest animate-pulse">
                Initializing BI Engine...
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#1e1e1e] text-slate-400 font-sans selection:bg-[#00bcf2] selection:text-white overflow-hidden">
            <SidebarBI />

            <main className="flex-1 flex flex-col min-w-0 p-4 gap-4 h-screen overflow-hidden">
                {/* Header Info */}
                <div className="flex justify-between items-center px-1 border-b border-[#3e3e42] pb-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-[16px] font-bold text-white uppercase tracking-tight">Production Analytics Platform</h1>
                        <span className="px-2 py-0.5 bg-[#00bcf2]/10 text-[#00bcf2] text-[11px] font-bold rounded border border-[#00bcf2]/20">PRO EDITION</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
                            <Clock size={13} />
                            <span>LAST SYNC: {new Date(metrics.lastUpdate).toLocaleTimeString('ru-RU')}</span>
                        </div>
                    </div>
                </div>

                {/* Top Statistics Row */}
                <div className="grid grid-cols-12 gap-4 h-36 flex-shrink-0">
                    <div className="col-span-12 lg:col-span-3">
                        <BIGauge value={metrics.shopLoad} max={450} />
                    </div>
                    <div className="col-span-12 lg:col-span-9 grid grid-cols-3 gap-4">
                        <BIStatCard
                            label="Shop Load"
                            value={`${metrics.shopLoad} KG`}
                            subValue="Target 450"
                            icon={TrendingUp}
                            colorClass="text-[#00bcf2]"
                        />
                        <BIStatCard
                            label="Active Personnel"
                            value={metrics.personnel}
                            subValue="Standard Shift"
                            icon={Users}
                        />
                        <BIStatCard
                            label="Critical Alerts"
                            value={metrics.criticalSKUs}
                            subValue="Positions at Risk"
                            icon={AlertTriangle}
                            colorClass="text-[#e74856]"
                        />
                    </div>
                </div>

                {/* Main Content Area: Matrix + Insights */}
                <div className="flex-1 overflow-hidden grid grid-cols-12 gap-4 min-h-0">
                    <div className="col-span-12 lg:col-span-8 overflow-hidden h-full">
                        <BIPowerMatrix queue={queue} />
                    </div>
                    <div className="col-span-12 lg:col-span-4 overflow-y-auto custom-scrollbar h-full pr-1">
                        <BIInsights queue={queue} />
                    </div>
                </div>
            </main>
        </div>
    );
}
