'use client';

import React, { useMemo, useState } from 'react';
import { ProductionTask } from '@/types/bi';
import { AlertCircle, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import { UI_TOKENS } from '@/lib/design-tokens';
import { useStore } from '@/context/StoreContext';

export const BIInsights = ({ queue }: { queue: ProductionTask[] }) => {

    const { selectedStore } = useStore();
    const [expandedStore, setExpandedStore] = useState<string | null>(null);
    const [hoveredStore, setHoveredStore] = useState<string | null>(null);

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
        <div className="flex flex-col gap-3 h-full font-sans">
            {/* Top risk stores */}
            <div className="glass-panel-premium rounded-xl p-3 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="flex items-center justify-center mb-2">
                    <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-[#E74856] bg-[#E74856]/10 border border-[#E74856]/30 rounded-full">
                        ⚠️ Звернути увагу
                    </span>
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-[9px] font-semibold text-[#E6EDF3]/80 uppercase tracking-widest text-center">
                        {selectedStore === 'Усі' ? 'Магазини з дефіцитом' : `Ризики: ${selectedStore}`}
                    </span>
                </div>
                <div className="space-y-2">
                    {insights.topRiskStores.map(({ store, count, items }) => (
                        <div key={store} className="relative group/card">
                            <button
                                onClick={() => toggleStore(store)}
                                onMouseEnter={() => setHoveredStore(store)}
                                onMouseLeave={() => setHoveredStore(null)}
                                aria-expanded={expandedStore === store}
                                className="w-full px-3.5 py-2.5 mb-2 text-left rounded-lg transition-all duration-300 hover:translate-x-[2px] relative overflow-hidden"
                                style={{
                                    background: 'rgba(37, 45, 69, 0.55)',
                                    backdropFilter: 'blur(10px)',
                                    WebkitBackdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                    boxShadow: (expandedStore === store || hoveredStore === store)
                                        ? '0 8px 18px rgba(0, 0, 0, 0.5), 0 0 16px rgba(231, 72, 86, 0.3)'
                                        : '0 4px 10px rgba(0, 0, 0, 0.35)'
                                }}
                            >
                                <div
                                    className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg z-20"
                                    style={{
                                        background: 'linear-gradient(135deg, #E74856 0%, #C41E3A 100%)'
                                    }}
                                />
                                <div className="flex items-center justify-between relative z-10">
                                    <span className="text-[10px] font-semibold text-[#E6EDF3] uppercase tracking-wide">
                                        {store}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-[#FF4B4B] drop-shadow-[0_0_6px_rgba(255,75,75,0.4)]">
                                            {count} ДЕФІЦИТ
                                        </span>
                                        {expandedStore === store ?
                                            <ChevronDown size={12} className="text-white/40" /> :
                                            <ChevronRight size={12} className="text-white/40" />
                                        }
                                    </div>
                                </div>
                            </button>

                            {expandedStore === store && (
                                <div className="px-5 pb-2 pt-1 space-y-1 bg-black/10 border-t border-[#2B2B2B]/30 max-h-[120px] overflow-y-auto custom-scrollbar">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="text-[9px] text-[#E6EDF3]/70 py-1 border-b border-[#2B2B2B]/20 last:border-b-0 flex items-center gap-2">
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
            <div className="glass-panel-premium rounded-xl p-3 animate-in fade-in slide-in-from-top-2 duration-500 delay-100">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="text-[#3FB950]" size={12} />
                    <h4 className="text-[10px] font-black text-[#E6EDF3] uppercase tracking-widest text-center">Прогноз системи</h4>
                </div>
                <div className="h-16 bg-[#0F172A]/60 rounded-lg border border-white/10 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center opacity-25">
                        <svg className="w-full h-full" overflow="visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0,80 Q10,20 20,40 T40,60 T60,30 T80,50 100,20" fill="none" stroke="#58A6FF" strokeWidth="1.5" />
                        </svg>
                    </div>
                    <span className="text-[9px] text-[#8B949E] font-bold uppercase tracking-widest relative z-10">Аналіз в реальному часі...</span>
                </div>
            </div>

            {/* Actions */}
            <div className="glass-panel-premium rounded-xl p-3 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-500 delay-200">
                <div className="flex items-center gap-2">
                    <AlertCircle className="text-[#F6C343]" size={12} />
                    <span className="text-[10px] font-black text-[#E6EDF3] uppercase tracking-widest">Швидкі дії</span>
                </div>
                <button
                    className="px-3 py-1.5 text-white text-[9px] font-black uppercase rounded-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
                    style={{ backgroundColor: UI_TOKENS.colors.priority.critical, boxShadow: `0 4px 10px ${UI_TOKENS.colors.priority.critical}20` }}
                >
                    Згенерувати
                </button>
            </div>
        </div >
    );
};
