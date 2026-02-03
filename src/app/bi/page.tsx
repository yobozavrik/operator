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

import { supabase } from '@/lib/supabase';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function BIDashboard() {
    // ⚡ REALTIME ARCHITECTURE: No more polling!
    // We fetch initially, then listen for DB events to re-fetch.
    const { data: deficitData, error: deficitError, mutate: mutateDeficit } = useSWR<SupabaseDeficitRow[]>(
        '/api/graviton/deficit',
        fetcher
    );

    const { data: metrics, error: metricsError, mutate: mutateMetrics } = useSWR<BI_Metrics>(
        '/api/graviton/metrics',
        fetcher
    );

    // Для режиму "Конкретний магазин" потрібні ВСІ товари
    const { data: allProductsData, error: allProductsError, mutate: mutateAllProducts } = useSWR<SupabaseDeficitRow[]>(
        '/api/graviton/all-products',
        fetcher
    );

    // 🔄 EVENT-DRIVEN UPDATES
    React.useEffect(() => {
        console.log('🔌 Connecting to Supabase Realtime...');

        const channel = supabase
            .channel('dashboard-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'dashboard_deficit' },
                (payload) => {
                    console.log('⚡ Realtime update received:', payload.eventType);
                    // Trigger re-fetch when data changes
                    mutateDeficit();
                    mutateMetrics();
                    mutateAllProducts();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Connected to Realtime stream');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [mutateDeficit, mutateMetrics, mutateAllProducts]);

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
            <div className="flex items-center justify-center min-h-screen bg-[var(--background)] text-[var(--status-critical)] font-bold uppercase tracking-widest" role="alert">
                Помилка даних | Supabase Offline
            </div>
        );
    }

    if (!deficitData || !metrics || !allProductsData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--background)] text-[var(--text-muted)] font-bold uppercase tracking-widest animate-pulse">
                Ініціалізація двигуна BI...
            </div>
        );
    }

    return (
        <DashboardLayout currentWeight={metrics.shopLoad} maxWeight={450}>
            {/* BENTO GRID CONTAINER */}
            <div className="max-w-[1600px] mx-auto min-h-[calc(100vh-140px)] p-6">

                <div className="grid grid-cols-12 gap-6 h-full">

                    {/* 1. HEADER & KPI ROW (Span 12) */}
                    <div className="col-span-12 glass-panel-premium rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden group/spotlight">
                        {/* Spotlight Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/spotlight:animate-shimmer pointer-events-none" />

                        <div className="flex items-center gap-4 z-10">
                            <div className="w-12 h-12 rounded-xl bg-[var(--status-normal)]/10 flex items-center justify-center border border-[var(--status-normal)]/20 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                                <BarChart2 size={24} className="text-[var(--status-normal)]" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight uppercase">
                                    BI Production Hub
                                </h1>
                                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                    Realtime Analytics Engine
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 items-center z-10">
                            <SmallKPI label="Загалом кг" value={Math.round(metrics.shopLoad)} icon={Activity} color={UI_TOKENS.colors.priority.normal} />
                            <SmallKPI label="Критичні SKU" value={metrics.criticalSKUs} icon={AlertTriangle} color={UI_TOKENS.colors.priority.critical} />
                            <SmallKPI label="Персонал" value={`${metrics.personnel} ПЕРС`} icon={Users} color={UI_TOKENS.colors.priority.reserve} />
                            <SmallKPI label="Синхронізація" value={new Date(metrics.lastUpdate).toLocaleTimeString('uk-UA')} icon={RefreshCw} color={UI_TOKENS.colors.priority.high} />

                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="p-3 bg-[var(--panel)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--status-normal)] rounded-xl border border-[var(--border)] transition-all disabled:opacity-50 shadow-lg hover:shadow-[0_0_15px_rgba(52,211,153,0.1)] active:scale-95"
                                title="Оновити залишки"
                            >
                                <RotateCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </div>

                    {/* 2. MAIN MATRIX (Span 8) */}
                    <div className="col-span-12 lg:col-span-8 glass-panel-premium rounded-2xl p-1 flex flex-col h-[600px] lg:h-auto overflow-hidden">
                        <div className="flex-1 overflow-hidden relative">
                            <ErrorBoundary>
                                <BIPowerMatrix deficitQueue={deficitQueue} allProductsQueue={allProductsQueue} />
                            </ErrorBoundary>
                        </div>
                    </div>

                    {/* 3. INSIGHTS PANEL (Span 4) */}
                    <div className="col-span-12 lg:col-span-4 glass-panel-premium rounded-2xl p-6 flex flex-col h-[600px] lg:h-auto">
                        <div className="flex items-center gap-2 mb-6">
                            <Lightbulb size={16} className="text-[var(--status-reserve)]" />
                            <h2 className="text-[13px] font-bold text-[var(--foreground)] tracking-[0.2em] uppercase">
                                AI Insights
                            </h2>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                            <ErrorBoundary>
                                <BIInsights queue={deficitQueue} />
                            </ErrorBoundary>
                        </div>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}

const SmallKPI = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) => (
    <div className="group relative flex items-center gap-3 px-5 py-3 bg-[var(--background)]/50 border border-[var(--border)] rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:border-[var(--text-muted)] hover:shadow-[0_0_20px_rgba(0,0,0,0.3)] overflow-hidden">
        {/* Shimmer on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />

        <div className="p-2.5 rounded-lg transition-colors group-hover:bg-white/5" style={{ backgroundColor: `${color}10` }}>
            <Icon size={16} style={{ color: color }} className="transition-transform group-hover:scale-110" />
        </div>
        <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1.5">{label}</span>
            <span className="text-[16px] font-black text-[var(--foreground)] leading-none tabular-nums tracking-tight">{value}</span>
        </div>
    </div>
);
