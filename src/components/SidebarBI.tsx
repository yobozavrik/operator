'use client';

import React from 'react';
import { Calendar, Store, Package, Activity, ChevronDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SidebarBI = () => {
    return (
        <aside className="hidden lg:flex w-64 border-r border-surface-700 bg-surface-900 h-screen sticky top-0 flex flex-col p-4 space-y-6">
            <div className="flex items-center gap-2 px-2 py-4 border-b border-surface-700">
                <div className="w-6 h-6 bg-brand-primary rounded flex items-center justify-center font-black text-[10px] text-white">G</div>
                <span className="font-black text-sm tracking-tighter text-white">GRAVITON | BI</span>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block px-2">Global Slicers</label>
                    <div className="space-y-1">
                        <SlicerItem icon={Calendar} label="Дата" value="Сегодня" />
                        <SlicerItem icon={Store} label="Магазины" value="6 из 6" />
                        <SlicerItem icon={Package} label="Тип продукции" value="Все" />
                        <SlicerItem icon={Activity} label="Режим" value="Прогноз" isToggle />
                    </div>
                </div>

                <div className="pt-4 border-t border-surface-700/50">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block px-2">Индикаторы</label>
                    <div className="px-2 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-400">KPI Status</span>
                            <span className="text-status-low">Online</span>
                        </div>
                        <div className="h-1 w-full bg-surface-700 rounded-full overflow-hidden">
                            <div className="h-full bg-status-low w-full animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

const SlicerItem = ({ icon: Icon, label, value, isToggle }: any) => (
    <div className="group flex items-center justify-between px-2 py-2 hover:bg-surface-800 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-surface-700">
        <div className="flex items-center gap-2">
            <Icon size={14} className="text-slate-500 group-hover:text-brand-primary" />
            <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase">{label}</span>
                <span className="text-xs font-black text-slate-200">{value}</span>
            </div>
        </div>
        {isToggle ? (
            <div className="w-8 h-4 bg-brand-primary/20 rounded-full relative">
                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-brand-primary rounded-full" />
            </div>
        ) : (
            <ChevronDown size={14} className="text-slate-600" />
        )}
    </div>
);
