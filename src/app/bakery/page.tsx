'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Activity, AlertTriangle, TrendingDown, Store, AlertCircle, Percent, ArrowUpRight, ArrowDownRight, Package, TrendingUp, Calendar, ChevronLeft, Loader2, X, Search, LayoutGrid, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Chakra_Petch, JetBrains_Mono } from 'next/font/google';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const chakra = Chakra_Petch({ weight: ['300', '400', '500', '600', '700'], subsets: ['latin'], variable: '--font-chakra' });
const jetbrains = JetBrains_Mono({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-jetbrains' });

// --- MOCK DATA ---
const mockNetwork = {
    qty_delivered: 4250,
    qty_fresh_sold: 3100,
    qty_disc_sold: 800,
    qty_waste: 350,
    waste_rate: 8.2,
    sell_through_rate: 91.8,
    // NEW METRICS
    lost_revenue: 14500, // Упущенная выручка (грн) из-за пустых полок "раннего Sold Out"
    cannibalization_rate: 20.5, // % дисконта в общих продажах
    waste_uah: 12500, // Списание в гривнах (розничная цена)
    average_fill_rate: 94.2 // % выполнения заявок магазинов от цеха
};

const mockRanking = {
    top_stores: [
        { store_name: 'Магазин "Руська"', total_sold: 840 },
        { store_name: 'Магазин "Садгора"', total_sold: 720 },
        { store_name: 'Магазин "Щербанюка"', total_sold: 650 },
        { store_name: 'Магазин "Головна"', total_sold: 590 },
        { store_name: 'Магазин "Ентузіастів"', total_sold: 510 },
    ],
    bottom_stores: [
        { store_name: 'Магазин "Винниченка"', total_sold: 120 },
        { store_name: 'Магазин "Комарова"', total_sold: 145 },
        { store_name: 'Магазин "Південно-Кільцева"', total_sold: 155 },
        { store_name: 'Магазин "Героїв Майдану"', total_sold: 180 },
        { store_name: 'Магазин "Гравітон"', total_sold: 195 },
    ],
    sku_abc: [
        { sku_name: 'Хліб "Гречаний" крафтовий', total_revenue: '45 200', total_sold: 1100, waste_uah: 1200 },
        { sku_name: 'Чіабата класична', total_revenue: '38 500', total_sold: 950, waste_uah: 800 },
        { sku_name: 'Багет французький', total_revenue: '29 100', total_sold: 800, waste_uah: 3100 },
        { sku_name: 'Хліб "Бородінський" на заквасці', total_revenue: '18 400', total_sold: 450, waste_uah: 250 },
        { sku_name: 'Бріош', total_revenue: '12 800', total_sold: 320, waste_uah: 2400 },
        { sku_name: 'Хліб "Кукурудзяний"', total_revenue: '8 500', total_sold: 210, waste_uah: 1100 },
    ]
};

const mockTrends = [
    { store_name: 'Магазин "Руська"', sku_name: 'Хліб "Гречаний" крафтовий', sold_14d: 210, trend_index: 1.25, fill_rate: 98 },
    { store_name: 'Магазин "Садгора"', sku_name: 'Чіабата класична', sold_14d: 185, trend_index: 1.15, fill_rate: 100 },
    { store_name: 'Магазин "Головна"', sku_name: 'Багет французький', sold_14d: 140, trend_index: 0.98, fill_rate: 85 }, // Недооценка заказа
    { store_name: 'Магазин "Винниченка"', sku_name: 'Бріош', sold_14d: 45, trend_index: 0.75, fill_rate: 99 },
    { store_name: 'Магазин "Щербанюка"', sku_name: 'Хліб "Бородінський"', sold_14d: 95, trend_index: 1.05, fill_rate: 100 },
    { store_name: 'Магазин "Комарова"', sku_name: 'Хліб "Кукурудзяний"', sold_14d: 30, trend_index: 0.60, fill_rate: 95 },
];

const mockDiscountHealth = [
    { store_name: 'Магазин "Щербанюка"', cannibalization_rate: 35.2, total_sold: 650, disc_sold: 229 },
    { store_name: 'Магазин "Руська"', cannibalization_rate: 28.5, total_sold: 840, disc_sold: 239 },
    { store_name: 'Магазин "Садгора"', cannibalization_rate: 22.1, total_sold: 720, disc_sold: 159 },
    { store_name: 'Магазин "Головна"', cannibalization_rate: 15.4, total_sold: 590, disc_sold: 91 },
    { store_name: 'Магазин "Ентузіастів"', cannibalization_rate: 8.5, total_sold: 510, disc_sold: 43 },
];

export default function BakeryPage() {
    const [activeTab, setActiveTab] = useState<'network' | 'ranking' | 'trend' | 'discount' | 'catalog'>('network');
    const [selectedSku, setSelectedSku] = useState<{ id: string, name: string } | null>(null);

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

    // Безопасный фоллбэк на моки, если API еще не отдал данные
    const network = apiData?.network?.qty_delivered !== undefined ? apiData.network : mockNetwork;
    const ranking = apiData?.ranking?.top_stores !== undefined ? apiData.ranking : mockRanking;
    const trends = apiData?.trends?.length > 0 ? apiData.trends : mockTrends;

    // Вычисляем данные для вкладки "Здоровье дисконта"
    // Если RPC вернул каннибализацию в сторах, используем их, иначе мок
    const allStores = [...(ranking.top_stores || []), ...(ranking.bottom_stores || [])];
    const discountStores = allStores.filter(s => s.cannibalization_pct !== undefined).sort((a, b) => b.cannibalization_pct - a.cannibalization_pct);
    const discountHealth = discountStores.length > 0 ? discountStores : mockDiscountHealth;

    return (
        <div className={cn("min-h-screen bg-bg-primary text-text-primary p-4 md:p-8 font-sans flex flex-col", chakra.variable, jetbrains.variable, "font-[family-name:var(--font-chakra)]")}>

            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">

                {/* Header Back Link */}
                <div className="shrink-0">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent-primary transition-colors uppercase tracking-widest font-bold">
                        <ChevronLeft size={16} /> Повернутись до Command Center
                    </Link>
                </div>

                {/* Main Panel */}
                <div className="flex-1 bg-panel-bg border border-panel-border rounded-2xl shadow-[var(--panel-shadow)] flex flex-col overflow-hidden">

                    {/* Header Area */}
                    <div className="p-6 border-b border-panel-border bg-panel-bg flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shrink-0 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/80 to-transparent pointer-events-none"></div>
                        <div className="flex flex-col gap-3 relative z-10 w-full xl:w-auto">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                                    <Store className="text-orange-500" size={24} />
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
                                {isLoading && <Loader2 size={14} className="animate-spin text-[#00D4FF]" />}
                                {!isLoading && apiData && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase shadow-[0_0_10px_rgba(16,185,129,0.1)]">
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
                            <div className="flex items-center bg-bg-primary/40 border border-panel-border rounded-xl p-1 shadow-sm w-full xl:w-auto justify-between xl:justify-start overflow-x-auto custom-scrollbar">
                                <div className="flex items-center px-4 gap-3 border-r border-panel-border/50 shrink-0">
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
                                    <button className="flex items-center gap-2 px-6 py-1.5 text-sm font-bold text-[#00D4FF] uppercase tracking-wider font-display shrink-0 hover:bg-[#00D4FF]/5 rounded-lg transition-colors pointer-events-none">
                                        Шаблони
                                        <ChevronDown size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Bottom Row: Tabs */}
                            <div className="flex bg-bg-primary/40 border border-panel-border rounded-xl p-1 shadow-sm overflow-x-auto custom-scrollbar w-full xl:w-auto">
                                <button onClick={() => setActiveTab('network')} className={cn("px-5 py-2 text-xs font-bold uppercase rounded-lg transition-colors font-display tracking-widest shrink-0", activeTab === 'network' ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border border-[#00D4FF]/30 text-[#00D4FF]" : "text-slate-400 hover:text-white border border-transparent")}>Мережа</button>
                                <button onClick={() => setActiveTab('ranking')} className={cn("px-5 py-2 text-xs font-bold uppercase rounded-lg transition-colors font-display tracking-widest shrink-0", activeTab === 'ranking' ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border border-[#00D4FF]/30 text-[#00D4FF]" : "text-slate-400 hover:text-white border border-transparent")}>Ренкінг/ABC</button>
                                <button onClick={() => setActiveTab('catalog')} className={cn("px-5 py-2 text-xs font-bold uppercase rounded-lg transition-colors font-display tracking-widest flex items-center gap-2 shrink-0", activeTab === 'catalog' ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border border-[#00D4FF]/30 text-[#00D4FF]" : "text-slate-400 hover:text-white border border-transparent")}>
                                    <LayoutGrid size={14} /> Каталог
                                </button>
                                <button onClick={() => setActiveTab('discount')} className={cn("px-5 py-2 text-xs font-bold uppercase rounded-lg transition-colors font-display tracking-widest shrink-0", activeTab === 'discount' ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border border-[#00D4FF]/30 text-[#00D4FF]" : "text-slate-400 hover:text-white border border-transparent")}>Здоров'я дисконту</button>
                                <button onClick={() => setActiveTab('trend')} className={cn("px-5 py-2 text-xs font-bold uppercase rounded-lg transition-colors font-display tracking-widest shrink-0", activeTab === 'trend' ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border border-[#00D4FF]/30 text-[#00D4FF]" : "text-slate-400 hover:text-white border border-transparent")}>Тренди</button>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-auto custom-scrollbar p-6 bg-gradient-to-b from-transparent to-bg-primary/30">
                        {/* NETWORK TAB */}
                        {activeTab === 'network' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-lg font-bold text-text-secondary uppercase tracking-widest font-display mb-2 border-l-2 border-accent-primary pl-3">Глобальні Метрики Мережі</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-panel-bg border border-panel-border p-5 rounded-2xl flex flex-col relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div className="text-[10px] uppercase font-bold text-text-muted tracking-widest font-display mb-2">Привезено (шт)</div>
                                        <div className="text-3xl font-bold font-[family-name:var(--font-jetbrains)] text-text-primary tracking-tight">{network.qty_delivered || 0}</div>
                                        <Package className="absolute right-4 bottom-4 text-text-muted opacity-10" size={48} />
                                    </div>
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl flex flex-col relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest font-display mb-2">Продано Фреш & Дисконт</div>
                                        <div className="text-3xl font-bold font-[family-name:var(--font-jetbrains)] text-emerald-500 tracking-tight">{(network.qty_fresh_sold || 0) + (network.qty_disc_sold || 0)}</div>
                                        <Activity className="absolute right-4 bottom-4 text-emerald-500 opacity-10" size={48} />
                                    </div>
                                    <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl flex flex-col relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div className="text-[10px] uppercase font-bold text-red-500 tracking-widest font-display mb-2">Списано в Мусор</div>
                                        <div className="text-3xl font-bold font-[family-name:var(--font-jetbrains)] text-red-500 tracking-tight">{network.qty_waste || 0}</div>
                                        <AlertTriangle className="absolute right-4 bottom-4 text-red-500 opacity-10" size={48} />
                                    </div>
                                    <div className="bg-[#2b80ff]/5 border border-[#2b80ff]/20 p-5 rounded-2xl flex flex-col relative overflow-hidden justify-between shadow-sm hover:shadow-md transition-shadow">
                                        <div>
                                            <div className="text-[10px] uppercase font-bold text-[#2b80ff] tracking-widest font-display mb-3">Дисципліна Цеху</div>
                                            <div className="flex items-end gap-2 text-[#2b80ff]">
                                                <div className="text-3xl font-bold font-[family-name:var(--font-jetbrains)] leading-none tracking-tight">{network.average_fill_rate || mockNetwork.average_fill_rate}%</div>
                                                <div className="text-[9px] uppercase font-display tracking-widest pb-1 opacity-80">Fill Rate (Виконання)</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-panel-bg border border-red-500/30 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-1.5 bg-red-500/10 text-red-500 rounded-lg"><AlertTriangle size={18} /></div>
                                            <div className="text-[10px] uppercase font-bold text-red-500 tracking-widest font-display">Списання в Грошах (Waste UAH)</div>
                                        </div>
                                        <div className="text-2xl font-bold font-[family-name:var(--font-jetbrains)] text-red-500 tracking-tight mt-1">
                                            {(network.waste_uah ?? mockNetwork.waste_uah).toLocaleString('uk-UA')} <span className="text-xs font-sans font-normal text-text-muted select-none">грн</span>
                                        </div>
                                        <p className="text-[10px] text-text-muted mt-2 tracking-wide font-medium">Оцінка втрат за роздрібними цінами.</p>
                                    </div>
                                    <div className="bg-panel-bg border border-red-500/30 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-1.5 bg-red-500/10 text-red-500 rounded-lg"><TrendingDown size={18} /></div>
                                            <div className="text-[10px] uppercase font-bold text-red-500 tracking-widest font-display">Втрачена Виторг (Скритий Дефіцит)</div>
                                        </div>
                                        <div className="text-2xl font-bold font-[family-name:var(--font-jetbrains)] text-red-400 tracking-tight mt-1">
                                            <span className="text-sm text-text-muted font-sans font-normal mr-1">≈</span>{(network.lost_revenue_potential ?? network.lost_revenue ?? mockNetwork.lost_revenue).toLocaleString('uk-UA')} <span className="text-xs font-sans font-normal text-text-muted select-none">грн</span>
                                        </div>
                                        <p className="text-[10px] text-text-muted mt-2 tracking-wide font-medium">Розрахункові втрати через "порожні полиці" до вечора.</p>
                                    </div>
                                    <div className="bg-panel-bg border border-panel-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center">
                                        <div className="flex items-center justify-between">
                                            <div className="text-[10px] text-text-muted uppercase font-display mt-1 tracking-wider">Waste Rate (Брак)</div>
                                            <div className="text-2xl font-bold font-[family-name:var(--font-jetbrains)] text-red-500 leading-none tracking-tight">{network.waste_rate || 0}%</div>
                                        </div>
                                        <div className="w-full bg-red-500/10 h-1 mt-2 rounded-full overflow-hidden"><div className="bg-red-500 h-full" style={{ width: `${network.waste_rate || 0}%` }}></div></div>
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="text-[10px] text-text-muted uppercase font-display mt-1 tracking-wider">Sell-Through (Реалізація)</div>
                                            <div className="text-2xl font-bold font-[family-name:var(--font-jetbrains)] text-emerald-500 leading-none tracking-tight">{network.sell_through_rate || 0}%</div>
                                        </div>
                                        <div className="w-full bg-emerald-500/10 h-1 mt-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full" style={{ width: `${network.sell_through_rate || 0}%` }}></div></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* RANKING TAB */}
                        {activeTab === 'ranking' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-lg font-bold text-text-secondary uppercase tracking-widest font-display mb-2 border-l-2 border-accent-primary pl-3">Аналіз Магазинів та Асортименту</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="space-y-6 lg:col-span-1">
                                        <div className="bg-panel-bg border border-emerald-500/20 rounded-2xl overflow-hidden shadow-sm">
                                            <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-4 text-emerald-500 font-bold text-sm uppercase font-display tracking-widest flex items-center gap-2">
                                                <ArrowUpRight size={18} /> Топ-5 Магазинів
                                            </div>
                                            <div className="p-3 space-y-2">
                                                {(ranking.top_stores || []).map((s: any, i: number) => (
                                                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-bg-primary/50 hover:bg-bg-primary transition-colors border border-transparent hover:border-panel-border">
                                                        <span className="font-medium text-text-primary text-sm">{s.store_name}</span>
                                                        <span className="font-[family-name:var(--font-jetbrains)] text-emerald-500 font-bold">{s.total_sold} <span className="text-[10px] font-sans font-normal text-text-muted">шт</span></span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-panel-bg border border-red-500/20 rounded-2xl overflow-hidden shadow-sm">
                                            <div className="bg-red-500/10 border-b border-red-500/20 p-4 text-red-500 font-bold text-sm uppercase font-display tracking-widest flex items-center gap-2">
                                                <ArrowDownRight size={18} /> Аутсайдери
                                            </div>
                                            <div className="p-3 space-y-2">
                                                {(ranking.bottom_stores || []).map((s: any, i: number) => (
                                                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-bg-primary/50 hover:bg-bg-primary transition-colors border border-transparent hover:border-panel-border">
                                                        <span className="font-medium text-text-primary text-sm">{s.store_name}</span>
                                                        <span className="font-[family-name:var(--font-jetbrains)] text-red-500 font-bold">{s.total_sold} <span className="text-[10px] font-sans font-normal text-text-muted">шт</span></span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2">
                                        <div className="bg-panel-bg border border-panel-border rounded-2xl overflow-hidden h-full shadow-sm flex flex-col">
                                            <div className="bg-[#2b80ff]/5 border-b border-panel-border p-4 text-[#2b80ff] font-bold text-sm uppercase font-display tracking-widest flex items-center gap-2">
                                                <Activity size={18} /> ABC-Аналіз SKU (За Виручкою)
                                            </div>
                                            <div className="p-4 flex-1 overflow-auto">
                                                <div className="space-y-3">
                                                    {(ranking.sku_abc || []).map((s: any, i: number) => (
                                                        <div key={i} className="flex items-center p-4 rounded-xl bg-bg-primary/50 border border-panel-border/50 gap-5 hover:border-panel-border transition-colors group">
                                                            <div className={cn(
                                                                "w-10 h-10 rounded-lg flex items-center justify-center font-[family-name:var(--font-jetbrains)] font-bold text-lg shadow-sm",
                                                                i === 0 ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" :
                                                                    i === 1 ? "bg-slate-300/20 text-slate-300 border border-slate-300/30" :
                                                                        i === 2 ? "bg-orange-600/20 text-orange-600 border border-orange-600/30" :
                                                                            "bg-panel-bg border border-panel-border text-text-muted"
                                                            )}>{i + 1}</div>
                                                            <div className="flex-1">
                                                                <span className="font-bold text-text-primary text-lg group-hover:text-[#2b80ff] transition-colors">{s.sku_name}</span>
                                                            </div>
                                                            <div className="text-right flex items-center justify-end gap-6 w-full">
                                                                <div>
                                                                    <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Продажі</div>
                                                                    <div className="font-[family-name:var(--font-jetbrains)] text-text-secondary text-sm">{s.total_sold} шт</div>
                                                                </div>
                                                                <div className="w-px h-8 bg-panel-border"></div>
                                                                <div className="w-[100px] text-left">
                                                                    <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Waste (Списання)</div>
                                                                    <div className="font-[family-name:var(--font-jetbrains)] text-red-500 font-medium text-sm leading-none tracking-tight">{(s.waste_uah || 0).toLocaleString('uk-UA')} <span className="text-[10px] font-sans font-normal text-text-muted select-none">грн</span></div>
                                                                </div>
                                                                <div className="w-px h-8 bg-panel-border"></div>
                                                                <div>
                                                                    <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Чиста Виручка</div>
                                                                    <div className="font-[family-name:var(--font-jetbrains)] text-emerald-500 font-bold text-lg leading-none tracking-tight">{s.total_revenue} <span className="text-xs font-sans font-normal text-text-muted">грн</span></div>
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
                                <h3 className="text-lg font-bold text-text-secondary uppercase tracking-widest font-display mb-2 border-l-2 border-accent-primary pl-3">Здоров'я Дисконту (Markdown Economics)</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                                    <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-[10px] uppercase font-bold text-amber-500 tracking-widest font-display">Глобальна Каннібалізація</h4>
                                            <AlertCircle size={18} className="text-amber-500" />
                                        </div>
                                        <div className="text-4xl font-bold font-[family-name:var(--font-jetbrains)] text-amber-500 tracking-tight">{network.cannibalization_pct ?? network.cannibalization_rate ?? mockNetwork.cannibalization_rate}%</div>
                                        <p className="text-xs text-amber-500/80 mt-2 font-medium">Частка покупок зі знижкою у загальних продажах. Значення вище 25% свідчить, що покупці навмисно чекають знижок, і це з'їдає базову маржу.</p>
                                    </div>
                                    <div className="bg-panel-bg border border-panel-border p-5 rounded-2xl shadow-sm">
                                        <h4 className="text-[10px] uppercase font-bold text-text-muted tracking-widest font-display mb-2">Як діяти (Playbook)</h4>
                                        <ul className="space-y-2 mt-3 text-sm text-text-secondary">
                                            <li className="flex items-start gap-2"><span className="text-red-500 font-bold mt-0.5">•</span> Для червоних магазинів (Каннібалізація {">"} 30%): Терміново урізати вечірні поставки фрешу на 15-20%.</li>
                                            <li className="flex items-start gap-2"><span className="text-amber-500 font-bold mt-0.5">•</span> Для жовтих (Каннібалізація 20-30%): Взяти на моніторинг продажі після 18:00.</li>
                                            <li className="flex items-start gap-2"><span className="text-emerald-500 font-bold mt-0.5">•</span> Для зелених (Каннібалізація {"<"} 20%): Здорова економіка розпродажів.</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="bg-panel-bg border border-panel-border rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
                                    <div className="p-4 border-b border-panel-border bg-bg-primary/30">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-primary font-display flex items-center gap-2">
                                            Магазини: Ренкінг Каннібалізації
                                        </h3>
                                    </div>
                                    <div className="flex-1 overflow-auto">
                                        <table className="w-full text-left border-collapse min-w-full">
                                            <thead>
                                                <tr className="bg-bg-primary/80 border-b border-panel-border sticky top-0 backdrop-blur-md z-10">
                                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-text-muted">Магазин</th>
                                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-text-muted text-right">Всього продано</th>
                                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-text-muted text-right">Продано по Дисконту</th>
                                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-text-muted text-right">Індекс Каннібалізації</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {discountHealth.map((row: any, idx: number) => {
                                                    const rate = row.cannibalization_pct ?? row.cannibalization_rate ?? 0;
                                                    const disc_sold = row.disc_sold || 0;
                                                    const isCritical = rate > 30;
                                                    const isWarning = rate > 20 && rate <= 30;
                                                    return (
                                                        <tr key={idx} className="border-b border-panel-border/40 hover:bg-white/[0.02] transition-colors">
                                                            <td className="py-4 px-6 text-sm font-medium text-text-primary">{row.store_name}</td>
                                                            <td className="py-4 px-6 text-right font-[family-name:var(--font-jetbrains)] text-text-secondary">{row.total_sold} <span className="text-[10px] font-sans font-normal text-text-muted">шт</span></td>
                                                            <td className="py-4 px-6 text-right font-[family-name:var(--font-jetbrains)] text-amber-500/80">{disc_sold} <span className="text-[10px] font-sans font-normal text-text-muted">шт</span></td>
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
                                <h3 className="text-lg font-bold text-text-secondary uppercase tracking-widest font-display mb-2 border-l-2 border-accent-primary pl-3">Матриця Здоров'я: Тренд Індекси</h3>
                                <div className="bg-panel-bg border border-panel-border rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
                                    <div className="p-5 border-b border-panel-border bg-bg-primary/30 flex items-center justify-between">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-[#2b80ff] font-display flex items-center gap-2">
                                            <TrendingUp size={18} /> Останні 14 днів vs Попередні 28 днів
                                        </h3>
                                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                                            <div className="flex items-center gap-1.5 text-emerald-500"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Зростання ({">"}1.1)</div>
                                            <div className="flex items-center gap-1.5 text-red-500"><div className="w-2 h-2 rounded-full bg-red-500"></div> Падіння ({"<"}0.85)</div>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-auto">
                                        <table className="w-full text-left border-collapse min-w-full">
                                            <thead>
                                                <tr className="bg-bg-primary/80 border-b border-panel-border sticky top-0 backdrop-blur-md z-10">
                                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-text-muted">Магазин</th>
                                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-text-muted">SKU (Товар)</th>
                                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-text-muted text-center">Fill Rate (Цех)</th>
                                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-text-muted text-right">Продажі (14д)</th>
                                                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-widest text-text-muted text-right">Тренд Індекс</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {trends.map((row: any, idx: number) => {
                                                    const trend = row.trend_index || 1;
                                                    const isUp = trend > 1.1;
                                                    const isDown = trend < 0.85;
                                                    // Падение fill rate на фоллбэках, если API его еще не отдает
                                                    const fillRate = row.fill_rate ?? mockTrends.find(m => m.sku_name === row.sku_name)?.fill_rate ?? 95;
                                                    const badFill = fillRate < 90;
                                                    return (
                                                        <tr key={idx} className="border-b border-panel-border/40 hover:bg-white/[0.02] transition-colors">
                                                            <td className="py-4 px-6 text-sm font-medium text-text-primary whitespace-nowrap">{row.store_name}</td>
                                                            <td className="py-4 px-6 text-sm text-text-secondary">{row.sku_name}</td>
                                                            <td className="py-4 px-6 text-center">
                                                                <span className={cn(
                                                                    "font-[family-name:var(--font-jetbrains)] px-2 py-1 rounded text-xs font-bold border",
                                                                    badFill ? "bg-red-500/10 text-red-500 border-red-500/30" : "bg-bg-primary border-panel-border text-text-muted"
                                                                )}>
                                                                    {fillRate}%
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-6 text-right font-[family-name:var(--font-jetbrains)] text-text-secondary">{row.sold_14d} <span className="text-[10px] font-sans font-normal text-text-muted">шт</span></td>
                                                            <td className="py-4 px-6 text-right whitespace-nowrap">
                                                                <span className={cn(
                                                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-[family-name:var(--font-jetbrains)] font-bold text-sm border shadow-sm",
                                                                    isUp ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" :
                                                                        isDown ? "bg-red-500/10 text-red-500 border-red-500/30" :
                                                                            "bg-panel-bg text-text-secondary border-panel-border"
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
                                    <h3 className="text-lg font-bold text-text-secondary uppercase tracking-widest font-display border-l-2 border-accent-primary pl-3">Каталог Товарів (SKU Metrics)</h3>
                                </div>
                                {catalogLoading ? (
                                    <div className="flex-1 flex items-center justify-center min-h-[400px]">
                                        <Loader2 className="animate-spin text-accent-primary size-8" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
                                        {(catalogData?.cards || []).length === 0 ? (
                                            <div className="col-span-full text-center p-12 text-text-muted border border-dashed border-panel-border rounded-2xl">
                                                Немає даних про товари за останні 7 днів
                                            </div>
                                        ) : (
                                            (catalogData?.cards || []).map((sku: any, idx: number) => {
                                                const wastePct = sku.waste_pct || 0;
                                                const isWasteHigh = wastePct > 15;
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => setSelectedSku({ id: sku.sku_id, name: sku.sku_name })}
                                                        className="bg-panel-bg border border-panel-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-accent-primary/50 hover:bg-white/[0.02] transition-all cursor-pointer group flex flex-col h-full"
                                                    >
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="p-2 bg-bg-primary rounded-xl text-accent-primary group-hover:bg-accent-primary/10 transition-colors">
                                                                <Package size={20} />
                                                            </div>
                                                            {isWasteHigh && (
                                                                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-500/10 px-2 py-1 rounded-md">
                                                                    <AlertTriangle size={12} /> High Waste
                                                                </div>
                                                            )}
                                                        </div>
                                                        <h4 className="font-bold text-text-primary mb-1 line-clamp-2 md:min-h-[48px] leading-tight">{sku.sku_name}</h4>
                                                        <p className="text-[10px] text-text-muted font-display uppercase tracking-widest mb-4 opacity-70">SKU ID: {sku.sku_id}</p>

                                                        <div className="grid grid-cols-2 gap-y-4 gap-x-2 mt-auto pt-4 border-t border-panel-border/50">
                                                            <div>
                                                                <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Продажі (7д)</div>
                                                                <div className="font-[family-name:var(--font-jetbrains)] text-emerald-500 font-bold text-lg leading-none">{sku.total_sold} <span className="text-[10px] font-sans font-normal text-text-muted">шт</span></div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Середнє / день</div>
                                                                <div className="font-[family-name:var(--font-jetbrains)] text-text-secondary font-medium text-lg leading-none">{sku.avg_daily_sold} <span className="text-[10px] font-sans font-normal text-text-muted">шт</span></div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Списання</div>
                                                                <div className={cn("font-[family-name:var(--font-jetbrains)] font-bold text-lg leading-none", isWasteHigh ? "text-red-500" : "text-amber-500/80")}>
                                                                    {sku.waste_pct}%
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Дисконт</div>
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
                <div className="fixed inset-0 z-50 flex justify-end bg-bg-primary/80 backdrop-blur-sm transition-opacity">
                    <div className="w-full max-w-3xl bg-panel-bg border-l border-panel-border h-full overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-panel-border bg-bg-primary/50 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-text-primary mb-1 pr-8">{selectedSku.name}</h3>
                                <p className="text-xs text-text-muted uppercase font-display tracking-widest">Деталізація по магазинах ({startDate} - {endDate})</p>
                            </div>
                            <button
                                onClick={() => setSelectedSku(null)}
                                className="p-2 hover:bg-white/10 rounded-xl text-text-muted hover:text-text-primary transition-colors absolute top-6 right-6"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-6 bg-gradient-to-b from-transparent to-bg-primary/20 custom-scrollbar">
                            {storesLoading ? (
                                <div className="flex h-[300px] items-center justify-center">
                                    <Loader2 className="animate-spin text-accent-primary size-8" />
                                </div>
                            ) : (
                                <div className="space-y-4 pb-12">
                                    {(storesData?.stores || []).length === 0 ? (
                                        <div className="text-center p-12 text-text-muted border border-dashed border-panel-border rounded-2xl">
                                            Немає даних про продажі по магазинах для цього товару
                                        </div>
                                    ) : (
                                        (storesData?.stores || []).map((store: any, idx: number) => {
                                            const wastePct = store.waste_pct || 0;
                                            return (
                                                <div key={idx} className="bg-bg-primary/40 border border-panel-border hover:border-panel-border/80 transition-colors p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-[#2b80ff]/10 text-[#2b80ff] flex items-center justify-center shrink-0 border border-[#2b80ff]/20">
                                                            <Store size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-text-primary text-base mb-1">{store.store_name}</div>
                                                            <div className="text-[10px] text-text-muted font-display uppercase tracking-wider">Магазин ID: <span className="font-mono">{store.store_id}</span></div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 shrink-0 bg-panel-bg/50 p-3 rounded-xl border border-white/5">
                                                        <div className="text-right">
                                                            <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Продажі</div>
                                                            <div className="font-[family-name:var(--font-jetbrains)] text-emerald-500 font-bold text-base">{store.total_sold} <span className="text-[10px] font-sans font-normal text-text-muted">шт</span></div>
                                                        </div>
                                                        <div className="w-px h-10 bg-panel-border hidden sm:block"></div>
                                                        <div className="text-right">
                                                            <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Середнє</div>
                                                            <div className="font-[family-name:var(--font-jetbrains)] text-text-secondary font-medium text-base">{store.avg_daily_sold} <span className="text-[10px] font-sans font-normal text-text-muted">шт</span></div>
                                                        </div>
                                                        <div className="w-px h-10 bg-panel-border hidden sm:block"></div>
                                                        <div className="text-right w-[72px]">
                                                            <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Списання</div>
                                                            <div className={cn("font-[family-name:var(--font-jetbrains)] font-bold text-base", wastePct > 15 ? "text-red-500" : "text-amber-500/80")}>{store.waste_pct}%</div>
                                                        </div>
                                                        <div className="w-px h-10 bg-panel-border hidden sm:block"></div>
                                                        <div className="text-right w-[72px]">
                                                            <div className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Дисконт</div>
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
