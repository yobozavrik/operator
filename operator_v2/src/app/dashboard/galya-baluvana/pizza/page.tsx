'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { FinancialDashboard } from '@/components/analytics/FinancialDashboard';
import { ProductionTabs } from '@/components/production/ProductionTabs';
import { transformPizzaData } from '@/lib/transformers';
import { ChefHat, PieChart, Factory } from 'lucide-react';
import { authedFetcher } from '@/lib/authed-fetcher';

export default function PizzaDashboardPage() {
    const [view, setView] = useState<'finance' | 'operations'>('finance');

    // Fetch data required for ProductionTabs (Operations)
    const { data: allProductsData, error, isLoading, mutate } = useSWR<any[]>(
        '/api/pizza/orders',
        authedFetcher,
        { refreshInterval: 60000 }
    );

    const handleRefresh = React.useCallback(async () => {
        await mutate();
    }, [mutate]);

    const productQueue = React.useMemo(() => {
        if (!allProductsData) return [];
        return transformPizzaData(allProductsData);
    }, [allProductsData]);

    return (
        <div className="flex flex-col min-h-[calc(100vh-80px)] w-auto bg-[#0B0F19] -mx-4 -my-4 md:-mx-6 md:-my-6 lg:-mx-8 lg:-my-8 border-none ring-0">
            {/* Top Level View Switcher for Galya Baluvana / Pizza */}
            <div className="flex-shrink-0 border-b border-white/10 bg-[#0B0F19]/80 backdrop-blur-xl p-4 md:px-6 z-[60]">
                <div className="flex items-center justify-between max-w-[1920px] mx-auto">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                            <ChefHat className="text-orange-500" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-widest">Піца Дашборд</h2>
                            <span className="text-[10px] text-orange-400 font-mono uppercase tracking-[0.2em]">Galya Baluvana Hub</span>
                        </div>
                    </div>

                    <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
                        <button
                            onClick={() => setView('finance')}
                            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${view === 'finance'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                                : 'text-slate-400 hover:text-white transparent'
                                }`}
                        >
                            <PieChart size={14} />
                            Фінанси
                        </button>
                        <button
                            onClick={() => setView('operations')}
                            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${view === 'operations'
                                ? 'bg-[#2b80ff]/20 text-[#2b80ff] border border-[#2b80ff]/30 shadow-sm'
                                : 'text-slate-400 hover:text-white transparent'
                                }`}
                        >
                            <Factory size={14} />
                            Виробництво & Опер.
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area Rendering the Active View */}
            <div className="flex-1 overflow-hidden">
                {view === 'finance' ? (
                    <FinancialDashboard />
                ) : (
                    <div className="h-full w-full flex flex-col p-2 md:p-4 pb-0 max-w-[1920px] mx-auto">
                        {error ? (
                            <div className="flex items-center justify-center min-h-[500px] text-[#E74856] font-bold uppercase tracking-widest bg-white/5 rounded-2xl border border-white/10">
                                Помилка завантаження даних виробництва
                            </div>
                        ) : isLoading || !allProductsData ? (
                            <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 bg-white/5 rounded-2xl border border-white/10">
                                <ChefHat size={48} className="text-[#FFB800] animate-bounce" />
                                <span className="text-slate-400 font-bold uppercase tracking-widest animate-pulse font-mono">
                                    Завантаження піци...
                                </span>
                            </div>
                        ) : (
                            /* Pass data directly to ProductionTabs which contains logistics and simulator */
                            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl">
                                <ProductionTabs data={productQueue} onRefresh={handleRefresh} showTabs={true} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
