'use client';

import React, { useMemo } from 'react';
import useSWR from 'swr';
import { DashboardLayout } from '@/components/layout';
import { BIGauge, BIStatCard } from '@/components/BIPanels';
import { BIPowerMatrix } from '@/components/BIPowerMatrix';
import { BIInsights } from '@/components/BIInsights';
import { ProductionTask, BI_Metrics, SupabaseDeficitRow } from '@/types/bi';
import { transformDeficitData } from '@/lib/transformers';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Users, AlertTriangle, TrendingUp, RotateCw, Activity, RefreshCw, BarChart2, Lightbulb } from 'lucide-react';
import { UI_TOKENS } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function BIDashboard() {
    const { data: deficitData, error: deficitError, mutate: mutateDeficit } = useSWR<SupabaseDeficitRow[]>(
        '/api/graviton/deficit',
        fetcher,
        { refreshInterval: 30000 }
    );

    const { data: metrics, error: metricsError, mutate: mutateMetrics } = useSWR<BI_Metrics>(
        '/api/graviton/metrics',
        fetcher,
        { refreshInterval: 30000 }
    );

    // Для режиму "Конкретний магазин" потрібні ВСІ товари
    const { data: allProductsData, error: allProductsError } = useSWR<SupabaseDeficitRow[]>(
        '/api/graviton/all-products',
        fetcher,
        { refreshInterval: 30000 }
    );

    const [isRefreshing, setIsRefreshing] = React.useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch('http://localhost:5678/webhook-test/operator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'refresh_stock', timestamp: new Date().toISOString() })
            });

            if (response.ok) {
                // Ждем немного, чтобы n8n успел обработать (опционально)
                await new Promise(resolve => setTimeout(resolve, 2000));
                await Promise.all([mutateDeficit(), mutateMetrics()]);
            } else {
                console.error('Webhook failed:', response.statusText);
            }
        } catch (err) {
            console.error('Refresh error:', err);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Для режиму "Усі магазини" (тільки товари з дефіцитом)
    const deficitQueue = useMemo((): ProductionTask[] => {
        if (!deficitData || !Array.isArray(deficitData)) return [];
        return transformDeficitData(deficitData);
    }, [deficitData]);

    // Для режиму "Конкретний магазин" (всі товари)
    const allProductsQueue = useMemo((): ProductionTask[] => {
        if (!allProductsData || !Array.isArray(allProductsData)) return [];
        return transformDeficitData(allProductsData);
    }, [allProductsData]);

    if (deficitError || metricsError || allProductsError) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#1e1e1e] text-[#e74856] font-bold uppercase tracking-widest" role="alert">
                Помилка даних | Supabase Offline
            </div>
        );
    }

    if (!deficitData || !metrics || !allProductsData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#1e1e1e] text-slate-600 font-bold uppercase tracking-widest animate-pulse">
                Ініціалізація двигуна BI...
            </div>
        );
    }

    return (
        <DashboardLayout currentWeight={metrics.shopLoad} maxWeight={450}>
            <div className="max-w-[1200px] mx-auto min-h-[calc(100vh-160px)]">
                {/* Outer Panel like SVG */}
                <div className="bg-[#1A1A1A] rounded-[16px] border border-[#2B2B2B] p-6 lg:p-10 shadow-2xl h-full flex flex-col">

                    {/* Header Shell */}
                    <div className="bg-[#111823] rounded-xl border border-[#202938] px-6 py-4 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#58A6FF]/10 flex items-center justify-center border border-[#58A6FF]/20">
                                <BarChart2 size={18} className="text-[#58A6FF]" />
                            </div>
                            <h1 className="text-[18px] font-black text-[#E6EDF3] tracking-tighter uppercase">
                                BI Аналітична Консоль
                            </h1>
                        </div>

                        <div className="flex flex-wrap gap-4 items-center">
                            <SmallKPI label="Загалом кг" value={Math.round(metrics.shopLoad)} icon={Activity} color="#58A6FF" />
                            <SmallKPI label="Критичні SKU" value={metrics.criticalSKUs} icon={AlertTriangle} color="#F85149" />
                            <SmallKPI label="Персонал" value={`${metrics.personnel} ПЕРС`} icon={Users} color="#3FB950" />
                            <SmallKPI label="Синхронізація" value={new Date(metrics.lastUpdate).toLocaleTimeString('uk-UA')} icon={RefreshCw} color="#F6C343" />

                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="p-2.5 bg-[#222325] hover:bg-[#2A2B2F] text-[#8B949E] hover:text-[#58A6FF] rounded-xl border border-[#33343A] transition-all disabled:opacity-50 shadow-sm"
                                title="Оновити залишки"
                            >
                                <RotateCw size={16} className={isRefreshing ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </div>

                    {/* Main Content: 840/360 Split according to SVG */}
                    <div className="grid grid-cols-[8.4fr_3.6fr] gap-8 h-[calc(100vh-220px)] mt-4">
                        {/* Priority Tree Section */}
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="flex items-center gap-2 mb-6 px-2">
                                <h2 className="text-[13px] font-bold text-[#E6EDF3] tracking-tight">Priority Tree</h2>
                            </div>

                            <div className="flex-1 overflow-hidden">
                                <ErrorBoundary>
                                    <BIPowerMatrix deficitQueue={deficitQueue} allProductsQueue={allProductsQueue} />
                                </ErrorBoundary>
                            </div>
                        </div>

                        {/* Insights Section */}
                        <div className="flex flex-col h-full overflow-hidden border-l border-[#2B2B2B] border-dashed pl-8">
                            <div className="flex items-center gap-2 mb-6 px-2">
                                <h2 className="text-[13px] font-bold text-[#E6EDF3] tracking-tight">Insights</h2>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                <ErrorBoundary>
                                    <BIInsights queue={deficitQueue} />
                                </ErrorBoundary>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

const SmallKPI = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) => (
    <div className="flex items-center gap-3 px-4 py-2 bg-[#222325] border border-[#33343A] rounded-xl shadow-sm hover:border-[#44454A] transition-all">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
            <Icon size={14} style={{ color: color }} />
        </div>
        <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#8B949E] uppercase tracking-wider leading-none mb-1">{label}</span>
            <span className="text-[14px] font-black text-[#E6EDF3] leading-none">{value}</span>
        </div>
    </div>
);
