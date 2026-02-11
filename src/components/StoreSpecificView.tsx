'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Package, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { ProductionTask, SKUCategory, CategoryGroup } from '@/types/bi';
import { cn } from '@/lib/utils';
import { UI_TOKENS } from '@/lib/design-tokens';
import { StoreProductCard } from './graviton/StoreProductCard';

interface Props {
    queue: ProductionTask[];
    storeName: string;
}

export const StoreSpecificView = ({ queue, storeName }: Props) => {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    // Групуємо по категоріях
    const categoryGroups = useMemo((): CategoryGroup[] => {
        const categoryMap = new Map<SKUCategory, ProductionTask[]>();

        queue.forEach(item => {
            const categoryName = item.category || 'Інше';
            if (!categoryMap.has(categoryName)) {
                categoryMap.set(categoryName, []);
            }
            categoryMap.get(categoryName)!.push(item);
        });

        return Array.from(categoryMap.entries()).map(([categoryName, items]) => {
            const totalKg = items.reduce((sum, item) => sum + item.recommendedQtyKg, 0);

            return {
                categoryName,
                emoji: '',
                totalKg: Math.round(totalKg),
                itemsCount: items.length,
                items: items.sort((a, b) => (b.stores[0]?.avgSales || 0) - (a.stores[0]?.avgSales || 0))
            };
        }).sort((a, b) => b.totalKg - a.totalKg);
    }, [queue]);

    const totalWeight = useMemo(() => {
        return categoryGroups.reduce((sum, cat) => sum + cat.totalKg, 0);
    }, [categoryGroups]);

    const toggleCategory = (categoryName: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(categoryName)) {
                next.delete(categoryName);
            } else {
                next.add(categoryName);
            }
            return next;
        });
    };

    // Auto-expand first category if none expanded



    return (
        <div className="flex flex-col h-full bg-[#1A1A1A] rounded-xl border border-[#3A3A3A] overflow-hidden font-sans">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#3A3A3A] bg-[#111823] shrink-0">
                <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-black uppercase tracking-tighter text-[#E6EDF3] flex items-center gap-2">
                        🏪 {storeName}
                    </h3>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-[#8B949E] uppercase font-bold tracking-widest leading-none mb-1">
                            Всього до виробництва
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black leading-none text-[#58A6FF]">
                                {totalWeight}
                            </span>
                            <span className="text-[10px] text-[#8B949E] font-bold">кг</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content - GRID OF EXPANDABLE CARDS */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0D1117] p-2 sm:p-4 flex flex-col justify-center">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 w-full max-w-[1800px] mx-auto auto-rows-min">
                    {categoryGroups.map((category) => {
                        const isExpanded = expandedCategories.has(category.categoryName);

                        return (
                            <div
                                key={category.categoryName}
                                className={cn(
                                    "group/card rounded-xl overflow-hidden transition-all duration-300 border flex flex-col",
                                    isExpanded
                                        ? "col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 bg-[#161b22] border-[#58A6FF]/30 shadow-[0_8px_30px_rgba(0,0,0,0.5)] order-first md:order-none"
                                        : "col-span-1 bg-[#161b22]/60 hover:bg-[#161b22] border-white/5 hover:border-white/10 hover:shadow-lg hover:-translate-y-0.5"
                                )}
                            >
                                {/* Category Header (Clickable Card) */}
                                <div
                                    className={cn(
                                        "relative p-4 cursor-pointer flex flex-col h-full min-h-[100px]",
                                        isExpanded ? "border-b border-white/5 bg-[#1c2128]" : ""
                                    )}
                                    onClick={() => {
                                        setExpandedCategories(prev => {
                                            const next = new Set<string>();
                                            if (!prev.has(category.categoryName)) {
                                                next.add(category.categoryName);
                                            } else {
                                                next.delete(category.categoryName);
                                            }
                                            return next;
                                        });
                                    }}
                                >
                                    {/* Background glow when expanded */}
                                    {isExpanded && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#58A6FF]/5 via-transparent to-transparent pointer-events-none" />
                                    )}

                                    <div className="flex justify-between items-start mb-auto">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 shadow-inner",
                                                isExpanded ? "bg-[#58A6FF] text-white shadow-[0_0_15px_rgba(88,166,255,0.4)]" : "bg-white/5 text-white/40 group-hover/card:bg-white/10"
                                            )}>
                                                {isExpanded ? <ChevronDown size={18} /> : <Package size={18} />}
                                            </div>
                                            <div>
                                                <h3 className={cn("text-[14px] font-black uppercase tracking-wide leading-tight transition-colors", isExpanded ? "text-white" : "text-white/90 group-hover/card:text-white")}>
                                                    {category.categoryName}
                                                </h3>
                                                <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mt-0.5">
                                                    {category.itemsCount} позицій
                                                </p>
                                            </div>
                                        </div>

                                        {!isExpanded && (
                                            <div className="opacity-0 group-hover/card:opacity-100 transition-opacity -mr-2">
                                                <ChevronRight size={14} className="text-white/20" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-white/5 flex items-end justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-bold mb-0.5">До виробництва</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className={cn(
                                                    "text-xl font-black font-mono leading-none tracking-tight",
                                                    category.totalKg > 0 ? "text-[#58A6FF] drop-shadow-[0_0_8px_rgba(88,166,255,0.3)]" : "text-white/20"
                                                )}>
                                                    {category.totalKg}
                                                </span>
                                                <span className="text-[9px] font-bold text-white/20 uppercase">кг</span>
                                            </div>
                                        </div>

                                        {/* Mini progress bar decoration */}
                                        <div className="w-14 h-1 rounded-full bg-white/5 overflow-hidden">
                                            <div className="h-full bg-[#58A6FF]" style={{ width: `${Math.min(100, (category.totalKg / 50) * 100)}%`, opacity: category.totalKg > 0 ? 1 : 0 }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content: Product Grid (Inside Card) */}
                                {isExpanded && (
                                    <div className="p-4 bg-[#0d1117]/50 animate-in slide-in-from-top-2 duration-300">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                                            {category.items.map(item => (
                                                <StoreProductCard
                                                    key={item.productCode}
                                                    item={item}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-2 border-t border-[#3A3A3A] bg-[#111823]">
                <div className="text-center text-[10px] text-[#8B949E]">
                    📊 Перегляд товарів для магазину: <span className="text-[#58A6FF] font-bold">{storeName}</span>
                </div>
            </div>
        </div>
    );
};
