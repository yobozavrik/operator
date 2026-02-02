'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ProductionTask } from '@/types/bi';
import { STORES } from '@/lib/data';
import { cn } from '@/lib/utils';

interface TaskCardProps {
    task: ProductionTask;
    onStatusChange: (id: string, status: ProductionTask['status']) => void;
}

const getStatusColor = (stock: number, threshold: number) => {
    if (stock <= 0) return '#E5534B';
    if (stock < threshold / 3) return '#F6C343';
    if (stock < threshold) return '#58A6FF';
    return '#3FB950';
};

export const TaskCard = ({ task, onStatusChange }: TaskCardProps) => {
    return (
        <div className="bg-[#0F1622] border border-[#1E2A3A] rounded-xl p-5 group transition-all hover:border-[#58A6FF]/30 hover:shadow-lg shadow-black/20">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0 pr-4">
                    <span className="text-[12px] font-bold text-[#E6EDF3] line-clamp-1">
                        SKU • {task.name}
                    </span>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span className="text-[10px] text-[#8B949E] font-medium">Прогноз 24г: {task.dailyForecastKg}кг</span>
                        <span className="text-[10px] text-[#8B949E] font-medium">•</span>
                        <span className={cn(
                            "text-[10px] font-bold",
                            task.deficitPercent > 50 ? "text-[#E5534B]" : "text-[#F6C343]"
                        )}>
                            Дефіцит: {task.deficitPercent}%
                        </span>
                    </div>
                </div>
                <div className="flex gap-1.5 shrink-0 pt-0.5">
                    {task.stores.map(store => {
                        const statusColor = getStatusColor(store.currentStock, store.minStock);
                        return (
                            <div
                                key={store.storeName}
                                className="w-2 h-2 rounded-full shadow-sm ring-1 ring-black/10"
                                style={{ backgroundColor: statusColor }}
                                title={`${store.storeName}: ${store.currentStock.toFixed(1)} kg`}
                            />
                        );
                    })}
                </div>
            </div>

            <div className="flex items-end justify-between gap-4 mt-2">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-[#8B949E] uppercase tracking-widest leading-none mb-1">
                        Квант плану
                    </span>
                    <span className="text-xl font-black text-[#58A6FF] leading-none">
                        {task.recommendedQtyKg} <span className="text-[10px] font-medium text-slate-500">кг</span>
                    </span>
                </div>

                <button
                    onClick={() => onStatusChange(task.id, 'in-progress')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] hover:bg-[#252526] border border-[#1E2A3A] rounded-lg text-[10px] font-black text-[#E6EDF3] uppercase tracking-tighter transition-all"
                >
                    Дія <ArrowRight size={12} className="text-[#58A6FF]" />
                </button>
            </div>
        </div>
    );
};
