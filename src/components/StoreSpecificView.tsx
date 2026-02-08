'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Package, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { ProductionTask, SKUCategory, CategoryGroup } from '@/types/bi';
import { cn } from '@/lib/utils';
import { UI_TOKENS } from '@/lib/design-tokens';

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
    useEffect(() => {
        if (categoryGroups.length > 0 && expandedCategories.size === 0) {
            setExpandedCategories(new Set([categoryGroups[0].categoryName]));
        }
    }, [categoryGroups]);


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
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0D1117] p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
                    {categoryGroups.map((category) => {
                        const isExpanded = expandedCategories.has(category.categoryName);

                        return (
                            <div
                                key={category.categoryName}
                                className={cn(
                                    "bg-[#161B22] border border-[#3A3A3A] rounded-xl overflow-hidden flex flex-col transition-all duration-300 relative group",
                                    isExpanded ? "col-span-1 md:col-span-2 xl:col-span-3 ring-1 ring-[#58A6FF]/50" : ""
                                )}
                            >
                                {/* Category Header (Clickable) */}
                                <div
                                    className={cn(
                                        "px-4 py-3 flex items-center justify-between cursor-pointer transition-colors select-none",
                                        isExpanded ? "bg-[#1C2128]" : "hover:bg-[#1C2128]"
                                    )}
                                    // Accordion behavior: click to toggle, only one active
                                    onClick={() => {
                                        setExpandedCategories(prev => {
                                            const next = new Set<string>();
                                            // If clicking the one that is already open, close it (empty set)
                                            // If clicking a new one, set it as the only item
                                            if (!prev.has(category.categoryName)) {
                                                next.add(category.categoryName);
                                            }
                                            return next;
                                        });
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <div className="text-[14px] font-bold text-[#E6EDF3] leading-tight mb-0.5">
                                                {category.categoryName}
                                            </div>
                                            <div className="text-[10px] text-[#8B949E] font-medium">
                                                {category.itemsCount} позицій
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={cn(
                                            "text-[14px] font-black",
                                            category.totalKg > 0 ? "text-[#58A6FF]" : "text-[#8B949E]"
                                        )}>
                                            {category.totalKg} кг
                                        </span>
                                        <div className={cn("transition-transform duration-300 text-[#8B949E]", isExpanded ? "rotate-180" : "")}>
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content: Product Grid (Inside Card) */}
                                {isExpanded && (
                                    <div className="p-3 bg-[#0D1117] border-t border-[#3A3A3A]/30 flex flex-col gap-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                                        {/* Adaptive Grid: fits more items horizontally when expanded */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                                            {category.items.map(item => {
                                                const storeData = item.stores[0];

                                                // Calculate Target and Percentage
                                                const target = storeData.currentStock + storeData.recommendedKg;
                                                const percentage = target === 0 ? 100 : (storeData.currentStock / target) * 100;

                                                // Determine Status
                                                const isCritical = percentage < 60; // Red
                                                const isWarning = percentage >= 60 && percentage < 90; // Yellow
                                                const isGood = percentage >= 90; // Green

                                                return (
                                                    <div
                                                        key={item.productCode}
                                                        className={cn(
                                                            "rounded-md p-2 border flex flex-col gap-1.5 transition-all relative overflow-hidden group",
                                                            isCritical
                                                                ? "bg-[#F85149]/10 border-[#F85149]/30 hover:border-[#F85149]/50"
                                                                : isWarning
                                                                    ? "bg-[#D29922]/10 border-[#D29922]/30 hover:border-[#D29922]/50"
                                                                    : "bg-[#238636]/10 border-[#238636]/30 hover:border-[#238636]/50" // Subtle green for good
                                                        )}
                                                    >
                                                        {/* Product Name */}
                                                        <div className="flex items-start justify-between gap-1 h-7">
                                                            <div className="flex items-center justify-center gap-1.5 w-full text-center">
                                                                <Package size={10} className="text-[#8B949E] shrink-0" />
                                                                <div className="text-[11px] font-bold text-[#E6EDF3] leading-tight line-clamp-2" title={item.name}>
                                                                    {item.name}
                                                                </div>
                                                            </div>
                                                            {isCritical && <AlertTriangle size={10} className="text-[#F85149] shrink-0" />}
                                                        </div>

                                                        {/* Metrics Grid */}
                                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-auto">
                                                            {/* Fact / Min */}
                                                            <div className="space-y-0.5">
                                                                <div className="flex justify-between items-baseline">
                                                                    <span className="text-[8px] text-[#8B949E] uppercase">Факт</span>
                                                                    <span className={cn(
                                                                        "text-[10px] font-bold font-mono",
                                                                        isCritical ? "text-[#F85149]" :
                                                                            isWarning ? "text-[#D29922]" : "text-[#3FB950]"
                                                                    )}>
                                                                        {storeData.currentStock.toFixed(0)}
                                                                    </span>
                                                                </div>
                                                                {/* Progress Bar */}
                                                                <div className="bg-[#3A3A3A]/50 h-1.5 rounded-full overflow-hidden w-full">
                                                                    <div
                                                                        className={cn("h-full rounded-full transition-all duration-500",
                                                                            isCritical ? "bg-[#F85149]" :
                                                                                isWarning ? "bg-[#D29922]" : "bg-[#3FB950]"
                                                                        )}
                                                                        style={{ width: `${percentage}%` }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Need */}
                                                            <div className="space-y-0.5 text-right">
                                                                <div className="flex justify-between items-baseline">
                                                                    <span className="text-[8px] text-[#8B949E] uppercase">Потреба</span>
                                                                    <span className={cn(
                                                                        "text-[11px] font-black font-mono",
                                                                        storeData.recommendedKg > 0 ? "text-[#58A6FF]" : "text-[#8B949E]"
                                                                    )}>
                                                                        {storeData.recommendedKg.toFixed(0)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Secondary Metrics (Min / Avg) */}
                                                        <div className="flex items-center justify-between pt-1 border-t border-[#3A3A3A]/20 mt-0.5">
                                                            <div className="flex gap-1 items-baseline">
                                                                <span className="text-[8px] text-[#8B949E]">Мін:</span>
                                                                <span className="text-[9px] text-[#E6EDF3] font-mono">{storeData.minStock.toFixed(0)}</span>
                                                            </div>
                                                            <div className="flex gap-1 items-baseline">
                                                                <span className="text-[8px] text-[#8B949E]">Сер:</span>
                                                                <span className="text-[9px] text-[#E6EDF3] font-mono">{storeData.avgSales.toFixed(1)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
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
