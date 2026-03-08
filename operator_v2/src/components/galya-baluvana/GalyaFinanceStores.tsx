'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Info, DollarSign, TrendingUp, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { authedFetcher } from '@/lib/authed-fetcher';

interface FinanceOverview {
    transaction_date: string;
    store_name: string;
    category: string;
    total_quantity: number;
    total_revenue: number;
    total_profit: number;
    margin_percent: number;
}

export const GalyaFinanceStores = () => {
    // Metric Toggle: 'UAH' | 'PCS' (ШТ)
    const [metricType, setMetricType] = useState<'UAH' | 'PCS'>('UAH');

    // Fetch the data from the newly created SQL view via API
    const { data: financeData, isLoading } = useSWR<FinanceOverview[]>(
        '/api/galya-baluvana/finance',
        authedFetcher
    );

    // Render logic for loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                Завантаження фінансової аналітики по магазинам...
            </div>
        );
    }

    // Aggregate by Store
    const aggregatedData = React.useMemo(() => {
        if (!financeData) return [];

        const storeMap = new Map<string, { total_revenue: number, total_profit: number, total_quantity: number }>();

        financeData.forEach(row => {
            const storeName = row.store_name || 'Невідомий магазин';

            const existing = storeMap.get(storeName) || { total_revenue: 0, total_profit: 0, total_quantity: 0 };

            storeMap.set(storeName, {
                total_revenue: existing.total_revenue + (Number(row.total_revenue) || 0),
                total_profit: existing.total_profit + (Number(row.total_profit) || 0),
                total_quantity: existing.total_quantity + (Number(row.total_quantity) || 0)
            });
        });

        const result = Array.from(storeMap.entries()).map(([store_name, stats]) => ({
            store_name,
            ...stats
        }));

        // Sort by revenue descending
        return result.sort((a, b) => b.total_revenue - a.total_revenue);
    }, [financeData]);

    const hasData = aggregatedData && aggregatedData.length > 0;
    const displayData = hasData ? aggregatedData : [
        { store_name: 'Немає даних', total_revenue: 0, total_profit: 0, total_quantity: 0 }
    ];

    const totalRev = displayData.reduce((acc, curr) => acc + curr.total_revenue, 0);
    const totalPcs = displayData.reduce((acc, curr) => acc + curr.total_quantity, 0);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Control Panel */}
            <div className="bg-[#131B2C] border border-white/10 p-4 rounded-xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 p-2 rounded-lg">
                        <Store className="text-emerald-500" size={24} />
                    </div>
                    <div>
                        <h2 className="text-white font-bold uppercase tracking-widest text-lg font-[family-name:var(--font-chakra)]">
                            Аналітика По Магазинам
                        </h2>
                        <p className="text-emerald-400/80 text-[10px] uppercase tracking-[0.2em] font-mono">
                            Store Performance Breakdown
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-lg">
                    <button
                        onClick={() => setMetricType('UAH')}
                        className={cn(
                            "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                            metricType === 'UAH' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-slate-400 hover:text-white"
                        )}
                    >
                        Гривні (UAH)
                    </button>
                    <button
                        onClick={() => setMetricType('PCS')}
                        className={cn(
                            "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                            metricType === 'PCS' ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-slate-400 hover:text-white"
                        )}
                    >
                        Штуки (PCS)
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-[#131B2C] to-[#0B0F19] border border-white/10 rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp size={64} className="text-emerald-500" />
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 font-mono">
                        {metricType === 'UAH' ? 'Загальний Обіг Мережі' : 'Загальний Збут Мережі (ШТ)'}
                    </div>
                    <div className="text-4xl font-black text-white font-[family-name:var(--font-jetbrains)]">
                        {metricType === 'UAH'
                            ? new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(totalRev)
                            : new Intl.NumberFormat('uk-UA').format(totalPcs) + ' шт'
                        }
                    </div>
                </div>
            </div>

            {/* Store Breakdown */}
            <div className="bg-[#131B2C] border border-white/10 rounded-xl p-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Продажі по Магазинам</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {displayData.map((item, idx) => {
                        const val = metricType === 'UAH' ? item.total_revenue : item.total_quantity;
                        const total = metricType === 'UAH' ? totalRev : totalPcs;
                        const percent = (val / total) * 100;

                        return (
                            <Link
                                key={idx}
                                href={`/dashboard/galya-baluvana/finance/stores/${encodeURIComponent(item.store_name)}`}
                                target="_blank"
                                className="bg-[#0B0F19] border border-white/5 p-4 rounded-lg flex flex-col gap-3 hover:border-emerald-500/50 hover:bg-[#131B2C] transition-all group cursor-pointer"
                            >
                                <div className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors" title={item.store_name}>
                                    {item.store_name}
                                </div>
                                <div className="text-2xl font-bold text-emerald-400 font-[family-name:var(--font-jetbrains)] flex flex-col">
                                    {metricType === 'UAH'
                                        ? new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(item.total_revenue)
                                        : <div className="flex items-baseline gap-1">
                                            <span>{new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 }).format(item.total_quantity)}</span>
                                            <span className="text-xs opacity-50 uppercase">кг/шт</span>
                                        </div>
                                    }
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-2">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                                </div>
                                <div className="text-[10px] text-slate-500 text-right font-mono">
                                    {percent.toFixed(1)}% від загальної суми
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Disclaimer for full connection */}
            {!hasData && (
                <div className="bg-[#131B2C] border border-white/10 rounded-xl p-5 min-h-[150px] flex flex-col justify-center items-center text-center mt-6">
                    <div className="bg-amber-500/10 p-4 rounded-full mb-4">
                        <Info className="text-amber-500" size={32} />
                    </div>
                    <h3 className="text-amber-400 font-bold uppercase tracking-widest mb-2 font-[family-name:var(--font-chakra)]">Очікується Підключення Бази</h3>
                    <p className="text-slate-400 text-sm max-w-sm">
                        Дані з транзакціями магазинів наразі не завантажені у схему categories.
                    </p>
                </div>
            )}
        </div>
    );
};
