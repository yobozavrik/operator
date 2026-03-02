'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
    ChevronLeft,
    PieChart,
    DollarSign,
    TrendingUp,
    ShoppingBag,
    Pizza,
    Croissant,
    Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authedFetcher } from '@/lib/authed-fetcher';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface FinanceOverview {
    transaction_date: string;
    store_name: string;
    category: string;
    total_quantity: number;
    total_revenue: number;
    total_profit: number;
    margin_percent: number;
}

interface GalyaStoreDetailProps {
    storeName: string;
}

export const GalyaStoreDetail = ({ storeName }: GalyaStoreDetailProps) => {
    const router = useRouter();
    const [metricType, setMetricType] = useState<'UAH' | 'PCS'>('UAH');

    // Fetch store-specific data
    const { data: financeData, isLoading } = useSWR<FinanceOverview[]>(
        `/api/galya-baluvana/finance?store=${encodeURIComponent(storeName)}`,
        authedFetcher
    );

    const categoryIcons: Record<string, any> = {
        'Піца': Pizza,
        'Піца (напівфабрикати)': Pizza,
        'Хліб': Croissant,
        'Випічка': Croissant,
        'Напівфабрикати': ShoppingBag,
        'Напівфабрикат': ShoppingBag,
        'Десерти': PieChart,
        'default': ShoppingBag
    };

    const aggregatedData = React.useMemo(() => {
        if (!financeData) return [];
        const categoryMap = new Map<string, { total_revenue: number, total_profit: number, total_quantity: number }>();

        financeData.forEach(row => {
            const catName = row.category || 'Без категорії';
            const existing = categoryMap.get(catName) || { total_revenue: 0, total_profit: 0, total_quantity: 0 };
            categoryMap.set(catName, {
                total_revenue: existing.total_revenue + (Number(row.total_revenue) || 0),
                total_profit: existing.total_profit + (Number(row.total_profit) || 0),
                total_quantity: existing.total_quantity + (Number(row.total_quantity) || 0)
            });
        });

        return Array.from(categoryMap.entries())
            .map(([category, stats]) => ({ category, ...stats }))
            .sort((a, b) => b.total_revenue - a.total_revenue);
    }, [financeData]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                Завантаження детальної аналітики магазину...
            </div>
        );
    }

    const totalRev = aggregatedData.reduce((acc, curr) => acc + curr.total_revenue, 0);
    const totalPcs = aggregatedData.reduce((acc, curr) => acc + curr.total_quantity, 0);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Back Link */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/10 transition-all text-slate-400 hover:text-white"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-white uppercase tracking-wider font-[family-name:var(--font-chakra)]">
                            {storeName}
                        </h1>
                        <p className="text-emerald-400 text-[10px] font-mono uppercase tracking-[0.2em]">
                            Аналітика Точки Продажу
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

            {/* KPI Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-[#131B2C] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp size={120} className="text-emerald-500" />
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 font-mono">
                        Обіг (7 днів)
                    </div>
                    <div className="text-3xl font-black text-white font-[family-name:var(--font-jetbrains)]">
                        {new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(totalRev)}
                    </div>
                </div>

                <div className="bg-[#131B2C] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShoppingBag size={120} className="text-amber-500" />
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 font-mono">
                        Кількість збуту
                    </div>
                    <div className="text-3xl font-black text-white font-[family-name:var(--font-jetbrains)] flex items-baseline gap-2">
                        {new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 }).format(totalPcs)}
                        <span className="text-sm font-medium text-slate-500 uppercase">кг/шт</span>
                    </div>
                </div>
            </div>

            {/* Category Cards Grid */}
            <div className="bg-[#131B2C]/50 border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <PieChart className="text-emerald-500" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white uppercase tracking-widest font-[family-name:var(--font-chakra)]">
                            Продажі по категоріям
                        </h3>
                        <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-mono mt-1">
                            Клікніть на категорію для деталізації по товарам
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {aggregatedData.length > 0 ? aggregatedData.map((item, idx) => {
                        const Icon = categoryIcons[item.category] || categoryIcons['default'];
                        const val = metricType === 'UAH' ? item.total_revenue : item.total_quantity;
                        const total = metricType === 'UAH' ? totalRev : totalPcs;
                        const percent = total > 0 ? (val / total) * 100 : 0;

                        return (
                            <Link
                                key={idx}
                                href={`/dashboard/galya-baluvana/finance/stores/${encodeURIComponent(storeName)}/${encodeURIComponent(item.category)}`}
                                target="_blank"
                                className="group relative bg-[#0B0F19] border border-white/5 rounded-2xl p-6 transition-all duration-300 hover:border-emerald-500/50 hover:bg-[#131B2C] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:-translate-y-1 cursor-pointer overflow-hidden"
                            >
                                {/* Decorative Background Icon */}
                                <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                    <Icon size={120} />
                                </div>

                                <div className="relative z-10 flex flex-col h-full gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="bg-white/5 p-2.5 rounded-xl text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all duration-300">
                                            <Icon size={20} />
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-500 font-mono tracking-tighter">
                                            {percent.toFixed(1)}% долі
                                        </div>
                                    </div>

                                    <div className="space-y-1 mt-2">
                                        <span className="text-sm font-bold text-white uppercase tracking-wider group-hover:text-emerald-400 transition-colors block truncate">
                                            {item.category}
                                        </span>
                                        <div className="text-xl font-black text-emerald-400 font-[family-name:var(--font-jetbrains)]">
                                            {metricType === 'UAH'
                                                ? new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(item.total_revenue)
                                                : <div className="flex items-baseline gap-1">
                                                    {new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 }).format(item.total_quantity)}
                                                    <span className="text-[10px] opacity-50 uppercase">кг/шт</span>
                                                </div>
                                            }
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-white/5">
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)] group-hover:bg-emerald-400"
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    }) : (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-3xl bg-white/5">
                            <Info size={48} className="mb-4 opacity-10" />
                            <p className="text-lg font-medium tracking-wide">Дані відсутні</p>
                            <p className="text-xs text-slate-600 uppercase tracking-widest mt-1">Оберіть інший період або точку</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
