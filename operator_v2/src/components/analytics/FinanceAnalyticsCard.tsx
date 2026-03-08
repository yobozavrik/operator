"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, DollarSign, Activity, ShoppingBag, CreditCard, ChevronDown, Calendar } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area } from 'recharts'

interface FinanceAnalyticsCardProps {
    title?: string;
    sourceName?: string;
    apiEndpoint?: string;
}

export default function FinanceAnalyticsCard({
    title = "Фінансова Аналітика",
    sourceName = "KeyCRM",
    apiEndpoint = "/api/analytics/financials"
}: FinanceAnalyticsCardProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchFinData = async () => {
            try {
                const res = await fetch(apiEndpoint);
                if (res.ok) {
                    const json = await res.json();
                    if (json.success) setData(json);
                }
            } catch (err) {
                console.error("Failed to fetch financial data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFinData();
    }, []);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(val);
    };

    const TrendPill = ({ delta }: { delta: number }) => {
        const isPositive = delta > 0;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? '+' : ''}{delta.toFixed(1)}%
            </span>
        );
    };

    if (isLoading || !data) {
        return (
            <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center min-h-[500px] animate-pulse">
                <Activity className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Синхронізація Виторгу...</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden select-none flex flex-col h-full">
            {/* Header */}
            <div className="border-b border-slate-100 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                        <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        {title}
                    </h2>
                    <p className="text-slate-500 text-xs mt-1 font-medium">Оновлено в реальному часі • Джерело: {sourceName}</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Цей тиждень</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x border-b border-slate-100 bg-white">
                <div className="p-4 lg:p-5 flex flex-col justify-center">
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Загальний Виторг</div>
                    <div className="flex flex-wrap items-baseline gap-2 mb-1">
                        <span className="text-2xl xl:text-3xl font-extrabold text-slate-900 tracking-tight whitespace-nowrap">{formatCurrency(data.kpi.revenue.current)}</span>
                        <TrendPill delta={data.kpi.revenue.delta} />
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">Попер. період: {formatCurrency(data.kpi.revenue.prev)}</div>
                </div>
                <div className="p-4 lg:p-5 flex flex-col justify-center">
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Середній чек</div>
                    <div className="flex flex-wrap items-baseline gap-2 mb-1">
                        <span className="text-2xl xl:text-3xl font-extrabold text-slate-900 tracking-tight whitespace-nowrap">{formatCurrency(data.kpi.averageCheck.current)}</span>
                        <TrendPill delta={data.kpi.averageCheck.delta} />
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">Попер. період: {formatCurrency(data.kpi.averageCheck.prev)}</div>
                </div>
                <div className="p-4 lg:p-5 flex flex-col justify-center">
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Кількість транзакцій</div>
                    <div className="flex flex-wrap items-baseline gap-2 mb-1">
                        <span className="text-2xl xl:text-3xl font-extrabold text-slate-900 tracking-tight whitespace-nowrap">{data.kpi.transactions.current.toLocaleString()} <span className="text-lg xl:text-xl text-slate-500 font-semibold">шт.</span></span>
                        <TrendPill delta={data.kpi.transactions.delta} />
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">Попер. період: {data.kpi.transactions.prev.toLocaleString()} шт.</div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="flex flex-col flex-1 divide-y divide-slate-100">
                {/* Trend Area Chart */}
                <div className="p-5 flex-1 min-h-[220px] flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
                        Динаміка Виторгу (тиждень до тижня)
                        <div className="flex gap-3 mt-1 items-center">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] text-slate-500 uppercase font-bold">Поточний</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-300"></div><span className="text-[10px] text-slate-500 uppercase font-bold">Минулий</span></div>
                        </div>
                    </h3>
                    <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.charts.dailyTrend} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorPrevRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} dy={5} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(value) => `${value / 1000}k`} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', fontWeight: 'bold', fontSize: '12px' }}
                                    formatter={(value: any) => formatCurrency(value)}
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area type="monotone" dataKey="prevRevenue" name="Минулий період" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorPrevRevenue)" activeDot={{ r: 4, fill: '#94a3b8', stroke: '#fff', strokeWidth: 2 }} />
                                <Area type="monotone" dataKey="revenue" name="Цей період" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bottom Row: Splitting remaining space */}
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x border-t border-slate-100 bg-slate-50/30">
                    {/* Pie Chart */}
                    <div className="p-5 flex flex-col items-center justify-center">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 w-full text-left">Розподіл по категоріях</h3>
                        <div className="h-[160px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.charts.revenueByCategory}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={75}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={4}
                                    >
                                        {data.charts.revenueByCategory.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        formatter={(value: any) => formatCurrency(value)}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col mt-1">
                                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Лідер</span>
                                <span className="text-sm font-black text-slate-800 px-2 text-center truncate max-w-[80px]">{data.charts.revenueByCategory[0]?.name}</span>
                            </div>
                        </div>
                        {/* Legend */}
                        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-xs">
                            {data.charts.revenueByCategory.map((c: any) => (
                                <div key={c.name} className="flex items-center gap-1.5 min-w-[30%]">
                                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: c.fill }}></div>
                                    <span className="text-slate-600 font-medium truncate max-w-[80px]" title={c.name}>{c.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="p-5">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex justify-between">
                            Топ продуктів (виторг)
                            <span className="text-xs text-blue-500 font-medium cursor-pointer hover:underline">Всі</span>
                        </h3>
                        <div className="space-y-3">
                            {data.charts.topProducts.map((p: any, i: number) => (
                                <div key={p.id} className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 p-2 -mx-2 rounded-lg hover:bg-slate-100 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' :
                                                i === 1 ? 'bg-slate-200 text-slate-700 ring-1 ring-slate-300' :
                                                    i === 2 ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-200' :
                                                        'bg-slate-50 text-slate-400'
                                            }`}>
                                            {i + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-slate-800 truncate" title={p.name}>{p.name}</div>
                                            <div className="text-[10px] text-slate-500">{p.quantity} шт.</div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-emerald-600 shrink-0 tabular-nums bg-emerald-50 px-2 py-0.5 rounded-md">
                                        {formatCurrency(p.revenue)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

