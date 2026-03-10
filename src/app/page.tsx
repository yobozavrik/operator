'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  LayoutGrid,
  BarChart2,
  ChefHat,
  Zap,
  Activity,
  Factory,
  Store,
  ShoppingBag,
  Warehouse,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Truck,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ClipboardList,
  ArrowRight,
  LogOut,
  BrainCircuit
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { cn } from '@/lib/utils';
import { Chakra_Petch, JetBrains_Mono } from 'next/font/google';
import { authedFetcher } from '@/lib/authed-fetcher';
import { transformPizzaData } from '@/lib/transformers';

// Font configuration
const chakra = Chakra_Petch({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-chakra',
});

const jetbrains = JetBrains_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
});

const fetcher = authedFetcher;

export default function CommandLevel1() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // --- GRAVITON DATA ---
  const { data: gravitonMetrics } = useSWR('/api/graviton/metrics', fetcher, { refreshInterval: 30000 });

  // --- PIZZA DATA ---
  const { data: pizzaRawData } = useSWR('/api/pizza/orders', fetcher, { refreshInterval: 60000 });
  const { data: pizzaSummary } = useSWR('/api/pizza/summary', fetcher, { refreshInterval: 60000 });

  const pizzaMetrics = useMemo(() => {
    // Default values
    let fact = 0;
    let norm = 0;
    let index = 0;

    // 1. FACT: Calculate from raw products (sum of current stock)
    // This matches ProductionTabs logic: totalNetworkStock
    if (pizzaRawData) {
      const products = transformPizzaData(pizzaRawData);
      fact = products.reduce((sum, p) => sum + p.totalStockKg, 0);
    }

    // 2. NORM: Use summary API if available (matches Dashboard), fallback to sum of minStock
    if (pizzaSummary?.total_norm) {
      norm = pizzaSummary.total_norm;
    } else if (pizzaRawData) {
      const products = transformPizzaData(pizzaRawData);
      norm = products.reduce((sum, p) => sum + p.minStockThresholdKg, 0);
    }

    // 3. INDEX: Calculate based on determined Fact/Norm
    index = norm > 0 ? Math.round((fact / norm) * 100) : 0;

    return { fact: Math.round(fact), norm: Math.round(norm), index };
  }, [pizzaRawData, pizzaSummary]);

  // --- KONDITERKA DATA ---
  const { data: konditerkaRawData } = useSWR('/api/konditerka/orders', fetcher, { refreshInterval: 60000 });
  const { data: konditerkaSummary } = useSWR('/api/konditerka/summary', fetcher, { refreshInterval: 60000 });

  const konditerkaMetrics = useMemo(() => {
    let fact = 0;
    let norm = 0;
    let index = 0;

    if (konditerkaRawData) {
      const products = transformPizzaData(konditerkaRawData);
      fact = products.reduce((sum, p) => sum + p.totalStockKg, 0);
    }

    if (konditerkaSummary?.total_norm) {
      norm = konditerkaSummary.total_norm;
    } else if (konditerkaRawData) {
      const products = transformPizzaData(konditerkaRawData);
      norm = products.reduce((sum, p) => sum + p.minStockThresholdKg, 0);
    }

    index = norm > 0 ? Math.round((fact / norm) * 100) : 0;
    return { fact: Math.round(fact), norm: Math.round(norm), index };
  }, [konditerkaRawData, konditerkaSummary]);

  // --- BULVAR DATA ---
  const { data: bulvarRawData } = useSWR('/api/bulvar/orders', fetcher, { refreshInterval: 60000 });
  const { data: bulvarSummary } = useSWR('/api/bulvar/summary', fetcher, { refreshInterval: 60000 });

  const bulvarMetrics = useMemo(() => {
    let fact = 0;
    let norm = 0;
    let index = 0;

    if (bulvarRawData) {
      const products = transformPizzaData(bulvarRawData);
      fact = products.reduce((sum, p) => sum + p.totalStockKg, 0);
    }

    if (bulvarSummary?.total_norm) {
      norm = bulvarSummary.total_norm;
    } else if (bulvarRawData) {
      const products = transformPizzaData(bulvarRawData);
      norm = products.reduce((sum, p) => sum + p.minStockThresholdKg, 0);
    }

    index = norm > 0 ? Math.round((fact / norm) * 100) : 0;
    return { fact: Math.round(fact), norm: Math.round(norm), index };
  }, [bulvarRawData, bulvarSummary]);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date: Субота, 14 Лютого
  const formattedDate = time ? new Intl.DateTimeFormat('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(time) : '';

  // Capitalize first letter of date
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className={cn(
      "h-screen saas-bg saas-text-primary font-sans relative overflow-hidden selection:bg-[#2b80ff] selection:text-white flex flex-col",
      chakra.variable,
      jetbrains.variable,
      "font-[family-name:var(--font-chakra)]"
    )}>
      {/* Background Effects Removed for SaaS Theme */}

      <div className="relative z-10 p-4 md:p-6 flex flex-col h-full max-w-[1920px] mx-auto w-full">

        {/* Header */}
        <header className="flex flex-row justify-between items-center mb-4 gap-4 border-b border-slate-200 pb-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-[#2b80ff]/10 p-2 rounded-lg border border-[#2b80ff]/20">
              <LayoutGrid className="saas-accent" size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider saas-text-primary">Галя Балувана</h1>
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#2b80ff] tracking-[0.2em] font-[family-name:var(--font-jetbrains)]">
                <span>COMMAND CENTER</span>
                <span className="w-1 h-1 bg-[#2b80ff] rounded-full"></span>
                <span>LEVEL 1</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 hover:text-red-400 transition-all text-xs font-bold uppercase tracking-wider font-[family-name:var(--font-jetbrains)]"
          >
            <LogOut size={14} />
            <span>Вихід</span>
          </button>

          {gravitonMetrics?.criticalSKU > 0 && (
            <div className="saas-card !rounded-full bg-red-50 px-4 py-1.5 flex items-center gap-3 border border-red-200 shadow-sm absolute left-1/2 -translate-x-1/2 top-6">
              <span className="w-2 h-2 bg-[#E74856] rounded-full animate-ping"></span>
              <span className="text-[#E74856] font-mono text-xs font-bold uppercase tracking-wide font-[family-name:var(--font-jetbrains)]">
                {gravitonMetrics.criticalSKU} критичних у Гравітоні
              </span>
            </div>
          )}

          <div className="text-right">
            <div className="text-2xl font-mono text-[#2b80ff] font-bold tabular-nums tracking-widest font-[family-name:var(--font-jetbrains)]">
              {time?.toLocaleTimeString('uk-UA', { hour12: false }) || '00:00:00'}
            </div>
            <div className="text-[10px] saas-text-secondary font-mono uppercase font-[family-name:var(--font-jetbrains)]">
              {capitalizedDate || 'Завантаження...'}
            </div>
          </div>
        </header>

        {/* content */}
        <main className="grid grid-cols-3 gap-4 flex-1 min-h-0">

{/* Active Card: Graviton */}
          <Link href="/graviton" className="saas-card rounded-xl p-5 relative overflow-hidden group hover:shadow-md hover:border-[#2b80ff]/30 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[#2b80ff]">
                <BarChart2 size={20} />
              </div>
              <div className={cn(
                "px-2.5 py-0.5 rounded-full flex items-center gap-2 border",
                gravitonMetrics?.criticalSKU > 0 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"
              )}>
                {gravitonMetrics?.criticalSKU > 0 ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E74856] animate-pulse"></span>
                    <span className="text-[9px] font-mono text-[#E74856] uppercase tracking-wider font-[family-name:var(--font-jetbrains)]">УВАГА</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></span>
                    <span className="text-[9px] font-mono text-emerald-600 uppercase tracking-wider font-[family-name:var(--font-jetbrains)]">ONLINE</span>
                  </>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold saas-text-primary mb-0.5">ЦЕХ Гравітон</h2>
              <p className="text-[10px] font-mono saas-text-secondary uppercase tracking-wide mb-4 font-[family-name:var(--font-jetbrains)]">Виробництво заморозки</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-auto">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-[9px] saas-text-secondary uppercase font-mono mb-0.5 font-[family-name:var(--font-jetbrains)]">Всього до виробництва</div>
                <div className="text-lg font-bold saas-text-primary">
                  {gravitonMetrics ? Math.round(gravitonMetrics.shopLoad) : '--'} <span className="text-xs saas-text-secondary font-normal">кг</span>
                </div>
              </div>
              <div className="bg-red-50/80 p-2.5 rounded-lg border border-red-100">
                <div className="text-[9px] text-red-500 uppercase font-mono mb-0.5 font-[family-name:var(--font-jetbrains)]">Критично</div>
                <div className="text-lg font-bold text-[#E74856]">
                  {gravitonMetrics ? gravitonMetrics.criticalSKU : '--'} <span className="text-xs text-red-400 font-normal">SKU</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Active Card: Pizza */}
          <Link href="/pizza" className="saas-card rounded-xl p-5 relative overflow-hidden group hover:shadow-md hover:border-[#2b80ff]/30 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2.5 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-600">
                <ChefHat size={20} />
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></span>
                <span className="text-[9px] font-mono text-emerald-600 uppercase tracking-wider font-[family-name:var(--font-jetbrains)]">ONLINE</span>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold saas-text-primary mb-0.5">ЦЕХ Піца</h2>
              <p className="text-[10px] font-mono saas-text-secondary uppercase tracking-wide mb-4 font-[family-name:var(--font-jetbrains)]">Випічка та пакування</p>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-auto">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-[9px] saas-text-secondary uppercase font-mono mb-0.5 font-[family-name:var(--font-jetbrains)]">Факт залишок</div>
                <div className="text-base font-bold saas-text-primary">
                  {pizzaMetrics.fact > 0 ? pizzaMetrics.fact : '--'} <span className="text-[10px] saas-text-secondary font-normal">шт.</span>
                </div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-[9px] saas-text-secondary uppercase font-mono mb-0.5 font-[family-name:var(--font-jetbrains)]">Норма</div>
                <div className="text-base font-bold saas-text-primary">
                  {pizzaMetrics.norm > 0 ? pizzaMetrics.norm : '--'} <span className="text-[10px] saas-text-secondary font-normal">шт.</span>
                </div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-[9px] saas-text-secondary uppercase font-mono mb-0.5 font-[family-name:var(--font-jetbrains)]">Індекс</div>
                <div className={cn("text-base font-bold", pizzaMetrics.index >= 100 ? "text-emerald-600" : "text-yellow-600")}>
                  {pizzaMetrics.index > 0 ? pizzaMetrics.index : '--'} <span className="text-[10px] saas-text-secondary font-normal">%</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Active Card: Bakery */}
          <Link href="/bakery" className="saas-card rounded-xl p-5 relative overflow-hidden group hover:shadow-md hover:border-[#2b80ff]/30 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
                <Store size={20} />
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></span>
                <span className="text-[9px] font-mono text-emerald-600 uppercase tracking-wider font-[family-name:var(--font-jetbrains)]">ONLINE</span>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold saas-text-primary mb-0.5">Крафтова пекарня</h2>
              <p className="text-[10px] font-mono saas-text-secondary uppercase tracking-wide mb-4 font-[family-name:var(--font-jetbrains)]">Випічка та аналітика</p>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-auto">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 group-hover:bg-blue-50/50 transition-colors">
                <div className="text-[9px] saas-text-secondary uppercase font-mono mb-0.5 font-[family-name:var(--font-jetbrains)]">Продано</div>
                <div className="text-base font-bold saas-text-primary">
                  1 845 <span className="text-[10px] saas-text-secondary font-normal">шт.</span>
                </div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 group-hover:bg-blue-50/50 transition-colors">
                <div className="text-[9px] saas-text-secondary uppercase font-mono mb-0.5 font-[family-name:var(--font-jetbrains)]">Списано</div>
                <div className="text-base font-bold saas-text-primary">
                  142 <span className="text-[10px] saas-text-secondary font-normal">шт.</span>
                </div>
              </div>
              <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/60 group-hover:bg-amber-100 transition-colors">
                <div className="text-[9px] text-amber-600 uppercase font-mono mb-0.5 font-[family-name:var(--font-jetbrains)]">Waste Rate</div>
                <div className="text-base font-bold text-amber-600">
                  7.1 <span className="text-[10px] text-amber-500 font-normal">%</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Active Card: Konditerka */}
          <Link href="/konditerka" className="saas-card rounded-xl p-5 relative overflow-hidden group hover:shadow-md hover:border-[#00E0FF]/30 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600">
                <Zap size={20} />
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></span>
                <span className="text-[9px] font-mono text-emerald-600 uppercase tracking-wider font-[family-name:var(--font-jetbrains)]">ONLINE</span>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold saas-text-primary mb-0.5">ЦЕХ Кондитерка</h2>
              <p className="text-[10px] font-mono saas-text-secondary uppercase tracking-wide mb-4 font-[family-name:var(--font-jetbrains)]">Солодощі та десерти</p>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-auto">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-[9px] saas-text-secondary uppercase font-mono mb-0.5 font-[family-name:var(--font-jetbrains)]">Факт залишок</div>
                <div className="text-base font-bold saas-text-primary">
                  {konditerkaMetrics.fact > 0 ? konditerkaMetrics.fact : '--'} <span className="text-[10px] saas-text-secondary font-normal">шт.</span>
                </div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-[9px] saas-text-secondary uppercase font-mono mb-0.5 font-[family-name:var(--font-jetbrains)]">Норма</div>
                <div className="text-base font-bold saas-text-primary">
                  {konditerkaMetrics.norm > 0 ? konditerkaMetrics.norm : '--'} <span className="text-[10px] saas-text-secondary font-normal">шт.</span>
                </div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-[9px] saas-text-secondary uppercase font-mono mb-0.5 font-[family-name:var(--font-jetbrains)]">Індекс</div>
                <div className={cn("text-base font-bold", konditerkaMetrics.index >= 100 ? "text-emerald-600" : (konditerkaMetrics.index >= 80 ? "text-yellow-600" : "text-red-500"))}>
                  {konditerkaMetrics.index > 0 ? konditerkaMetrics.index : '--'} <span className="text-[10px] saas-text-secondary font-normal">%</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Active Card: Bulvar */}
          <Link href="/bulvar" className="saas-card rounded-xl p-5 relative overflow-hidden group hover:shadow-md hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-600">
                <Store size={20} />
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></span>
                <span className="text-[9px] font-mono text-emerald-600 uppercase tracking-wider font-[family-name:var(--font-jetbrains)]">ONLINE</span>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold saas-text-primary mb-0.5">ЦЕХ Бульвар-Автовокзал</h2>
              <p className="text-[10px] font-mono saas-text-secondary uppercase tracking-wide mb-4 font-[family-name:var(--font-jetbrains)]">Млинці, Сирники, Хачапурі</p>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-auto">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-[9px] saas-text-secondary uppercase font-mono mb-0.5 font-[family-name:var(--font-jetbrains)]">Факт залишок</div>
                <div className="text-base font-bold saas-text-primary">
                  {bulvarMetrics.fact > 0 ? bulvarMetrics.fact : '--'} <span className="text-[10px] saas-text-secondary font-normal">шт.</span>
                </div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-[9px] saas-text-secondary uppercase font-mono mb-0.5 font-[family-name:var(--font-jetbrains)]">Норма</div>
                <div className="text-base font-bold saas-text-primary">
                  {bulvarMetrics.norm > 0 ? bulvarMetrics.norm : '--'} <span className="text-[10px] saas-text-secondary font-normal">шт.</span>
                </div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="text-[9px] saas-text-secondary uppercase font-mono mb-0.5 font-[family-name:var(--font-jetbrains)]">Індекс</div>
                <div className={cn("text-base font-bold", bulvarMetrics.index >= 100 ? "text-emerald-600" : (bulvarMetrics.index >= 80 ? "text-yellow-600" : "text-red-500"))}>
                  {bulvarMetrics.index > 0 ? bulvarMetrics.index : '--'} <span className="text-[10px] saas-text-secondary font-normal">%</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Active Card: Florida */}
          <Link href="/florida/production" className="saas-card rounded-xl p-5 relative overflow-hidden group hover:shadow-md hover:border-[#F43F5E]/30 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2.5 rounded-xl bg-pink-50 border border-pink-200 text-[#F43F5E]">
                <Factory size={20} />
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></span>
                <span className="text-[9px] font-mono text-emerald-600 uppercase tracking-wider font-[family-name:var(--font-jetbrains)]">ONLINE</span>
              </div>
            </div>

            <div className="mb-auto mt-4">
              <h2 className="text-xl font-bold saas-text-primary mb-0.5">ЦЕХ Флорида</h2>
              <p className="text-[10px] font-mono saas-text-secondary uppercase tracking-wide mb-4 font-[family-name:var(--font-jetbrains)]">Напівфабрикати та Кулінарія</p>
            </div>

            <div className="grid grid-cols-1 gap-2 mt-auto">
              <div className="flex bg-slate-50 p-2.5 rounded-lg border border-slate-100 items-center justify-between group-hover:bg-[#F43F5E]/10 transition-colors">
                <div className="text-[10px] uppercase font-mono saas-text-secondary font-bold font-[family-name:var(--font-jetbrains)]">ПЕРЕЙТИ ДО АНАЛІТИКИ</div>
                <ArrowRight size={14} className="text-[#F43F5E] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

                  {/* Inactive Cards */}

<InactiveCard
            title="ЦЕХ E-Com"
            subtitle="Виробництво"
            icon={Store}
            iconBg="bg-slate-100"
            iconBorder="border-slate-200"
          />

          <InactiveCard
            title="ЦЕХ E-Com"
            subtitle="Виробництво"
            icon={Store}
            iconBg="bg-slate-100"
            iconBorder="border-slate-200"
          />

          <InactiveCard
            title="ЦЕХ Б"
            subtitle="Центральна кухня"
            icon={ShoppingBag}
            iconBg="bg-slate-100"
            iconBorder="border-slate-200"
          />

          {/* Active Card: ML Forecasting */}
          <Link href="/forecasting" className="saas-card rounded-xl p-5 relative overflow-hidden group hover:shadow-md hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full pointer-events-none"></div>
            <div className="flex justify-between items-start mb-2 relative z-10">
              <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-600">
                <BrainCircuit size={20} />
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.3)] animate-pulse"></span>
                <span className="text-[9px] font-mono text-purple-600 uppercase tracking-wider font-[family-name:var(--font-jetbrains)]">AI ENGINE</span>
              </div>
            </div>

            <div className="relative z-10">
              <h2 className="text-xl font-bold saas-text-primary mb-0.5">ML Прогнозування</h2>
              <p className="text-[10px] font-mono saas-text-secondary uppercase tracking-wide mb-4 font-[family-name:var(--font-jetbrains)]">AI-Генерація планів випічки</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-auto relative z-10">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 group-hover:bg-purple-50/50 transition-colors">
                <div className="text-[9px] saas-text-secondary uppercase font-mono mb-0.5 font-[family-name:var(--font-jetbrains)]">Точність моделі</div>
                <div className="text-base font-bold saas-text-primary">
                  94.2 <span className="text-[10px] saas-text-secondary font-normal">%</span>
                </div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 group-hover:bg-purple-50/50 transition-colors">
                <div className="text-[9px] saas-text-secondary uppercase font-mono mb-0.5 font-[family-name:var(--font-jetbrains)]">Статус навчання</div>
                <div className="text-sm font-bold text-emerald-600 pt-0.5">
                  АКТИВНО
                </div>
              </div>
            </div>
          </Link>

          {/* Active Card: Finance Dashboard */}
          <Link href="/finance" className="saas-card rounded-xl p-5 relative overflow-hidden group hover:shadow-md hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none"></div>
            <div className="flex justify-between items-start mb-2 relative z-10">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
                <BarChart2 size={20} />
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse"></span>
                <span className="text-[9px] font-mono text-emerald-600 uppercase tracking-wider font-[family-name:var(--font-jetbrains)]">ONLINE</span>
              </div>
            </div>

            <div className="relative z-10">
              <h2 className="text-xl font-bold saas-text-primary mb-0.5">Фінансова Аналітика</h2>
              <p className="text-[10px] font-mono saas-text-secondary uppercase tracking-wide mb-4 font-[family-name:var(--font-jetbrains)]">Виторг, Тренди, Магазини</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-auto relative z-10">
              <div className="flex bg-slate-50 p-2.5 rounded-lg border border-slate-100 items-center justify-between group-hover:bg-emerald-50/50 transition-colors">
                <div className="text-[10px] uppercase font-mono saas-text-secondary font-bold font-[family-name:var(--font-jetbrains)]">УВІЙТИ ДО ФІНАНСІВ</div>
                <ArrowRight size={14} className="text-emerald-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          </main>

        <footer className="mt-4 text-center border-t border-white/5 pt-3 shrink-0">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em] font-[family-name:var(--font-jetbrains)]">Produced by Tovstytsky Dmytro</p>
        </footer>
      </div>
    </div>
  );
}

function InactiveCard({
  title,
  subtitle,
  icon: Icon,
  iconBg,
  iconBorder
}: {
  title: string,
  subtitle: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any,
  iconBg: string,
  iconBorder: string
}) {
  return (
    <div className="saas-card rounded-xl p-5 relative overflow-hidden opacity-70 select-none grayscale-[0.2] flex flex-col justify-between bg-gray-50/50">
      <div className="absolute inset-0 bg-white/40 z-10 backdrop-blur-[1px]"></div>
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
        <div className="bg-slate-100 border border-slate-200 w-[110%] py-4 flex flex-col items-center justify-center transform -rotate-6 shadow-sm relative">
          <h3 className="text-3xl md:text-4xl font-black text-slate-300 uppercase tracking-tighter">В РОЗРОБЦІ</h3>
          <div className="flex items-center gap-2 mt-1">
            <Zap className="text-slate-400" size={14} />
            <span className="text-[10px] font-mono text-slate-400 tracking-[0.3em] uppercase font-[family-name:var(--font-jetbrains)]">System Level 2</span>
          </div>
        </div>
      </div>

      <div className="opacity-40 filter blur-[2px] h-full flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div className={cn("p-2.5 rounded-xl border text-slate-400", iconBg, iconBorder)}>
            <Icon size={20} />
          </div>
          <div className="px-2.5 py-0.5 rounded-full bg-slate-200 border border-slate-300">
            <span className="text-[9px] font-mono text-slate-500 uppercase font-[family-name:var(--font-jetbrains)]">OFFLINE</span>
          </div>
        </div>

        <div className="mb-auto">
          <h2 className="text-xl font-bold saas-text-primary mb-0.5">{title}</h2>
          <p className="text-[10px] font-mono saas-text-secondary uppercase tracking-wide mb-4 font-[family-name:var(--font-jetbrains)]">{subtitle}</p>
        </div>

        {/* Placeholder for layout consistency */}
        <div className="h-12 w-full mt-auto"></div>
      </div>
    </div>
  );
}
