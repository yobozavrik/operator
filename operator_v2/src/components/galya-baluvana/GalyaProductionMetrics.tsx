'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Factory, AlertTriangle, Layers, Pizza, Croissant, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { authedFetcher } from '@/lib/authed-fetcher';
import { format } from 'date-fns';
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import Link from 'next/link';

interface CategoryProduction {
    category_name: string;
    total_quantity: number;
    total_batches: number;
    total_value: number;
    total_waste?: number;
    waste_pct?: number;
}

interface ProductionResponse {
    categories: CategoryProduction[];
    period?: { startDate: string, endDate: string };
}

// Function to map category name to an icon and color
const getCategoryMeta = (categoryName: string) => {
    const nameStr = categoryName.toLowerCase();

    if (nameStr.includes('піца')) return { icon: Pizza, colorClass: 'text-emerald-500', bgClass: 'bg-emerald-500/20', borderClass: 'border-emerald-500/20', glowClass: 'hover:border-emerald-500/50' };
    if (nameStr.includes('хліб')) return { icon: Croissant, colorClass: 'text-blue-500', bgClass: 'bg-blue-500/20', borderClass: 'border-blue-500/20', glowClass: 'hover:border-blue-500/50' };
    if (nameStr.includes('вареники') || nameStr.includes('пельмені') || nameStr.includes('млинці')) return { icon: Layers, colorClass: 'text-amber-500', bgClass: 'bg-amber-500/20', borderClass: 'border-amber-500/20', glowClass: 'hover:border-amber-500/50' };

    return { icon: Package, colorClass: 'text-purple-500', bgClass: 'bg-purple-500/20', borderClass: 'border-purple-500/20', glowClass: 'hover:border-purple-500/50' };
};

const getWasteStyle = (pct: number | undefined) => {
    if (pct === undefined || pct === 0) return {
        containerClass: 'text-slate-400 bg-slate-900/30 border-slate-500/20',
        badgeClass: 'bg-slate-500/20 text-slate-300'
    };
    if (pct < 10) return {
        containerClass: 'text-emerald-400/90 bg-emerald-950/30 border-emerald-500/20',
        badgeClass: 'bg-emerald-500/20 text-emerald-400'
    };
    if (pct <= 13) return {
        containerClass: 'text-amber-400/90 bg-amber-950/30 border-amber-500/20',
        badgeClass: 'bg-amber-500/20 text-amber-400'
    };
    return {
        containerClass: 'text-rose-400/90 bg-rose-950/30 border-rose-500/20',
        badgeClass: 'bg-rose-500/20 text-rose-400'
    };
};

export const GalyaProductionMetrics = () => {
    const today = new Date();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: today,
        to: today,
    });

    const startDateStr = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
    const endDateStr = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : startDateStr;

    // Fetch the data from the newly created SQL view via API
    const { data: prodData, error, isLoading } = useSWR<ProductionResponse>(
        `/api/galya-baluvana/production?startDate=${startDateStr}&endDate=${endDateStr}`,
        authedFetcher
    );

    // If API returns a different default date (e.g. yesterday because no data today), sync it back to the picker initially
    useEffect(() => {
        // Only sync if picker is on "today" but API says it fetched a different period
        if (prodData?.period && startDateStr === format(today, 'yyyy-MM-dd') && prodData.period.startDate !== startDateStr) {
            setDateRange({
                from: new Date(prodData.period.startDate),
                to: new Date(prodData.period.endDate)
            });
        }
    }, [prodData?.period]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                Завантаження виробничих показників...
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-xl flex items-center justify-center">
                <AlertTriangle className="mr-3" />
                Помилка завантаження даних виробництва
            </div>
        )
    }

    const categories = prodData?.categories || [];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Control Panel */}
            <div className="bg-[#131B2C] border border-white/10 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between shadow-lg gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-500/10 p-2 rounded-lg">
                        <Factory className="text-blue-500" size={24} />
                    </div>
                    <div>
                        <h2 className="text-white font-bold uppercase tracking-widest text-lg font-[family-name:var(--font-chakra)]">
                            Сводна Виробнича Аналітика
                        </h2>
                        <p className="text-blue-400/80 text-[10px] uppercase tracking-[0.2em] font-mono">
                            Fact Production Overview (Phase 1)
                        </p>
                    </div>
                </div>

                {/* DateRangePicker implementation */}
                <div className="flex items-center gap-2 relative z-50">
                    <DatePickerWithRange
                        date={dateRange}
                        setDate={setDateRange}
                        className="w-[280px]"
                    />
                </div>
            </div>

            {/* Dynamic Factories Grid */}
            {categories.length === 0 ? (
                <div className="bg-[#131B2C] border border-white/10 p-12 rounded-xl text-center text-slate-400">
                    На обраний період немає даних про фактичне виробництво.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((cat, idx) => {
                        const meta = getCategoryMeta(cat.category_name);
                        const wStyle = getWasteStyle(cat.waste_pct);
                        const IconComponent = meta.icon;
                        const drillDownUrl = `/dashboard/galya-baluvana/production/${encodeURIComponent(cat.category_name)}?startDate=${startDateStr}&endDate=${endDateStr}`;

                        return (
                            <Link
                                href={drillDownUrl}
                                key={idx}
                                className={`block bg-gradient-to-br from-[#131B2C] to-[#0B0F19] border border-white/10 rounded-2xl p-6 relative overflow-hidden group transition-colors shadow-lg hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] ${meta.glowClass}`}
                            >
                                <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 scale-100 group-hover:scale-110 ${meta.colorClass}`}>
                                    <IconComponent size={100} />
                                </div>

                                <div className="flex items-center gap-2 mb-6 relative z-10 text-white/80 group-hover:text-white transition-colors">
                                    <div className={`p-2 rounded-lg border transition-all ${meta.bgClass} ${meta.colorClass} ${meta.borderClass} group-hover:scale-110`}>
                                        <IconComponent size={20} />
                                    </div>
                                    <h3 className="font-bold uppercase tracking-widest font-[family-name:var(--font-chakra)] text-sm">
                                        {cat.category_name}
                                    </h3>
                                </div>

                                <div className="mb-4 relative z-10">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Вироблено (Факт)</span>
                                        <span className={`text-3xl font-black font-[family-name:var(--font-jetbrains)] transition-colors ${meta.colorClass}`}>
                                            {Number(cat.total_quantity).toFixed(0)} <span className="text-sm opacity-60">шт/кг</span>
                                        </span>
                                    </div>
                                    {/* Placeholder line until we have Plan data in Phase 2 */}
                                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2 relative">
                                        <div className={`absolute left-0 top-0 h-full w-full opacity-20 transition-all duration-700 group-hover:opacity-100 ${meta.bgClass.replace('/20', '')}`} />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 mt-6 border-t border-white/5 pt-4 relative z-10">
                                    <div className="flex justify-between text-xs font-mono">
                                        <span className="text-slate-400">Кількість партій</span>
                                        <span className="text-slate-300 font-bold">{cat.total_batches}</span>
                                    </div>
                                    {cat.total_waste !== undefined && (
                                        <div className={`flex justify-between text-xs font-mono mb-2 p-1.5 rounded-md border ${wStyle.containerClass}`}>
                                            <span>Списання (Брак)</span>
                                            <span className="font-bold">
                                                {Number(cat.total_waste).toFixed(1)} <span className="text-[10px] opacity-70">шт</span>
                                                {cat.waste_pct !== undefined && cat.waste_pct > 0 && (
                                                    <span className={`ml-1 opacity-80 backdrop-blur-sm px-1 py-0.5 rounded text-[10px] ${wStyle.badgeClass}`}>
                                                        {Number(cat.waste_pct).toFixed(1)}%
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-xs font-mono">
                                        <span className="text-slate-400">Оціночна вартість (ГРН)</span>
                                        <span className={`${meta.colorClass} font-bold`}>{new Intl.NumberFormat('uk-UA').format(cat.total_value)}</span>
                                    </div>

                                    {/* Phase 2 Data placeholders */}
                                    <div className="mt-2 text-[9px] text-slate-500 uppercase tracking-widest bg-black/20 p-2 rounded border border-white/5 text-center transition-colors group-hover:border-white/10 group-hover:text-slate-400">
                                        Деталізація продукції →
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    );
};
