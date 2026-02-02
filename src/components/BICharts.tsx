'use client';

import React from 'react';
import { STORES } from '@/lib/data';

export const BILineChart = ({ label, data }: { label: string, data: number[] }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 400;
    const height = 100;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="bi-panel p-4 rounded-xl flex flex-col h-full">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{label}</div>
            <div className="flex-1 w-full relative group">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path
                        d={`M 0,${height} L ${points} L ${width},${height} Z`}
                        fill="url(#lineGradient)"
                    />
                    <polyline
                        points={points}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    />
                    {data.map((val, i) => {
                        const x = (i / (data.length - 1)) * width;
                        const y = height - ((val - min) / range) * height;
                        return (
                            <circle key={i} cx={x} cy={y} r="3" fill="#0b0c10" stroke="#3b82f6" strokeWidth="1" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export const BIBarChart = ({ label }: { label: string }) => {
    const data = Array.from({ length: 6 }).map(() => Math.random() * 80 + 20);
    const max = Math.max(...data);

    return (
        <div className="bi-panel p-4 rounded-xl flex flex-col h-full">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{label}</div>
            <div className="flex-1 flex items-end justify-between gap-1 w-full px-2">
                {data.map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="w-full relative">
                            <div
                                className="w-full bg-brand-primary/20 border-t border-brand-primary/50 group-hover:bg-brand-primary/40 transition-colors"
                                style={{ height: `${(val / max) * 100}px` }}
                            />
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-mono-bi text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                {val.toFixed(0)}%
                            </div>
                        </div>
                        <span className="text-[8px] font-black text-slate-600 uppercase vertical-text h-12 text-center">
                            {STORES[i].split(' ')[1] || STORES[i]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
