'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Activity, ArrowRight, BarChart2, ChefHat, LayoutGrid, Zap, Factory, Store, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CommandLevel1() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // 🛰️ DATA FETCHING
  const { data: gravitonData } = useSWR('/api/graviton/metrics', fetcher, { refreshInterval: 10000 });
  const { data: pizzaData } = useSWR('/api/pizza/analytics', fetcher, { refreshInterval: 10000 });

  // Simple time for the header
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0E17] text-white overflow-hidden relative font-sans selection:bg-[#00D4FF]/30">

      {/* 🌌 AMBIENT BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-[#00D4FF]/5 blur-[150px] rounded-full mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-[#7B61FF]/5 blur-[150px] rounded-full mix-blend-screen animate-pulse-slow delay-1000" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vh] bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* 🏆 HEADER */}
        <header className="px-8 py-6 flex justify-between items-center border-b border-white/5 bg-[#0B0E17]/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#0066FF] flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.3)]">
              <LayoutGrid className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider uppercase text-white">Галя Балувана</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Command Center • Level 1</p>
            </div>
          </div>

          <div className="text-right hidden md:block">
            <div className="text-lg font-mono font-bold text-[#00D4FF] drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]">
              {time?.toLocaleTimeString('uk-UA')}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40">
              {time?.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </header>

        {/* 🚀 MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 lg:px-8 py-2">

          <div className="w-full max-w-[1400px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">

            {/* 🟦 CARD 1: GRAVITON */}
            <WorkshopCard
              href="/graviton"
              title="ЦЕХ Гравітон"
              subtitle="Виробництво заморозки"
              icon={BarChart2}
              color="#00D4FF"
              isHovered={hoveredCard === 'graviton'}
              onMouseEnter={() => setHoveredCard('graviton')}
              onMouseLeave={() => setHoveredCard(null)}
              stats={[
                { label: 'Всього до виробництва', value: gravitonData ? `${Math.round(gravitonData.shopLoad)} кг` : '— кг' },
                {
                  label: 'Критично',
                  value: gravitonData ? `${gravitonData.criticalSKU} SKU` : '— 🔥',
                  valueColor: (gravitonData?.criticalSKU > 0) ? '#FF4D4D' : undefined
                }
              ]}
              actionLabel="Управління замовленням"
            />

            {/* 🟧 CARD 2: PIZZA */}
            <WorkshopCard
              href="/pizza"
              title="ЦЕХ Піца"
              subtitle="Випічка та пакування"
              icon={ChefHat}
              color="#FFB800"
              isHovered={hoveredCard === 'pizza'}
              onMouseEnter={() => setHoveredCard('pizza')}
              onMouseLeave={() => setHoveredCard(null)}
              stats={[
                {
                  label: 'Факт залишок',
                  value: pizzaData ? `${pizzaData.kpi.currentStock} шт.` : '— шт.',
                  valueColor: (Number(pizzaData?.kpi.fillLevel) < 50) ? '#FF4D4D' : undefined
                },
                { label: 'Норма', value: pizzaData ? `${pizzaData.kpi.totalTarget} шт.` : '— шт.' },
                {
                  label: 'Індекс заповненості',
                  value: pizzaData ? `${pizzaData.kpi.fillLevel}%` : '— %',
                  valueColor: Number(pizzaData?.kpi.fillLevel) < 50 ? '#FF4D4D' :
                    Number(pizzaData?.kpi.fillLevel) < 80 ? '#FFA500' : undefined
                }
              ]}
              actionLabel="Розподіл та логістика"
            />

            {/* 🟣 CARD 3: KRAFT BAKERY */}
            <WorkshopCard
              href="#"
              title="Крафтова пекарня"
              subtitle="Випічка хліба та булок"
              icon={Zap}
              color="#A855F7"
              isHovered={hoveredCard === 'bakery'}
              onMouseEnter={() => setHoveredCard('bakery')}
              onMouseLeave={() => setHoveredCard(null)}
              isLocked={true}
              stats={[
                { label: 'План на зміну', value: '— шт.' },
                { label: 'Готовність', value: '— %' }
              ]}
              actionLabel="В розробці"
            />

            {/* 🟢 CARD 4: FLORIDA */}
            <WorkshopCard
              href="#"
              title="ЦЕХ Флорида"
              subtitle="Кондитерські вироби"
              icon={Activity}
              color="#10B981"
              isHovered={hoveredCard === 'florida'}
              onMouseEnter={() => setHoveredCard('florida')}
              onMouseLeave={() => setHoveredCard(null)}
              isLocked={true}
              stats={[
                { label: 'Замовлення', value: '—' },
                { label: 'Статус', value: 'Очікуємо' }
              ]}
              actionLabel="В розробці"
            />

            {/* 🟡 CARD 5: SADOVA */}
            <WorkshopCard
              href="#"
              title="ЦЕХ Садова"
              subtitle="Випічка та кулінарія"
              icon={Factory}
              color="#F59E0B"
              isHovered={hoveredCard === 'sadova'}
              onMouseEnter={() => setHoveredCard('sadova')}
              onMouseLeave={() => setHoveredCard(null)}
              isLocked={true}
              stats={[
                { label: 'План', value: '—' },
                { label: 'Статус', value: 'Очікуємо' }
              ]}
              actionLabel="В розробці"
            />

            {/* 🟣 CARD 6: ENTUZIASTIV */}
            <WorkshopCard
              href="#"
              title="ЦЕХ Ентузіастів"
              subtitle="Виробництво"
              icon={Store}
              color="#EC4899"
              isHovered={hoveredCard === 'entuziastiv'}
              onMouseEnter={() => setHoveredCard('entuziastiv')}
              onMouseLeave={() => setHoveredCard(null)}
              isLocked={true}
              stats={[
                { label: 'План', value: '—' },
                { label: 'Статус', value: 'Очікуємо' }
              ]}
              actionLabel="В розробці"
            />

            {/* 🔵 CARD 7: BULVAR */}
            <WorkshopCard
              href="#"
              title="ЦЕХ Бульвар"
              subtitle="Центральна кухня"
              icon={ShoppingBag}
              color="#6366F1"
              isHovered={hoveredCard === 'bulvar'}
              onMouseEnter={() => setHoveredCard('bulvar')}
              onMouseLeave={() => setHoveredCard(null)}
              isLocked={true}
              stats={[
                { label: 'План', value: '—' },
                { label: 'Статус', value: 'Очікуємо' }
              ]}
              actionLabel="В розробці"
            />

            {/* 🍬 CARD 8: CONFECTIONERY */}
            <WorkshopCard
              href="#"
              title="ЦЕХ Кондитерка"
              subtitle="Солодощі та десерти"
              icon={Zap}
              color="#8B5CF6"
              isHovered={hoveredCard === 'confectionery'}
              onMouseEnter={() => setHoveredCard('confectionery')}
              onMouseLeave={() => setHoveredCard(null)}
              isLocked={true}
              stats={[
                { label: 'План', value: '—' },
                { label: 'Статус', value: 'Очікуємо' }
              ]}
              actionLabel="В розробці"
            />

            {/* 🏛️ CARD 9: HEROIV MAIDANU */}
            <WorkshopCard
              href="#"
              title="ЦЕХ Героїв Майдану"
              subtitle="Виробництво"
              icon={Factory}
              color="#14B8A6"
              isHovered={hoveredCard === 'heroiv'}
              onMouseEnter={() => setHoveredCard('heroiv')}
              onMouseLeave={() => setHoveredCard(null)}
              isLocked={true}
              stats={[
                { label: 'План', value: '—' },
                { label: 'Статус', value: 'Очікуємо' }
              ]}
              actionLabel="В розробці"
            />

          </div>

        </main>

        <footer className="py-4 text-center text-white/20 text-[10px] uppercase tracking-widest font-mono pointer-events-none">
          System v2.0 • Antigravity Module
        </footer>
      </div>
    </div>
  );
}

// ✨ COMPONENT: Workshop Card
function WorkshopCard({
  href,
  title,
  subtitle,
  icon: Icon,
  color,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  stats,
  actionLabel,
  isLocked = false
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  stats: { label: string; value: string; valueColor?: string }[];
  actionLabel: string;
  isLocked?: boolean;
}) {
  return (
    <Link
      href={isLocked ? '#' : href}
      className={cn(
        "group relative h-[210px] lg:h-[240px] flex flex-col rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]",
        isLocked && "cursor-not-allowed opacity-80"
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: `1px solid ${isHovered ? color : 'rgba(255, 255, 255, 0.08)'}`,
        boxShadow: isHovered
          ? `0 0 60px -20px ${color}40, inset 0 0 20px -5px ${color}20`
          : '0 20px 40px -10px rgba(0,0,0,0.5)',
      }}
    >
      {/* 🔦 Dynamic Glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background: `radial-gradient(800px circle at 50% 0%, ${color}15, transparent 60%)`
        }}
      />

      {/* 🖼️ Card Content */}
      <div className="relative z-10 flex-1 p-6 lg:p-8 flex flex-col justify-between">

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
              style={{
                background: `${color}15`,
                boxShadow: `0 0 30px ${color}10`,
                border: `1px solid ${color}30`
              }}
            >
              <Icon size={24} style={{ color: color }} />
            </div>

            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-1 leading-tight tracking-tight">
              {title}
            </h2>
            <p className="text-white/40 text-[10px] lg:text-xs font-medium uppercase tracking-widest">
              {subtitle}
            </p>
          </div>

          {isLocked && (
            <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">🔒 Offline</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className={cn(
          "grid gap-3 my-4",
          stats.length === 3 ? "grid-cols-3" : "grid-cols-2"
        )}>
          {stats.map((stat, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/5 group-hover:bg-white/10 group-hover:border-white/10 transition-colors">
              <div className="text-[7px] lg:text-[8px] text-white/40 uppercase tracking-widest font-bold mb-0.5 truncate">
                {stat.label}
              </div>
              <div
                className="text-sm lg:text-lg font-mono font-bold truncate transition-colors duration-300"
                style={{ color: stat.valueColor || '#FFF' }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div
          className="flex items-center justify-between py-3 px-5 rounded-xl transition-all duration-300 transform group-hover:translate-x-2"
          style={{
            background: isHovered && !isLocked ? color : 'rgba(255, 255, 255, 0.05)',
            color: isHovered && !isLocked ? '#000' : '#FFF'
          }}
        >
          <span className="font-bold uppercase tracking-widest text-[10px]">
            {actionLabel}
          </span>
          <ArrowRight size={16} className={cn("transition-transform duration-300", isHovered && "translate-x-1")} />
        </div>

      </div>

      {/* 🏗️ IN DEVELOPMENT OVERLAY */}
      {isLocked && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0B0E17]/60 backdrop-blur-[2px] pointer-events-none group-hover:backdrop-blur-none transition-all duration-500">
          <div className="px-6 py-3 border-y-2 border-white/10 bg-white/5 flex flex-col items-center gap-1 -rotate-6 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
            <span className="text-3xl lg:text-4xl font-black text-white/90 tracking-tighter uppercase text-center drop-shadow-2xl">
              В РОЗРОБЦІ
            </span>
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-[#00D4FF] animate-pulse" />
              <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-[0.3em]">System Level 2</span>
            </div>
          </div>
        </div>
      )}
    </Link>
  );
}
