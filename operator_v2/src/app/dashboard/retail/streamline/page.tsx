"use client"

import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, ShoppingBag, Store, AlertCircle, Settings2, Zap, TrendingUpDown, Calendar } from "lucide-react"
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ReferenceLine, ZAxis, ComposedChart, Line, Bar, Area, Legend } from 'recharts'
import { useState, useEffect } from "react"

// Data is now fetched dynamically from KeyCRM API via /api/streamline/retail

const getColor = (x: number, y: number) => {
    if (x <= 30 && y >= 50) return '#10b981';
    if (x <= 30 && y < 50) return '#3b82f6';
    if (x > 30 && y >= 50) return '#f59e0b';
    return '#ef4444';
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-3 border border-[#E5E7EB] shadow-lg rounded-lg">
                <p className="font-bold text-[#2C3E50] mb-1">{data.name}</p>
                <div className="text-sm text-[#7F8C8D]">
                    <p>Оборотність: <span className="font-semibold text-[#2C3E50]">{data.x} днів</span></p>
                    <p>Маржа: <span className="font-semibold text-[#2C3E50]">{data.y}%</span></p>
                    <p>Об'єм: <span className="font-semibold text-[#2C3E50]">{data.z.toLocaleString()} ₴</span></p>
                </div>
            </div>
        );
    }
    return null;
};

// UI Components for the Streamline Advanced Settings Block
const CheckboxOption = ({ label, defaultChecked = false, desc = "" }: { label: string, defaultChecked?: boolean, desc?: string }) => (
    <label className="flex items-start gap-3 cursor-pointer group p-2 hover:bg-white rounded-md transition-colors border border-transparent hover:border-[#E5E7EB]">
        <input type="checkbox" defaultChecked={defaultChecked} className="mt-1 rounded border-[#CBD5E1] text-[#3b82f6] focus:ring-[#3b82f6]" />
        <div>
            <span className="text-sm font-medium text-[#2C3E50] group-hover:text-[#3b82f6] transition-colors">{label}</span>
            {desc && <p className="text-xs text-[#9CA3AF] mt-0.5">{desc}</p>}
        </div>
    </label>
);

const SelectOption = ({ label, options, defaultValue }: { label: string, options: string[], defaultValue?: string }) => (
    <div className="flex flex-col gap-1.5 mb-3">
        <label className="text-xs font-semibold text-[#7F8C8D] uppercase tracking-wider">{label}</label>
        <select defaultValue={defaultValue} className="text-sm border border-[#E5E7EB] rounded-lg bg-white px-3 py-2 text-[#2C3E50] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] outline-none transition-shadow shadow-sm">
            {options.map(opt => <option key={opt}>{opt}</option>)}
        </select>
    </div>
);

export default function RetailStreamlineDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [kpiData, setKpiData] = useState({ nonMoving: 0, avgDaysToSell: 0, riskRevenueLost: 0 });
    const [trendData, setTrendData] = useState<any[]>([]);
    const [turnEarnData, setTurnEarnData] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/streamline/retail');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setKpiData(data.kpi);
                        setTrendData(data.trendData);
                        setTurnEarnData(data.turnEarnData);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch streamline data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-baseline justify-between gap-4 border-b border-[#E5E7EB] pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#2C3E50] tracking-tight flex items-center gap-2">
                        <Store className="text-[#8b5cf6]" />
                        Ритейл: Streamline Analytics (Expert Mode)
                    </h1>
                    <p className="text-sm text-[#7F8C8D] mt-1">Абсолютний контроль над моделями прогнозування та факторами попиту</p>
                </div>
                <div className="text-sm font-medium text-[#7F8C8D]">
                    База даних: KeyCRM API
                </div>
            </div>

            {/* Top KPI Row */}
            {isLoading ? (
                <div className="h-32 flex items-center justify-center bg-white rounded-lg border border-[#E5E7EB] shadow-sm animate-pulse">
                    <div className="text-[#3b82f6] font-medium flex items-center gap-2">
                        <Activity className="w-5 h-5 animate-spin" /> Синхронізація з KeyCRM...
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="text-sm font-semibold text-[#7F8C8D] uppercase">Неліквід (Non-moving)</div>
                            <ShoppingBag className="w-5 h-5 text-[#EF4444]" />
                        </div>
                        <div className="text-3xl font-bold text-[#2C3E50] mb-2">{kpiData.nonMoving.toLocaleString()} ₴</div>
                        <p className="text-sm text-[#7F8C8D]">Товари без продажів {">"} 30 днів</p>
                    </div>
                    <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="text-sm font-semibold text-[#7F8C8D] uppercase">Days to Sell</div>
                            <BarChart3 className="w-5 h-5 text-[#3b82f6]" />
                        </div>
                        <div className="text-3xl font-bold text-[#2C3E50] mb-2">{kpiData.avgDaysToSell} дні</div>
                        <p className="text-sm text-[#7F8C8D]">Середній час продажу моделі</p>
                    </div>
                    <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="text-sm font-semibold text-[#7F8C8D] uppercase">Risk / Revenue Loss</div>
                            <Activity className="w-5 h-5 text-[#F59E0B]" />
                        </div>
                        <div className="text-3xl font-bold text-[#2C3E50] mb-2">{kpiData.riskRevenueLost.toLocaleString()} ₴</div>
                        <p className="text-sm text-[#7F8C8D]">Втрати через дефіцит розмірів</p>
                    </div>
                </div>
            )}

            {/* --- CORE: EXPERT FORECASTING ENGINE --- */}
            <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm mt-8">
                <div className="p-5 md:p-6 border-b border-[#E5E7EB] bg-slate-50 rounded-t-lg">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-[#2C3E50] flex items-center gap-2">
                                <Settings2 className="w-6 h-6 text-[#3b82f6]" />
                                AI Двигун Прогнозування (Demand Sensing)
                            </h3>
                            <p className="text-[#7F8C8D] mt-1 text-sm">
                                Глибинні налаштування моделі прогнозування для обраного SKU.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <select className="bg-white border border-[#E5E7EB] text-[#2C3E50] font-bold text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-4 py-2 shadow-sm">
                                <option>👗 Сукня "Міла" (Артикул: M-001)</option>
                                <option>👕 Базова Футболка (Артикул: T-092)</option>
                                <option>👖 Джинси кльош (Артикул: J-304)</option>
                            </select>
                            <button className="bg-[#3b82f6] hover:bg-[#2563eb] border border-transparent text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                                Застосувати Модель
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 divide-y xl:divide-y-0 xl:divide-x border-[#E5E7EB]">

                    {/* Left Panel: Deep Settings (3 Cols in Grid) */}
                    <div className="xl:col-span-4 bg-gray-50/30 p-5 md:p-6 space-y-8 h-[600px] overflow-y-auto custom-scrollbar">

                        {/* Section 1: Forecasting Method */}
                        <div className="space-y-3">
                            <h4 className="flex items-center gap-2 font-bold text-[#2C3E50] text-sm uppercase tracking-wider mb-4 pb-2 border-b border-[#E5E7EB]">
                                <TrendingUpDown className="w-4 h-4 text-[#8b5cf6]" /> Основна Модель
                            </h4>
                            <SelectOption label="Метод прогнозу" options={["Успадков. (Знизу вгору)", "Зверху вниз", "Прямий розрахунок"]} />
                            <SelectOption label="Тип моделі" options={["Автоматичний вибір", "ARIMA (Сезонна)", "Експоненційне згладжування", "Ковзне середнє (Moving Average)"]} />
                            <SelectOption label="Шаблон сезонності" options={["Автоматичний вибір", "Фіксований (11 місяців)", "Без сезонності"]} />
                        </div>

                        {/* Section 2: Demand Sensing & Adjustments */}
                        <div className="space-y-3">
                            <h4 className="flex items-center gap-2 font-bold text-[#2C3E50] text-sm uppercase tracking-wider mb-4 pb-2 border-b border-[#E5E7EB]">
                                <Zap className="w-4 h-4 text-[#F59E0B]" /> Згладжування Anomalies
                            </h4>
                            <CheckboxOption label="Ігнорувати нульові продажі" defaultChecked={true} desc="Виключає з математики дні, коли товар взагалі не продавався (щоб не занижувати прогноз)." />
                            <CheckboxOption label="Ігнорувати дефіцит" defaultChecked={true} desc="Якщо товару не було на залишку, система не буде вважати це падінням попиту." />
                            <CheckboxOption label="Виявити відхилення від норми" defaultChecked={true} desc="Автоматично зрізає неприродні піки (наприклад, оптову закупку 100 шт за раз)." />
                            <SelectOption label="Ігнорувати тренд до" options={["Не ігнорувати", "січ. 2024", "лют. 2024", "бер. 2024"]} />
                            <SelectOption label="Автоматичне вікно" options={["Так (Адаптивне)", "Ні (Жорстке)"]} />
                        </div>

                        {/* Section 3: Promotions & Elasticity */}
                        <div className="space-y-3">
                            <h4 className="flex items-center gap-2 font-bold text-[#2C3E50] text-sm uppercase tracking-wider mb-4 pb-2 border-b border-[#E5E7EB]">
                                <Calendar className="w-4 h-4 text-[#10B981]" /> Еластичність та Фактори
                            </h4>
                            <CheckboxOption label="Відчувати попит (Demand Sensing)" desc="Використання ML для вловлювання мікро-трендів у реальному часі." />
                            <CheckboxOption label="Використовувати еластичність ціни" desc="Коригує майбутні продажі залежно від запланованої роздрібної ціни." />
                            <CheckboxOption label="Використовувати свята" defaultChecked={true} />
                            <CheckboxOption label="Використовувати акції (Promo)" defaultChecked={true} desc="Враховує ефект канібалізації та промо-сплески." />
                        </div>

                        {/* Section 4: Replenishment */}
                        <div className="space-y-3">
                            <h4 className="flex items-center gap-2 font-bold text-[#2C3E50] text-sm uppercase tracking-wider mb-4 pb-2 border-b border-[#E5E7EB]">
                                <Store className="w-4 h-4 text-[#64748b]" /> Логіка поповнення
                            </h4>
                            <SelectOption label="Щотижневий графік" options={["Неактивний", "ПН-СР-ПТ", "Кожен день"]} />
                            <SelectOption label="Придбання матеріалу" defaultValue="Закуповувати" options={["Виробляти", "Закуповувати", "Переміщувати (Між складами)"]} />
                            <SelectOption label="Статус плану" defaultValue="На розгляді" options={["На розгляді", "Затверджено Автоматично", "Потребує перевірки"]} />
                        </div>

                    </div>

                    {/* Right Panel: Visualization & Matrix (8 Cols in Grid) */}
                    <div className="xl:col-span-8 p-5 md:p-6 space-y-6 flex flex-col h-[600px]">

                        {/* Chart Area */}
                        <div className="flex-1 min-h-[300px] bg-white rounded-lg border border-[#E5E7EB] shadow-sm p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} />

                                    <Bar yAxisId="left" dataKey="actualSales" name="Факти (У минулому)" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={40} />
                                    <Line yAxisId="left" type="monotone" dataKey="forecast" name="Прогноз Попиту" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 8, fill: '#3b82f6', strokeWidth: 0 }} />
                                    <Area yAxisId="right" type="monotone" dataKey="inventory" name="Прогноз Залишку" fill="url(#colorInventory)" stroke="#10b981" fillOpacity={1} strokeWidth={2} />
                                    <defs>
                                        <linearGradient id="colorInventory" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        {/* The Matrix */}
                        <div className="shrink-0 overflow-x-auto border border-[#E5E7EB] rounded-lg shadow-sm">
                            <table className="w-full text-xs md:text-sm text-center">
                                <thead className="text-[#64748b] bg-slate-50 border-b border-[#E5E7EB]">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold border-r border-[#E5E7EB] w-[200px]">Показник</th>
                                        {trendData.map(d => (
                                            <th key={d.month} className={`px-2 py-3 font-semibold ${d.isFuture ? 'text-[#3b82f6]' : ''}`}>{d.month}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-[#E5E7EB] hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-2.5 text-left font-medium text-[#334155] border-r border-[#E5E7EB]">Фактичні продажі</td>
                                        {trendData.map(d => (
                                            <td key={d.month} className="px-2 py-2.5 text-[#64748b]">{d.actualSales || '-'}</td>
                                        ))}
                                    </tr>
                                    <tr className="border-b border-[#E5E7EB] hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-2.5 text-left font-medium text-[#334155] border-r border-[#E5E7EB]">Статистичний прогноз</td>
                                        {trendData.map(d => (
                                            <td key={d.month} className="px-2 py-2.5 font-bold text-[#3b82f6]">{d.forecast || '-'}</td>
                                        ))}
                                    </tr>
                                    <tr className="border-b border-[#E5E7EB] hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-2.5 text-left font-medium text-[#334155] border-r border-[#E5E7EB]">Фінальний прогноз <span className="text-[10px] text-gray-400 font-normal ml-1">(Ручний)</span></td>
                                        {trendData.map(d => (
                                            <td key={d.month} className="px-2 py-2.5"><input type="text" className="w-12 text-center border border-gray-200 rounded text-xs py-0.5" placeholder={d.forecast?.toString() || "-"} disabled={!d.isFuture} /></td>
                                        ))}
                                    </tr>
                                    <tr className="border-b border-[#E5E7EB] hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-2.5 text-left font-medium text-[#334155] border-r border-[#E5E7EB]">Прогноз запасів (Кінець міс.)</td>
                                        {trendData.map(d => (
                                            <td key={d.month} className={`px-2 py-2.5 font-bold ${d.inventory && d.inventory < 50 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>{d.inventory || '-'}</td>
                                        ))}
                                    </tr>
                                    <tr className="bg-blue-50/50 hover:bg-blue-50 transition-colors">
                                        <td className="px-4 py-3 text-left font-bold text-[#1e293b] border-r border-[#bfdbfe]">План замовлень (Дозакупка)</td>
                                        {trendData.map(d => (
                                            <td key={d.month} className="px-2 py-3 font-bold text-[#0f172a]">{d.suggestedOrder || '-'}</td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </div>

            {/* Turn-Earn Index Scatter Plot & Stockouts (Reduced emphasis, kept for completeness) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
                {/* Scatter Plot */}
                <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm p-5">
                    <h3 className="text-lg font-bold text-[#2C3E50] mb-4">Turn-Earn Index (Матриця рентабельності)</h3>
                    <div className="w-full h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis type="number" dataKey="x" name="Days to Sell" unit="д" tick={{ fontSize: 11 }} />
                                <YAxis type="number" dataKey="y" name="Margin" unit="%" tick={{ fontSize: 11 }} />
                                <ZAxis type="number" dataKey="z" range={[50, 500]} />
                                <ReferenceLine x={30} stroke="#9CA3AF" strokeDasharray="3 3" />
                                <ReferenceLine y={50} stroke="#9CA3AF" strokeDasharray="3 3" />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                                <Scatter data={turnEarnData} shape="circle">
                                    {turnEarnData.map((entry, index) => <Cell key={index} fill={getColor(entry.x, entry.y)} opacity={0.8} />)}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Alerts */}
                <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm">
                    <div className="p-4 border-b border-[#E5E7EB] bg-red-50/30">
                        <h3 className="text-base font-bold text-[#2C3E50] flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            Stockout Risk (Загублена виручка)
                        </h3>
                    </div>
                    <div className="p-4 text-sm text-[#475569]">
                        <p className="mb-2">⚠️ Сукня "Міла" (M) - Дефіцит <b className="text-red-500">14 днів</b> (Втрата: 12,500 ₴)</p>
                        <p>⚠️ Лляний костюм (L) - Дефіцит <b className="text-orange-500">3 дні</b> (Втрата: 4,800 ₴)</p>
                    </div>
                </div>
            </div>

        </div >
    )
}
