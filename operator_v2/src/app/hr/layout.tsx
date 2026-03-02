import React from 'react';
import { GradeSidebar } from '@/components/grade/GradeSidebar';
import { GradeHeader } from '@/components/grade/GradeHeader';

export default function HRLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-[#F4F5F7] text-slate-900 font-sans selection:bg-[#2563eb] selection:text-white">
            {/* Sidebar - Always Dark/Navy */}
            <GradeSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header - White */}
                <GradeHeader />

                {/* Page Content - Light Gray Background */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                    {children}
                </main>
            </div>

            {/* Scoped Styles for Grade UI feel */}
            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
        </div>
    );
}
