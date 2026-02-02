'use client';

import React, { useMemo } from 'react';
import useSWR from 'swr';
import { DashboardLayout } from '@/components/layout';
import { SeniorProductionMatrix } from '@/components/SeniorProductionMatrix';
import { SeniorAnalytics } from '@/components/SeniorAnalytics';
import { transformSupabaseData } from '@/lib/data';
import { SupabaseDeficitRow, BI_Metrics } from '@/types/bi';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function Dashboard() {
  const { data: rawDeficit, error: deficitError } = useSWR<SupabaseDeficitRow[]>('/api/graviton/deficit', fetcher, {
    refreshInterval: 30000
  });

  const { data: metrics, error: metricsError } = useSWR<BI_Metrics>('/api/graviton/metrics', fetcher, {
    refreshInterval: 15000
  });

  const queue = useMemo(() => rawDeficit ? transformSupabaseData(rawDeficit) : [], [rawDeficit]);

  const MAX_WEIGHT = 450;

  const currentWeight = metrics?.shopLoad || 0;
  const lastUpdate = metrics?.lastUpdate ? new Date(metrics.lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Оновлення...';

  if (deficitError || metricsError) {
    return (
      <DashboardLayout currentWeight={0} maxWeight={MAX_WEIGHT}>
        <div className="flex items-center justify-center min-h-[60vh] text-red-400 font-bold uppercase tracking-widest">
          Помилка завантаження даних (Supabase)
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentWeight={currentWeight} maxWeight={MAX_WEIGHT}>
      <div className="grid grid-cols-12 gap-8 p-4 lg:p-8">
        {/* Main Column: Production Queue */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Черга Виробництва</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                Оновлено: {lastUpdate}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#58A6FF]/10 rounded border border-[#58A6FF]/20 text-[10px] font-bold text-[#58A6FF] uppercase tracking-widest">
              Supabase Real-time: Активний
            </div>
          </div>

          {!rawDeficit ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 animate-pulse rounded-xl" />)}
            </div>
          ) : (
            <SeniorProductionMatrix queue={queue} />
          )}
        </div>

        {/* Right Column: Analytics & Critical Info */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <h2 className="text-sm font-black text-white uppercase tracking-widest lg:mt-3">Оперативна Аналітика</h2>
          <SeniorAnalytics queue={queue} />
        </div>
      </div>
    </DashboardLayout>
  );
}
