'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
    ChevronLeft,
    ShoppingBag,
    DollarSign,
    TrendingUp,
    Info,
    Package,
    ArrowUpRight,
    Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authedFetcher } from '@/lib/authed-fetcher';
import { useRouter, useSearchParams } from 'next/navigation';

interface ProductAnalytics {
    transaction_date: string;
    store_name: string;
    category: string;
    product_name: string;
    quantity_sold: number;
    revenue_generated: number;
    profit_generated: number;
    write_off_pct?: number;
    discount_pct?: number;
    trend_index?: number;
    is_bakery?: boolean;
}

interface Product {
    name: string;
    quantity: number;
    revenue: number;
    profit: number;
    writeOff?: number;
    discount?: number;
    trend?: number;
    isBakery?: boolean;
}

interface GalyaStoreCategoryDetailProps {
    storeName: string;
    categoryName: string;
}

export const GalyaStoreCategoryDetail = ({ storeName, categoryName }: GalyaStoreCategoryDetailProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const [metricType, setMetricType] = useState<'UAH' | 'PCS'>('UAH');

    const dateDisplay = React.useMemo(() => {
        if (startDateParam && endDateParam) {
            return `${new Date(startDateParam).toLocaleDateString('uk-UA')} — ${new Date(endDateParam).toLocaleDateString('uk-UA')}`;
        }
        return 'За 7 днів';
    }, [startDateParam, endDateParam]);

    // Fetch product-level data for this store and category
    const qs = new URLSearchParams();
    qs.set('store', storeName);
    qs.set('category', categoryName);
    if (startDateParam) qs.set('startDate', startDateParam);
    if (endDateParam) qs.set('endDate', endDateParam);

    const { data: productsData, isLoading } = useSWR<ProductAnalytics[]>(
        `/api/galya-baluvana/products?${qs.toString()}`,
        authedFetcher
    );

    const aggregatedProducts = React.useMemo(() => {
        if (!productsData) return [];
        const productMap = new Map<string, Product>();

        productsData.forEach(row => {
            const pName = row.product_name || 'Невідомий товар';
            const existing = productMap.get(pName) || {
                name: pName,
                revenue: 0,
                profit: 0,
                quantity: 0,
                writeOff: Number(row.write_off_pct) || 0,
                discount: Number(row.discount_pct) || 0,
                trend: Number(row.trend_index) || 0,
                isBakery: Boolean(row.is_bakery)
            };

            productMap.set(pName, {
                ...existing,
                revenue: existing.revenue + (Number(row.revenue_generated) || 0),
                profit: existing.profit + (Number(row.profit_generated) || 0),
                quantity: existing.quantity + (Number(row.quantity_sold) || 0)
            });
        });

        return Array.from(productMap.values())
            .sort((a, b) => b.revenue - a.revenue);
    }, [productsData]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                Завантаження аналітики по товарам...
            </div>
        );
    }

    const totalRev = aggregatedProducts.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalPcs = aggregatedProducts.reduce((acc, curr) => acc + curr.quantity, 0);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => router.back()}
                        className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/10 transition-all text-slate-400 hover:text-white group"
                    >
                        <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-[0.3em] font-mono">
                                {storeName}
                            </span>
                            <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] font-mono">
                                Категорія
                            </span>
                            <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                            <div className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-center gap-1">
                                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-[0.2em] font-mono">
                                    {dateDisplay}
                                </span>
                            </div>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter font-[family-name:var(--font-chakra)] leading-none">
                            {categoryName}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-[#131B2C] border border-white/10 p-1.5 rounded-xl self-start md:self-auto">
                    <button
                        onClick={() => setMetricType('UAH')}
                        className={cn(
                            "px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all",
                            metricType === 'UAH' ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "text-slate-400 hover:text-white"
                        )}
                    >
                        Гривні
                    </button>
                    <button
                        onClick={() => setMetricType('PCS')}
                        className={cn(
                            "px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all",
                            metricType === 'PCS' ? "bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]" : "text-slate-400 hover:text-white"
                        )}
                    >
                        Кількість
                    </button>
                </div>
            </div>

            {/* Summary Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-[#131B2C] border border-white/10 p-3 rounded-2xl flex flex-col justify-center">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">Виторг Категорії</div>
                    <div className="text-xl font-black text-white font-[family-name:var(--font-jetbrains)] leading-none">
                        {new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(totalRev)}
                    </div>
                </div>
                <div className="bg-[#131B2C] border border-white/10 p-3 rounded-2xl flex flex-col justify-center">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">Збут Категорії</div>
                    <div className="text-xl font-black text-white font-[family-name:var(--font-jetbrains)] flex items-baseline gap-1 leading-none">
                        {new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 }).format(totalPcs)}
                        <span className="text-[10px] text-slate-500 uppercase font-medium">кг/шт</span>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="bg-[#131B2C]/50 border border-white/10 rounded-2xl p-4 md:p-5 shadow-xl relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] -mr-16 -mt-16"></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                            <Package className="text-emerald-500" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-widest font-[family-name:var(--font-chakra)]">
                                Деталізація по товарам
                            </h3>
                            <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-mono mt-1">
                                Аналіз продажів кожної позиції в категорії
                            </p>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            {aggregatedProducts.length} позицій знайдено
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 relative z-10">
                    {aggregatedProducts.length === 0 ? (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-3xl bg-white/5">
                            <ShoppingBag size={48} className="mb-4 opacity-20" />
                            <p className="text-xl font-medium">Товари не знайдені</p>
                            <p className="text-sm opacity-60">Спробуйте змінити період або фільтри</p>
                        </div>
                    ) : (
                        aggregatedProducts.map((product: Product, index: number) => (
                            <div
                                key={index}
                                className="group relative bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-3 hover:bg-slate-800/60 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-0.5 overflow-hidden flex flex-col"
                            >
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Hash size={24} className="text-emerald-500" />
                                </div>

                                <div className="relative flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                                            <Package size={14} className="text-emerald-500" />
                                        </div>
                                        <div className="px-1.5 py-0.5 bg-slate-900/50 rounded-md border border-slate-700/50">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">#{index + 1}</span>
                                        </div>
                                    </div>

                                    <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 min-h-[2.5rem] leading-tight mb-2 pr-4">
                                        {product.name}
                                    </div>

                                    <div className="mt-auto space-y-2">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-medium leading-none mb-1">Виручка</span>
                                            <div className="text-base font-black text-white group-hover:text-emerald-400 transition-colors font-[family-name:var(--font-jetbrains)] leading-none">
                                                {new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(product.revenue)}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-2 border-t border-slate-700/50">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-medium">Кількість</span>
                                                <span className="text-xs font-semibold text-slate-200">
                                                    {product.quantity.toLocaleString()} {product.isBakery ? 'шт' : 'кг'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-medium">Сер. чек</span>
                                                <span className="text-xs font-semibold text-slate-200">
                                                    {Math.round(product.revenue / product.quantity).toLocaleString()} ₴
                                                </span>
                                            </div>

                                            {/* Bakery Specific Metrics */}
                                            {product.isBakery && (
                                                <>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] uppercase tracking-wider text-slate-500 font-medium tracking-tight whitespace-nowrap">Дисконт</span>
                                                        <span className={`text-xs font-bold ${(product.discount || 0) > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                            {product.discount || 0}%
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] uppercase tracking-wider text-slate-500 font-medium tracking-tight whitespace-nowrap">Списання</span>
                                                        <span className={`text-xs font-bold ${(product.writeOff || 0) > 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                            {product.writeOff || 0}%
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col col-span-2 sm:col-span-1">
                                                        <span className="text-[8px] uppercase tracking-wider text-slate-500 font-medium tracking-tight whitespace-nowrap">Тренд</span>
                                                        <span className={`text-xs font-bold ${(product.trend || 0) > 10 ? 'text-emerald-400' : (product.trend || 0) < 5 ? 'text-red-400' : 'text-blue-400'}`}>
                                                            {product.trend || 0}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/5 rounded-lg border border-emerald-500/10 mt-1">
                                            <div className="text-[8px] uppercase tracking-wider text-emerald-500/60 font-medium">Прибуток</div>
                                            <div className="text-xs font-bold text-emerald-400 ml-auto">
                                                +{new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(product.profit)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
