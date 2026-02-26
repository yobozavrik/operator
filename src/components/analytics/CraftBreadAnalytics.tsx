'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Calendar, Activity, AlertTriangle, TrendingDown, Store, AlertCircle, Percent, ArrowUpRight, ArrowDownRight, Package, TrendingUp, ChevronDown, LayoutGrid } from 'lucide-react';
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

    return (
        <div className="flex flex-col h-full bg-bg-primary">
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                            Live Data
                        </span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col xl:items-end gap-3 relative z-10 w-full xl:w-auto">
                    {/* Top Row: Date Picker & Templates */}
                    <div className="flex items-center bg-bg-primary/40 border border-panel-border rounded-xl p-1 shadow-sm w-full xl:w-auto justify-between xl:justify-start overflow-x-auto custom-scrollbar">
                        <div className="flex items-center px-4 gap-3 border-r border-panel-border/50 shrink-0">
                            <Calendar size={16} className="text-slate-400" />
                            {activeTab === 'trend' ? (
                                <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="bg-transparent text-sm text-white font-bold outline-none py-1.5 custom-calendar-icon w-[130px] font-display tracking-widest" />
                            ) : (
                                <>
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm text-white font-bold outline-none py-1.5 custom-calendar-icon w-[115px] font-display tracking-widest" />
                                    <span className="text-slate-400 font-bold">-</span>
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm text-white font-bold outline-none py-1.5 custom-calendar-icon w-[115px] font-display tracking-widest" />
                                </>
                            )}
                            <Calendar size={16} className="text-slate-400" />
                        </div>
                        <button className="flex items-center gap-2 px-6 py-1.5 text-sm font-bold text-[#00D4FF] uppercase tracking-wider font-display shrink-0 hover:bg-[#00D4FF]/5 rounded-lg transition-colors">
                            Шаблони
                            <ChevronDown size={16} />
                        </button>
                    </div>

                    {/* Bottom Row: Tabs */}
                    <div className="flex bg-bg-primary/40 border border-panel-border rounded-xl p-1 shadow-sm overflow-x-auto custom-scrollbar w-full xl:w-auto">
                        <button onClick={() => setActiveTab('network')} className={cn("px-5 py-2 text-xs font-bold uppercase rounded-lg transition-colors font-display tracking-widest shrink-0", activeTab === 'network' ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border border-[#00D4FF]/30 text-[#00D4FF]" : "text-slate-400 hover:text-white border border-transparent")}>Мережа</button>
                        <button onClick={() => setActiveTab('ranking')} className={cn("px-5 py-2 text-xs font-bold uppercase rounded-lg transition-colors font-display tracking-widest shrink-0", activeTab === 'ranking' ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border border-[#00D4FF]/30 text-[#00D4FF]" : "text-slate-400 hover:text-white border border-transparent")}>Ренкінг/АВС</button>
                        <button onClick={() => setActiveTab('catalog')} className={cn("px-5 py-2 text-xs font-bold uppercase rounded-lg transition-colors font-display tracking-widest flex items-center gap-2 shrink-0", activeTab === 'catalog' ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border border-[#00D4FF]/30 text-[#00D4FF]" : "text-slate-400 hover:text-white border border-transparent")}>
                            <LayoutGrid size={14} /> Каталог
                        </button>
                        <button onClick={() => setActiveTab('discount')} className={cn("px-5 py-2 text-xs font-bold uppercase rounded-lg transition-colors font-display tracking-widest shrink-0", activeTab === 'discount' ? "bg-gradient-to-r from-[#00D4FF]/20 to-transparent border border-[#00D4FF]/30 text-[#00D4FF]" : "text-slate-400 hover:text-white border border-transparent")}>Здоров'я дисконту</button>
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
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-panel-bg border border-panel-border p-5 rounded-xl flex flex-col relative overflow-hidden">
                                        <div className="text-[10px] uppercase font-bold text-text-muted tracking-wide font-display mb-2">Загальний Об'єм (шт)</div>
                                        <div className="text-3xl font-bold font-mono text-text-primary">{networkData.qty_delivered || 0}</div>
                                        <Package className="absolute right-4 bottom-4 text-text-muted opacity-20" size={48} />
                                    </div>
                                    <div className="bg-panel-bg border border-status-success/30 p-5 rounded-xl flex flex-col relative overflow-hidden">
                                        <div className="text-[10px] uppercase font-bold text-status-success tracking-wide font-display mb-2">Продано Фреш & Дисконт</div>
                                        <div className="text-3xl font-bold font-mono text-status-success">{Number(networkData.qty_fresh_sold) + Number(networkData.qty_disc_sold)}</div>
                                        <Activity className="absolute right-4 bottom-4 text-status-success opacity-10" size={48} />
                                    </div>
                                    <div className="bg-panel-bg border border-status-critical/30 p-5 rounded-xl flex flex-col relative overflow-hidden">
                                        <div className="text-[10px] uppercase font-bold text-status-critical tracking-wide font-display mb-2">Списано в Мусор</div>
                                        <div className="text-3xl font-bold font-mono text-status-critical">{networkData.qty_waste || 0}</div>
                                        <AlertTriangle className="absolute right-4 bottom-4 text-status-critical opacity-10" size={48} />
                                    </div>
                                    <div className="bg-panel-bg border border-accent-primary/30 p-5 rounded-xl flex flex-col relative overflow-hidden justify-between">
                                        <div>
                                            <div className="text-[10px] uppercase font-bold text-accent-primary tracking-wide font-display mb-1">Ключові Метрики</div>
                                            <div className="flex items-end gap-2 mb-2">
                                                <Percent size={14} className="text-status-critical mb-1" />
                                                <div className="text-2xl font-bold font-mono text-status-critical leading-none">{networkData.waste_rate || 0}%</div>
                                                <div className="text-[10px] text-text-muted uppercase font-display mb-1">Waste Rate</div>
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <Percent size={14} className="text-status-success mb-1" />
                                                <div className="text-2xl font-bold font-mono text-status-success leading-none">{networkData.sell_through_rate || 0}%</div>
                                                <div className="text-[10px] text-text-muted uppercase font-display mb-1">Sell-Through</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                {rankingData.top_stores?.map((s: any, i: number) => (
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
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                {rankingData.bottom_stores?.map((s: any, i: number) => (
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
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                {rankingData.sku_abc?.map((s: any, i: number) => (
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
                            <div className="text-text-muted font-display tracking-widest uppercase">Розділ "Каталог" в розробці...</div>
                        </div>
                    )}

                    {/* DISCOUNT TAB */}
                    {activeTab === 'discount' && (
                        <div className="space-y-6 h-full flex flex-col items-center justify-center min-h-[400px]">
                            <Percent size={48} className="text-panel-border mb-4 opacity-50" />
                            <div className="text-text-muted font-display tracking-widest uppercase">Розділ "Здоров'я дисконту" в розробці...</div>
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
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            <style jsx>{`
                .custom-calendar-icon::-webkit-calendar-picker-indicator {
                    filter: invert(1) opacity(0.5);
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};
