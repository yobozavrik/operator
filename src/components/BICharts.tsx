'use client';

import React from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

const POWER_BI_COLORS = ['#00bcf2', '#ffc000', '#e74856', '#d2d2d2', '#2d7d9a', '#f2c811'];

export const BILineChart = ({ label, data }: { label: string, data: any[] }) => {
    return (
        <div className="bg-[#252526] p-4 rounded border border-[#3e3e42] flex flex-col h-full">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">{label}</div>
            <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#666"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#666"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #3e3e42', fontSize: '10px' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#00bcf2"
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#00bcf2' }}
                            activeDot={{ r: 5 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export const BIBarChart = ({ label, data }: { label: string, data: any[] }) => {
    return (
        <div className="bg-[#252526] p-4 rounded border border-[#3e3e42] flex flex-col h-full">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">{label}</div>
            <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            stroke="#666"
                            fontSize={9}
                            width={70}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #3e3e42', fontSize: '10px' }}
                        />
                        <Bar dataKey="value" fill="#00bcf2" radius={[0, 2, 2, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export const BIPieChart = ({ label, data }: { label: string, data: any[] }) => {
    return (
        <div className="bg-[#252526] p-4 rounded border border-[#3e3e42] flex flex-col h-full">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">{label}</div>
            <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={POWER_BI_COLORS[index % POWER_BI_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #3e3e42', fontSize: '10px' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
