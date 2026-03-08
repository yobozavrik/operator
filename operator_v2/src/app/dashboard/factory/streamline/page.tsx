"use client"

import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, Factory, PackageX, Settings, Truck, ShieldAlert, Boxes } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts'
import { useState, useEffect } from "react"
import FinanceAnalyticsCard from "@/components/analytics/FinanceAnalyticsCard"

// Data is dynamically loaded via /api/streamline/factory

const InputOption = ({ label, defaultValue, unit }: { label: string, defaultValue: string, unit: string }) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-[#7F8C8D] uppercase tracking-wider">{label}</label>
        <div className="relative">
            <input type="text" defaultValue={defaultValue} className="w-full text-sm border border-[#E5E7EB] rounded-lg bg-white px-3 py-2 text-[#2C3E50] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] outline-none transition-shadow shadow-sm" />
            <span className="absolute right-3 top-2 text-[#9CA3AF] text-sm">{unit}</span>
        </div>
    </div>
);

const SelectOption = ({ label, options, defaultValue }: { label: string, options: string[], defaultValue?: string }) => (
    <div className="flex flex-col gap-1.5 mb-2">
        <label className="text-xs font-semibold text-[#7F8C8D] uppercase tracking-wider">{label}</label>
        <select defaultValue={defaultValue} className="text-sm border border-[#E5E7EB] rounded-lg bg-white px-3 py-2 text-[#2C3E50] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] outline-none transition-shadow shadow-sm">
            {options.map(opt => <option key={opt}>{opt}</option>)}
        </select>
    </div>
);

export default function FactoryStreamlineDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [kpiData, setKpiData] = useState({ daysOfSupply: 0, stockoutRiskCount: 0, overstockValue: 0 });
    const [stockoutData, setStockoutData] = useState<any[]>([]);
    const [purchasePlan, setPurchasePlan] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/streamline/factory');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setKpiData(data.kpi);
                        setStockoutData(data.stockoutData);
                        setPurchasePlan(data.purchasePlan);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch factory streamline data", err);
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
                        <Factory className="text-[#3b82f6]" />
                        Фабрика: Streamline Analytics (Supply Chain Expert)
                    </h1>
                    <p className="text-sm text-[#7F8C8D] mt-1">Тотальне управління закупівлями, страховими запасами (Safety Stock) та Lead Times</p>
                </div>
                <div className="text-sm font-medium text-[#7F8C8D]">
                    Сировина: 2,400 SKU
                </div>
            </div>

            {/* Injected Financial Sales Dashboard */}
            <FinanceAnalyticsCard />

            {/* Top KPI Row */}
            {isLoading ? (
                <div className="h-32 flex items-center justify-center bg-white rounded-lg border border-[#E5E7EB] shadow-sm animate-pulse">
                    <div className="text-[#3b82f6] font-medium flex items-center gap-2">
                        <Activity className="w-5 h-5 animate-spin" /> Завантаження даних KeyCRM...
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="text-sm font-semibold text-[#7F8C8D] uppercase">Days of Supply (Покриття)</div>
                            <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                        </div>
                        <div className="text-3xl font-bold text-[#2C3E50] mb-2">{kpiData.daysOfSupply} дн.</div>
                        <p className="text-sm text-[#7F8C8D]">Середнє покриття запасів сировини</p>
                    </div>
                    <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="text-sm font-semibold text-[#7F8C8D] uppercase">Stockout Risk (Дефіцит)</div>
                            <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
                        </div>
                        <div className="text-3xl font-bold text-[#2C3E50] mb-2">{kpiData.stockoutRiskCount} шт.</div>
                        <p className="text-sm text-[#7F8C8D]">Критичний залишок сировини {"<"} 3 днів</p>
                    </div>
                    <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="text-sm font-semibold text-[#7F8C8D] uppercase">Overstock (Надлишок)</div>
                            <PackageX className="w-5 h-5 text-[#F59E0B]" />
                        </div>
                        <div className="text-3xl font-bold text-[#2C3E50] mb-2">{kpiData.overstockValue.toLocaleString()} ₴</div>
                        <p className="text-sm text-[#7F8C8D]">Заморожені кошти в матеріалах</p>
                    </div>
                </div>
            )}

            {/* --- EXPERT SUPPLY CHAIN CONTROLS --- */}
            <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm mt-8">
                <div className="p-5 border-b border-[#E5E7EB] bg-slate-50 rounded-t-lg">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-[#2C3E50] flex items-center gap-2">
                                <Settings className="w-6 h-6 text-[#10B981]" />
                                Параметри поповнення (Replenishment Engine)
                            </h3>
                            <p className="text-[#7F8C8D] mt-1 text-sm">
                                Налаштування ланцюга поставок, Service Levels та обмежень замовлень.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <select className="bg-white border border-[#E5E7EB] text-[#2C3E50] font-bold text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block px-4 py-2 shadow-sm">
                                <option>🧵 Блискавки 20см (Арт: ZP-20-BLK)</option>
                                <option>🧻 Флізелін 50г/м2 (Арт: FL-50)</option>
                            </select>
                            <button className="bg-[#10B981] hover:bg-[#059669] border border-transparent text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                                Розрахувати Замовлення
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 divide-y xl:divide-y-0 xl:divide-x border-[#E5E7EB]">

                    {/* Constraints Panel (Left) */}
                    <div className="p-5 md:p-6 space-y-6">
                        <h4 className="flex items-center gap-2 font-bold text-[#2C3E50] text-sm uppercase tracking-wider pb-2 border-b border-[#E5E7EB]">
                            <Truck className="w-4 h-4 text-[#3b82f6]" /> Логістика та Постачальник
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <InputOption label="Lead Time (Доставка)" defaultValue="14" unit="днів" />
                            <InputOption label="Order Cycle (Цикл)" defaultValue="30" unit="днів" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InputOption label="Review Period" defaultValue="7" unit="днів" />
                            <InputOption label="Shelf Life (Термін)" defaultValue="-" unit="днів" />
                        </div>

                        <h4 className="flex items-center gap-2 font-bold text-[#2C3E50] text-sm uppercase tracking-wider pb-2 border-b border-[#E5E7EB] mt-8">
                            <Boxes className="w-4 h-4 text-[#8b5cf6]" /> Обмеження партій (Constraints)
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <InputOption label="Min Lot Size (Мін)" defaultValue="1000" unit="шт" />
                            <InputOption label="Max Lot Size (Макс)" defaultValue="10000" unit="шт" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InputOption label="Кратність замовлення" defaultValue="500" unit="шт" />
                            <InputOption label="Unit Weight (Вага)" defaultValue="0.05" unit="кг" />
                        </div>
                    </div>

                    {/* Safety Stock Panel (Middle) */}
                    <div className="p-5 md:p-6 space-y-6">
                        <h4 className="flex items-center gap-2 font-bold text-[#2C3E50] text-sm uppercase tracking-wider pb-2 border-b border-[#E5E7EB]">
                            <ShieldAlert className="w-4 h-4 text-[#EF4444]" /> Страхова Модель (Safety Stock)
                        </h4>

                        <SelectOption label="Метод Страхового Запасу" options={["Рівень обслуговування (Service Level %)", "Задано вручну (Фікс)", "Покриття в днях (Days of Supply)"]} />

                        <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                            <InputOption label="Service Level (Цільовий)" defaultValue="98.5" unit="%" />
                            <p className="text-xs text-[#64748b] mt-2">
                                98.5% означає, що фабрика буде забезпечена цією сировиною у 98.5% випадків, незалежно від різких коливань попиту (Demand Variability).
                            </p>
                        </div>

                        <div className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-lg bg-gray-50 mt-4">
                            <span className="text-sm font-semibold text-[#2C3E50]">Розрахований Safety Stock:</span>
                            <span className="text-lg font-bold text-[#10B981]">120 шт</span>
                        </div>
                        <div className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-lg bg-gray-50 mt-2">
                            <span className="text-sm font-semibold text-[#2C3E50]">Пропозиція до замовлення (ROP):</span>
                            <span className="text-lg font-bold text-[#3b82f6]">1,500 шт</span>
                        </div>
                    </div>

                    {/* BOM Chart Panel (Right) */}
                    <div className="p-5 md:p-6 flex flex-col">
                        <h4 className="flex items-center gap-2 font-bold text-[#2C3E50] text-sm uppercase tracking-wider pb-2 border-b border-[#E5E7EB] mb-4">
                            <Activity className="w-4 h-4 text-[#F59E0B]" /> Забезпечення виробництва
                        </h4>
                        <div className="flex-1 min-h-[250px] w-full bg-white border border-[#E5E7EB] rounded-lg p-3">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    layout="vertical"
                                    data={stockoutData}
                                    margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                    <XAxis type="number" tick={{ fill: '#7F8C8D', fontSize: 11 }} />
                                    <YAxis dataKey="name" type="category" width={90} tick={{ fill: '#2C3E50', fontSize: 11, fontWeight: 500 }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                                    <Bar dataKey="actual" name="Фактичний залишок" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                    <Line dataKey="forecast" name="Потреба (Виробництво)" type="monotone" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                                    <Line dataKey="safetyStock" name="Min (Страховий запас)" type="step" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </div>

            {/* Smart Purchase Plan Table */}
            <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
                <div className="p-5 border-b border-[#E5E7EB] bg-slate-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-[#2C3E50]">Детальний План Замовлень (Smart Purchase Plan)</h3>
                    <button className="text-[#3b82f6] text-sm font-semibold hover:underline">Експорт для Постачальника</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-[#7F8C8D] uppercase border-b border-[#E5E7EB]">
                            <tr>
                                <th className="px-5 py-4 font-semibold">Сировина</th>
                                <th className="px-5 py-4 font-semibold">Постачальник</th>
                                <th className="px-5 py-4 font-semibold">Lead Time</th>
                                <th className="px-5 py-4 font-semibold">Обмеження (MOQ)</th>
                                <th className="px-5 py-4 font-semibold text-[#10B981]">Замовити</th>
                                <th className="px-5 py-4 font-semibold">Сума</th>
                                <th className="px-5 py-4 font-semibold">Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchasePlan.map((row: any) => (
                                <tr key={row.id} className="border-b border-[#E5E7EB] hover:bg-gray-50/50">
                                    <td className="px-5 py-4 font-bold text-[#2C3E50]">{row.item}</td>
                                    <td className="px-5 py-4 text-[#64748b]">{row.supplier}</td>
                                    <td className="px-5 py-4 text-[#64748b]">{row.leadTime}</td>
                                    <td className="px-5 py-4 text-[#64748b]"><span className="text-[#9CA3AF] text-xs">Мін:</span> {row.moq}</td>
                                    <td className="px-5 py-4 font-bold text-[#10B981]">{row.requestedOrder}</td>
                                    <td className="px-5 py-4 font-medium text-[#2C3E50]">{row.cost}</td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2.5 py-1.5 rounded-md text-xs font-bold ${row.status.includes('Терміново') ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    )
}
