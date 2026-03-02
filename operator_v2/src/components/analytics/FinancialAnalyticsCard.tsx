"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, DollarSign, Activity, ShoppingBag, CreditCard, ChevronDown, Calendar } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area } from 'recharts'

interface FinancialAnalyticsCardProps {
    title?: string;
    sourceName?: string;
    apiEndpoint?: string;
}

export default function FinancialAnalyticsCard({
    title = "Фінансова Аналітика",
    sourceName = "KeyCRM",
    apiEndpoint = "/api/analytics/financials"
}: FinancialAnalyticsCardProps) {
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
            <div className="w-full bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8 flex flex-col items-center justify-center min-h-[500px] animate-pulse">
                <Activity className="w-10 h-10 text-[#3b82f6] animate-spin mb-4" />
                <p className="text-[#64748b] font-medium">Синхронізація Виторгу з KeyCRM...</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden select-none">
            {/* Header */}
            <div className="border-b border-[#E5E7EB] p-5 lg:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-[#1e293b]">
                        <DollarSign className="w-6 h-6 text-[#10b981]" />
                        {title}
                    </h2>
                    <p className="text-[#64748b] text-sm mt-1">Оновлено в реальному часі • Джерело: {sourceName}</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-white border border-[#E5E7EB] text-[#334155] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm">
                        <Calendar className="w-4 h-4 text-[#64748b]" />
                        <span>Цей тиждень</span>
                        <ChevronDown className="w-4 h-4 text-[#64748b]" />
                    </button>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b border-[#E5E7EB]">
                <div className="p-6">
                    <div className="text-[#64748b] text-sm font-semibold uppercase tracking-wider mb-2">Загальний Виторг</div>
                    <div className="flex items-end gap-3">
                        <span className="text-3xl font-bold text-[#0f172a]">{formatCurrency(data.kpi.revenue.current)}</span>
                        <div className="pb-1"><TrendPill delta={data.kpi.revenue.delta} /></div>
                    </div>
                    <div className="text-xs text-[#94a3b8] mt-2">Попер. період: {formatCurrency(data.kpi.revenue.prev)}</div>
                </div>
                <div className="p-6">
                    <div className="text-[#64748b] text-sm font-semibold uppercase tracking-wider mb-2">Середній чек</div>
                    <div className="flex items-end gap-3">
                        <span className="text-3xl font-bold text-[#0f172a]">{formatCurrency(data.kpi.averageCheck.current)}</span>
                        <div className="pb-1"><TrendPill delta={data.kpi.averageCheck.delta} /></div>
                    </div>
                    <div className="text-xs text-[#94a3b8] mt-2">Попер. період: {formatCurrency(data.kpi.averageCheck.prev)}</div>
                </div>
                <div className="p-6">
                    <div className="text-[#64748b] text-sm font-semibold uppercase tracking-wider mb-2">Кількість транзакцій</div>
                    <div className="flex items-end gap-3">
                        <span className="text-3xl font-bold text-[#0f172a]">{data.kpi.transactions.current.toLocaleString()} шт.</span>
                        <div className="pb-1"><TrendPill delta={data.kpi.transactions.delta} /></div>
                    </div>
                    <div className="text-xs text-[#94a3b8] mt-2">Попер. період: {data.kpi.transactions.prev.toLocaleString()} шт.</div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x border-[#E5E7EB]">
                {/* Left: Trend Area Chart */}
                <div className="p-6">
                    <h3 className="text-base font-bold text-[#1e293b] mb-4">Динаміка Виторгу (поточний vs попер. тиждень)</h3>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.charts.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorPrevRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `${value / 1000}k`} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value: any) => formatCurrency(value)}
                                />
                                <Area type="monotone" dataKey="prevRevenue" name="Минулий період" stroke="#94a3b8" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPrevRevenue)" />
                                <Area type="monotone" dataKey="revenue" name="Цей період" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right: Revenue by Category (Pie) & Top Products (List) */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-[#E5E7EB]">
                    {/* Pie Chart */}
                    <div className="p-6 flex flex-col items-center justify-center">
                        <h3 className="text-base font-bold text-[#1e293b] mb-4 w-full text-center">Розподіл по категоріях</h3>
                        <div className="h-[180px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.charts.revenueByCategory}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {data.charts.revenueByCategory.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                                <span className="text-xs text-[#64748b] uppercase tracking-wide">Лідер</span>
                                <span className="text-lg font-bold text-[#1e293b]">{data.charts.revenueByCategory[0]?.name}</span>
                            </div>
                        </div>
                        {/* Legend */}
                        <div className="flex flex-wrap justify-center gap-3 mt-4 text-xs">
                            {data.charts.revenueByCategory.map((c: any) => (
                                <div key={c.name} className="flex items-center gap-1">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.fill }}></div>
                                    <span className="text-[#475569]">{c.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="p-6">
                        <h3 className="text-base font-bold text-[#1e293b] mb-4">Топ продуктів (виторг)</h3>
                        <div className="space-y-4">
                            {data.charts.topProducts.map((p: any, i: number) => (
                                <div key={p.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-[#334155]">{p.name}</div>
                                            <div className="text-xs text-[#94a3b8]">{p.quantity} шт. продано</div>
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold text-[#10b981]">{formatCurrency(p.revenue)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
