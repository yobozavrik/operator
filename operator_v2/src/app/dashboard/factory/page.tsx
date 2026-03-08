import Link from "next/link";
import { Factory, TrendingUp, Users, Target, UserPlus, ClipboardCheck, CalendarClock, HeadphonesIcon, Globe } from "lucide-react";

export default function FactoryDashboardSelection() {
    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-10">
            <div className="border-b border-slate-200 pb-5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Factory className="text-blue-600" />
                    Швейне виробництво
                </h1>
                <p className="text-sm text-slate-500 mt-2">Огляд та аналітика виробничих та кадрових процесів</p>
            </div>

            {/* Section 1: Operations & Analytics */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    Операційна Аналітика
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link href="/dashboard/factory/streamline" className="block group h-full">
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all h-full relative overflow-hidden group-hover:border-blue-300 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                    Supply Chain
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                                Streamline Analytics
                            </h3>
                            <p className="text-sm text-slate-500 line-clamp-3">
                                Прогнозування дефіциту сировини, план замовлень (Just-in-Time) та контроль запасів (Days of Supply).
                            </p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Section 2: HR Management */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-500" />
                    Управління Персоналом (HR)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link href="/hr/employees" className="block group">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-emerald-300 flex items-center gap-4">
                            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">Співробітники</h3>
                                <p className="text-xs text-slate-500">База та профайли</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/hr/attendances" className="block group">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-emerald-300 flex items-center gap-4">
                            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                                <CalendarClock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">Відвідуваність</h3>
                                <p className="text-xs text-slate-500">Трекінг робочого часу</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/hr/leaves" className="block group">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-emerald-300 flex items-center gap-4">
                            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                                <ClipboardCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">Відпустки</h3>
                                <p className="text-xs text-slate-500">Запити та баланси</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/hr/surveys" className="block group">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-emerald-300 flex items-center gap-4">
                            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                                <HeadphonesIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">Опитування</h3>
                                <p className="text-xs text-slate-500">Зворотний зв'язок</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Section 3: Recruiting */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-500" />
                    Рекрутинг та Найм
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link href="/hr/recruit/jobs" className="block group">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-orange-300 flex items-center gap-4">
                            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg group-hover:scale-110 transition-transform">
                                <Target className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">Вакансії</h3>
                                <p className="text-xs text-slate-500">Управління позиціями</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/hr/recruit/candidate" className="block group">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-orange-300 flex items-center gap-4">
                            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg group-hover:scale-110 transition-transform">
                                <UserPlus className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">Кандидати</h3>
                                <p className="text-xs text-slate-500">Воронка найму</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/hr/recruit/interview-schedule" className="block group">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-orange-300 flex items-center gap-4">
                            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg group-hover:scale-110 transition-transform">
                                <CalendarClock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">Інтерв'ю</h3>
                                <p className="text-xs text-slate-500">Графік співбесід</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/hr/recruit/careers" className="block group">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-orange-300 flex items-center gap-4">
                            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg group-hover:scale-110 transition-transform">
                                <Globe className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">Кар'єрний сайт</h3>
                                <p className="text-xs text-slate-500">Зовнішній портал</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
