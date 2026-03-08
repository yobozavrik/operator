'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, TrendingUp, BarChart3, PieChart, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Chakra_Petch, JetBrains_Mono } from 'next/font/google';

const chakra = Chakra_Petch({
    weight: ['300', '400', '500', '600', '700'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-chakra',
});

const jetbrains = JetBrains_Mono({
    weight: ['400', '700'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-jetbrains',
});

export default function GalyaFinanceLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const tabs = [
        { name: 'Загальне', href: '/dashboard/galya-baluvana/finance', icon: TrendingUp },
        { name: 'По Категоріям', href: '/dashboard/galya-baluvana/finance/categories', icon: PieChart },
        { name: 'По Магазинам', href: '/dashboard/galya-baluvana/finance/stores', icon: Store },
    ];

    return (
        <div className={cn(
            "min-h-[calc(100vh-80px)] bg-[#0B0F19] text-white font-sans selection:bg-[#2b80ff] selection:text-white flex flex-col -mx-4 -my-4 md:-mx-6 md:-my-6 lg:-mx-8 lg:-my-8",
            chakra.variable,
            jetbrains.variable,
            "font-[family-name:var(--font-chakra)]"
        )}>
            {/* Header */}
            <div className="border-b border-white/10 bg-[#0B0F19]/80 backdrop-blur-xl sticky top-0 z-50 px-4 py-6 md:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 max-w-[1920px] mx-auto">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#1ABB9C]/10 p-3 rounded-2xl border border-[#1ABB9C]/20 shadow-[0_0_20px_rgba(26,187,156,0.15)]">
                            <Store className="text-[#1ABB9C]" size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-white">Галя Балувана</h1>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-[#1ABB9C] tracking-[0.2em] font-[family-name:var(--font-jetbrains)] uppercase">
                                <span>Фінансова Аналітика</span>
                                <span className="w-1.5 h-1.5 bg-[#1ABB9C] rounded-full animate-pulse"></span>
                                <span>Live System</span>
                            </div>
                        </div>
                    </div>

                    {/* Finance Sub-Tabs */}
                    <div className="flex bg-[#131B2C] border border-white/10 rounded-xl p-1.5 w-full md:w-auto shadow-inner">
                        {tabs.map((tab) => {
                            const isActive = pathname === tab.href;
                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className={cn(
                                        "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all",
                                        isActive
                                            ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                                            : "text-slate-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <tab.icon size={16} />
                                    {tab.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content Area (renders the page.tsx components) */}
            <main className="flex-1 max-w-[1920px] mx-auto w-full p-4 md:p-8">
                {children}
            </main>
        </div>
    );
}
