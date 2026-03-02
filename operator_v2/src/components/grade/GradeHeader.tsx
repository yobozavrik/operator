'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Search, Folder, Clock, Plus, Bell, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export const GradeHeader = () => {
    const pathname = usePathname();

    // Mapping paths to title for basic breadcrumbs
    const pathTitleMap: Record<string, string> = {
        '/hr/employees': 'Співробітники',
        '/hr/leaves': 'Відпустки',
        '/hr/shifts': 'Графік роботи',
        '/hr/attendances': 'Відвідуваність',
        '/hr/holidays': 'Вихідні дні та свята',
        '/hr/recruit/dashboard': 'Рекрутинг Дашборд',
        '/hr/recruit/job-applications': 'Заявки на вакансії',
    };

    const currentTitle = Object.entries(pathTitleMap).find(([key]) => pathname.includes(key))?.[1] || 'Дашборд';

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0 z-10 sticky top-0">

            {/* Left side: Breadcrumbs */}
            <div className="flex items-baseline gap-4">
                <h1 className="text-[17px] font-bold text-slate-800">{currentTitle}</h1>
                <div className="hidden sm:flex items-center text-[13px] text-slate-400">
                    <span>Головна</span>
                    <span className="mx-2">•</span>
                    <span className="text-slate-500">{currentTitle}</span>
                </div>
            </div>

            {/* Right side: Actions */}
            <div className="flex items-center gap-1 sm:gap-3">
                <div className="hidden lg:flex items-center gap-1">
                    <div className="relative">
                        <IconButton icon={<Bell size={18} />} />
                        <span className="absolute top-1 right-1 w-4 h-4 bg-[#2563eb] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                            1
                        </span>
                    </div>
                </div>

                {/* User Profile Hook */}
                <div className="border-l border-slate-200 pl-4 ml-1">
                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#2563eb] transition-all">
                        <img src="https://ui-avatars.com/api/?name=User&background=cbd5e1&color=475569" alt="User Avatar" className="w-full h-full object-cover" />
                    </div>
                </div>
            </div>
        </header>
    );
};

const IconButton = ({ icon }: { icon: React.ReactNode }) => (
    <button className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors">
        {icon}
    </button>
);
