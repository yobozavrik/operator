import Link from "next/link";
import { Factory, TrendingUp, AlertTriangle, CalendarRange } from "lucide-react";

export default function FactoryDashboardSelection() {
    return (
        <div className="space-y-6">
            <div className="border-b border-[#E5E7EB] pb-4">
                <h1 className="text-2xl font-bold text-[#2C3E50] tracking-tight flex items-center gap-2">
                    <Factory className="text-[#3b82f6]" />
                    Швейне виробництво
                </h1>
                <p className="text-sm text-[#7F8C8D] mt-1">Огляд та аналітика виробничих процесів</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Streamline Analytics Card */}
                <Link href="/dashboard/factory/streamline" className="block group">
                    <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all h-full relative overflow-hidden group-hover:border-blue-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                Аналітика
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-[#2C3E50] mb-2 group-hover:text-blue-600 transition-colors">
                            Streamline Аналітика
                        </h3>
                        <p className="text-sm text-[#7F8C8D] line-clamp-2">
                            Прогнозування дефіциту сировини, план замовлень (Just-in-Time) та контроль запасів (Days of Supply).
                        </p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
