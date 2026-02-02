'use client';

import React from 'react';
import { ProductionTask, STORES } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ChevronRight, Plus, Info } from 'lucide-react';

const StoreStatusMatrix = ({ stocks }: { stocks: Record<string, number> }) => {
    return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-md border border-white/5">
            {STORES.map((store) => {
                const stock = stocks[store] || 0;
                let colorClass = "text-[#3FB950]"; // Green
                if (stock === 0) colorClass = "text-[#F85149]"; // Red
                else if (stock < 5) colorClass = "text-[#D29922]"; // Yellow

                return (
                    <div
                        key={store}
                        className={cn("dot-neon", colorClass)}
                        title={`${store}: ${stock}кг`}
                    />
                );
            })}
        </div>
    );
};

export const SeniorProductionMatrix = ({ queue }: { queue: ProductionTask[] }) => {
    // Grouping by category
    const categories = Array.from(new Set(queue.map(t => t.category)));

    return (
        <div className="space-y-8 pb-12">
            {categories.map((cat) => {
                const tasks = queue.filter(t => t.category === cat);
                if (tasks.length === 0) return null;

                return (
                    <section key={cat} className="space-y-3">
                        <div className="flex items-center gap-2 px-2">
                            <span className="text-lg">🥟</span>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">{cat}</h3>
                            <div className="h-px flex-1 bg-gradient-to-r from-[#30363D] to-transparent ml-4" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{tasks.length} позицій</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {tasks.map((item) => (
                                <div
                                    key={item.id}
                                    className="bi-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-[#58A6FF]/30 transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={cn(
                                            "w-1 h-8 rounded-full",
                                            item.priority === 'critical' ? "bg-[#F85149]" : "bg-[#30363D]"
                                        )} />
                                        <div>
                                            <h4 className="text-sm font-bold text-white group-hover:text-[#58A6FF] transition-colors">{item.name}</h4>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">
                                                ПРОГНОЗ: <span className="text-white">{item.dailyForecastKg}кг/день</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        {/* Forecast Column */}
                                        <div className="text-left min-w-[70px] hidden sm:block">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Прогноз 24H</p>
                                            <p className="text-sm font-mono-bi font-bold text-slate-300">
                                                {item.dailyForecastKg.toFixed(1)} <span className="text-[8px] opacity-40">кг</span>
                                            </p>
                                        </div>

                                        {/* Deficit % Column */}
                                        <div className="text-left min-w-[60px]">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Дефіцит %</p>
                                            <p className={cn(
                                                "text-lg font-mono-bi font-black leading-none",
                                                (item as any).deficitPercent > 60 ? "text-[#F85149]" :
                                                    (item as any).deficitPercent > 30 ? "text-[#F59E0B]" : "text-[#3FB950]"
                                            )}>
                                                {Math.round((item as any).deficitPercent || 0)}%
                                            </p>
                                        </div>

                                        {/* Recommended Qty */}
                                        <div className="text-right min-w-[70px]">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">План</p>
                                            <p className="text-lg font-mono-bi font-black text-white leading-none">
                                                +{item.recommendedQtyKg} <span className="text-[10px] opacity-40">кг</span>
                                            </p>
                                        </div>

                                        {/* Store Matrix */}
                                        <div className="hidden lg:block">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1 ml-1 text-center">Мережа</p>
                                            <StoreStatusMatrix stocks={item.storeStocks} />
                                        </div>

                                        {/* Action */}
                                        <button className="h-10 px-4 bg-[#238636] hover:bg-[#2EA043] text-white rounded-md flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-900/20">
                                            <Plus size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">В ПЛАН +50КГ</span>
                                        </button>

                                        <button className="p-2 text-slate-500 hover:text-white transition-colors">
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
    );
};
