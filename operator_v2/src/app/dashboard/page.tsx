import { LayoutDashboard, Users, Clock, ArrowUpRight, ArrowDownRight, Factory, Pizza } from "lucide-react"
import FinancialAnalyticsCard from "@/components/analytics/FinancialAnalyticsCard"

export default function DashboardPage() {
    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
            {/* Top Stats Row (Gentelella style 'tile_count') */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

                {/* Stat Tile 1 */}
                <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group">
                    <div className="flex items-center text-[#73879C] mb-2 font-medium">
                        <Users className="w-5 h-5 mr-2" />
                        Трекери (Швачки)
                    </div>
                    <div className="text-4xl font-semibold text-[#73879C] mb-2">
                        45
                    </div>
                    <div className="text-sm text-[#1ABB9C] flex items-center mt-auto font-medium">
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        Всі на зміні
                    </div>
                </div>

                {/* Stat Tile 2 */}
                <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group">
                    <div className="flex items-center text-[#73879C] mb-2 font-medium">
                        <Clock className="w-5 h-5 mr-2" />
                        Середній час пошиву
                    </div>
                    <div className="text-4xl font-semibold text-[#73879C] mb-2">
                        42 хв
                    </div>
                    <div className="text-sm text-[#1ABB9C] flex items-center mt-auto font-medium">
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        -3 хв (Покращення)
                    </div>
                </div>

                {/* Stat Tile 3 */}
                <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group">
                    <div className="flex items-center text-[#73879C] mb-2 font-medium">
                        <LayoutDashboard className="w-5 h-5 mr-2" />
                        Замовлення на Піцу
                    </div>
                    <div className="text-4xl font-semibold text-[#73879C] mb-2">
                        184
                    </div>
                    <div className="text-sm text-[#E74C3C] flex items-center mt-auto font-medium">
                        <ArrowDownRight className="w-4 h-4 mr-1" />
                        -12 (Сьогодні)
                    </div>
                </div>

                {/* Stat Tile 4 */}
                <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group">
                    <div className="flex items-center text-[#73879C] mb-2 font-medium">
                        <Users className="w-5 h-5 mr-2" />
                        Клієнти Залу
                    </div>
                    <div className="text-4xl font-semibold text-[#73879C] mb-2">
                        412
                    </div>
                    <div className="text-sm text-[#1ABB9C] flex items-center mt-auto font-medium">
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        +14% Из Прошлой Недели
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
                    <FinancialAnalyticsCard
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
                    <FinancialAnalyticsCard
                        title="Виторг Ресторану"
                        sourceName="Poster POS (Mocked)"
                        apiEndpoint="/api/analytics/galya"
                    />
                </div>

            </div>
        </div>
    )
}
