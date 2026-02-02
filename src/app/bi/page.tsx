'use client';

import React, { useMemo } from 'react';
import useSWR from 'swr';
import { SidebarBI } from '@/components/SidebarBI';
import { BIGauge, BIStatCard } from '@/components/BIPanels';
import { BIProductionMatrix } from '@/components/BIProductionMatrix';
import { BILineChart, BIBarChart } from '@/components/BICharts';
import { ProductionTask, SKUCategory, SupabaseRow, transformSupabaseData } from '@/lib/data';
import { Users, AlertTriangle, Cpu } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function BIDashboard() {
    const { data: rawDeficit } = useSWR('/api/graviton/deficit', fetcher, { refreshInterval: 30000 });
    const { data: metrics } = useSWR('/api/graviton/metrics', fetcher, { refreshInterval: 15000 });

    const queue = useMemo(() => transformSupabaseData(rawDeficit), [rawDeficit]);

    const currentWeight = metrics?.total_deficit_kg || 0;
    const criticalCount = metrics?.critical_positions || 0;
    const lastUpdate = metrics?.last_update ? new Date(metrics.last_update).toLocaleTimeString() : '--:--:--';

    return (
        <div className="flex min-h-screen bg-surface-900 text-slate-400 font-sans selection:bg-brand-primary selection:text-white">
            <SidebarBI />

            <main className="flex-1 flex flex-col min-w-0 p-4 pb-24 lg:pb-4 gap-4 overflow-y-auto">
                {/* Top Row: Quick Stats */}
                <div className="grid grid-cols-12 gap-4 h-auto lg:h-48">
                    <div className="col-span-12 md:col-span-6 lg:col-span-3 h-48 lg:h-auto">
                        <BIGauge value={currentWeight} max={450} />
                    </div>
                    <div className="col-span-6 lg:col-span-3 h-32 lg:h-auto">
                        <BIStatCard
                            label="Персонал"
                            value={`${metrics?.staff_count || 8} активних`}
                            subValue="Смена"
                            icon={Users}
                        />
                    </div>
                    <div className="col-span-6 lg:col-span-3 h-32 lg:h-auto">
                        <BIStatCard
                            label="Критичних позицій"
                            value={`${criticalCount} SKU`}
                            icon={AlertTriangle}
                            colorClass="text-[#F85149]"
                        />
                    </div>
                    <div className="col-span-12 md:col-span-6 lg:col-span-3 h-32 lg:h-auto">
                        <BIStatCard
                            label="Ефективність ІІ"
                            value={`${metrics?.ai_efficiency || 94.2}%`}
                            subValue={`Оновлено: ${lastUpdate}`}
                            icon={Cpu}
                            colorClass="text-[#58A6FF]"
                        />
                    </div>
                </div>

                {/* Center: Production Matrix */}
                <div className="flex-1 min-h-[400px]">
                    <BIProductionMatrix queue={queue} />
                </div>

                {/* Bottom Row: Analytics */}
                <div className="grid grid-cols-12 gap-4 h-auto lg:h-64">
                    <div className="col-span-12 lg:col-span-7 h-64 lg:h-auto">
                        <BILineChart
                            label="Динаміка замовлень (12г)"
                            data={[30, 45, 32, 60, 55, 80, 75, 90, 85, 110, 95, 120]}
                        />
                    </div>
                    <div className="col-span-12 lg:col-span-5 h-64 lg:h-auto">
                        <BIBarChart label="Порівняння продажів по магазинам" />
                    </div>
                </div>
            </main>
        </div>
    );
}
