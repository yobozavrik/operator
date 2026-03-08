import React, { useState, useMemo, useEffect } from 'react';
import { ProductionTask } from '@/types/bi';
import { StoreProductCard } from './graviton/StoreProductCard';
import { Package, X, Store, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
    queue: ProductionTask[];
    storeName: string;
}

export const StoreSpecificView = ({ queue, storeName }: Props) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Group items by broad category based on naming conventions
    const categoriesMap = useMemo(() => {
        const map = new Map<string, {
            categoryName: string;
            items: ProductionTask[];
            totalKg: number;
            totalFact: number;
            itemsCount: number;
        }>();

        queue.forEach(item => {
            let cat = 'Інше';
            const nameLower = item.name.toLowerCase();

            if (nameLower.includes('вареники')) cat = 'Вареники';
            else if (nameLower.includes('млинці')) cat = 'Млинці';
            else if (nameLower.includes('котлети')) cat = 'Котлети';
            else if (nameLower.includes('сирники')) cat = 'Сирники';
            else if (nameLower.includes('хінкалі')) cat = 'Хінкалі';
            else if (nameLower.includes('пельмені')) cat = 'Пельмені';
            else if (nameLower.includes('зрази')) cat = 'Зрази';
            else if (nameLower.includes('ковбас')) cat = 'Ковбаси';
            else if (nameLower.includes('голубці')) cat = 'Голубці';
            else if (nameLower.includes('деруни')) cat = 'Деруни';
            else if (nameLower.includes('м\'ясо') || nameLower.includes('куряч')) cat = 'М\'ясні вироби';

            if (!map.has(cat)) {
                map.set(cat, {
                    categoryName: cat,
                    items: [],
                    totalKg: 0,
                    totalFact: 0,
                    itemsCount: 0
                });
            }

            const c = map.get(cat)!;
            c.items.push(item);
            c.itemsCount += 1;
            c.totalKg += item.recommendedQtyKg || 0;
            c.totalFact += item.stores[0]?.currentStock || 0;
        });

        // Filter out empty categories and sort by totalKg descending
        return Array.from(map.values())
            .filter(c => c.itemsCount > 0)
            .sort((a, b) => b.totalKg - a.totalKg);

    }, [queue]);

    // Handle escape key to close modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedCategory(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const selectedCategoryData = useMemo(() => {
        if (!selectedCategory) return null;
        return categoriesMap.find(c => c.categoryName === selectedCategory) || null;
    }, [selectedCategory, categoriesMap]);

    const totalStoreKg = useMemo(() => categoriesMap.reduce((sum, c) => sum + c.totalKg, 0), [categoriesMap]);

    return (
        <div className="flex flex-col h-full overflow-hidden bg-bg-primary font-sans text-text-primary">

            {/* STICKY HEADER */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 z-10 sticky top-0 bg-[#0A1931]/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-[#00E0FF]/20 to-[#00E0FF]/5 border border-[#00E0FF]/20 rounded-xl">
                        <Store size={20} className="text-[#00E0FF]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold uppercase tracking-widest text-white font-display">
                            {storeName}
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-display mb-0.5">Сумарний дефіцит</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-[#00E0FF] font-[family-name:var(--font-jetbrains)]">{totalStoreKg.toFixed(0)}</span>
                            <span className="text-[10px] text-[#00E0FF]/60 uppercase font-bold font-display tracking-widest">кг</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CATEGORY CARDS GRID */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 pb-20">
                    {categoriesMap.map((category) => {
                        const hasDeficit = category.totalKg > 0;
                        const fillPercent = Math.min(100, (category.totalKg / 100) * 100);

                        return (
                            <div
                                key={category.categoryName}
                                onClick={() => setSelectedCategory(category.categoryName)}
                                className={cn(
                                    "glass-panel p-4 rounded-xl transition-all flex flex-col justify-between group cursor-pointer min-h-[140px] relative overflow-hidden",
                                    hasDeficit ? "bg-[#131B2C] hover:shadow-[0_0_20px_rgba(0,224,255,0.15)] hover:border-[#00E0FF]/30" : "bg-[#161B22]/60 opacity-60 hover:opacity-100"
                                )}
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-b from-transparent via-[#00E0FF]/50 to-transparent opacity-0 group-hover:opacity-100 animate-scan pointer-events-none"></div>

                                <div className="flex items-start justify-between relative z-10 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-lg border transition-colors", hasDeficit ? "bg-[#00E0FF]/10 border-[#00E0FF]/20 text-[#00E0FF]" : "bg-white/5 border-white/10 text-white/40")}>
                                            <Package size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className="text-sm font-black uppercase text-white tracking-widest font-[family-name:var(--font-chakra)] group-hover:text-[#00E0FF] transition-colors">
                                                {category.categoryName}
                                            </h3>
                                            <span className="text-[9px] text-white/40 uppercase font-bold font-display tracking-widest">
                                                {category.itemsCount} позицій
                                            </span>
                                        </div>
                                    </div>
                                    <ArrowRight size={16} className="text-white/20 group-hover:text-[#00E0FF] transition-colors group-hover:translate-x-1" />
                                </div>

                                <div className="mt-auto border-t border-white/5 pt-3 relative z-10">
                                    <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-white/30 mb-1 block font-display">Треба виготовити</span>
                                    <div className="flex items-end justify-between">
                                        <div className="flex items-baseline gap-1">
                                            <span className={cn("text-2xl font-bold font-[family-name:var(--font-jetbrains)] leading-none", hasDeficit ? "text-[#00E0FF]" : "text-white/20")}>
                                                {category.totalKg.toFixed(0)}
                                            </span>
                                            <span className="text-[9px] text-[#00E0FF]/60 uppercase font-bold font-display tracking-widest">кг</span>
                                        </div>

                                        {hasDeficit && (
                                            <div className="w-16 h-1.5 bg-black/40 rounded-full overflow-hidden mb-1">
                                                <div className="h-full bg-[#00E0FF] shadow-[0_0_8px_rgba(0,224,255,0.6)]" style={{ width: `${Math.max(5, fillPercent)}%` }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* PRODUCT MODAL OVERLAY */}
            <AnimatePresence>
                {selectedCategory && selectedCategoryData && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity p-4 lg:p-8"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setSelectedCategory(null);
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-[1400px] h-auto max-h-[90vh] rounded-2xl overflow-hidden bg-[#112240]/95 backdrop-blur-md border border-[#00E0FF]/20 shadow-[0_0_30px_rgba(0,224,255,0.15)] flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* MODAL HEADER */}
                            <div className="flex items-start justify-between p-5 px-8 border-b border-[#00E0FF]/10 shrink-0 bg-[#112240]/80 shadow-lg">
                                <div className="flex items-center gap-6 lg:gap-12">
                                    <div className="flex flex-col justify-center">
                                        <div className="text-[10px] text-[#00E0FF] font-bold uppercase tracking-[0.2em] flex items-center gap-2 font-[family-name:var(--font-jetbrains)]">
                                            <span>Магазин "{storeName}"</span>
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wider leading-none mt-2 font-[family-name:var(--font-chakra)]">
                                            {selectedCategoryData.categoryName} <span className="text-white/30 text-lg md:text-xl font-display">/ {selectedCategoryData.itemsCount} тов.</span>
                                        </h2>
                                    </div>

                                    {/* Summary Metrics Inline with Title */}
                                    <div className="flex items-center gap-4 lg:gap-8 mt-2">
                                        <div className="flex flex-col justify-end">
                                            <div className="text-[9px] md:text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] mb-2 font-[family-name:var(--font-jetbrains)]">Факт Залишок</div>
                                            <div className={cn(
                                                "text-2xl md:text-3xl font-mono font-black leading-none flex items-baseline gap-1 font-[family-name:var(--font-jetbrains)]",
                                                selectedCategoryData.totalKg > 0 ? "text-status-critical drop-shadow-[0_0_8px_rgba(255,42,85,0.5)]" : "text-status-success drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                                            )}>
                                                {selectedCategoryData.totalFact.toFixed(0)} <span className="text-[9px] md:text-[11px] font-bold text-slate-500 font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">шт</span>
                                            </div>
                                        </div>
                                        <div className="w-px h-10 bg-white/10 hidden sm:block"></div>
                                        <div className="flex flex-col justify-end">
                                            <div className="text-[9px] md:text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] mb-2 font-[family-name:var(--font-jetbrains)]">Треба (Ціль)</div>
                                            <div className="text-2xl md:text-3xl font-mono font-black text-[#00E0FF] leading-none flex items-baseline gap-1 font-[family-name:var(--font-jetbrains)] drop-shadow-[0_0_8px_rgba(0,224,255,0.4)]">
                                                {selectedCategoryData.totalKg.toFixed(0)} <span className="text-[9px] md:text-[11px] font-bold text-[#00E0FF]/50 font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">кг</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className="p-3 rounded-xl bg-panel-border/30 text-text-muted hover:text-text-primary hover:bg-panel-border/50 transition-colors mt-2"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* MODAL CONTENT: PRODUCTS GRID */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar"
                            >
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                    {selectedCategoryData.items.map((item) => (
                                        <StoreProductCard key={item.id} item={item} />
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};
