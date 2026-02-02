'use client';

import React from 'react';
import { ProductionTask } from '@/lib/data';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import { BIPieChart, BILineChart } from './BICharts';

interface InsightsProps {
    queue: ProductionTask[];
}

export const BIInsights = ({ queue }: InsightsProps) => {
    // Top 5 Critical
    const topCritical = [...queue]
        .filter(i => (i as any).deficitPercent > 0)
        .sort((a, b) => (b as any).deficitPercent - (a as any).deficitPercent)
        .slice(0, 5);

    // Category Breakdown (for Pie Chart)
    const categories = Array.from(new Set(queue.map(i => i.category)));
    const categoryData = categories.map(cat => {
        const items = queue.filter(i => i.category === cat);
        const totalDeficit = items.reduce((acc, i) => acc + i.recommendedQtyKg, 0);
        return { name: cat, value: totalDeficit };
    }).filter(v => v.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);

    // Mock Trend Data for 7 days
    const trendData = [
        { name: 'Mon', value: 240 },
        { name: 'Tue', value: 210 },
        { name: 'Wed', value: 290 },
        { name: 'Thu', value: 250 },
        { name: 'Fri', value: 320 },
        { name: 'Sat', value: 280 },
        { name: 'Sun', value: 260 },
    ];

    return (
        <div className="flex flex-col gap-4 h-full overflow-hidden">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Operational Insights</h2>

            {/* Top 5 Critical */}
            <div className="bg-[#252526] p-4 rounded border border-[#3e3e42] flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={14} className="text-[#e74856]" />
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Top 5 Critical SKU</span>
                </div>
                <div className="flex flex-col gap-2">
                    {topCritical.map((item, i) => (
                        <div key={item.id} className="flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-white truncate max-w-[150px]">{item.name}</span>
                                <span className="text-[10px] font-mono font-bold text-[#e74856]">
                                    {(item as any).deficitPercent.toFixed(0)}%
                                </span>
                            </div>
                            <div className="h-1 w-full bg-surface-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#e74856]"
                                    style={{ width: `${(item as any).deficitPercent}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="flex-1 min-h-[180px]">
                <BIPieChart label="Deficit by Category (KG)" data={categoryData} />
            </div>

            {/* Deficit Trend */}
            <div className="flex-1 min-h-[180px]">
                <BILineChart label="Network Deficit Trend (7D)" data={trendData} />
            </div>
        </div>
    );
};
