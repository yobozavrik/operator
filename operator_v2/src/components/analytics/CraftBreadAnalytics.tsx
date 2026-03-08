'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Calendar, Activity, AlertTriangle, TrendingDown, Store, AlertCircle, Percent, ArrowUpRight, ArrowDownRight, Package, TrendingUp, ChevronDown, LayoutGrid } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Помилка завантаження даних');
    return res.json();
});

export const CraftBreadAnalytics = () => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setDate(lastMonth.getDate() - 30);

    const [startDate, setStartDate] = useState(lastMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
    const [targetDate, setTargetDate] = useState(today.toISOString().split('T')[0]);
    const [activeTab, setActiveTab] = useState<'network' | 'ranking' | 'catalog' | 'discount' | 'trend'>('network');
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

    const applyTemplate = (days: number, type: 'days' | 'month' | 'last_month' | 'yesterday') => {
        const end = new Date();
        const start = new Date();

        if (type === 'days') {
            start.setDate(end.getDate() - days);
        } else if (type === 'yesterday') {
            start.setDate(end.getDate() - 1);
            end.setDate(end.getDate() - 1);
        } else if (type === 'month') {
            start.setDate(1); // First day of current month
        } else if (type === 'last_month') {
            start.setMonth(start.getMonth() - 1);
            start.setDate(1); // First day of last month
            end.setDate(0); // Last day of last month
        }

        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
        if (activeTab === 'trend') setTargetDate(end.toISOString().split('T')[0]);
        setIsTemplatesOpen(false);
    };

    const { data: networkData, error: networkError, isLoading: loadingNetwork } = useSWR(
        activeTab === 'network' ? `/api/analytics/craft-bread?action=network&startDate=${startDate}&endDate=${endDate}` : null,
        fetcher
    );

    const { data: rankingData, error: rankingError, isLoading: loadingRanking } = useSWR(
        activeTab === 'ranking' ? `/api/analytics/craft-bread?action=ranking&startDate=${startDate}&endDate=${endDate}` : null,
        fetcher
    );

    const { data: trendData, error: trendError, isLoading: loadingTrend } = useSWR(
        activeTab === 'trend' ? `/api/analytics/craft-bread?action=trend&date=${targetDate}` : null,
        fetcher
    );

    // Helper function to format dates for the chart axis
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col h-full bg-bg-primary">
            {/* Header Area */}
            <div className="p-6 border-b border-panel-border bg-panel-bg flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shrink-0 relative">
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
                                &quot;Крафтова пекарня&quot;
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <p className="text-sm text-slate-400 m-0">
                            Аналітичний шар даних (Свіжий, Дисконт, Списання)
                        </p>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                            Live Data
                        </span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col xl:items-end gap-3 relative z-10 w-full xl:w-auto">
                    {/* Top Row: Date Picker & Templates */}
                    <div className="flex flex-wrap items-center bg-bg-primary/40 border border-panel-border rounded-xl p-1 shadow-sm w-full xl:w-auto justify-between xl:justify-start">
                        <div className="flex items-center px-4 gap-3 border-r border-panel-border/50 shrink-0">
                            <Calendar size={16} className="text-slate-400" />
                            {activeTab === 'trend' ? (
                                <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="bg-transparent text-sm text-white font-bold outline-none py-1.5 custom-calendar-icon w-[130px] font-display tracking-widest [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
                            ) : (
                                <>
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm text-white font-bold outline-none py-1.5 custom-calendar-icon w-[115px] font-display tracking-widest [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
                                    <span className="text-slate-400 font-bold">-</span>
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm text-white font-bold outline-none py-1.5 custom-calendar-icon w-[115px] font-display tracking-widest [&::-webkit-calendar-picker-indicator]:cursor-pointer" />
                                </>
                            )}
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
                                className="flex items-center gap-2 px-6 py-1.5 text-sm font-bold text-[#00D4FF] uppercase tracking-wider font-display shrink-0 hover:bg-[#00D4FF]/5 rounded-lg transition-colors"
                            >
                                Шаблони
                                <ChevronDown size={16} />
                            </button>

                            {isTemplatesOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsTemplatesOpen(false)}></div>
                                    <div className="absolute right-0 mt-2 w-56 bg-panel-bg border border-panel-border rounded-xl shadow-xl z-50 overflow-hidden transform opacity-100 scale-100 origin-top-right">
                                        <button onClick={() => applyTemplate(0, 'days')} className="w-full text-left px-5 py-3 text-sm text-white hover:bg-[#00D4FF]/10 transition-colors border-b border-panel-border/50 font-bold">Сьогодні</button>
                                        <button onClick={() => applyTemplate(1, 'yesterday')} className="w-full text-left px-5 py-3 text-sm text-white hover:bg-[#00D4FF]/10 transition-colors border-b border-panel-border/50">Вчора</button>
                                        <button onClick={() => applyTemplate(6, 'days')} className="w-full text-left px-5 py-3 text-sm text-white hover:bg-[#00D4FF]/10 transition-colors border-b border-panel-border/50">Останні 7 днів</button>
                                        <button onClick={() => applyTemplate(29, 'days')} className="w-full text-left px-5 py-3 text-sm text-white hover:bg-[#00D4FF]/10 transition-colors border-b border-panel-border/50">Останні 30 днів</button>
                                        <button onClick={() => applyTemplate(0, 'month')} className="w-full text-left px-5 py-3 text-sm text-white hover:bg-[#00D4FF]/10 transition-colors border-b border-panel-border/50">Поточний місяць</button>
                                        <button onClick={() => applyTemplate(0, 'last_month')} className="w-full text-left px-5 py-3 text-sm text-white hover:bg-[#00D4FF]/10 transition-colors">Минулий місяць</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Bottom Row: Tabs */}
                    <div className="flex bg-bg-primary/40 border border-panel-border rounded-xl p-1 shadow-sm overflow-x-auto custom-scrollbar w-full xl:w-auto">
                        <button onClick={() => setActiveTab('network')} className={cn("px-5 py-2 text-xs font-bold uppercase rounded-lg transition-colors font-display tracking-widest shrink-0", activeTab === 'network' ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border border-[#00D4FF]/30 text-[#00D4FF]" : "text-slate-400 hover:text-white border border-transparent")}>Мережа</button>
                        <button onClick={() => setActiveTab('ranking')} className={cn("px-5 py-2 text-xs font-bold uppercase rounded-lg transition-colors font-display tracking-widest shrink-0", activeTab === 'ranking' ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border border-[#00D4FF]/30 text-[#00D4FF]" : "text-slate-400 hover:text-white border border-transparent")}>Ренкінг/АВС</button>
                        <button onClick={() => setActiveTab('catalog')} className={cn("px-5 py-2 text-xs font-bold uppercase rounded-lg transition-colors font-display tracking-widest flex items-center gap-2 shrink-0", activeTab === 'catalog' ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border border-[#00D4FF]/30 text-[#00D4FF]" : "text-slate-400 hover:text-white border border-transparent")}>
                            <LayoutGrid size={14} /> Каталог
                        </button>
                        <button onClick={() => setActiveTab('discount')} className={cn("px-5 py-2 text-xs font-bold uppercase rounded-lg transition-colors font-display tracking-widest shrink-0", activeTab === 'discount' ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border border-[#00D4FF]/30 text-[#00D4FF]" : "text-slate-400 hover:text-white border border-transparent")}>Здоров&apos;я дисконту</button>
                        <button onClick={() => setActiveTab('trend')} className={cn("px-5 py-2 text-xs font-bold uppercase rounded-lg transition-colors font-display tracking-widest shrink-0", activeTab === 'trend' ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border border-[#00D4FF]/30 text-[#00D4FF]" : "text-slate-400 hover:text-white border border-transparent")}>Тренди</button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar p-6">
                <ErrorBoundary>
                    {/* NETWORK TAB */}
                    {activeTab === 'network' && (
                        <div className="space-y-6">
                            {loadingNetwork ? (
                                <div className="p-12 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full" /></div>
                            ) : networkError ? (
                                <div className="p-8 text-status-critical flex items-center gap-2"><AlertCircle /> {networkError.message}</div>
                            ) : networkData && (
                                (() => {
                                    const totalDelivered = Number(networkData.qty_delivered) || 0;
                                    const freshQty = Number(networkData.qty_fresh_sold) || 0;
                                    const discQty = Number(networkData.qty_disc_sold) || 0;
                                    const wasteQty = Number(networkData.qty_waste) || 0;

                                    const freshRev = Number(networkData.revenue_fresh) || 0;
                                    const discRev = Number(networkData.revenue_disc) || 0;
                                    const totalRev = freshRev + discRev;

                                    const avgFreshPrice = freshQty > 0 ? freshRev / freshQty : 0;
                                    const avgDiscPrice = discQty > 0 ? discRev / discQty : 0;
                                    const discountDepth = avgFreshPrice > 0 ? (1 - (avgDiscPrice / avgFreshPrice)) * 100 : 0;
                                    const lostRev = wasteQty * avgFreshPrice;

                                    // Prepare chart data if available
                                    let chartData = [];
                                    if (networkData.trend_current && networkData.trend_previous) {
                                        // Align datasets by day offset for comparison
                                        const currentTrend = networkData.trend_current || [];
                                        const prevTrend = networkData.trend_previous || [];

                                        chartData = currentTrend.map((currPoint: any, index: number) => {
                                            const prevPoint = prevTrend[index];
                                            return {
                                                dayIndex: index + 1,
                                                currentDate: currPoint.date,
                                                prevDate: prevPoint?.date,
                                                currentSales: currPoint.total_sold || 0,
                                                prevSales: prevPoint?.total_sold || 0,
                                                formattedCurrentDate: formatDate(currPoint.date)
                                            };
                                        });
                                    }

                                    return (
                                        <div className="space-y-6">
                                            {/* Розділ 1: Фінансові показники (Revenue & Efficiency) */}
                                            <div>
                                                <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted font-display mb-4">Фінансові результати</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div className="bg-panel-bg border border-status-success/30 p-5 rounded-xl flex flex-col relative overflow-hidden">
                                                        <div className="text-[10px] uppercase font-bold text-status-success tracking-wide font-display mb-2">Загальна Виручка</div>
                                                        <div className="text-3xl font-bold font-mono text-status-success">{totalRev.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴</div>
                                                        <div className="text-xs text-text-muted mt-2 font-mono flex items-center justify-between">
                                                            <span>Фреш: <span className="text-status-success/80">{freshRev.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴</span></span>
                                                            <span className="text-panel-border">|</span>
                                                            <span>-30%: <span className="text-status-warning/80">{discRev.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴</span></span>
                                                        </div>
                                                    </div>

                                                    <div className="bg-panel-bg border border-status-critical/40 p-5 rounded-xl flex flex-col relative overflow-hidden shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                                                        <div className="text-[10px] uppercase font-bold text-status-critical tracking-wide font-display mb-2 flex items-center gap-1">
                                                            Втрачена вигода (Списано в мусор)
                                                        </div>
                                                        <div className="text-3xl font-bold font-mono text-status-critical">-{lostRev.toLocaleString('uk-UA', { maximumFractionDigits: 0 })} ₴</div>
                                                        <div className="text-xs text-status-critical/50 mt-2 font-mono">
                                                            * розрахунок за середньою фреш-ціною товару
                                                        </div>
                                                    </div>

                                                    <div className="bg-panel-bg border border-accent-primary/30 p-5 rounded-xl flex flex-col relative overflow-hidden">
                                                        <div className="text-[10px] uppercase font-bold text-accent-primary tracking-wide font-display mb-2">Середня глибина знижки</div>
                                                        <div className="text-3xl font-bold font-mono text-accent-primary">-{discountDepth.toFixed(1)}%</div>
                                                        <div className="text-xs text-text-muted mt-2 font-mono flex flex-col gap-1">
                                                            <div className="flex justify-between"><span>Середня ціна Fresh (100%):</span> <span className="text-white">{avgFreshPrice.toFixed(0)} ₴</span></div>
                                                            <div className="flex justify-between"><span>Середня ціна Discount:</span> <span className="text-white">{avgDiscPrice.toFixed(0)} ₴</span></div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-panel-bg border border-panel-border p-5 rounded-xl flex flex-col relative overflow-hidden justify-center bg-gradient-to-br from-panel-bg to-bg-primary/50">
                                                        <div className="text-[10px] uppercase font-bold text-text-muted tracking-wide font-display mb-4">Ефективність продажів (Sell-Through)</div>
                                                        <div className="flex flex-col gap-3">
                                                            <div className="flex justify-between items-center text-sm font-mono">
                                                                <span className="text-text-secondary line-clamp-1">Fresh (День в день)</span>
                                                                <span className="text-status-success font-bold">{(freshQty / (totalDelivered || 1) * 100).toFixed(1)}%</span>
                                                            </div>
                                                            <div className="w-full bg-slate-800 rounded-full h-1.5 mb-1"><div className="bg-status-success h-1.5 rounded-full" style={{ width: `${Math.min(100, (freshQty / (totalDelivered || 1)) * 100)}%` }}></div></div>

                                                            <div className="flex justify-between items-center text-sm font-mono mt-1">
                                                                <span className="text-text-secondary line-clamp-1">Discount (Наст. день)</span>
                                                                <span className="text-status-warning font-bold">{(discQty / (totalDelivered || 1) * 100).toFixed(1)}%</span>
                                                            </div>
                                                            <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-status-warning h-1.5 rounded-full" style={{ width: `${Math.min(100, (discQty / (totalDelivered || 1)) * 100)}%` }}></div></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Розділ 2: Операційні показники (Operations) */}
                                            <div>
                                                <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted font-display mb-4 mt-2">Операційні об'єми (Штуки)</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                                    <div className="bg-panel-bg border border-panel-border p-4 rounded-xl flex items-center justify-between group hover:border-text-muted transition-colors">
                                                        <div>
                                                            <div className="text-[10px] uppercase font-bold text-text-muted tracking-wide font-display mb-1">Вироблено / Доставлено</div>
                                                            <div className="text-2xl font-bold font-mono text-text-primary">{totalDelivered} шт</div>
                                                        </div>
                                                        <Package className="text-text-muted opacity-30 group-hover:opacity-100 transition-opacity" size={32} />
                                                    </div>

                                                    <div className="bg-panel-bg border border-panel-border p-4 rounded-xl flex items-center justify-between group hover:border-status-success/50 transition-colors">
                                                        <div>
                                                            <div className="text-[10px] uppercase font-bold text-text-muted tracking-wide font-display mb-1">Фреш продано</div>
                                                            <div className="text-2xl font-bold font-mono text-status-success">{freshQty} шт</div>
                                                        </div>
                                                        <Activity className="text-status-success opacity-30 group-hover:opacity-100 transition-opacity" size={32} />
                                                    </div>

                                                    <div className="bg-panel-bg border border-panel-border p-4 rounded-xl flex items-center justify-between group hover:border-status-warning/50 transition-colors">
                                                        <div>
                                                            <div className="text-[10px] uppercase font-bold text-text-muted tracking-wide font-display mb-1">Дисконт продано (-30%)</div>
                                                            <div className="text-2xl font-bold font-mono text-status-warning">{discQty} шт</div>
                                                        </div>
                                                        <Percent className="text-status-warning opacity-30 group-hover:opacity-100 transition-opacity" size={32} />
                                                    </div>

                                                    <div className="bg-panel-bg border border-panel-border p-4 rounded-xl flex items-center justify-between group hover:border-status-critical/50 transition-colors">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="text-[10px] uppercase font-bold text-text-muted tracking-wide font-display mb-1">Списано (Waste)</div>
                                                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-status-critical/20 text-status-critical mb-1">{(wasteQty / (totalDelivered || 1) * 100).toFixed(1)}%</span>
                                                            </div>
                                                            <div className="text-2xl font-bold font-mono text-status-critical">{wasteQty} шт</div>
                                                        </div>
                                                        <AlertTriangle className="text-status-critical opacity-30 group-hover:opacity-100 transition-opacity" size={32} />
                                                    </div>
                                                </div>

                                                {/* TIME SERIES CHART */}
                                                {chartData.length > 0 && (
                                                    <div className="bg-panel-bg border border-panel-border rounded-xl p-5 mt-6">
                                                        <div className="mb-6 flex justify-between items-center">
                                                            <div>
                                                                <h4 className="text-sm font-bold uppercase tracking-widest text-[#00D4FF] font-display">Динаміка Продажів (Шт)</h4>
                                                                <p className="text-xs text-text-muted mt-1">Поточний період vs Попередній (за день тижня)</p>
                                                            </div>
                                                        </div>
                                                        <div className="h-[300px] w-full">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                                                    <CartesianGrid strokeDasharray="3 3" stroke="#233446" vertical={false} />
                                                                    <XAxis
                                                                        dataKey="formattedCurrentDate"
                                                                        stroke="#64748b"
                                                                        fontSize={12}
                                                                        tickLine={false}
                                                                        axisLine={false}
                                                                        dy={10}
                                                                    />
                                                                    <YAxis
                                                                        stroke="#64748b"
                                                                        fontSize={12}
                                                                        width={45}
                                                                        tickLine={false}
                                                                        axisLine={false}
                                                                        dx={-10}
                                                                    />
                                                                    <RechartsTooltip
                                                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                                                                        itemStyle={{ color: '#f8fafc' }}
                                                                        labelStyle={{ color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}
                                                                        formatter={(value: any) => [`${value} шт`]}
                                                                    />
                                                                    <Legend
                                                                        verticalAlign="top"
                                                                        align="right"
                                                                        iconType="circle"
                                                                        wrapperStyle={{ fontSize: '12px', paddingBottom: '20px' }}
                                                                    />
                                                                    <Line
                                                                        type="monotone"
                                                                        name="Поточний період"
                                                                        dataKey="currentSales"
                                                                        stroke="#10b981"
                                                                        strokeWidth={3}
                                                                        dot={{ r: 4, strokeWidth: 2 }}
                                                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                                                        animationDuration={1500}
                                                                    />
                                                                    <Line
                                                                        type="monotone"
                                                                        name="Минулий період"
                                                                        dataKey="prevSales"
                                                                        stroke="#64748b"
                                                                        strokeWidth={2}
                                                                        strokeDasharray="5 5"
                                                                        dot={false}
                                                                        activeDot={{ r: 4 }}
                                                                        animationDuration={1500}
                                                                    />
                                                                </LineChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    );
                                })()
                            )}
                        </div>
                    )}

                    {/* RANKING TAB */}
                    {activeTab === 'ranking' && (
                        <div className="space-y-6">
                            {loadingRanking ? (
                                <div className="p-12 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full" /></div>
                            ) : rankingError ? (
                                <div className="p-8 text-status-critical flex items-center gap-2"><AlertCircle /> {rankingError.message}</div>
                            ) : rankingData && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        <div className="bg-panel-bg border border-panel-border rounded-xl overflow-hidden">
                                            <div className="bg-status-success/10 border-b border-panel-border p-3 text-status-success font-bold text-sm uppercase font-display tracking-widest flex items-center gap-2"><ArrowUpRight /> Топ-5 Магазинів</div>
                                            <div className="p-2 space-y-1">
                                                {rankingData.top_stores?.map((s: { store_name: string; total_sold: number }, i: number) => (
                                                    <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-bg-primary/50">
                                                        <span className="font-medium text-text-primary text-sm">{s.store_name}</span>
                                                        <span className="font-mono text-status-success">{s.total_sold} шт</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-panel-bg border border-panel-border rounded-xl overflow-hidden">
                                            <div className="bg-status-critical/10 border-b border-panel-border p-3 text-status-critical font-bold text-sm uppercase font-display tracking-widest flex items-center gap-2"><ArrowDownRight /> Аутсайдери (Найменше продажі)</div>
                                            <div className="p-2 space-y-1">
                                                {rankingData.bottom_stores?.map((s: { store_name: string; total_sold: number }, i: number) => (
                                                    <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-bg-primary/50">
                                                        <span className="font-medium text-text-primary text-sm">{s.store_name}</span>
                                                        <span className="font-mono text-status-warning">{s.total_sold} шт</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="bg-panel-bg border border-panel-border rounded-xl overflow-hidden h-full">
                                            <div className="bg-accent-primary/10 border-b border-panel-border p-3 text-accent-primary font-bold text-sm uppercase font-display tracking-widest flex items-center gap-2"><Activity /> ABC-Аналіз SKU (Виручка)</div>
                                            <div className="p-2 space-y-1">
                                                {rankingData.sku_abc?.map((s: { sku_name: string; total_revenue: number; total_sold: number }, i: number) => (
                                                    <div key={i} className="flex items-center p-3 rounded-lg bg-bg-primary/50 gap-4">
                                                        <div className={cn("w-6 h-6 rounded flex items-center justify-center font-bold text-xs", i === 0 ? "bg-yellow-500/20 text-yellow-500" : i === 1 ? "bg-slate-300/20 text-slate-300" : i === 2 ? "bg-amber-600/20 text-amber-600" : "bg-panel-border text-text-muted")}>{i + 1}</div>
                                                        <span className="font-medium text-text-primary flex-1">{s.sku_name}</span>
                                                        <div className="text-right">
                                                            <div className="font-mono text-status-success leading-none">{s.total_revenue} грн</div>
                                                            <div className="font-mono text-xs text-text-muted mt-1">{s.total_sold} продажів</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CATALOG TAB */}
                    {activeTab === 'catalog' && (
                        <div className="space-y-6 h-full flex flex-col items-center justify-center min-h-[400px]">
                            <LayoutGrid size={48} className="text-panel-border mb-4 opacity-50" />
                            <div className="text-text-muted font-display tracking-widest uppercase">Розділ &quot;Каталог&quot; в розробці...</div>
                        </div>
                    )}

                    {/* DISCOUNT TAB */}
                    {activeTab === 'discount' && (
                        <div className="space-y-6 h-full flex flex-col items-center justify-center min-h-[400px]">
                            <Percent size={48} className="text-panel-border mb-4 opacity-50" />
                            <div className="text-text-muted font-display tracking-widest uppercase">Розділ &quot;Здоров&apos;я дисконту&quot; в розробці...</div>
                        </div>
                    )}

                    {/* TREND TAB */}
                    {activeTab === 'trend' && (
                        <div className="space-y-6 flex-1 h-full">
                            {loadingTrend ? (
                                <div className="p-12 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full" /></div>
                            ) : trendError ? (
                                <div className="p-8 text-status-critical flex items-center gap-2"><AlertCircle /> {trendError.message}</div>
                            ) : trendData && (
                                <div className="bg-panel-bg border border-panel-border rounded-xl overflow-hidden">
                                    <div className="p-4 border-b border-panel-border bg-bg-primary/50">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted font-display">Індекс Трендів: Останні 14 днів vs Попередні 28 днів</h3>
                                    </div>
                                    <table className="w-full text-left border-collapse min-w-full">
                                        <thead>
                                            <tr className="bg-panel-bg/95 border-b border-panel-border">
                                                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-text-muted">Магазин</th>
                                                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-text-muted">SKU</th>
                                                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-text-muted text-right">Розпродаж (14д)</th>
                                                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-text-muted text-right">Тренд Індекс</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            {trendData?.sort((a: any, b: any) => (b.trend_index || 0) - (a.trend_index || 0)).map((row: any, idx: number) => {
                                                const trend = row.trend_index;
                                                const isUp = trend > 1.1;
                                                const isDown = trend < 0.85 && trend !== null;
                                                return (
                                                    <tr key={idx} className="border-b border-panel-border/50 hover:bg-white/5 transition-colors">
                                                        <td className="py-2 px-4 text-sm font-medium text-text-primary whitespace-nowrap">{row.store_name}</td>
                                                        <td className="py-2 px-4 text-sm text-text-secondary">{row.sku_name}</td>
                                                        <td className="py-2 px-4 text-sm text-right font-mono">{row.sold_14d} шт</td>
                                                        <td className="py-2 px-4 text-right whitespace-nowrap">
                                                            <span className={cn(
                                                                "inline-flex items-center gap-1 px-2 py-1 rounded font-mono text-xs border backdrop-blur-sm",
                                                                isUp ? "bg-status-success/10 text-status-success border-status-success/30" :
                                                                    isDown ? "bg-status-critical/10 text-status-critical border-status-critical/30" :
                                                                        "bg-panel-border/30 text-text-muted border-panel-border/50"
                                                            )}>
                                                                {isUp ? <TrendingUp size={12} /> : isDown ? <TrendingDown size={12} /> : null}
                                                                {trend ? trend.toFixed(2) : 'N/A'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </ErrorBoundary>
            </div>
        </div>
    );
};
