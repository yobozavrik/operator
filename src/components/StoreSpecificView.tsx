'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Package } from 'lucide-react';
import { ProductionTask, PriorityKey, SKUCategory, PriorityHierarchy, CategoryGroup } from '@/types/bi';
import { cn } from '@/lib/utils';
import { UI_TOKENS } from '@/lib/design-tokens';

const CATEGORY_EMOJI: Record<string, string> = {
    'ВАРЕНИКИ': '🥟',
    'ПЕЛЬМЕНІ': '🥢',
    'ХІНКАЛІ': '🥡',
    'ЧЕБУРЕКИ': '🌯',
    'КОВБАСКИ': '🌭',
    'ГОЛУБЦІ': '🥬',
    'КОТЛЕТИ': '🥩',
    'СИРНИКИ': '🥞',
    'ФРИКАДЕЛЬКИ': '🧆',
    'ЗРАЗИ': '🥔',
    'ПЕРЕЦЬ ФАРШИРОВАНИЙ': '🫑',
    'МЛИНЦІ': '🥞',
    'БЕНДЕРИКИ': '🌮'
};

const getEmoji = (category: string) => CATEGORY_EMOJI[category.toUpperCase()] || '📦';

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
                emoji: getEmoji(categoryName),
                totalKg: Math.round(totalKg),
                itemsCount: items.length,
                items: items.sort((a, b) => b.recommendedQtyKg - a.recommendedQtyKg)
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

    return (
        <div className="flex flex-col h-full bg-[#1A1A1A] rounded-xl border border-[#3A3A3A] overflow-hidden font-sans">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#3A3A3A] bg-[#111823]">
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0D1117]">
                {categoryGroups.map((category) => {
                    const isCategoryExpanded = expandedCategories.has(category.categoryName);

                    return (
                        <div key={category.categoryName} className="border-b border-[#3A3A3A]/50 last:border-0">
                            {/* Category Header */}
                            <div
                                className="px-6 py-4 bg-[#161B22] hover:bg-[#1C2128] cursor-pointer flex items-center justify-between transition-colors"
                                onClick={() => toggleCategory(category.categoryName)}
                            >
                                <div className="flex items-center gap-3">
                                    {isCategoryExpanded ?
                                        <ChevronDown size={16} className="text-[#8B949E]" /> :
                                        <ChevronRight size={16} className="text-[#8B949E]" />
                                    }
                                    <span className="text-[16px]">{category.emoji}</span>
                                    <span className="text-[13px] font-bold text-[#E6EDF3]">
                                        {category.categoryName}
                                    </span>
                                    <span className="text-[10px] text-[#8B949E]">
                                        ({category.itemsCount} поз.)
                                    </span>
                                </div>
                                <span className="text-[15px] font-black text-[#58A6FF]">
                                    {category.totalKg} кг
                                </span>
                            </div>

                            {/* Products */}
                            {isCategoryExpanded && (
                                <div className="bg-[#0D1117]">
                                    {category.items.map((item) => (
                                        <div
                                            key={item.productCode}
                                            className="px-6 py-3 border-b border-[#3A3A3A]/10 last:border-0 hover:bg-white/[0.02] transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <Package size={14} className="text-[#8B949E]" />
                                                    <span className="text-[12px] font-semibold text-[#E6EDF3]">
                                                        {item.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[9px] text-[#8B949E] uppercase font-bold tracking-wider">
                                                            Дефіцит
                                                        </span>
                                                        <span className="text-[11px] font-bold text-[#F85149]">
                                                            -{item.totalDeficitKg} кг
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[9px] text-[#8B949E] uppercase font-bold tracking-wider">
                                                            Рекомендовано
                                                        </span>
                                                        <span className="text-[13px] font-black text-[#58A6FF]">
                                                            {item.recommendedQtyKg} кг
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#3A3A3A] bg-[#111823]">
                <div className="text-center text-[10px] text-[#8B949E]">
                    📊 Перегляд товарів для магазину: <span className="text-[#58A6FF] font-bold">{storeName}</span>
                </div>
            </div>
        </div>
    );
};
