'use client';

import React from 'react';
import { Users, AlertTriangle, ArrowUpRight, TrendingUp } from 'lucide-react';

export const BIGauge = ({ value, max }: { value: number, max: number }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = percentage === 0 ? 0 : (percentage / 100) * circumference;

    return (
        <div className="bg-[#252526] p-4 rounded border border-[#3e3e42] flex flex-col items-center justify-center relative overflow-hidden h-full">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4 w-full text-left">Shop Load Utilization</div>
            <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90">
                    <circle
                        cx="64" cy="64" r={radius}
                        fill="transparent"
                        stroke="#1e1e1e"
                        strokeWidth="10"
                    />
                    <circle
                        cx="64" cy="64" r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="10"
                        strokeDasharray={`${strokeDasharray} ${circumference}`}
                        strokeLinecap="butt"
                        className={percentage > 85 ? "text-[#e74856]" : percentage > 60 ? "text-[#ffc000]" : "text-[#00bcf2]"}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white leading-none">{value}</span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase mt-1">/ {max} kg</span>
                </div>
            </div>
            <div className="mt-4 w-full flex justify-between items-center px-2">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#00bcf2]" />
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Optimal</span>
                </div>
                <span className="text-[10px] font-bold text-white">{percentage.toFixed(0)}%</span>
            </div>
        </div>
    );
};

export const BIStatCard = ({ label, value, subValue, icon: Icon, colorClass }: any) => (
    <div className="bg-[#252526] p-4 rounded border border-[#3e3e42] flex flex-col h-full hover:bg-[#2d2d30] transition-colors group">
        <div className="flex justify-between items-start mb-4">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</div>
            <div className="p-1.5 bg-[#1e1e1e] rounded border border-[#3e3e42]">
                <Icon size={14} className={colorClass || "text-slate-400"} />
            </div>
        </div>
        <div className="flex-1 flex flex-col justify-end">
            <div className={concat("text-2xl font-bold text-white leading-none mb-1", colorClass)}>{value}</div>
            <div className="text-[9px] font-semibold text-slate-500 flex items-center gap-1 uppercase">
                {subValue && <><ArrowUpRight size={10} className="text-[#3fb950] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /> {subValue}</>}
            </div>
        </div>
    </div>
);

function concat(...args: any[]) {
    return args.filter(Boolean).join(' ');
}
