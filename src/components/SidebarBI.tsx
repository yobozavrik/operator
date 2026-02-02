'use client';

import React from 'react';
import { Calendar, Store, Package, Activity, ChevronDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SidebarBI = () => {
    return (
        <aside className="hidden lg:flex w-64 border-r border-[#3e3e42] bg-[#1e1e1e] h-screen sticky top-0 flex flex-col p-4 space-y-6">
            <div className="flex items-center gap-2 px-2 py-4 border-b border-[#3e3e42]">
                <div className="w-6 h-6 bg-[#00bcf2] rounded-sm flex items-center justify-center font-bold text-[10px] text-white">G</div>
                <span className="font-bold text-sm tracking-tight text-white uppercase">Graviton Engine</span>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 block px-2">Data Filters</label>
                    <div className="space-y-1">
                        <SlicerItem icon={Calendar} label="Date Range" value="Current Shift" />
                        <SlicerItem icon={Store} label="Store Network" value="All Locations" />
                        <SlicerItem icon={Package} label="Category" value="High Demand" />
                        <SlicerItem icon={Activity} label="AI Insights" value="Enabled" isToggle />
                    </div>
                </div>

                <div className="pt-4 border-t border-[#3e3e42]">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 block px-2">System Health</label>
                    <div className="px-2 space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-400">BI Service</span>
                            <span className="text-[#3fb950]">Operational</span>
                        </div>
                        <div className="h-1 w-full bg-[#252526] rounded-full overflow-hidden">
                            <div className="h-full bg-[#3fb950] w-full" />
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

const SlicerItem = ({ icon: Icon, label, value, isToggle }: any) => (
    <div className="group flex items-center justify-between px-2 py-2 hover:bg-[#252526] rounded-sm transition-colors cursor-pointer border border-transparent hover:border-[#3e3e42]">
        <div className="flex items-center gap-3">
            <Icon size={14} className="text-slate-500 group-hover:text-[#00bcf2]" />
            <div className="flex flex-col">
                <span className="text-[9px] text-slate-500 font-bold uppercase">{label}</span>
                <span className="text-xs font-bold text-slate-300 group-hover:text-white">{value}</span>
            </div>
        </div>
        {isToggle ? (
            <div className="w-7 h-3.5 bg-[#00bcf2]/20 rounded-full relative">
                <div className="absolute right-0.5 top-0.5 w-2.5 h-2.5 bg-[#00bcf2] rounded-full shadow-[0_0_8px_rgba(0,188,242,0.4)]" />
            </div>
        ) : (
            <ChevronDown size={12} className="text-slate-600 group-hover:text-slate-400" />
        )}
    </div>
);
