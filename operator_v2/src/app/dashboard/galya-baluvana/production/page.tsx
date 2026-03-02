'use client';

import React from 'react';
import { GalyaProductionMetrics } from '@/components/galya-baluvana/GalyaProductionMetrics';
import { Store } from 'lucide-react';
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

export default function GalyaProductionPage() {
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
                                <span>Бренд Аналітика</span>
                                <span className="w-1.5 h-1.5 bg-[#1ABB9C] rounded-full animate-pulse"></span>
                                <span>Live System</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 max-w-[1920px] mx-auto w-full p-4 md:p-8">
                <GalyaProductionMetrics />
            </main>
        </div>
    );
}
