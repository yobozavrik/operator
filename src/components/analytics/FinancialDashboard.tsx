'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    BarChart2,
    DollarSign,
    CreditCard,
    ReceiptText,
    PieChart,
    Calendar,
    ChevronDown,
    Store
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';
import { cn } from '@/lib/utils';
import { Chakra_Petch, JetBrains_Mono } from 'next/font/google';

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

// Mock Data
const revenueTrendData = [
    { name: 'Пн', current: 12000, previous: 10000 },
    { name: 'Вт', current: 15000, previous: 13000 },
    { name: 'Ср', current: 11000, previous: 14000 },
    { name: 'Чт', current: 18000, previous: 12000 },
    { name: 'Пт', current: 24000, previous: 20000 },
    { name: 'Сб', current: 35000, previous: 30000 },
    { name: 'Нд', current: 32000, previous: 28000 },
];

const storesData = [
    { name: 'Садгора', revenue: 45000 },
    { name: 'Ентузіастів', revenue: 38000 },
    { name: 'Комарова', revenue: 32000 },
    { name: 'Центр', revenue: 26000 },
    { name: 'Гравітон', revenue: 21000 },
];

const categoryData = [
    { name: 'Випічка', value: 45, color: '#2b80ff' },
    { name: 'Піца', value: 30, color: '#10b981' },
    { name: 'Напої', value: 15, color: '#f59e0b' },
    { name: 'Десерти', value: 10, color: '#8b5cf6' },
];

const topProducts = [
    { rank: 1, name: 'Круасан з мигдалем', revenue: 15400, qty: 342, trend: 12 },
    { rank: 2, name: 'Піца Пепероні (30см)', revenue: 12800, qty: 85, trend: 5 },
    { rank: 3, name: 'Капучино XL', revenue: 9500, qty: 190, trend: -2 },
    { rank: 4, name: 'Хліб Гречаний', revenue: 8200, qty: 164, trend: 8 },
    { rank: 5, name: 'Еклер Ванільний', revenue: 6100, qty: 122, trend: 15 },
];

export const FinancialDashboard = () => {
    const [period, setPeriod] = useState('Цей Тиждень');

    return (
        <div className={cn(
            "min-h-screen bg-[#0B0F19] text-white font-sans selection:bg-[#2b80ff] selection:text-white flex flex-col",
            chakra.variable,
            jetbrains.variable,
            "font-[family-name:var(--font-chakra)]"
        )}>
            {/* Header / Top Navigation */}
            <div className="border-b border-white/10 bg-[#0B0F19]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-[1920px] mx-auto p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-lg border border-white/10">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                                <DollarSign className="text-emerald-500" size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider text-white">Фінансова Аналітика</h1>
                                <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 tracking-[0.2em] font-[family-name:var(--font-jetbrains)] uppercase">
                                    <span>Revenue Intelligence</span>
                                    <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></span>
                                    <span>Live Data</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 md:pb-0">
                        <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
                            {['Сьогодні', 'Вчора', 'Цей Тиждень', 'Цей Місяць'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={cn(
                                        "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all font-[family-name:var(--font-jetbrains)]",
                                        period === p ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-slate-400 hover:text-white transparent"
                                    )}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-300 uppercase tracking-wider font-[family-name:var(--font-jetbrains)] bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors shrink-0">
                            <Calendar size={14} className="text-slate-400" />
                            Кастомний Період
                            <ChevronDown size={14} className="text-slate-500" />
                        </button>
                    </div>
                </div>
            </div>

            <main className="flex-1 max-w-[1920px] mx-auto w-full p-4 md:p-6 space-y-6">

                {/* Top KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Revenue Card */}
                    <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                                <DollarSign size={20} />
                            </div>
                            <div className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                                <TrendingUp size={12} className="text-emerald-500" />
                                <span className="text-[10px] font-mono text-emerald-500 font-bold font-[family-name:var(--font-jetbrains)]">+14.2%</span>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="text-[11px] uppercase font-mono text-slate-400 tracking-wider mb-1 font-[family-name:var(--font-jetbrains)]">Загальний Виторг</div>
                            <div className="flex items-baseline gap-2">
                                <div className="text-3xl font-bold tracking-tight text-white tabular-nums">147,000</div>
                                <div className="text-sm font-medium text-slate-500 uppercase">грн</div>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-2 font-mono font-[family-name:var(--font-jetbrains)]">vs 128,700 минулий період</div>
                        </div>
                    </div>

                    {/* Avg Check Card */}
                    <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#2b80ff]/10 rounded-full blur-2xl group-hover:bg-[#2b80ff]/20 transition-all"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-2.5 rounded-xl bg-[#2b80ff]/10 border border-[#2b80ff]/20 text-[#2b80ff]">
                                <ReceiptText size={20} />
                            </div>
                            <div className="px-2 py-1 rounded bg-[#E74856]/10 border border-[#E74856]/20 flex items-center gap-1">
                                <TrendingDown size={12} className="text-[#E74856]" />
                                <span className="text-[10px] font-mono text-[#E74856] font-bold font-[family-name:var(--font-jetbrains)]">-2.1%</span>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="text-[11px] uppercase font-mono text-slate-400 tracking-wider mb-1 font-[family-name:var(--font-jetbrains)]">Середній Чек</div>
                            <div className="flex items-baseline gap-2">
                                <div className="text-3xl font-bold tracking-tight text-white tabular-nums">184</div>
                                <div className="text-sm font-medium text-slate-500 uppercase">грн</div>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-2 font-mono font-[family-name:var(--font-jetbrains)]">vs 188 минулий період</div>
                        </div>
                    </div>

                    {/* Transactions Card */}
                    <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                                <CreditCard size={20} />
                            </div>
                            <div className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                                <TrendingUp size={12} className="text-emerald-500" />
                                <span className="text-[10px] font-mono text-emerald-500 font-bold font-[family-name:var(--font-jetbrains)]">+16.5%</span>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="text-[11px] uppercase font-mono text-slate-400 tracking-wider mb-1 font-[family-name:var(--font-jetbrains)]">Кількість Чеків</div>
                            <div className="flex items-baseline gap-2">
                                <div className="text-3xl font-bold tracking-tight text-white tabular-nums">798</div>
                                <div className="text-sm font-medium text-slate-500 uppercase">шт</div>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-2 font-mono font-[family-name:var(--font-jetbrains)]">vs 685 минулий період</div>
                        </div>
                    </div>

                    {/* Margin/Profit (Optional) Card */}
                    <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                                <PieChart size={20} />
                            </div>
                            <div className="px-2 py-1 rounded bg-slate-800 border border-slate-700 flex items-center gap-1">
                                <span className="text-[10px] font-mono text-slate-400 uppercase font-[family-name:var(--font-jetbrains)]">Оціночно</span>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="text-[11px] uppercase font-mono text-slate-400 tracking-wider mb-1 font-[family-name:var(--font-jetbrains)]">Маржинальність</div>
                            <div className="flex items-baseline gap-2">
                                <div className="text-3xl font-bold tracking-tight text-white tabular-nums">34.5</div>
                                <div className="text-sm font-medium text-slate-500 uppercase">%</div>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-2 font-mono font-[family-name:var(--font-jetbrains)]">Норма 35.0%</div>
                        </div>
                    </div>
                </div>

                {/* Main Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Trend Line Chart */}
                    <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2">
                                    <BarChart2 className="text-[#2b80ff]" size={18} />
                                    Динаміка Виторгу
                                </h3>
                                <p className="text-xs text-slate-400 font-mono mt-1 font-[family-name:var(--font-jetbrains)]">Порівняння з попереднім періодом</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
                                    <span className="text-[10px] uppercase font-bold text-slate-300">Поточний</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm border-2 border-slate-600 border-dashed"></div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Попередній</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}к`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                        labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
                                        formatter={(value: any) => [`${value} грн`, 'Виторг']}
                                    />
                                    <Line type="monotone" dataKey="previous" stroke="#475569" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="current" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Store Distribution Bar Chart */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col min-h-[400px]">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2">
                                <Store className="text-emerald-500" size={18} />
                                Виторг по Магазинах
                            </h3>
                            <p className="text-xs text-slate-400 font-mono mt-1 font-[family-name:var(--font-jetbrains)]">Абсолютні значення в грн</p>
                        </div>
                        <div className="flex-1 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={storesData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                                    <XAxis type="number" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}к`} />
                                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={80} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                                        formatter={(value: any) => [`${value} грн`, 'Виторг']}
                                    />
                                    <Bar dataKey="revenue" fill="#2b80ff" radius={[0, 4, 4, 0]}>
                                        {storesData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#2b80ff'} /> // Highlight top store
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Category Donut */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
                        <div className="mb-2">
                            <h3 className="text-lg font-bold uppercase tracking-wider">Структура Виторгу</h3>
                            <p className="text-xs text-slate-400 font-mono mt-1 font-[family-name:var(--font-jetbrains)]">Частки категорій</p>
                        </div>
                        <div className="flex-1 min-h-[250px] relative flex flex-col items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', border: 'none' }}
                                        formatter={(value: any) => [`${value}%`, 'Частка']}
                                    />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <div className="text-2xl font-bold">100<span className="text-sm">%</span></div>
                                <div className="text-[10px] text-slate-400 uppercase">Всього</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            {categoryData.map(cat => (
                                <div key={cat.name} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></div>
                                    <div className="flex-1 flex justify-between items-center min-w-0">
                                        <span className="text-xs text-slate-300 truncate font-medium">{cat.name}</span>
                                        <span className="text-xs font-bold font-mono pl-2">{cat.value}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Products Table (ABC) */}
                    <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h3 className="text-lg font-bold uppercase tracking-wider">ABC Аналіз: Топ-5 SKU</h3>
                                <p className="text-xs text-slate-400 font-mono mt-1 font-[family-name:var(--font-jetbrains)]">Драйвери виручки</p>
                            </div>
                            <button className="text-xs text-[#2b80ff] hover:text-[#5294ff] font-bold uppercase transition-colors">
                                Показати всі
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 w-12">#</th>
                                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Товар</th>
                                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">К-сть (шт)</th>
                                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Виторг (грн)</th>
                                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Тренд</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topProducts.map((p, idx) => {
                                        const isUp = p.trend > 0;
                                        return (
                                            <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                                <td className="py-3 px-4">
                                                    <div className={cn(
                                                        "w-6 h-6 rounded flex items-center justify-center font-bold text-xs",
                                                        p.rank === 1 ? "bg-amber-500/20 text-amber-500" :
                                                            p.rank === 2 ? "bg-slate-300/20 text-slate-300" :
                                                                p.rank === 3 ? "bg-orange-700/20 text-orange-500" :
                                                                    "bg-white/5 text-slate-500"
                                                    )}>
                                                        {p.rank}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-sm font-medium text-white">{p.name}</td>
                                                <td className="py-3 px-4 text-sm text-right font-mono text-slate-300">{p.qty}</td>
                                                <td className="py-3 px-4 text-sm text-right font-mono font-bold text-emerald-400">{p.revenue.toLocaleString('uk-UA')}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1 px-2 py-1 rounded font-mono text-[10px] font-bold",
                                                        isUp ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                                                    )}>
                                                        {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                        {Math.abs(p.trend)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(43, 128, 255, 0.5);
                }
            `}</style>
        </div>
    );
};
