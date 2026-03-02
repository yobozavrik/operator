import Link from "next/link";
import { Store, BarChart3, ShoppingBag, Activity } from "lucide-react";

export default function RetailDashboardSelection() {
    return (
        <div className="space-y-6">
            <div className="border-b border-[#E5E7EB] pb-4">
                <h1 className="text-2xl font-bold text-[#2C3E50] tracking-tight flex items-center gap-2">
                    <Store className="text-[#8b5cf6]" />
                    Мережа магазинів одягу
                </h1>
                <p className="text-sm text-[#7F8C8D] mt-1">Огляд показників роздрібної торгівлі та управління асортиментом</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Streamline Analytics Card */}
                <Link href="/dashboard/retail/streamline" className="block group">
                    <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all h-full relative overflow-hidden group-hover:border-purple-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                Аналітика
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-[#2C3E50] mb-2 group-hover:text-purple-600 transition-colors">
                            Streamline Аналітика
                        </h3>
                        <p className="text-sm text-[#7F8C8D] line-clamp-3">
                            Мультифакторна оптимізація асортименту, Turn-Earn Index, неліквідні запаси та прогнозування попиту.
                        </p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
