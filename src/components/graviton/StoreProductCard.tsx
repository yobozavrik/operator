
import React from 'react';
import { cn } from '@/lib/utils';
import { ProductionTask } from '@/types/bi';
import { CheckCircle2, AlertTriangle, Package } from 'lucide-react';

interface StoreProductCardProps {
    item: ProductionTask;
    // In store view, we assume item.stores has exactly 1 element or we take the first
}

export const StoreProductCard = ({ item }: StoreProductCardProps) => {
    const storeData = item.stores[0];
    if (!storeData) return null;

    const currentStock = storeData.currentStock;
    const minStock = storeData.minStock;
    const recommended = storeData.recommendedKg;
    const avgSales = storeData.avgSales;

    // Logic for color/status
    // Critical: Stock < Min
    // Warning: Stock < Min + 1 day sales? Or just close to Min?
    // Let's stick to the red/green logic of the main dashboard for consistency.
    const isCritical = currentStock < minStock;
    // Calculate percentage for bar: Stock / (Min + Recommended) ?? 
    // If recommended > 0, it means we have a deficit.
    // If recommended == 0, we are good.

    // Let's use a visual max for the bar. Max = Min * 1.5 ?
    const maxRef = minStock > 0 ? minStock * 1.5 : (currentStock * 1.5 || 10);
    const progressPercent = Math.min(100, (currentStock / maxRef) * 100);

    const cardColorClass = isCritical
        ? "border-red-500/20 bg-red-500/5 hover:border-red-500/40"
        : "border-white/10 bg-[#141829] hover:border-white/20";

    const textColorClass = isCritical ? "text-red-500" : "text-white";
    const progressBarColor = isCritical ? "bg-red-500" : "bg-emerald-500";

    return (
        <div
            className={cn(
                "relative flex flex-col justify-between rounded-xl border transition-all duration-300 overflow-hidden group select-none min-h-[140px]",
                cardColorClass
            )}
        >
            <div className="p-4 flex flex-col h-full">
                {/* Header: Icon + Name */}
                <div className="flex items-start gap-3 mb-3">
                    <div className="text-xl">🍕</div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-none mb-1">Товар</span>
                        <h3 className="text-xs font-black uppercase tracking-wider leading-tight line-clamp-2 text-white/90">
                            {item.name}
                        </h3>
                    </div>
                </div>

                {/* Primary Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 mt-auto mb-3">
                    {/* Left: Stock (Fact) */}
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 mb-0.5">Факт</span>
                        <div className="flex items-baseline gap-1">
                            <span className={cn("text-2xl font-black font-mono leading-none", textColorClass)}>
                                {Math.round(currentStock)}
                            </span>
                            <span className="text-[9px] font-bold text-white/20 uppercase">шт</span>
                        </div>
                    </div>

                    {/* Right: Need (Recommended) */}
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 mb-0.5 text-right w-full">Треба</span>
                        <div className="flex items-baseline gap-1">
                            <span className={cn(
                                "text-2xl font-black font-mono leading-none",
                                recommended > 0 ? "text-[#00D4FF]" : "text-white/20"
                            )}>
                                {Math.round(recommended)}
                            </span>
                            <span className="text-[9px] font-bold text-white/20 uppercase">кг</span>
                        </div>
                    </div>
                </div>

                {/* Secondary Metrics (Min / Avg) */}
                <div className="flex items-center justify-between py-2 border-t border-white/5 mx-[-16px] px-4 bg-black/10">
                    <div className="flex flex-col">
                        <span className="text-[8px] text-white/30 uppercase tracking-wider">Мін. залишок</span>
                        <span className="text-[10px] font-mono text-white/70">{minStock}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] text-white/30 uppercase tracking-wider">Сер. продажі</span>
                        <span className="text-[10px] font-mono text-white/70">{avgSales.toFixed(1)}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                    <div
                        className={cn("h-full rounded-full transition-all duration-500", progressBarColor)}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

            </div>
        </div>
    );
};
