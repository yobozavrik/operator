'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Activity, AlertTriangle, TrendingDown, Store, AlertCircle, Percent, ArrowUpRight, ArrowDownRight, Package, TrendingUp, Calendar, ChevronLeft, Loader2, X, Search, LayoutGrid, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Suspense } from 'react';
import { Chakra_Petch, JetBrains_Mono } from 'next/font/google';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const chakra = Chakra_Petch({ weight: ['300', '400', '500', '600', '700'], subsets: ['latin'], variable: '--font-chakra' });
const jetbrains = JetBrains_Mono({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-jetbrains' });



function BakeryDashboard() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const activeTabParam = searchParams.get('tab');
    const activeTab = (activeTabParam === 'network' || activeTabParam === 'ranking' || activeTabParam === 'catalog' || activeTabParam === 'discount' || activeTabParam === 'trend') ? activeTabParam : 'network';

    const setTab = (tab: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.push(`${pathname}?${params.toString()}`);
    };
    const [selectedSku, setSelectedSku] = useState<{ id: string, name: string } | null>(null);
    const [metricMode, setMetricMode] = useState<'qty' | 'revenue'>('qty');

    // Инициализируем даты (по умолчанию - последние 14 дней)
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 14);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
    });

    const handlePresetChange = (days: number) => {
        const end = new Date();
        const start = new Date();
        end.setDate(end.getDate() - 1);
        start.setDate(end.getDate() - (days - 1));
        setEndDate(end.toISOString().split('T')[0]);
        setStartDate(start.toISOString().split('T')[0]);
    };

    const periodQuery = `start_date=${startDate}&end_date=${endDate}`;

    const { data: apiData, error, isLoading } = useSWR(`/api/bakery/analytics?${periodQuery}`, fetcher);

    // API для каталога и карточек
    const { data: catalogData, isLoading: catalogLoading } = useSWR(`/api/bakery/catalog?${periodQuery}`, fetcher);
    const { data: storesData, isLoading: storesLoading } = useSWR(selectedSku ? `/api/bakery/catalog/stores?sku_id=${selectedSku.id}&${periodQuery}` : null, fetcher);

    // Remove safe fallbacks since the API is fixed
    const network = apiData?.network || {};
    const ranking = apiData?.ranking || {};
    const trends = apiData?.trends || [];

    // Здоров'я дисконту
    const allStores = [...(ranking.top_stores || []), ...(ranking.bottom_stores || [])];
    const discountStores = allStores.filter(s => s.cannibalization_pct !== undefined).sort((a, b) => b.cannibalization_pct - a.cannibalization_pct);
    const discountHealth = discountStores;

    return (
        <div className={cn("min-h-screen bg-[#0B0F19] text-white selection:bg-[#2b80ff] selection:text-white p-4 md:p-8 font-sans flex flex-col", chakra.variable, jetbrains.variable, "font-[family-name:var(--font-chakra)]")}>

            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">

                {/* Header Back Link */}
                <div className="shrink-0">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-[#2b80ff] transition-colors uppercase tracking-widest font-bold">
                        <ChevronLeft size={16} /> Повернутись до Command Center
                    </Link>
                </div>

                {/* Main Panel */}
                <div className="flex-1 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl  flex flex-col overflow-hidden">

                    {/* Header Area */}
                    <div className="p-6 border-b border-white/10 bg-gradient-to-br from-white/5 to-transparent flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shrink-0 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/80 to-transparent pointer-events-none"></div>
                        <div className="flex flex-col gap-3 relative z-10 w-full xl:w-auto">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[#2b80ff]/10 border border-[#2b80ff]/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(43,128,255,0.15)]">
                                    <Store className="text-[#2b80ff]" size={24} />
                                </div>
                                <div className="leading-none pt-1">
                                    <h2 className="text-2xl font-bold text-white uppercase tracking-widest font-display m-0 p-0">
                                        Аналітичний дашборд
                                    </h2>
                                    <h2 className="text-2xl font-bold text-white uppercase tracking-widest font-display m-0 p-0 mt-1">
                                        "Крафтова пекарня"
                                    </h2>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <p className="text-sm text-slate-400 m-0">
                                    Аналітичний шар даних (Свіжий, Дисконт, Списання)
                                </p>
                                {isLoading && <Loader2 size={14} className="animate-spin text-[#2b80ff]" />}
                                {!isLoading && apiData && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-[family-name:var(--font-jetbrains)]">
                                        Live Data
                                    </span>
                                )}
                                {error && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-red-500/10 text-red-500 border border-red-500/20 uppercase shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                                        API Error
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col xl:items-end gap-3 relative z-10 w-full xl:w-auto">
                            {/* Top Row: Date Picker & Templates */}
                            <div className="flex items-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-1 shadow-sm w-full xl:w-auto justify-between xl:justify-start overflow-x-auto custom-scrollbar">
                                <div className="flex items-center px-4 gap-3 border-r border-white/[0.05] shrink-0">
                                    <Calendar size={16} className="text-slate-400" />
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="bg-transparent text-sm text-white font-bold outline-none cursor-pointer w-[115px] font-display tracking-widest custom-calendar-icon"
                                            max={endDate}
                                        />
                                        <span className="text-slate-400 font-bold">-</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="bg-transparent text-sm text-white font-bold outline-none cursor-pointer w-[115px] font-display tracking-widest custom-calendar-icon"
                                            min={startDate}
                                        />
                                    </div>
                                    <Calendar size={16} className="text-slate-400" />
                                </div>
                                <div className="relative">
                                    <select
                                        defaultValue=""
                                        onChange={(e) => {
                                            if (e.target.value) handlePresetChange(Number(e.target.value));
                                            e.target.value = "";
                                        }}
                                        className="appearance-none absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    >
                                        <option value="" disabled>Шаблони</option>
                                        <option value={1}>За 1 день (Вчора)</option>
                                        <option value={7}>Останні 7 днів</option>
                                        <option value={14}>Останні 14 днів</option>
                                        <option value={30}>Останні 30 днів</option>
                                    </select>
                                    <button className="flex items-center gap-2 px-6 py-1.5 text-sm font-bold text-[#2b80ff] uppercase tracking-wider font-display shrink-0 hover:bg-[#2b80ff]/10 rounded-lg transition-colors pointer-events-none">
                                        Шаблони
                                        <ChevronDown size={16} />
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                    {/* SIDEBAR */}
                    <div className="w-full lg:w-64 shrink-0 border-r border-white/10 bg-[#0B0F19]/80 backdrop-blur-xl p-4 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto custom-scrollbar border-b lg:border-b-0">
                        <button onClick={() => setTab('network')} className={cn("px-4 py-3 text-sm font-bold uppercase rounded-xl transition-all font-display tracking-widest flex items-center justify-start gap-3 shrink-0 text-left", activeTab === 'network' ? "bg-[#2b80ff]/20 text-[#2b80ff] border border-[#2b80ff]/30 rounded-lg" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent")}>
                            <Activity size={18} />
                            <span className="inline whitespace-nowrap">Мережа</span>
                        </button>
                        <button onClick={() => setTab('ranking')} className={cn("px-4 py-3 text-sm font-bold uppercase rounded-xl transition-all font-display tracking-widest flex items-center justify-start gap-3 shrink-0 text-left", activeTab === 'ranking' ? "bg-[#2b80ff]/20 text-[#2b80ff] border border-[#2b80ff]/30 rounded-lg" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent")}>
                            <TrendingUp size={18} />
                            <span className="inline whitespace-nowrap">Ренкінг/ABC</span>
                        </button>
                        <button onClick={() => setTab('catalog')} className={cn("px-4 py-3 text-sm font-bold uppercase rounded-xl transition-all font-display tracking-widest flex items-center justify-start gap-3 shrink-0 text-left", activeTab === 'catalog' ? "bg-[#2b80ff]/20 text-[#2b80ff] border border-[#2b80ff]/30 rounded-lg" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent")}>
                            <LayoutGrid size={18} />
                            <span className="inline whitespace-nowrap">Каталог</span>
                        </button>
                        <button onClick={() => setTab('discount')} className={cn("px-4 py-3 text-sm font-bold uppercase rounded-xl transition-all font-display tracking-widest flex items-center justify-start gap-3 shrink-0 text-left", activeTab === 'discount' ? "bg-[#2b80ff]/20 text-[#2b80ff] border border-[#2b80ff]/30 rounded-lg" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent")}>
                            <Percent size={18} />
                            <span className="inline whitespace-nowrap">Здоров'я дисконту</span>
                        </button>
                        <button onClick={() => setTab('trend')} className={cn("px-4 py-3 text-sm font-bold uppercase rounded-xl transition-all font-display tracking-widest flex items-center justify-start gap-3 shrink-0 text-left", activeTab === 'trend' ? "bg-[#2b80ff]/20 text-[#2b80ff] border border-[#2b80ff]/30 rounded-lg" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent")}>
                            <TrendingDown size={18} />
                            <span className="inline whitespace-nowrap">Тренди</span>
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-auto custom-scrollbar p-6 bg-gradient-to-b from-transparent to-bg-primary/30">
                        {/* NETWORK TAB */}
                        {activeTab === 'network' && (
                            <>
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h3 className="text-lg font-bold text-slate-200 uppercase tracking-widest font-display mb-2 border-l-2 border-accent-primary pl-3">Глобальні Метрики Мережі</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-5 rounded-2xl flex flex-col relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
                                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-slate-500/10 rounded-full blur-2xl group-hover:bg-slate-500/20 transition-all"></div>
                                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest font-display mb-2 relative z-10">Привезено (шт)</div>
                                            <div className="text-3xl font-bold font-[family-name:var(--font-jetbrains)] relative z-10 text-white tracking-tight">{network.qty_delivered || 0}</div>
                                            <Package className="absolute right-4 bottom-4 text-slate-400 opacity-10" size={48} />
                                        </div>
                                        <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl flex flex-col relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
                                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                                            <div className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest font-display mb-2 relative z-10">Продано Фреш & Дисконт</div>
                                            <div className="text-3xl font-bold font-[family-name:var(--font-jetbrains)] relative z-10 text-emerald-500 tracking-tight">{(network.qty_fresh_sold || 0) + (network.qty_disc_sold || 0)}</div>
                                            <Activity className="absolute right-4 bottom-4 text-emerald-500 opacity-10" size={48} />
                                        </div>
                                        <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl flex flex-col relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
                                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
                                            <div className="text-[10px] uppercase font-bold text-red-500 tracking-widest font-display mb-2 relative z-10">Списано в Мусор</div>
                                            <div className="text-3xl font-bold font-[family-name:var(--font-jetbrains)] relative z-10 text-red-500 tracking-tight">{network.qty_waste || 0}</div>
                                            <AlertTriangle className="absolute right-4 bottom-4 text-red-500 opacity-10" size={48} />
                                        </div>
                                        <div className="bg-[#2b80ff]/5 border border-[#2b80ff]/20 p-5 rounded-2xl flex flex-col relative overflow-hidden group justify-between shadow-sm hover:shadow-md transition-shadow">
                                            <div>
                                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#2b80ff]/10 rounded-full blur-2xl group-hover:bg-[#2b80ff]/20 transition-all"></div>
                                                <div className="text-[10px] uppercase font-bold text-[#2b80ff] tracking-widest font-display mb-3 relative z-10">Дисципліна Цеху</div>
                                                <div className="flex items-end gap-2 text-[#2b80ff]">
                                                    <div className="text-3xl font-bold font-[family-name:var(--font-jetbrains)] relative z-10 leading-none tracking-tight">{network.average_fill_rate || 0}%</div>
                                                    <div className="text-[9px] uppercase font-display tracking-widest pb-1 opacity-80">Fill Rate (Виконання)</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-gradient-to-br from-white/5 to-transparent border border-red-500/30 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-1.5 bg-red-500/10 text-red-500 rounded-lg"><AlertTriangle size={18} /></div>
                                                <div className="text-[10px] uppercase font-bold text-red-500 tracking-widest font-display">Списання в Грошах (Waste UAH)</div>
                                            </div>
                                            <div className="text-2xl font-bold font-[family-name:var(--font-jetbrains)] text-red-500 tracking-tight mt-1">
                                                {(network.waste_uah || 0).toLocaleString('uk-UA')} <span className="text-xs font-sans font-normal text-slate-400 select-none">грн</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-2 tracking-wide font-medium">Оцінка втрат за роздрібними цінами.</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-white/5 to-transparent border border-red-500/30 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-1.5 bg-red-500/10 text-red-500 rounded-lg"><TrendingDown size={18} /></div>
                                                <div className="text-[10px] uppercase font-bold text-red-500 tracking-widest font-display">Втрачена Виторг (Скритий Дефіцит)</div>
                                            </div>
                                            <div className="text-2xl font-bold font-[family-name:var(--font-jetbrains)] text-red-400 tracking-tight mt-1">
                                                <span className="text-sm text-slate-400 font-sans font-normal mr-1">≈</span>{(network.lost_revenue_potential ?? network.lost_revenue ?? 0).toLocaleString('uk-UA')} <span className="text-xs font-sans font-normal text-slate-400 select-none">грн</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-2 tracking-wide font-medium">Розрахункові втрати через "порожні полиці" до вечора.</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center">
                                            <div className="flex items-center justify-between">
                                                <div className="text-[10px] text-slate-400 uppercase font-display mt-1 tracking-wider">Waste Rate (Брак)</div>
                                                <div className="text-2xl font-bold font-[family-name:var(--font-jetbrains)] text-red-500 leading-none tracking-tight">{network.waste_rate || 0}%</div>
                                            </div>
                                            <div className="w-full bg-red-500/10 h-1 mt-2 rounded-full overflow-hidden"><div className="bg-red-500 h-full" style={{ width: `${network.waste_rate || 0}%` }}></div></div>
                                            <div className="flex items-center justify-between mt-4">
                                                <div className="text-[10px] text-slate-400 uppercase font-display mt-1 tracking-wider">Sell-Through (Реалізація)</div>
                                                <div className="text-2xl font-bold font-[family-name:var(--font-jetbrains)] text-emerald-500 leading-none tracking-tight">{network.sell_through_rate || 0}%</div>
                                            </div>
                                            <div className="w-full bg-emerald-500/10 h-1 mt-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full" style={{ width: `${network.sell_through_rate || 0}%` }}></div></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col mt-6">
                                    <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#2b80ff] font-display flex items-center gap-2">
                                            <Store size={18} /> Деталізація по Магазинах
                                        </h3>
                                        <div className="flex bg-[#0B0F19] rounded-lg border border-white/10 p-1 overflow-hidden shrink-0">
                                            <button
                                                onClick={() => setMetricMode('qty')}
                                                className={cn(
                                                    "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                                                    metricMode === 'qty' ? "bg-[#2b80ff]/20 text-[#2b80ff] border border-[#2b80ff]/30 shadow-sm" : "text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/5"
                                                )}
                                            >
                                                ШТ.
                                            </button>
                                            <button
                                                onClick={() => setMetricMode('revenue')}
                                                className={cn(
                                                    "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                                                    metricMode === 'revenue' ? "bg-[#2b80ff]/20 text-[#2b80ff] border border-[#2b80ff]/30 shadow-sm" : "text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/5"
                                                )}
                                            >
                                                ГРН. (ВИТОРГ)
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-auto max-h-[500px] custom-scrollbar">
                                        <table className="w-full text-left border-collapse min-w-full">
                                            <thead>
                                                <tr className="bg-[#0B0F19]/80 border-b border-white/10 sticky top-0 backdrop-blur-md z-10">
                                                    <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Магазин</th>
                                                    <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-emerald-500 text-right">Фреш</th>
                                                    <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-emerald-500 text-right">Дисконт</th>
                                                    <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-red-500 text-right">Списання</th>
                                                    <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Всього</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                {(ranking.all_stores || []).map((store: any, idx: number) => {
                                                    const isQty = metricMode === 'qty';
                                                    const unit = isQty ? 'шт' : 'грн';
                                                    const fresh = isQty ? store.fresh_sold : store.revenue_fresh;
                                                    const disc = isQty ? store.disc_sold : store.revenue_disc;
                                                    const waste = isQty ? store.total_waste : store.waste_uah;
                                                    const total = isQty ? store.total_sold : ((store.revenue_fresh || 0) + (store.revenue_disc || 0));

                                                    return (
                                                        <tr key={idx} className="border-b border-white/10 hover:bg-white/[0.02] transition-colors">
                                                            <td className="py-4 px-6 text-sm font-medium text-white">{store.store_name}</td>
                                                            <td className="py-4 px-6 text-right font-[family-name:var(--font-jetbrains)] text-emerald-500 font-medium">
                                                                {(fresh || 0).toLocaleString('uk-UA')} <span className="text-[10px] font-sans font-normal text-slate-400 ml-1">{unit}</span>
                                                            </td>
                                                            <td className="py-4 px-6 text-right font-[family-name:var(--font-jetbrains)] font-medium text-emerald-500/80">
                                                                {(disc || 0).toLocaleString('uk-UA')} <span className="text-[10px] font-sans font-normal text-slate-400 ml-1">{unit}</span>
                                                            </td>
                                                            <td className="py-4 px-6 text-right font-[family-name:var(--font-jetbrains)] font-medium text-red-500">
                                                                {(waste || 0).toLocaleString('uk-UA')} <span className="text-[10px] font-sans font-normal text-slate-400 ml-1">{unit}</span>
                                                            </td>
                                                            <td className="py-4 px-6 text-right font-[family-name:var(--font-jetbrains)] text-white font-bold bg-white/[0.02]">
                                                                {(total || 0).toLocaleString('uk-UA')} <span className="text-[10px] font-sans font-normal text-slate-400 ml-1">{unit}</span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {!(ranking.all_stores && ranking.all_stores.length > 0) && (
                                                    <tr>
                                                        <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                                                            Оновіть базу даних (Supabase SQL) для відображення деталізації
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* RANKING TAB */}
                        {activeTab === 'ranking' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-lg font-bold text-slate-200 uppercase tracking-widest font-display mb-2 border-l-2 border-accent-primary pl-3">Аналіз Магазинів та Асортименту</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="space-y-6 lg:col-span-1">
                                        <div className="bg-gradient-to-br from-white/5 to-transparent border border-emerald-500/20 rounded-2xl overflow-hidden shadow-sm">
                                            <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-4 text-emerald-500 font-bold text-sm uppercase font-display tracking-widest flex items-center gap-2">
                                                <ArrowUpRight size={18} /> Топ-5 Магазинів
                                            </div>
                                            <div className="p-3 space-y-2">
                                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                {(ranking.top_stores || []).map((s: any, i: number) => (
                                                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-[#0B0F19]/50 hover:bg-[#0B0F19] transition-colors border border-transparent hover:border-white/10">
                                                        <span className="font-medium text-white text-sm">{s.store_name}</span>
                                                        <span className="font-[family-name:var(--font-jetbrains)] text-emerald-500 font-bold">{s.total_sold} <span className="text-[10px] font-sans font-normal text-slate-400">шт</span></span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-br from-white/5 to-transparent border border-red-500/20 rounded-2xl overflow-hidden shadow-sm">
                                            <div className="bg-red-500/10 border-b border-red-500/20 p-4 text-red-500 font-bold text-sm uppercase font-display tracking-widest flex items-center gap-2">
                                                <ArrowDownRight size={18} /> Аутсайдери
                                            </div>
                                            <div className="p-3 space-y-2">
                                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                {(ranking.bottom_stores || []).map((s: any, i: number) => (
                                                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-[#0B0F19]/50 hover:bg-[#0B0F19] transition-colors border border-transparent hover:border-white/10">
                                                        <span className="font-medium text-white text-sm">{s.store_name}</span>
                                                        <span className="font-[family-name:var(--font-jetbrains)] text-red-500 font-bold">{s.total_sold} <span className="text-[10px] font-sans font-normal text-slate-400">шт</span></span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2">
                                        <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl overflow-hidden h-full shadow-sm flex flex-col">
                                            <div className="bg-[#2b80ff]/5 border-b border-white/10 p-4 text-[#2b80ff] font-bold text-sm uppercase font-display tracking-widest flex items-center gap-2">
                                                <Activity size={18} /> ABC-Аналіз SKU (За Виручкою)
                                            </div>
                                            <div className="p-4 flex-1 overflow-auto">
                                                <div className="space-y-3">
                                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                    {(ranking.sku_abc || []).map((s: any, i: number) => (
                                                        <div key={i} className="flex items-center p-4 rounded-xl bg-[#0B0F19]/50 border border-white/[0.05] gap-5 hover:border-white/10 transition-colors group">
                                                            <div className={cn(
                                                                "w-10 h-10 rounded-lg flex items-center justify-center font-[family-name:var(--font-jetbrains)] font-bold text-lg shadow-sm",
                                                                i === 0 ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" :
                                                                    i === 1 ? "bg-slate-300/20 text-slate-300 border border-slate-300/30" :
                                                                        i === 2 ? "bg-orange-600/20 text-orange-600 border border-orange-600/30" :
                                                                            "bg-gradient-to-br from-white/5 to-transparent border border-white/10 text-slate-400"
                                                            )}>{i + 1}</div>
                                                            <div className="flex-1">
                                                                <span className="font-bold text-white text-lg group-hover:text-[#2b80ff] transition-colors">{s.sku_name}</span>
                                                            </div>
                                                            <div className="text-right flex items-center justify-end gap-6 w-full">
                                                                <div>
                                                                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Продажі</div>
                                                                    <div className="font-[family-name:var(--font-jetbrains)] text-slate-200 text-sm">{s.total_sold} шт</div>
                                                                </div>
                                                                <div className="w-px h-8 bg-panel-border"></div>
                                                                <div className="w-[100px] text-left">
                                                                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Waste (Списання)</div>
                                                                    <div className="font-[family-name:var(--font-jetbrains)] text-red-500 font-medium text-sm leading-none tracking-tight">{(s.waste_uah || 0).toLocaleString('uk-UA')} <span className="text-[10px] font-sans font-normal text-slate-400 select-none">грн</span></div>
                                                                </div>
                                                                <div className="w-px h-8 bg-panel-border"></div>
                                                                <div>
                                                                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Чиста Виручка</div>
                                                                    <div className="font-[family-name:var(--font-jetbrains)] text-emerald-500 font-bold text-lg leading-none tracking-tight">{s.total_revenue} <span className="text-xs font-sans font-normal text-slate-400">грн</span></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DISCOUNT HEALTH TAB (CANNIBALIZATION) */}
                        {activeTab === 'discount' && (
                            <div className="space-y-6 flex-1 h-full animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col">
                                <h3 className="text-lg font-bold text-slate-200 uppercase tracking-widest font-display mb-2 border-l-2 border-accent-primary pl-3">Здоров'я Дисконту (Markdown Economics)</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                                    <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-[10px] uppercase font-bold text-amber-500 tracking-widest font-display">Глобальна Каннібалізація</h4>
                                            <AlertCircle size={18} className="text-amber-500" />
                                        </div>
                                        <div className="text-4xl font-bold font-[family-name:var(--font-jetbrains)] text-amber-500 tracking-tight">{network.cannibalization_pct ?? network.cannibalization_rate ?? 0}%</div>
                                        <p className="text-xs text-amber-500/80 mt-2 font-medium">Частка покупок зі знижкою у загальних продажах. Значення вище 25% свідчить, що покупці навмисно чекають знижок, і це з'їдає базову маржу.</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-5 rounded-2xl shadow-sm">
                                        <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest font-display mb-2">Як діяти (Playbook)</h4>
                                        <ul className="space-y-2 mt-3 text-sm text-slate-200">
                                            <li className="flex items-start gap-2"><span className="text-red-500 font-bold mt-0.5">•</span> Для червоних магазинів (Каннібалізація {">"} 30%): Терміново урізати вечірні поставки фрешу на 15-20%.</li>
                                            <li className="flex items-start gap-2"><span className="text-amber-500 font-bold mt-0.5">•</span> Для жовтих (Каннібалізація 20-30%): Взяти на моніторинг продажі після 18:00.</li>
                                            <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold mt-0.5">•</span> Для зелених (Каннібалізація {"<"} 20%): Здорова економіка розпродажів.</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
                                    <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-sm">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-white font-display flex items-center gap-2">
                                            Магазини: Ренкінг Каннібалізації
                                        </h3>
                                    </div>
                                    <div className="flex-1 overflow-auto">
                                        <table className="w-full text-left border-collapse min-w-full">
                                            <thead>
                                                <tr className="bg-[#0B0F19]/80 border-b border-white/10 sticky top-0 backdrop-blur-md z-10">
                                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-slate-400">Магазин</th>
                                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-slate-400 text-right">Всього продано</th>
                                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-slate-400 text-right">Продано по Дисконту</th>
                                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-slate-400 text-right">Індекс Каннібалізації</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                {discountHealth.map((row: any, idx: number) => {
                                                    const rate = row.cannibalization_pct ?? row.cannibalization_rate ?? 0;
                                                    const disc_sold = row.disc_sold || 0;
                                                    const isCritical = rate > 30;
                                                    const isWarning = rate > 20 && rate <= 30;
                                                    return (
                                                        <tr key={idx} className="border-b border-white/10/40 hover:bg-white/[0.02] transition-colors">
                                                            <td className="py-4 px-6 text-sm font-medium text-white">{row.store_name}</td>
                                                            <td className="py-4 px-6 text-right font-[family-name:var(--font-jetbrains)] text-slate-200">{row.total_sold} <span className="text-[10px] font-sans font-normal text-slate-400">шт</span></td>
                                                            <td className="py-4 px-6 text-right font-[family-name:var(--font-jetbrains)] text-amber-500/80">{disc_sold} <span className="text-[10px] font-sans font-normal text-slate-400">шт</span></td>
                                                            <td className="py-4 px-6 text-right whitespace-nowrap">
                                                                <span className={cn(
                                                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-[family-name:var(--font-jetbrains)] font-bold text-sm border shadow-sm",
                                                                    isCritical ? "bg-red-500/10 text-red-500 border-red-500/30" :
                                                                        isWarning ? "bg-amber-500/10 text-amber-500 border-amber-500/30" :
                                                                            "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                                                )}>
                                                                    {rate.toFixed(1)}%
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'trend' && (
                            <div className="space-y-6 flex-1 h-full animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col">
                                <h3 className="text-lg font-bold text-slate-200 uppercase tracking-widest font-display mb-2 border-l-2 border-accent-primary pl-3">Матриця Здоров'я: Тренд Індекси</h3>
                                <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
                                    <div className="p-5 border-b border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-between">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-[#2b80ff] font-display flex items-center gap-2">
                                            <TrendingUp size={18} /> Останні 14 днів vs Попередні 14 днів
                                        </h3>
                                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                                            <div className="flex items-center gap-1.5 text-emerald-500"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Зростання ({">"}1.1)</div>
                                            <div className="flex items-center gap-1.5 text-red-500"><div className="w-2 h-2 rounded-full bg-red-500"></div> Падіння ({"<"}0.85)</div>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-auto">
                                        <table className="w-full text-left border-collapse min-w-full">
                                            <thead>
                                                <tr className="bg-[#0B0F19]/80 border-b border-white/10 sticky top-0 backdrop-blur-md z-10">
                                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-slate-400">Магазин</th>
                                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-slate-400">SKU (Товар)</th>
                                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-slate-400 text-center">Fill Rate (Цех)</th>
                                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-slate-400 text-right">Продажі (14д)</th>
                                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-slate-400 text-right">Тренд Індекс</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                {trends.map((row: any, idx: number) => {
                                                    const trend = row.trend_index || 1;
                                                    const isUp = trend > 1.1;
                                                    const isDown = trend < 0.85;
                                                    const fillRate = row.fill_rate ?? 95;
                                                    const badFill = fillRate < 90;
                                                    return (
                                                        <tr key={idx} className="border-b border-white/10/40 hover:bg-white/[0.02] transition-colors">
                                                            <td className="py-4 px-6 text-sm font-medium text-white whitespace-nowrap">{row.store_name}</td>
                                                            <td className="py-4 px-6 text-sm text-slate-200">{row.sku_name}</td>
                                                            <td className="py-4 px-6 text-center">
                                                                <span className={cn(
                                                                    "font-[family-name:var(--font-jetbrains)] px-2 py-1 rounded text-xs font-bold border",
                                                                    badFill ? "bg-red-500/10 text-red-500 border-red-500/30" : "bg-[#0B0F19] border-white/10 text-slate-400"
                                                                )}>
                                                                    {fillRate}%
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-6 text-right font-[family-name:var(--font-jetbrains)] text-slate-200">{row.sold_14d} <span className="text-[10px] font-sans font-normal text-slate-400">шт</span></td>
                                                            <td className="py-4 px-6 text-right whitespace-nowrap">
                                                                <span className={cn(
                                                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-[family-name:var(--font-jetbrains)] font-bold text-sm border shadow-sm",
                                                                    isUp ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" :
                                                                        isDown ? "bg-red-500/10 text-red-500 border-red-500/30" :
                                                                            "bg-gradient-to-br from-white/5 to-transparent text-slate-200 border-white/10"
                                                                )}>
                                                                    {isUp ? <TrendingUp size={16} /> : isDown ? <TrendingDown size={16} /> : null}
                                                                    {trend.toFixed(2)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CATALOG TAB (SKU Drill-down) */}
                        {activeTab === 'catalog' && (
                            <div className="space-y-6 flex-1 h-full animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-bold text-slate-200 uppercase tracking-widest font-display border-l-2 border-accent-primary pl-3">Каталог Товарів (SKU Metrics)</h3>
                                </div>
                                {catalogLoading ? (
                                    <div className="flex-1 flex items-center justify-center min-h-[400px]">
                                        <Loader2 className="animate-spin text-[#2b80ff] size-8" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
                                        {(catalogData?.cards || []).length === 0 ? (
                                            <div className="col-span-full text-center p-12 text-slate-400 border border-dashed border-white/10 rounded-2xl">
                                                Немає даних про товари за останні 7 днів
                                            </div>
                                        ) : (
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            (catalogData?.cards || []).map((sku: any, idx: number) => {
                                                const wastePct = sku.waste_pct || 0;
                                                const isWasteHigh = wastePct > 15;
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => setSelectedSku({ id: sku.sku_id, name: sku.sku_name })}
                                                        className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-accent-primary/50 hover:bg-white/[0.02] transition-all cursor-pointer group flex flex-col h-full"
                                                    >
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="p-2 bg-[#0B0F19] rounded-xl text-[#2b80ff] group-hover:bg-accent-primary/10 transition-colors">
                                                                <Package size={20} />
                                                            </div>
                                                            {isWasteHigh && (
                                                                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-500/10 px-2 py-1 rounded-md">
                                                                    <AlertTriangle size={12} /> High Waste
                                                                </div>
                                                            )}
                                                        </div>
                                                        <h4 className="font-bold text-white mb-1 line-clamp-2 md:min-h-[48px] leading-tight">{sku.sku_name}</h4>
                                                        <p className="text-[10px] text-slate-400 font-display uppercase tracking-widest mb-4 opacity-70">SKU ID: {sku.sku_id}</p>

                                                        <div className="grid grid-cols-2 gap-y-4 gap-x-2 mt-auto pt-4 border-t border-white/[0.05]">
                                                            <div>
                                                                <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Продажі (7д)</div>
                                                                <div className="font-[family-name:var(--font-jetbrains)] text-emerald-500 font-bold text-lg leading-none">{sku.total_sold} <span className="text-[10px] font-sans font-normal text-slate-400">шт</span></div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Середнє / день</div>
                                                                <div className="font-[family-name:var(--font-jetbrains)] text-slate-200 font-medium text-lg leading-none">{sku.avg_daily_sold} <span className="text-[10px] font-sans font-normal text-slate-400">шт</span></div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Списання</div>
                                                                <div className={cn("font-[family-name:var(--font-jetbrains)] font-bold text-lg leading-none", isWasteHigh ? "text-red-500" : "text-amber-500/80")}>
                                                                    {sku.waste_pct}%
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Дисконт</div>
                                                                <div className="font-[family-name:var(--font-jetbrains)] text-[#2b80ff] font-bold text-lg leading-none">{sku.disc_pct}%</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL / DRAWER FOR SKU STORES */}
            {selectedSku && (
                <div className="fixed inset-0 z-50 flex justify-end bg-[#0B0F19]/80 backdrop-blur-sm transition-opacity">
                    <div className="w-full max-w-3xl bg-gradient-to-br from-white/5 to-transparent border-l border-white/10 h-full overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-white/10 bg-[#0B0F19]/50 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1 pr-8">{selectedSku.name}</h3>
                                <p className="text-xs text-slate-400 uppercase font-display tracking-widest">Деталізація по магазинах ({startDate} - {endDate})</p>
                            </div>
                            <button
                                onClick={() => setSelectedSku(null)}
                                className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors absolute top-6 right-6"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-6 bg-gradient-to-b from-transparent to-bg-primary/20 custom-scrollbar">
                            {storesLoading ? (
                                <div className="flex h-[300px] items-center justify-center">
                                    <Loader2 className="animate-spin text-[#2b80ff] size-8" />
                                </div>
                            ) : (
                                <div className="space-y-4 pb-12">
                                    {(storesData?.stores || []).length === 0 ? (
                                        <div className="text-center p-12 text-slate-400 border border-dashed border-white/10 rounded-2xl">
                                            Немає даних про продажі по магазинах для цього товару
                                        </div>
                                    ) : (
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        (storesData?.stores || []).map((store: any, idx: number) => {
                                            const wastePct = store.waste_pct || 0;
                                            return (
                                                <div key={idx} className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/10/80 transition-colors p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-[#2b80ff]/10 text-[#2b80ff] flex items-center justify-center shrink-0 border border-[#2b80ff]/20">
                                                            <Store size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white text-base mb-1">{store.store_name}</div>
                                                            <div className="text-[10px] text-slate-400 font-display uppercase tracking-wider">Магазин ID: <span className="font-mono">{store.store_id}</span></div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 shrink-0 bg-gradient-to-br from-white/5 to-transparent/50 p-3 rounded-xl border border-white/5">
                                                        <div className="text-right">
                                                            <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Продажі</div>
                                                            <div className="font-[family-name:var(--font-jetbrains)] text-emerald-500 font-bold text-base">{store.total_sold} <span className="text-[10px] font-sans font-normal text-slate-400">шт</span></div>
                                                        </div>
                                                        <div className="w-px h-10 bg-panel-border hidden sm:block"></div>
                                                        <div className="text-right">
                                                            <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Середнє</div>
                                                            <div className="font-[family-name:var(--font-jetbrains)] text-slate-200 font-medium text-base">{store.avg_daily_sold} <span className="text-[10px] font-sans font-normal text-slate-400">шт</span></div>
                                                        </div>
                                                        <div className="w-px h-10 bg-panel-border hidden sm:block"></div>
                                                        <div className="text-right w-[72px]">
                                                            <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Списання</div>
                                                            <div className={cn("font-[family-name:var(--font-jetbrains)] font-bold text-base", wastePct > 15 ? "text-red-500" : "text-amber-500/80")}>{store.waste_pct}%</div>
                                                        </div>
                                                        <div className="w-px h-10 bg-panel-border hidden sm:block"></div>
                                                        <div className="text-right w-[72px]">
                                                            <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Дисконт</div>
                                                            <div className="font-[family-name:var(--font-jetbrains)] text-[#2b80ff] font-bold text-base">{store.disc_pct}%</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


export default function BakeryPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0B0F19] flex justify-center items-center"><Loader2 className="animate-spin text-[#2b80ff] size-8" /></div>}>
            <BakeryDashboard />
        </Suspense>
    );
}
