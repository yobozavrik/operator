'use client';

import React from 'react';
import { Users, AlertTriangle, ArrowUpRight, TrendingUp } from 'lucide-react';

export const BIGauge = ({ value, max }: { value: number, max: number }) => {
    const percentage = Math.min((value / max) * 100, 100);
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = percentage === 0 ? 0 : (percentage / 100) * circumference;

    return (
        <div className="bi-panel p-4 rounded-xl flex flex-col items-center justify-center relative overflow-hidden h-full">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 w-full">Загрузка цеха</div>
            <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90">
                    <circle
                        cx="64" cy="64" r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-surface-700"
                    />
                    <circle
                        cx="64" cy="64" r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray={`${strokeDasharray} ${circumference}`}
                        strokeLinecap="round"
                        className={percentage > 85 ? "text-status-high" : percentage > 60 ? "text-status-medium" : "text-brand-primary"}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-white font-mono-bi">{value}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">/ {max} kg</span>
                </div>
            </div>
        </div>
    );
};

export const BIStatCard = ({ label, value, subValue, icon: Icon, colorClass }: any) => (
    <div className="bi-panel p-4 rounded-xl flex flex-col h-full border-t-2 border-t-brand-primary/20">
        <div className="flex justify-between items-start mb-4">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
            <Icon size={16} className={colorClass || "text-slate-500"} />
        </div>
        <div className="flex-1 flex flex-col justify-end">
            <div className={concat("text-3xl font-black text-white font-mono-bi leading-none mb-1", colorClass)}>{value}</div>
            <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase">
                {subValue && <><ArrowUpRight size={10} className="text-status-low" /> {subValue}</>}
            </div>
        </div>
    </div>
);

function concat(...args: any[]) {
    return args.filter(Boolean).join(' ');
}
