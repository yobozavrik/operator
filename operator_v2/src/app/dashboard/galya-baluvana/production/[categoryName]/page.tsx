'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { ArrowLeft, Package, AlertTriangle, Layers, Pizza, Croissant } from 'lucide-react';
import { cn } from '@/lib/utils';
import { authedFetcher } from '@/lib/authed-fetcher';
import { format } from 'date-fns';
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface ProductProduction {
    product_name: string;
    total_quantity: number;
    total_batches: number;
    total_value: number;
    total_waste?: number;
    waste_pct?: number;
}

interface CategoryDetailResponse {
    categoryName: string;
    period?: { startDate: string, endDate: string };
    products: ProductProduction[];
}

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

const GalyaCategoryDetailContent = ({ categoryNameParam }: { categoryNameParam: string }) => {
    const decodedCategoryName = decodeURIComponent(categoryNameParam);
    const searchParams = useSearchParams();
    const startDateQuery = searchParams.get('startDate');
    const endDateQuery = searchParams.get('endDate');

    const today = new Date();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startDateQuery ? new Date(startDateQuery) : today,
        to: endDateQuery ? new Date(endDateQuery) : today,
    });

    const startDateStr = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
    const endDateStr = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : startDateStr;

    const { data: detailData, error, isLoading } = useSWR<CategoryDetailResponse>(
        `/api/galya-baluvana/production/${categoryNameParam}?startDate=${startDateStr}&endDate=${endDateStr}`,
        authedFetcher
    );

    // Sync dates from API (fallback)
    useEffect(() => {
        if (detailData?.period && startDateStr === format(today, 'yyyy-MM-dd') && detailData.period.startDate !== startDateStr) {
            setDateRange({
                from: new Date(detailData.period.startDate),
                to: new Date(detailData.period.endDate)
            });
        }
    }, [detailData?.period]);

    const meta = getCategoryMeta(decodedCategoryName);
    const IconComponent = meta.icon;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                Завантаження деталей категорії {decodedCategoryName}...
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-xl flex items-center justify-center">
                <AlertTriangle className="mr-3" />
                Помилка завантаження даних категорії {decodedCategoryName}
            </div>
        )
    }

    const products = detailData?.products || [];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Control Panel */}
            <div className="bg-[#131B2C] border border-white/10 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between shadow-lg gap-4">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/galya-baluvana/production?startDate=${startDateStr}&endDate=${endDateStr}`} className="text-slate-400 hover:text-white transition-colors p-2 bg-white/5 rounded-lg hover:bg-white/10">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className={cn("p-2 rounded-lg", meta.bgClass)}>
                        <IconComponent className={meta.colorClass} size={24} />
                    </div>
                    <div>
                        <h2 className="text-white font-bold uppercase tracking-widest text-lg font-[family-name:var(--font-chakra)]">
                            {decodedCategoryName}
                        </h2>
                        <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-mono">
                            Деталізація продукції
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 relative z-50">
                    <DatePickerWithRange
                        date={dateRange}
                        setDate={setDateRange}
                        className="w-[280px]"
                    />
                </div>
            </div>

            {products.length === 0 ? (
                <div className="bg-[#131B2C] border border-white/5 rounded-xl p-12 text-center flex flex-col items-center justify-center">
                    <Package className="text-slate-600 mb-4" size={48} />
                    <h3 className="text-slate-300 font-bold mb-2">Немає Вироблених Товарів</h3>
                    <p className="text-slate-500 text-sm">В обраний період не знайдено записів про виробництво для категорії {decodedCategoryName}.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {products.map((p, idx) => {
                        const wStyle = getWasteStyle(p.waste_pct);
                        return (
                            <div
                                key={idx}
                                className={cn(
                                    "bg-gradient-to-br from-[#131B2C] to-[#0B0F19] border rounded-2xl p-5 relative overflow-hidden group transition-all duration-300 shadow-lg",
                                    meta.borderClass,
                                    meta.glowClass
                                )}
                            >
                                {/* Background Number */}
                                <div className="absolute top-2 right-2 flex justify-end">
                                    <span className="text-[60px] font-black leading-none opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 tracking-tighter mix-blend-overlay" style={{ WebkitTextStroke: '1px currentColor' }}>
                                        {String(idx + 1).padStart(2, '0')}
                                    </span>
                                </div>

                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div>
                                        <h3 className="text-base font-bold text-white leading-tight mb-2 pr-8">
                                            {p.product_name}
                                        </h3>
                                    </div>
                                    <div className="mt-4 flex items-end justify-between border-t border-white/5 pt-4">
                                        <div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 font-mono">
                                                Вироблено
                                            </div>
                                            <div className={cn("text-2xl font-black font-[family-name:var(--font-jetbrains)] tracking-tighter", meta.colorClass)}>
                                                {new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 }).format(p.total_quantity)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 font-mono">
                                                Партій
                                            </div>
                                            <div className="text-lg font-bold text-white">
                                                {p.total_batches}
                                            </div>
                                        </div>
                                    </div>
                                    {p.total_waste !== undefined && (
                                        <div className={`mt-3 pt-2 flex justify-between items-center border-t px-3 py-1.5 rounded-md ${wStyle.containerClass}`}>
                                            <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Списання (Брак)</span>
                                            <span className="font-bold text-sm leading-none flex items-center gap-1.5">
                                                {Number(p.total_waste).toFixed(1)} <span className="text-[8px] opacity-70">шт/кг</span>
                                                {p.waste_pct !== undefined && p.waste_pct > 0 && (
                                                    <span className={`px-1 py-0.5 rounded text-[10px] ${wStyle.badgeClass}`}>
                                                        {Number(p.waste_pct).toFixed(1)}%
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default function GalyaCategoryDetailPage({ params }: { params: Promise<{ categoryName: string }> }) {
    const { categoryName } = React.use(params);

    return (
        <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                Підготовка сторінки...
            </div>
        }>
            <GalyaCategoryDetailContent categoryNameParam={categoryName} />
        </React.Suspense>
    );
}
