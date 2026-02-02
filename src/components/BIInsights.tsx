'use client';

import React, { useMemo, useState } from 'react';
import { ProductionTask } from '@/types/bi';
import { AlertCircle, TrendingUp, MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UI_TOKENS } from '@/lib/design-tokens';
import { useStore } from '@/context/StoreContext';

export const BIInsights = ({ queue }: { queue: ProductionTask[] }) => {
    const { selectedStore } = useStore();
    const [expandedStore, setExpandedStore] = useState<string | null>(null);

    const insights = useMemo(() => {
        const criticalCount = queue.filter(t => t.priority === 'critical').length;
        const totalKg = queue.reduce((sum, t) => sum + t.recommendedQtyKg, 0);

        const riskStoresMap = queue.reduce((acc: Record<string, { count: number, items: string[] }>, t) => {
            t.stores.forEach(s => {
                // Якщо обрано конкретний магазин, фільтруємо тільки по ньому
                if (selectedStore !== 'Усі' && s.storeName !== selectedStore) return;

                if (s.currentStock === 0) {
                    if (!acc[s.storeName]) acc[s.storeName] = { count: 0, items: [] };
                    acc[s.storeName].count++;
                    acc[s.storeName].items.push(t.name);
                }
            });
            return acc;
        }, {});

        const topRiskStores = Object.entries(riskStoresMap)
            .map(([store, data]) => ({ store, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        return { criticalCount, totalKg, topRiskStores };
    }, [queue, selectedStore]);

    const toggleStore = (store: string) => {
        setExpandedStore(expandedStore === store ? null : store);
    };

    return (
        <div className="flex flex-col gap-6 h-full font-sans">
            {/* Top risk stores */}
            <div className="bg-[#222325] border border-[#33343A] p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <MapPin className="text-[#58A6FF]" size={16} />
                    <h4 className="text-[12px] font-bold text-[#E6EDF3] tracking-tight">
                        {selectedStore === 'Усі' ? 'Магазини з ризиком OOS' : `Ризики: ${selectedStore}`}
                    </h4>
                </div>
                <div className="space-y-3">
                    {insights.topRiskStores.map(({ store, count, items }) => (
                        <div key={store} className="flex flex-col bg-[#1A1A1A] rounded-lg border border-[#2B2B2B] overflow-hidden">
                            <button
                                onClick={() => toggleStore(store)}
                                className="flex justify-between items-center p-3 hover:bg-white/[0.02] transition-colors w-full text-left"
                            >
                                <div className="flex items-center gap-2">
                                    {expandedStore === store ? <ChevronDown size={14} className="text-[#8B949E]" /> : <ChevronRight size={14} className="text-[#8B949E]" />}
                                    <span className="text-[12px] text-[#8B949E] font-medium">{store}</span>
                                </div>
                                <span className="text-[11px] font-extrabold" style={{ color: UI_TOKENS.colors.priority.critical }}>
                                    {count} OOS
                                </span>
                            </button>

                            {expandedStore === store && (
                                <div className="px-8 pb-3 pt-1 space-y-1 bg-black/10 border-t border-[#2B2B2B]/30 max-h-[150px] overflow-y-auto custom-scrollbar">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="text-[10px] text-[#E6EDF3]/70 py-1 border-b border-[#2B2B2B]/20 last:border-b-0 flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full opacity-50" style={{ backgroundColor: UI_TOKENS.colors.priority.critical }} />
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Forecast sparkline */}
            <div className="bg-[#222325] border border-[#33343A] p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <TrendingUp className="text-[#3FB950]" size={16} />
                    <h4 className="text-[12px] font-bold text-[#E6EDF3] tracking-tight">Прогноз Системи</h4>
                </div>
                <div className="h-24 bg-[#1A1A1A] rounded-lg border border-[#2B2B2B] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <svg className="w-full h-full" overflow="visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0,80 Q10,20 20,40 T40,60 T60,30 T80,50 100,20" fill="none" stroke="#58A6FF" strokeWidth="2" />
                        </svg>
                    </div>
                    <span className="text-[10px] text-[#8B949E] font-bold uppercase tracking-widest relative z-10">Аналіз в реальному часі...</span>
                </div>
            </div>

            {/* Actions */}
            <div className="bg-[#222325] border border-[#33343A] p-5 rounded-xl flex items-center justify-between gap-4 shadow-sm hover:border-[#1F2630] transition-colors">
                <div className="flex items-center gap-3">
                    <AlertCircle className="text-[#F6C343]" size={16} />
                    <span className="text-[12px] font-bold text-[#E6EDF3] uppercase tracking-widest">Швидкі Дії</span>
                </div>
                <button
                    className="px-5 py-2.5 text-white text-[10px] font-black uppercase rounded-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
                    style={{ backgroundColor: UI_TOKENS.colors.priority.critical, boxShadow: `0 4px 12px ${UI_TOKENS.colors.priority.critical}20` }}
                >
                    Згенерувати
                </button>
            </div>
        </div>
    );
};
