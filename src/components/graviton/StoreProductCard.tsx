import React from 'react';
import { cn } from '@/lib/utils';
import { ProductionTask } from '@/types/bi';

interface StoreProductCardProps {
    item: ProductionTask;
}

export const StoreProductCard = ({ item }: StoreProductCardProps) => {
    // In store view context, we assume stores array has the exact filtered store 
    const storeData = item.stores[0];
    if (!storeData) return null;

    const currentStock = storeData.currentStock || 0;
    const minStock = storeData.minStock || 0;
    // const recommended = storeData.recommendedKg || 0;
    const avgSales = storeData.avgSales || 0;

    const isLowStock = currentStock <= minStock;

    return (
        <div
            className={cn(
                "rounded-xl p-4 flex flex-col gap-2 transition-all duration-300 relative overflow-hidden group hover:shadow-[0_0_20px_rgba(0,224,255,0.15)]",
                isLowStock
                    ? "bg-status-critical/5 border border-status-critical/30 shadow-[0_0_15px_rgba(255,42,85,0.1)] hover:border-status-critical/50"
                    : "bg-[#0A1931]/60 border border-[#00E0FF]/10 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:border-[#00E0FF]/30"
            )}
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-b from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 animate-scan pointer-events-none"></div>

            {/* Product Name */}
            <div
                className="text-sm font-semibold text-white uppercase tracking-wider truncate text-center font-[family-name:var(--font-chakra)]"
                title={item.name}
            >
                {item.name}
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold tracking-[0.2em] text-slate-400 mb-1 uppercase font-[family-name:var(--font-jetbrains)]">Факт</span>
                    <span className={cn(
                        "text-lg font-bold font-[family-name:var(--font-jetbrains)] leading-none",
                        isLowStock ? "text-status-critical drop-shadow-[0_0_8px_rgba(255,42,85,0.5)]" : "text-status-success drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                    )}>
                        {currentStock.toFixed(0)}
                    </span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold tracking-[0.2em] text-slate-400 mb-1 uppercase font-[family-name:var(--font-jetbrains)]">Мін</span>
                    <span className="text-lg font-bold font-[family-name:var(--font-jetbrains)] leading-none text-slate-300">
                        {minStock.toFixed(0)}
                    </span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold tracking-[0.2em] text-slate-400 mb-1 uppercase font-[family-name:var(--font-jetbrains)]">Сер</span>
                    <span className="text-lg font-bold font-[family-name:var(--font-jetbrains)] leading-none text-[#00E0FF]">
                        {avgSales.toFixed(1)}
                    </span>
                </div>
            </div>
        </div>
    );
};
