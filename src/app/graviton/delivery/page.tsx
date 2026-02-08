'use client';

import React from 'react';
import { GravitonDistributionPanel } from '@/components/graviton/GravitonDistributionPanel';
import { DashboardLayout } from '@/components/layout';
import { useStore } from '@/context/StoreContext';
import { BackToHome } from '@/components/BackToHome';
import { BarChart2 } from 'lucide-react';

export default function GravitonDeliveryPage() {
    const { currentCapacity } = useStore();

    // Use a fixed date for static header or implement dynamic time if needed
    const currentTime = new Date();
    const formattedDate = new Intl.DateTimeFormat('uk-UA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(currentTime);

    return (
        <DashboardLayout
            currentWeight={0} // Placeholder or connect to real metrics if available
            maxWeight={currentCapacity || 0}
            fullHeight={true}
        >
            <div className="flex flex-col h-full overflow-hidden relative z-10 w-full max-w-[1600px] mx-auto">
                {/* Simplified Header for this page */}
                <header className="flex-shrink-0 p-4 lg:p-6 pb-2 lg:pb-3">
                    <div
                        className="rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-6 z-10"
                        style={{
                            background: 'rgba(26, 31, 58, 0.7)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                        }}
                    >
                        <div className="flex flex-col gap-2">
                            <BackToHome />
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[#00D4FF]/10 flex items-center justify-center border border-[#00D4FF]/20 shadow-[0_0_15px_rgba(0,212,255,0.2)]">
                                    <BarChart2 size={24} className="text-[#00D4FF]" />
                                </div>
                                <div>
                                    <h1 className="text-[24px] font-bold text-white tracking-wide uppercase">ГАЛЯ БАЛУВАНА</h1>
                                    <p className="text-[11px] text-white/60 uppercase tracking-wider mt-1">Виробничий контроль • Логістика</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[13px] font-semibold text-white/80 capitalize">{formattedDate}</div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 min-h-0 p-4 lg:p-6 pt-0 lg:pt-0">
                    <GravitonDistributionPanel />
                </main>
            </div>
        </DashboardLayout>
    );
}
