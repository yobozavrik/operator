'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard, Users, CalendarDays, CalendarClock, Clock,
    CalendarRange, Briefcase, Building2, Award, HeadphonesIcon,
    FileText, ClipboardList, Package, BookOpen, Target,
    FileSearch, UserCircle2, Globe, MessageSquare, Megaphone,
    Video, Mail, QrCode, ClipboardCheck, BriefcaseBusiness
} from 'lucide-react';

export const GradeSidebar = () => {
    const pathname = usePathname();

    // State for collapsible sections
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        hr: pathname.includes('/hr') && !pathname.includes('/hr/recruit'),
        recruit: pathname.includes('/hr/recruit')
    });

    const toggleSection = (key: string) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const hrLinks = [
        { name: 'Співробітники', path: '/hr/employees', icon: <Users size={16} /> },
        { name: 'Відпустки', path: '/hr/leaves', icon: <CalendarDays size={16} /> },
        { name: 'Графік роботи', path: '/hr/shifts', icon: <CalendarClock size={16} /> },
        { name: 'Відвідуваність', path: '/hr/attendances', icon: <Clock size={16} /> },
        { name: 'Вихідні дні та свята', path: '/hr/holidays', icon: <CalendarRange size={16} /> },
        { name: 'Посада', path: '/hr/designations', icon: <Briefcase size={16} /> },
        { name: 'Відділ', path: '/hr/departments', icon: <Building2 size={16} /> },
        { name: 'Відзначення', path: '/hr/appreciations', icon: <Award size={16} /> },
        { name: 'Опитування', path: '/hr/surveys', icon: <HeadphonesIcon size={16} /> },
        { name: 'Звіт по відпусткам', path: '/hr/leave-report', icon: <FileText size={16} /> },
        { name: 'Звіт про відвідуваність', path: '/hr/attendance-report', icon: <ClipboardList size={16} /> },
        { name: 'Активи', path: '/hr/assets', icon: <Package size={16} /> },
        { name: 'База знань', path: '/hr/knowledgebase', icon: <BookOpen size={16} /> },
    ];

    const recruitLinks = [
        { name: 'Дашборд', path: '/hr/recruit/dashboard', icon: <LayoutDashboard size={16} /> },
        { name: 'Вакансії', path: '/hr/recruit/jobs', icon: <BriefcaseBusiness size={16} /> },
        { name: 'Заявки на вакансії', path: '/hr/recruit/job-applications', icon: <ClipboardCheck size={16} /> },
        { name: 'Заплановані інтерв’ю', path: '/hr/recruit/interview-schedule', icon: <CalendarClock size={16} /> },
        { name: 'Кандидати', path: '/hr/recruit/candidate', icon: <UserCircle2 size={16} /> },
        { name: 'Кар\'єрний сайт', path: '/hr/recruit/careers', icon: <Globe size={16} /> },
        { name: 'Події', path: '/hr/recruit/events', icon: <Target size={16} /> },
    ];

    return (
        <aside className="w-[280px] bg-[#1e293b] text-slate-300 h-screen flex flex-col shrink-0 overflow-y-auto custom-scrollbar shadow-xl z-20">

            {/* Brand & Selector */}
            <div className="p-4 flex items-center gap-3 border-b border-slate-700/50 sticky top-0 bg-[#1e293b] z-10">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl leading-none">
                    A
                </div>
                <div className="flex flex-col">
                    <span className="text-white font-medium text-sm">Operator v2</span>
                    <span className="text-xs text-slate-400">Dima</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 flex flex-col gap-1 px-3">

                {/* Simple Link Example */}
                <NavItem href="/dashboard" icon={<LayoutDashboard size={18} />} label="Дашборд" />

                <div className="my-2 border-b border-slate-700/50" />

                {/* HR Section */}
                <div>
                    <button
                        onClick={() => toggleSection('hr')}
                        className={cn(
                            "w-full flex items-center justify-between p-2 rounded-md hover:bg-slate-800 transition-colors text-[14px]",
                            openSections.hr ? "text-white" : "text-slate-400"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <Users size={18} />
                            <span className="font-medium">HR</span>
                        </div>
                        <span className="text-xs transition-transform duration-200" style={{ transform: openSections.hr ? 'rotate(90deg)' : 'rotate(0)' }}>▶</span>
                    </button>

                    {openSections.hr && (
                        <div className="mt-1 pl-6 flex flex-col gap-1">
                            {hrLinks.map(link => (
                                <NavItem key={link.path} href={link.path} icon={link.icon} label={link.name} isActive={pathname === link.path} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Recruiting Section */}
                <div className="mt-2">
                    <button
                        onClick={() => toggleSection('recruit')}
                        className={cn(
                            "w-full flex items-center justify-between p-2 rounded-md hover:bg-slate-800 transition-colors text-[14px]",
                            openSections.recruit ? "text-white" : "text-slate-400"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <Target size={18} />
                            <span className="font-medium">Рекрутинг</span>
                        </div>
                        <span className="text-xs transition-transform duration-200" style={{ transform: openSections.recruit ? 'rotate(90deg)' : 'rotate(0)' }}>▶</span>
                    </button>

                    {openSections.recruit && (
                        <div className="mt-1 pl-6 flex flex-col gap-1">
                            {recruitLinks.map(link => (
                                <NavItem key={link.path} href={link.path} icon={link.icon} label={link.name} isActive={pathname === link.path} />
                            ))}
                        </div>
                    )}
                </div>

            </nav>
        </aside>
    );
};

// Sub-component for individual links
const NavItem = ({ href, icon, label, isActive = false }: { href: string; icon: React.ReactNode; label: string; isActive?: boolean }) => {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-3 py-[7px] px-3 rounded-md transition-all text-[13px]",
                isActive
                    ? "bg-slate-800 text-white font-medium border-l-2 border-blue-500 rounded-l-none"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            )}
        >
            <span className={isActive ? "text-blue-500" : "text-slate-500"}>{icon}</span>
            {label}
        </Link>
    );
};
