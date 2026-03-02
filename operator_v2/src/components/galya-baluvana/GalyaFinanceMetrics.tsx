'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { ChefHat, PieChart, Info, DollarSign, TrendingUp, Croissant, Pizza, ShoppingBag } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { cn } from '@/lib/utils';
import { authedFetcher } from '@/lib/authed-fetcher';
import { useSearchParams } from 'next/navigation';

// Define the API Response Type based on SQL View
interface FinanceOverview {
    transaction_date: string;
    store_name: string;
    category: string;
    total_quantity: number;
    total_revenue: number;
    total_profit: number;
    margin_percent: number;
}

interface KPIData {
    revenue: number;
    profit: number;
    margin_pct: number;
    checks: number;
    avg_check: number;
    discount: number;
    tips: number;
    guests: number;
}

interface KPIResponse {
    current: KPIData;
    previous: KPIData;
}

const calculateTrend = (current: number, previous: number) => {
    if (!previous || previous === 0) return { value: 100, isPositive: current > 0 };
    const diff = current - previous;
    const value = (diff / previous) * 100;
    return { value, isPositive: value >= 0 };
};

const GalyaFinanceMetricsContent = () => {
    // ... logic from before ...
    const [metricType, setMetricType] = useState<'UAH' | 'PCS'>('UAH');

    const searchParams = useSearchParams();
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const qs = new URLSearchParams();
    if (startDateParam) qs.set('startDate', startDateParam);
    if (endDateParam) qs.set('endDate', endDateParam);
    const queryString = qs.toString() ? `?${qs.toString()}` : '';

    // Fetch the data from the newly created SQL view via API
    const { data: financeData, isLoading: isLoadingFinance } = useSWR<FinanceOverview[]>(
        `/api/galya-baluvana/finance${queryString}`,
        authedFetcher
    );

    const { data: kpiData, isLoading: isLoadingKPI } = useSWR<KPIResponse>(
        `/api/galya-baluvana/finance/kpi${queryString}`,
        authedFetcher
    );

    // Render logic for loading state
    if (isLoadingFinance || isLoadingKPI) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                Завантаження фінансової аналітики...
            </div>
        );
    }

    // Aggregate the flat rows from the view into Categories
    // If the view returns multiple rows for the same category across different stores/dates,
    // we need to sum them up for the top-level Category Breakdown.
    const aggregatedData = React.useMemo(() => {
        if (!financeData) return [];

        const categoryMap = new Map<string, { total_revenue: number, total_profit: number, total_quantity: number }>();

        financeData.forEach(row => {
            // Null categories usually map to 'Інше' (Other)
            const catName = row.category || 'Інше';

            const existing = categoryMap.get(catName) || { total_revenue: 0, total_profit: 0, total_quantity: 0 };

            categoryMap.set(catName, {
                total_revenue: existing.total_revenue + (Number(row.total_revenue) || 0),
                total_profit: existing.total_profit + (Number(row.total_profit) || 0),
                total_quantity: existing.total_quantity + (Number(row.total_quantity) || 0)
            });
        });

        // Convert Map to Array
        const result = Array.from(categoryMap.entries()).map(([category, stats]) => ({
            category,
            ...stats
        }));

        // Sort by revenue descending
        return result.sort((a, b) => b.total_revenue - a.total_revenue);
    }, [financeData]);

    // Fallback UI if the view is not yet seeded (Still keeping minimal Mock for absolute empty DBs)
    const hasData = aggregatedData && aggregatedData.length > 0;

    const displayData = hasData ? aggregatedData : [
        { category: 'Немає даних', total_revenue: 0, total_profit: 0, total_quantity: 0 }
    ];

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

    const totalRev = displayData.reduce((acc, curr) => acc + curr.total_revenue, 0);
    const totalPcs = displayData.reduce((acc, curr) => acc + curr.total_quantity, 0);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Control Panel */}
            <div className="bg-[#131B2C] border border-white/10 p-4 rounded-xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 p-2 rounded-lg">
                        <DollarSign className="text-emerald-500" size={24} />
                    </div>
                    <div>
                        <h2 className="text-white font-bold uppercase tracking-widest text-lg font-[family-name:var(--font-chakra)]">
                            Сводна Фінансова Аналітика
                        </h2>
                        <p className="text-emerald-400/80 text-[10px] uppercase tracking-[0.2em] font-mono">
                            Revenue & Profit Overview
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

            {/* KPI Cards (Bento Style) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Загальна Виручка */}
                <div className="bg-gradient-to-br from-[#131B2C] to-[#0B0F19] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-lg col-span-2">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign size={80} className="text-emerald-500" />
                    </div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest font-mono">
                            Загальна Виручка
                        </div>
                        {kpiData && (
                            <div className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                calculateTrend(kpiData.current.revenue, kpiData.previous.revenue).isPositive
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-rose-500/20 text-rose-400"
                            )}>
                                {calculateTrend(kpiData.current.revenue, kpiData.previous.revenue).isPositive ? '+' : ''}
                                {calculateTrend(kpiData.current.revenue, kpiData.previous.revenue).value.toFixed(1)}%
                            </div>
                        )}
                    </div>
                    <div className="text-4xl md:text-5xl font-black text-white font-[family-name:var(--font-jetbrains)] tracking-tighter relative z-10">
                        {kpiData?.current.revenue
                            ? new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(kpiData.current.revenue)
                            : '0 ₴'}
                    </div>
                </div>

                {/* 2. Чистий Прибуток */}
                <div className="bg-gradient-to-br from-[#131B2C] to-[#0B0F19] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-lg col-span-2">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp size={80} className="text-emerald-500" />
                    </div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest font-mono">
                            Чистий Прибуток
                        </div>
                        {kpiData && (
                            <div className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                calculateTrend(kpiData.current.profit, kpiData.previous.profit).isPositive
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-rose-500/20 text-rose-400"
                            )}>
                                {calculateTrend(kpiData.current.profit, kpiData.previous.profit).isPositive ? '+' : ''}
                                {calculateTrend(kpiData.current.profit, kpiData.previous.profit).value.toFixed(1)}%
                            </div>
                        )}
                    </div>
                    <div className="text-4xl md:text-5xl font-black text-white font-[family-name:var(--font-jetbrains)] tracking-tighter relative z-10">
                        {kpiData?.current.profit
                            ? new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(kpiData.current.profit)
                            : '0 ₴'}
                    </div>
                </div>

                {/* 3. Маржинальність */}
                <div className="bg-[#131B2C] border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-white/20 transition-all">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 font-mono">
                        Маржинальність
                    </div>
                    <div className="flex items-end justify-between">
                        <div className="text-2xl font-black text-emerald-400 font-[family-name:var(--font-jetbrains)] tracking-tighter">
                            {kpiData?.current.margin_pct ? kpiData.current.margin_pct.toFixed(1) : '0'}%
                        </div>
                        {kpiData && (
                            <div className="text-[10px] text-slate-500">
                                Було {kpiData.previous.margin_pct.toFixed(1)}%
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Всього Чеків */}
                <div className="bg-[#131B2C] border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-white/20 transition-all">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 font-mono">
                        Всього Чеків
                    </div>
                    <div className="flex items-end justify-between">
                        <div className="text-2xl font-black text-white font-[family-name:var(--font-jetbrains)] tracking-tighter">
                            {new Intl.NumberFormat('uk-UA').format(kpiData?.current.checks || 0)}
                        </div>
                        {kpiData && (
                            <div className={cn(
                                "text-[10px] font-bold",
                                calculateTrend(kpiData.current.checks, kpiData.previous.checks).isPositive ? "text-emerald-400" : "text-rose-400"
                            )}>
                                {calculateTrend(kpiData.current.checks, kpiData.previous.checks).isPositive ? '+' : ''}
                                {calculateTrend(kpiData.current.checks, kpiData.previous.checks).value.toFixed(1)}%
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. Середній Чек */}
                <div className="bg-[#131B2C] border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-white/20 transition-all">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 font-mono">
                        Середній Чек
                    </div>
                    <div className="flex items-end justify-between">
                        <div className="text-2xl font-black text-white font-[family-name:var(--font-jetbrains)] tracking-tighter">
                            {new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(kpiData?.current.avg_check || 0)}
                        </div>
                        {kpiData && (
                            <div className={cn(
                                "text-[10px] font-bold",
                                calculateTrend(kpiData.current.avg_check, kpiData.previous.avg_check).isPositive ? "text-emerald-400" : "text-rose-400"
                            )}>
                                {calculateTrend(kpiData.current.avg_check, kpiData.previous.avg_check).isPositive ? '+' : ''}
                                {calculateTrend(kpiData.current.avg_check, kpiData.previous.avg_check).value.toFixed(1)}%
                            </div>
                        )}
                    </div>
                </div>

                {/* 6. Знижки та Чайові */}
                <div className="bg-[#131B2C] border border-white/10 rounded-2xl p-4 flex flex-col justify-center space-y-2 hover:border-white/20 transition-all">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Знижки</span>
                        <span className="text-amber-400 font-bold font-mono">
                            {new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(kpiData?.current.discount || 0)}
                        </span>
                    </div>
                    <div className="h-px w-full bg-white/5"></div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Чайові</span>
                        <span className="text-emerald-400 font-bold font-mono">
                            {new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(kpiData?.current.tips || 0)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#131B2C] border border-white/10 rounded-xl p-5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Продажі по категоріям</h3>
                    <div className="space-y-4">
                        {displayData.map((item, idx) => {
                            const Icon = categoryIcons[item.category] || categoryIcons['default'];
                            const val = metricType === 'UAH' ? item.total_revenue : item.total_quantity;
                            const total = metricType === 'UAH' ? totalRev : totalPcs;
                            const percent = (val / total) * 100;

                            return (
                                <div key={idx} className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-white/5 p-1.5 rounded-md text-slate-300">
                                                <Icon size={16} />
                                            </div>
                                            <span className="text-sm font-semibold text-white uppercase tracking-wider">{item.category}</span>
                                        </div>
                                        <div className="text-sm font-bold text-emerald-400 font-[family-name:var(--font-jetbrains)] text-right">
                                            {metricType === 'UAH'
                                                ? new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(item.total_revenue)
                                                : <div>
                                                    {new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 }).format(item.total_quantity)}
                                                    <span className="text-[10px] ml-1 opacity-60">кг/шт</span>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-[#131B2C] border border-white/10 rounded-xl p-5 min-h-[300px] flex flex-col justify-center items-center text-center">
                    <div className="bg-amber-500/10 p-4 rounded-full mb-4">
                        <Info className="text-amber-500" size={32} />
                    </div>
                    <h3 className="text-amber-400 font-bold uppercase tracking-widest mb-2 font-[family-name:var(--font-chakra)]">Очікується Підключення Бази</h3>
                    <p className="text-slate-400 text-sm max-w-sm">
                        Для повного відображення графіка маржинальності та чистого прибутку, необхідно завантажити дані з Poster POS або KeyCRM у створену SQL-таблицю gb_sales_transactions.
                    </p>
                </div>
            </div>
        </div>
    );
};

export const GalyaFinanceMetrics = () => {
    return (
        <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                Завантаження фінансової аналітики...
            </div>
        }>
            <GalyaFinanceMetricsContent />
        </React.Suspense>
    );
};
