import { LayoutDashboard, Users, Clock, ArrowUpRight, ArrowDownRight, Factory, Pizza } from "lucide-react"
import FinanceAnalyticsCard from "@/components/analytics/FinanceAnalyticsCard"

export default function DashboardPage() {
    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
            {/* Top Stats Row (Gentelella style 'tile_count') */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6 mb-6">

                {/* Stat Tile 1 */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Трекери (Швачки)</div>
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-500">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-slate-800 tracking-tight mb-2">45</div>
                    <div className="text-xs font-semibold text-emerald-600 flex items-center mt-auto bg-emerald-50 w-fit px-2 py-1 rounded-md">
                        <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                        Всі на зміні
                    </div>
                </div>

                {/* Stat Tile 2 */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Середній час пошиву</div>
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-500">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-slate-800 tracking-tight mb-2">42 <span className="text-xl text-slate-500 font-semibold">хв</span></div>
                    <div className="text-xs font-semibold text-emerald-600 flex items-center mt-auto bg-emerald-50 w-fit px-2 py-1 rounded-md">
                        <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                        -3 хв (Покращення)
                    </div>
                </div>

                {/* Stat Tile 3 */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Замовлення на Піцу</div>
                        <div className="p-2 rounded-lg bg-orange-50 text-orange-500">
                            <LayoutDashboard className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-slate-800 tracking-tight mb-2">184</div>
                    <div className="text-xs font-semibold text-rose-600 flex items-center mt-auto bg-rose-50 w-fit px-2 py-1 rounded-md">
                        <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
                        -12 (Сьогодні)
                    </div>
                </div>

                {/* Stat Tile 4 */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Клієнти Залу</div>
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-slate-800 tracking-tight mb-2">412</div>
                    <div className="text-xs font-semibold text-emerald-600 flex items-center mt-auto bg-emerald-50 w-fit px-2 py-1 rounded-md">
                        <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                        +14% <span className="hidden sm:inline ml-1">Минулий тиждень</span>
                    </div>
                </div>
            </div>

            {/* Main Financial Analytics Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* Factory Financials */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[#3b82f6] mb-1">
                        <Factory className="w-5 h-5" />
                        <h2 className="text-lg font-bold tracking-wide uppercase">Виробництво (Швейка)</h2>
                    </div>
                    <FinanceAnalyticsCard
                        title="Виторг Швейки"
                        sourceName="KeyCRM"
                        apiEndpoint="/api/analytics/financials"
                    />
                </div>

                {/* Galya Baluvana Financials */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[#e11d48] mb-1">
                        <Pizza className="w-5 h-5" />
                        <h2 className="text-lg font-bold tracking-wide uppercase">Галя Балувана & Піца</h2>
                    </div>
                    <FinanceAnalyticsCard
                        title="Виторг Ресторану"
                        sourceName="Poster POS (Mocked)"
                        apiEndpoint="/api/analytics/galya"
                    />
                </div>

            </div>
        </div>
    )
}
