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
  Truck,
  ClipboardList,
  ArrowRight,
  LogOut
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
      "h-screen bg-[#0B0F19] text-slate-200 font-sans relative overflow-hidden selection:bg-[#00E0FF] selection:text-black flex flex-col",
      chakra.variable,
      jetbrains.variable,
      "font-[family-name:var(--font-chakra)]"
    )}>
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none bg-[size:40px_40px]" style={{
        backgroundImage: 'linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)'
      }}></div>
      <div className="fixed top-0 left-0 w-full h-96 bg-[#00E0FF]/5 rounded-full blur-[120px] pointer-events-none transform -translate-y-1/2"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-[#FF2A55]/5 rounded-full blur-[100px] pointer-events-none transform translate-y-1/2 translate-x-1/2"></div>

      <div className="relative z-10 p-4 md:p-6 flex flex-col h-full max-w-[1920px] mx-auto w-full">

        {/* Header */}
        <header className="flex flex-row justify-between items-center mb-4 gap-4 border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-[#00E0FF]/20 p-2 rounded-lg backdrop-blur-sm border border-[#00E0FF]/30">
              <LayoutGrid className="text-[#00E0FF]" size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider text-white">Галя Балувана</h1>
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#00E0FF]/80 tracking-[0.2em] font-[family-name:var(--font-jetbrains)]">
                <span>COMMAND CENTER</span>
                <span className="w-1 h-1 bg-[#00E0FF] rounded-full"></span>
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
            <div className="glass-panel bg-[#FF2A55]/10 px-4 py-1.5 rounded-full border border-[#FF2A55]/30 flex items-center gap-3 shadow-[0_0_15px_rgba(255,42,85,0.2)] animate-pulse absolute left-1/2 -translate-x-1/2 top-6">
              <span className="w-2 h-2 bg-[#FF2A55] rounded-full animate-ping"></span>
              <span className="text-[#FF2A55] font-mono text-xs font-bold uppercase tracking-wide font-[family-name:var(--font-jetbrains)]">
                {gravitonMetrics.criticalSKU} критичних у Гравітоні
              </span>
            </div>
          )}

          <div className="text-right">
            <div className="text-2xl font-mono text-[#00E0FF] font-bold tabular-nums tracking-widest drop-shadow-[0_0_8px_rgba(0,224,255,0.6)] font-[family-name:var(--font-jetbrains)]">
              {time?.toLocaleTimeString('uk-UA', { hour12: false }) || '00:00:00'}
            </div>
            <div className="text-[10px] text-slate-400 font-mono uppercase font-[family-name:var(--font-jetbrains)]">
              {capitalizedDate || 'Завантаження...'}
            </div>
          </div>
        </header>

        {/* content */}
        <main className="grid grid-cols-3 gap-4 flex-1 min-h-0">

          {/* Active Card: Graviton */}
          <Link href="/graviton" className="glass-panel bg-[#131B2C] rounded-xl p-5 relative overflow-hidden group hover:shadow-[0_0_20px_rgba(0,224,255,0.15)] hover:border-[#00E0FF]/30 transition-all duration-300 hover:scale-[1.005] flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-b from-transparent via-[#00E0FF]/50 to-transparent opacity-0 group-hover:opacity-100 animate-scan pointer-events-none"></div>

            <div className="flex justify-between items-start mb-2">
              <div className="p-2.5 rounded-xl bg-cyan-900/30 border border-cyan-500/20 text-[#00E0FF]">
                <BarChart2 size={20} />
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-red-900/40 border border-[#FF2A55]/50 flex items-center gap-2">
                {gravitonMetrics?.criticalSKU > 0 ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A55] animate-pulse"></span>
                    <span className="text-[9px] font-mono text-[#FF2A55] uppercase tracking-wider font-[family-name:var(--font-jetbrains)]">УВАГА</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                    <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider font-[family-name:var(--font-jetbrains)]">ONLINE</span>
                  </>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-0.5">ЦЕХ Гравітон</h2>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wide mb-4 font-[family-name:var(--font-jetbrains)]">Виробництво заморозки</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-auto">
              <div className="bg-slate-900/50 p-2.5 rounded-lg border border-white/5">
                <div className="text-[9px] text-slate-500 uppercase font-mono mb-0.5 font-[family-name:var(--font-jetbrains)]">Всього до виробництва</div>
                <div className="text-lg font-bold text-white">
                  {gravitonMetrics ? Math.round(gravitonMetrics.shopLoad) : '--'} <span className="text-xs text-slate-400 font-normal">кг</span>
                </div>
              </div>
              <div className="bg-red-900/20 p-2.5 rounded-lg border border-[#FF2A55]/30">
                <div className="text-[9px] text-red-300/70 uppercase font-mono mb-0.5 font-[family-name:var(--font-jetbrains)]">Критично</div>
                <div className="text-lg font-bold text-[#FF2A55]">
                  {gravitonMetrics ? gravitonMetrics.criticalSKU : '--'} <span className="text-xs font-normal">SKU</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Active Card: Pizza */}
          <Link href="/pizza" className="glass-panel bg-[#131B2C] rounded-xl p-5 relative overflow-hidden group hover:shadow-[0_0_20px_rgba(0,224,255,0.15)] hover:border-[#00E0FF]/30 transition-all duration-300 hover:scale-[1.005] flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-b from-transparent via-[#00E0FF]/50 to-transparent opacity-0 group-hover:opacity-100 animate-scan pointer-events-none"></div>

            <div className="flex justify-between items-start mb-2">
              <div className="p-2.5 rounded-xl bg-yellow-900/30 border border-yellow-500/20 text-yellow-400">
                <ChefHat size={20} />
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-emerald-900/40 border border-emerald-500/50 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider font-[family-name:var(--font-jetbrains)]">ONLINE</span>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-0.5">ЦЕХ Піца</h2>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wide mb-4 font-[family-name:var(--font-jetbrains)]">Випічка та пакування</p>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-auto">
              <div className="bg-slate-900/50 p-2.5 rounded-lg border border-white/5">
                <div className="text-[9px] text-slate-500 uppercase font-mono mb-0.5 font-[family-name:var(--font-jetbrains)]">Факт залишок</div>
                <div className="text-base font-bold text-white">
                  {pizzaMetrics.fact > 0 ? pizzaMetrics.fact : '--'} <span className="text-[10px] text-slate-400 font-normal">шт.</span>
                </div>
              </div>
              <div className="bg-slate-900/50 p-2.5 rounded-lg border border-white/5">
                <div className="text-[9px] text-slate-500 uppercase font-mono mb-0.5 font-[family-name:var(--font-jetbrains)]">Норма</div>
                <div className="text-base font-bold text-white">
                  {pizzaMetrics.norm > 0 ? pizzaMetrics.norm : '--'} <span className="text-[10px] text-slate-400 font-normal">шт.</span>
                </div>
              </div>
              <div className="bg-slate-900/50 p-2.5 rounded-lg border border-white/5">
                <div className="text-[9px] text-slate-500 uppercase font-mono mb-0.5 font-[family-name:var(--font-jetbrains)]">Індекс</div>
                <div className={cn("text-base font-bold", pizzaMetrics.index >= 100 ? "text-emerald-400" : "text-yellow-400")}>
                  {pizzaMetrics.index > 0 ? pizzaMetrics.index : '--'} <span className="text-[10px] text-slate-400 font-normal">%</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Inactive Cards */}
          <InactiveCard
            title="Крафтова"
            subtitle="Випічка хліба"
            icon={Zap}
            iconBg="bg-purple-900/30"
            iconBorder="border-purple-500/20"
          />

          <InactiveCard
            title="ЦЕХ Фарма"
            subtitle="Кондитерські вироби"
            icon={Activity}
            iconBg="bg-teal-900/30"
            iconBorder="border-teal-500/20"
          />

          <InactiveCard
            title="ЦЕХ Склад"
            subtitle="Випічка та кулінарія"
            icon={Factory}
            iconBg="bg-orange-900/30"
            iconBorder="border-orange-500/20"
          />

          <InactiveCard
            title="ЦЕХ E-Com"
            subtitle="Виробництво"
            icon={Store}
            iconBg="bg-pink-900/30"
            iconBorder="border-pink-500/20"
          />

          <InactiveCard
            title="ЦЕХ Б"
            subtitle="Центральна кухня"
            icon={ShoppingBag}
            iconBg="bg-indigo-900/30"
            iconBorder="border-indigo-500/20"
          />

          <InactiveCard
            title="ЦЕХ К"
            subtitle="Солодощі та десерти"
            icon={Zap}
            iconBg="bg-violet-900/30"
            iconBorder="border-violet-500/20"
          />

          <InactiveCard
            title="ЦЕХ Го"
            subtitle="Виробництво"
            icon={Warehouse}
            iconBg="bg-cyan-900/30"
            iconBorder="border-cyan-500/20"
          />

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
  icon: any,
  iconBg: string,
  iconBorder: string
}) {
  return (
    <div className="glass-panel bg-[#131B2C]/40 rounded-xl p-5 relative overflow-hidden opacity-80 select-none grayscale-[0.5] flex flex-col justify-between">
      <div className="absolute inset-0 bg-black/40 z-10 backdrop-blur-[2px]"></div>
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
        <div className="caution-tape w-[110%] py-4 flex flex-col items-center justify-center transform -rotate-6 shadow-2xl relative">
          <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter glitch-text">В РОЗРОБЦІ</h3>
          <div className="flex items-center gap-2 mt-1">
            <Zap className="text-[#00E0FF] animate-pulse" size={14} />
            <span className="text-[10px] font-mono text-[#00E0FF] tracking-[0.3em] uppercase font-[family-name:var(--font-jetbrains)]">System Level 2</span>
          </div>
        </div>
      </div>

      <div className="opacity-30 filter blur-sm h-full flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div className={cn("p-2.5 rounded-xl border", iconBg, iconBorder)}>
            <Icon size={20} />
          </div>
          <div className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-600">
            <span className="text-[9px] font-mono text-slate-400 uppercase font-[family-name:var(--font-jetbrains)]">OFFLINE</span>
          </div>
        </div>

        <div className="mb-auto">
          <h2 className="text-xl font-bold text-white mb-0.5">{title}</h2>
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wide mb-4 font-[family-name:var(--font-jetbrains)]">{subtitle}</p>
        </div>

        {/* Placeholder for layout consistency */}
        <div className="h-12 w-full mt-auto"></div>
      </div>
    </div>
  );
}
