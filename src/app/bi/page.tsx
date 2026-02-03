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
            <div className="max-w-[1200px] mx-auto min-h-[calc(100vh-160px)]">
                {/* Outer Panel like SVG */}
                <div className="bi-panel rounded-[16px] p-6 lg:p-10 h-full flex flex-col">

                    {/* Header Shell */}
                    <div className="bg-[var(--background)]/50 rounded-xl border border-[var(--border)] px-6 py-4 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-inner">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--status-normal)]/10 flex items-center justify-center border border-[var(--status-normal)]/20">
                                <BarChart2 size={18} className="text-[var(--status-normal)]" />
                            </div>
                            <h1 className="text-[18px] font-black text-[var(--foreground)] tracking-tighter uppercase">
                                BI Аналітична Консоль
                            </h1>
                        </div>

                        <div className="flex flex-wrap gap-4 items-center">
                            <SmallKPI label="Загалом кг" value={Math.round(metrics.shopLoad)} icon={Activity} color={UI_TOKENS.colors.priority.normal} />
                            <SmallKPI label="Критичні SKU" value={metrics.criticalSKUs} icon={AlertTriangle} color={UI_TOKENS.colors.priority.critical} />
                            <SmallKPI label="Персонал" value={`${metrics.personnel} ПЕРС`} icon={Users} color={UI_TOKENS.colors.priority.reserve} />
                            <SmallKPI label="Синхронізація" value={new Date(metrics.lastUpdate).toLocaleTimeString('uk-UA')} icon={RefreshCw} color={UI_TOKENS.colors.priority.high} />

                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="p-2.5 bg-[var(--panel)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--status-normal)] rounded-xl border border-[var(--border)] transition-all disabled:opacity-50 shadow-sm"
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
                                <h2 className="text-[13px] font-bold text-[var(--foreground)] tracking-tight">Priority Tree</h2>
                            </div>

                            <div className="flex-1 overflow-hidden">
                                <ErrorBoundary>
                                    <BIPowerMatrix deficitQueue={deficitQueue} allProductsQueue={allProductsQueue} />
                                </ErrorBoundary>
                            </div>
                        </div>

                        {/* Insights Section */}
                        <div className="flex flex-col h-full overflow-hidden border-l border-[var(--border)] border-dashed pl-8">
                            <div className="flex items-center gap-2 mb-6 px-2">
                                <h2 className="text-[13px] font-bold text-[var(--foreground)] tracking-tight">Insights</h2>
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

const SmallKPI = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) => (
    <div className="flex items-center gap-3 px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-sm hover:border-[var(--text-muted)] transition-all">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
            <Icon size={14} style={{ color: color }} />
        </div>
        <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider leading-none mb-1">{label}</span>
            <span className="text-[14px] font-black text-[var(--foreground)] leading-none">{value}</span>
        </div>
    </div>
);
