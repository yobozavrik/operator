'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, LogOut, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
    { label: 'ВАРЕНИКИ', icon: '🥟' },
    { label: 'ПЕЛЬМЕНІ', icon: '🥟' },
    { label: 'ХІНКАЛІ', icon: '🥟' },
    { label: 'ЧЕБУРЕКИ', icon: '🥙' },
    { label: 'КОВБАСКИ', icon: '🌭' },
    { label: 'ГОЛУБЦІ', icon: '🥬' },
    { label: 'КОТЛЕТИ', icon: '🍗' },
    { label: 'СИРНИКИ', icon: '🥞' },
    { label: 'ФРИКАДЕЛЬКИ', icon: '🧆' },
    { label: 'ЗРАЗИ', icon: '🥔' },
    { label: 'ПЕРЕЦЬ', icon: '🫑' },
    { label: 'МЛИНЦІ', icon: '🥞' },
    { label: 'БЕНДЕРИКИ', icon: '🌮' },
];

export const Sidebar = () => {
    const pathname = usePathname();

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 border-r border-[#30363D] bg-[#0D1117] h-screen sticky top-0 flex-col py-6">
                <div className="px-6 mb-8">
                    <div className="flex items-center gap-3 text-[#58A6FF]">
                        <div className="w-8 h-8 rounded bg-[#58A6FF]/20 flex items-center justify-center font-black text-sm">G</div>
                        <span className="font-black text-lg tracking-tighter uppercase text-white">Graviton</span>
                    </div>
                </div>

                <div className="flex-1 px-4 space-y-0.5 overflow-y-auto custom-scrollbar">
                    <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Категорії</p>
                    {CATEGORIES.map((cat, i) => (
                        <button
                            key={i}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-2 rounded-md transition-all text-xs font-bold uppercase tracking-tight text-left",
                                i === 0 ? "bg-[#58A6FF]/10 text-[#58A6FF]" : "text-slate-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <span>{cat.icon}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div className="px-4 mt-6 pt-4 border-t border-[#30363D]">
                    <button className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-slate-500 hover:text-red-400 text-xs font-bold uppercase transition-colors">
                        <LogOut size={16} />
                        Вихід
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#161B22]/90 backdrop-blur-xl border-t border-[#30363D] flex items-center justify-around px-2 z-50">
                {CATEGORIES.slice(0, 5).map((cat, i) => (
                    <button key={i} className="flex flex-col items-center gap-1 text-[#58A6FF]">
                        <span className="text-lg">{cat.icon}</span>
                        <span className="text-[8px] font-black uppercase tracking-tighter">{cat.label}</span>
                    </button>
                ))}
            </div>
        </>
    );
};

export const SeniorHeader = ({ currentWeight, maxWeight }: { currentWeight: number, maxWeight: number }) => {
    const progress = (currentWeight / maxWeight) * 100;

    return (
        <header className="h-20 lg:h-24 border-b border-[#30363D] bg-[#0D1117]/80 backdrop-blur-xl sticky top-0 z-40 px-4 lg:px-8 flex flex-col justify-center">
            <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-4">
                    <div className="lg:hidden">
                        <Menu size={20} className="text-slate-400" />
                    </div>
                    <div>
                        <h1 className="text-sm lg:text-base font-black text-white uppercase tracking-tighter flex items-center gap-2">
                            Центр Управління <span className="text-[#58A6FF]">|</span> Виробництво
                        </h1>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] font-bold text-[#3FB950] uppercase px-1.5 py-0.5 bg-[#3FB950]/10 rounded border border-[#3FB950]/20 tracking-widest">Live</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Users size={12} /> Зміна: 8 чол
                            </span>
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Ліміт цеху</p>
                        <p className="text-xl font-mono-bi font-black text-white leading-none">450 <span className="text-[10px] text-slate-500">KG</span></p>
                    </div>
                </div>
            </div>

            <div className="w-full">
                <div className="flex justify-between items-end mb-1.5">
                    <div className="flex items-baseline gap-2">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">План на сьогодні</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{Math.round(progress)}% ГОТОВО</span>
                    </div>
                    <span className="text-xs font-mono-bi font-black text-[#F59E0B]">
                        {currentWeight} <span className="text-[8px] text-slate-500">/</span> {maxWeight} <span className="text-[8px] text-slate-500">кг</span>
                    </span>
                </div>
                <div className="progress-bi-bg">
                    <div
                        className="progress-bi-fill bg-[#F59E0B]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </header>
    );
};

export const DashboardLayout = ({ children, currentWeight, maxWeight }: { children: React.ReactNode, currentWeight: number, maxWeight: number }) => {
    return (
        <div className="flex min-h-screen bg-[#0D1117] text-[#F0F2F5] font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <SeniorHeader currentWeight={currentWeight} maxWeight={maxWeight} />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};
