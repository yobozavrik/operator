'use client';

import React from 'react';
import { Users, LogOut, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useStore } from '@/context/StoreContext';

const STORES_MENU = [
    { label: 'Усі', icon: '🌍' },
    { label: 'Магазин "Садгора"', icon: '🏪' },
    { label: 'Магазин "Компас"', icon: '🏙️' },
    { label: 'Магазин "Руська"', icon: '🏛️' },
    { label: 'Магазин "Хотинська"', icon: '🛣️' },
    { label: 'Магазин "Білоруська"', icon: '🌳' },
    { label: 'Магазин "Кварц"', icon: '⚛️' },
];

export const Sidebar = () => {
    const { selectedStore, setSelectedStore } = useStore();

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 border-r border-[var(--border)] bg-[var(--background)] h-screen sticky top-0 flex-col py-6">
                <div className="px-6 mb-8">
                    <div className="flex items-center gap-3 text-[var(--status-normal)]">
                        <div className="w-8 h-8 rounded-lg bg-[var(--status-normal)]/20 flex items-center justify-center font-black text-sm">G</div>
                        <span className="font-bold text-lg tracking-tight uppercase text-[var(--foreground)]">Graviton</span>
                    </div>
                </div>

                <div className="flex-1 px-4 space-y-0.5 overflow-y-auto custom-scrollbar">
                    <p className="px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Магазини</p>
                    {STORES_MENU.map((item, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedStore(item.label)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-2 rounded-md transition-all text-xs font-bold uppercase tracking-tight text-left",
                                selectedStore === item.label ? "bg-[var(--status-normal)]/10 text-[var(--status-normal)]" : "text-[var(--text-muted)] hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="px-4 mt-6 pt-4 border-t border-[var(--border)]">
                    <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--status-critical)] text-xs font-semibold uppercase transition-colors">
                        <LogOut size={16} />
                        Вихід
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--background)]/95 backdrop-blur-xl border-t border-[var(--border)] flex items-center justify-around px-2 z-50">
                {STORES_MENU.slice(0, 5).map((item, i) => (
                    <button
                        key={i}
                        onClick={() => setSelectedStore(item.label)}
                        className={cn(
                            "flex flex-col items-center gap-1",
                            selectedStore === item.label ? "text-[var(--status-normal)]" : "text-[var(--text-muted)]"
                        )}
                    >
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
                    </button>
                ))}
            </div>
        </>
    );
};

export const SeniorHeader = ({ currentWeight, maxWeight }: { currentWeight: number, maxWeight: number }) => {
    const progress = (currentWeight / maxWeight) * 100;

    return (
        <header className="h-24 bg-[var(--background)]/80 backdrop-blur-xl sticky top-0 z-40 px-10 flex flex-col justify-center border-b border-[var(--border)]">
            <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-4">
                    <div className="lg:hidden">
                        <Menu size={20} className="text-[var(--text-muted)]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[var(--foreground)] uppercase tracking-tight flex items-center gap-2">
                            Центр Управління <span className="text-[var(--status-normal)]">|</span> Виробництво
                        </h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-bold text-[var(--status-normal)] uppercase px-2 py-0.5 bg-[var(--status-normal)]/10 rounded border border-[var(--status-normal)]/20 tracking-wider">Live</span>
                            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase flex items-center gap-1.5">
                                <Users size={12} /> Зміна: 8 чол
                            </span>
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-10">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1.5">Ліміт цеху</p>
                        <p className="text-2xl font-black text-[var(--foreground)] leading-none">450 <span className="text-[12px] text-[var(--text-muted)] font-medium ml-1">KG</span></p>
                    </div>
                </div>
            </div>

            <div className="w-full">
                <div className="flex justify-between items-end mb-1.5">
                    <div className="flex items-baseline gap-2">
                        <span className="text-[10px] font-black text-[var(--foreground)] uppercase tracking-widest">План на сьогодні</span>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{Math.round(progress)}% ГОТОВО</span>
                    </div>
                    <span className="text-xs font-mono-bi font-black text-[var(--status-high)]">
                        {currentWeight} <span className="text-[8px] text-[var(--text-muted)]">/</span> {maxWeight} <span className="text-[8px] text-[var(--text-muted)]">кг</span>
                    </span>
                </div>
                <div className="progress-bi-bg">
                    <div
                        className="progress-bi-fill bg-[var(--status-high)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </header>
    );
};

import { StoreProvider } from '@/context/StoreContext';

export const DashboardLayout = ({ children, currentWeight, maxWeight }: { children: React.ReactNode, currentWeight: number, maxWeight: number }) => {
    return (
        <StoreProvider>
            <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans antialiased">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <SeniorHeader currentWeight={currentWeight} maxWeight={maxWeight} />
                    <main className="flex-1 overflow-y-auto p-10">
                        {children}
                    </main>
                </div>
            </div>
        </StoreProvider>
    );
};
